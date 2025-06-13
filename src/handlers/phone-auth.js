import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  RespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

const snsClient = new SNSClient({
  region: process.env.AWS_REGION
});

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const USER_POOL_ID = process.env.USER_POOL_ID;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
};

const createResponse = (statusCode, body) => ({
  statusCode,
  headers,
  body: JSON.stringify(body)
});

// Passwordless phone authentication - initiate SMS OTP
export const initiatePhoneAuth = async (event) => {
  try {
    const { phoneNumber } = JSON.parse(event.body);

    // Clean and format phone number: remove spaces, keep only + and digits
    const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/[^\+\d]/g, '');
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Use the cleaned phone number as username
    const username = cleanPhone;
    const tempPassword = verificationCode + 'A!';
    
    console.log(`Initiating phone auth:`);
    console.log(`Original phone: ${phoneNumber}`);
    console.log(`Cleaned phone: ${cleanPhone}`);
    console.log(`Username (phone): ${username}`);
    console.log(`Verification code: ${verificationCode}`);
    console.log(`Temp password: ${tempPassword}`);
    
    try {
      // Create or update user with verification code as temporary password
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: [
          {
            Name: 'phone_number',
            Value: cleanPhone
          },
          {
            Name: 'phone_number_verified',
            Value: 'true'
          }
        ],
        MessageAction: 'SUPPRESS',
        TemporaryPassword: tempPassword
      });

      await cognitoClient.send(createCommand);
      console.log(`User created with username: ${username}`);
    } catch (createError) {
      // User might exist, set new temporary password
      if (createError.name === 'UsernameExistsException') {
        console.log(`User exists, updating password for: ${username}`);
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          Password: tempPassword,
          Temporary: true
        });
        await cognitoClient.send(setPasswordCommand);
        console.log(`Password updated for: ${username}`);
      } else {
        console.error('Create user error:', createError);
        throw createError;
      }
    }

    // Send SMS via SNS using the cleaned phone number
    const smsCommand = new PublishCommand({
      PhoneNumber: cleanPhone,
      Message: `Your verification code is: ${verificationCode}`
    });

    await snsClient.send(smsCommand);

    return createResponse(200, {
      message: 'SMS code sent',
      session: 'phone-auth-session',
      codeDeliveryDetails: {
        Destination: cleanPhone.replace(/(\+\d{2})\d{3}(\d{2})(\d{2})/, '$1***$2$3'),
        DeliveryMedium: 'SMS'
      }
    });

  } catch (error) {
    console.error('InitiatePhoneAuth error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

// Confirm passwordless phone authentication with SMS code
export const confirmPhoneAuth = async (event) => {
  try {
    const { phoneNumber, code, session } = JSON.parse(event.body);

    // Clean the phone number the same way as in initiate
    const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/[^\+\d]/g, '');
    const username = cleanPhone;
    const password = code + 'A!';
    
    console.log(`Attempting phone confirmation:`);
    console.log(`Original phone: ${phoneNumber}`);
    console.log(`Cleaned phone: ${cleanPhone}`);
    console.log(`Username (phone): ${username}`);
    console.log(`Code received: ${code}`);
    console.log(`Password format: ${password}`);
    
    // Try to authenticate with the verification code as password
    const signInCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });

    const signInResponse = await cognitoClient.send(signInCommand);

    // If successful, set a permanent password to complete the flow
    if (signInResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      const newPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      const newPasswordCommand = new RespondToAuthChallengeCommand({
        ClientId: USER_POOL_CLIENT_ID,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: signInResponse.Session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword
        }
      });

      const finalResponse = await cognitoClient.send(newPasswordCommand);
      
      return createResponse(200, {
        message: 'Phone authentication successful',
        authenticationResult: finalResponse.AuthenticationResult
      });
    }

    return createResponse(200, {
      message: 'Phone authentication successful',
      authenticationResult: signInResponse.AuthenticationResult
    });

  } catch (error) {
    console.error('ConfirmPhoneAuth error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

// Resend phone verification code
export const resendPhoneCode = async (event) => {
  try {
    const { phoneNumber } = JSON.parse(event.body);

    // Clean the phone number the same way
    const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/[^\+\d]/g, '');
    
    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Use the cleaned phone number as username
    const username = cleanPhone;
    
    // Update user's temporary password with new code
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: verificationCode + 'Aa!', // Match the password format
      Temporary: true
    });
    
    await cognitoClient.send(setPasswordCommand);

    // Send new SMS
    const smsCommand = new PublishCommand({
      PhoneNumber: cleanPhone,
      Message: `Your verification code is: ${verificationCode}`
    });

    await snsClient.send(smsCommand);

    return createResponse(200, {
      message: 'New SMS code sent',
      codeDeliveryDetails: {
        Destination: cleanPhone.replace(/(\+\d{2})\d{3}(\d{2})(\d{2})/, '$1***$2$3'),
        DeliveryMedium: 'SMS'
      }
    });

  } catch (error) {
    console.error('ResendPhoneCode error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};
