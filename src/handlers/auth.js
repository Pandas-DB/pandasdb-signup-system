import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminInitiateAuthCommand,
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
const AUTH_TYPE = process.env.AUTH_TYPE;

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

export const signUp = async (event) => {
  try {
    const { email, password, phoneNumber } = JSON.parse(event.body);

    // Determine username and user attributes based on auth type
    let username, userAttributes = [];

    if (AUTH_TYPE === 'email') {
      // For email aliases, use a non-email username and put email in attributes
      username = email.split('@')[0] + '_' + Date.now(); // e.g., "sergi.ortiz_1234567890"
      userAttributes.push({
        Name: 'email',
        Value: email
      });
    } else if (AUTH_TYPE === 'phone') {
      username = phoneNumber;
      userAttributes.push({
        Name: 'phone_number',
        Value: phoneNumber
      });
    }

    const command = new SignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: userAttributes
    });

    const response = await cognitoClient.send(command);

    return createResponse(200, {
      message: 'User registered successfully',
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails
    });

  } catch (error) {
    console.error('SignUp error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

export const signIn = async (event) => {
  try {
    const { email, password, phoneNumber } = JSON.parse(event.body);

    let username;
    if (AUTH_TYPE === 'email') {
      // For email aliases, sign in with the email directly (Cognito handles the alias)
      username = email;
    } else if (AUTH_TYPE === 'phone') {
      username = phoneNumber;
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });

    const response = await cognitoClient.send(command);

    return createResponse(200, {
      message: 'User signed in successfully',
      authenticationResult: response.AuthenticationResult,
      challengeName: response.ChallengeName,
      session: response.Session
    });

  } catch (error) {
    console.error('SignIn error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

export const confirmSignUp = async (event) => {
  try {
    const { email, phoneNumber, confirmationCode } = JSON.parse(event.body);

    let username;
    if (AUTH_TYPE === 'email') {
      // For email confirmation, use the email (Cognito handles the alias)
      username = email;
    } else if (AUTH_TYPE === 'phone') {
      username = phoneNumber;
    }

    const command = new ConfirmSignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode
    });

    await cognitoClient.send(command);

    return createResponse(200, {
      message: 'User confirmed successfully'
    });

  } catch (error) {
    console.error('ConfirmSignUp error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

export const resendConfirmationCode = async (event) => {
  try {
    const { email, phoneNumber } = JSON.parse(event.body);

    let username;
    if (AUTH_TYPE === 'email') {
      // For email resend, use the email (Cognito handles the alias)
      username = email;
    } else if (AUTH_TYPE === 'phone') {
      username = phoneNumber;
    }

    const command = new ResendConfirmationCodeCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username
    });

    const response = await cognitoClient.send(command);

    return createResponse(200, {
      message: 'Confirmation code resent',
      codeDeliveryDetails: response.CodeDeliveryDetails
    });

  } catch (error) {
    console.error('ResendConfirmationCode error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

export const forgotPassword = async (event) => {
  try {
    const { email, phoneNumber } = JSON.parse(event.body);

    let username;
    if (AUTH_TYPE === 'email') {
      username = email;
    } else if (AUTH_TYPE === 'phone') {
      username = phoneNumber;
    }

    const command = new ForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username
    });

    const response = await cognitoClient.send(command);

    return createResponse(200, {
      message: 'Password reset code sent',
      codeDeliveryDetails: response.CodeDeliveryDetails
    });

  } catch (error) {
    console.error('ForgotPassword error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

export const confirmForgotPassword = async (event) => {
  try {
    const { email, phoneNumber, confirmationCode, newPassword } = JSON.parse(event.body);

    let username;
    if (AUTH_TYPE === 'email') {
      username = email;
    } else if (AUTH_TYPE === 'phone') {
      username = phoneNumber;
    }

    const command = new ConfirmForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    });

    await cognitoClient.send(command);

    return createResponse(200, {
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('ConfirmForgotPassword error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

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
