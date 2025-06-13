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

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code (in a real app, use DynamoDB with TTL)
    // For now, we'll use a simple approach with temporary password
    const encodedPhone = phoneNumber.replace(/\+/g, 'PLUS').replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    try {
      // Create or update user with verification code as temporary password
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: encodedPhone,
        UserAttributes: [
          {
            Name: 'email',
            Value: `${encodedPhone}@phone.local`
          },
          {
            Name: 'email_verified',
            Value: 'true'
          }
        ],
        MessageAction: 'SUPPRESS',
        TemporaryPassword: verificationCode + 'A!' // Store code in temp password
      });

      await cognitoClient.send(createCommand);
    } catch (createError) {
      // User might exist, set new temporary password
      if (createError.name === 'UsernameExistsException') {
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: encodedPhone,
          Password: verificationCode + 'A!',
          Temporary: true
        });
        await cognitoClient.send(setPasswordCommand);
      }
    }

    // Send SMS via SNS
    const smsCommand = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: `Your verification code is: ${verificationCode}`
    });

    await snsClient.send(smsCommand);

    return createResponse(200, {
      message: 'SMS code sent',
      session: 'phone-auth-session',
      codeDeliveryDetails: {
        Destination: phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1***$2'),
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

    // Encode phone number the same way as in initiate
    const encodedPhone = 'phone_' + phoneNumber.replace(/\+/g, '').replace(/\s/g, '').replace(/[^0-9]/g, '');
    
    // Try to authenticate with the verification code as password
    const signInCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: encodedPhone,
        PASSWORD: code + 'A!' // Code stored as temp password
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
          USERNAME: encodedPhone,
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

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const encodedPhone = 'phone_' + phoneNumber.replace(/\+/g, '').replace(/\s/g, '').replace(/[^0-9]/g, '');
    
    // Update user's temporary password with new code
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: encodedPhone,
      Password: verificationCode + 'A!',
      Temporary: true
    });
    
    await cognitoClient.send(setPasswordCommand);

    // Send new SMS
    const smsCommand = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: `Your verification code is: ${verificationCode}`
    });

    await snsClient.send(smsCommand);

    return createResponse(200, {
      message: 'New SMS code sent',
      codeDeliveryDetails: {
        Destination: phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1***$2'),
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
