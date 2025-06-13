import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

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
    const { email, password } = JSON.parse(event.body);

    // For email aliases, use a consistent non-email username format
    const username = email.replace('@', '_at_').replace(/\./g, '_');
    const userAttributes = [{
      Name: 'email',
      Value: email
    }];

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
      username: username, // Return the username for confirmation
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
    const { email, password } = JSON.parse(event.body);

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
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
    const { email, confirmationCode } = JSON.parse(event.body);

    // Use the same username format as signup
    const username = email.replace('@', '_at_').replace(/\./g, '_');

    console.log(`Attempting to confirm signup for username: ${username}, code: ${confirmationCode}`);

    const command = new ConfirmSignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode
    });

    const response = await cognitoClient.send(command);
    console.log('Confirm signup response:', response);

    return createResponse(200, {
      message: 'User confirmed successfully'
    });

  } catch (error) {
    console.error('ConfirmSignUp error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

export const resendConfirmationCode = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    // Use the same username format as signup
    const username = email.replace('@', '_at_').replace(/\./g, '_');

    console.log(`Attempting to resend confirmation code for username: ${username}`);

    const command = new ResendConfirmationCodeCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username
    });

    const response = await cognitoClient.send(command);

    console.log('Resend confirmation response:', response);

    return createResponse(200, {
      message: 'Confirmation code resent',
      codeDeliveryDetails: response.CodeDeliveryDetails
    });

  } catch (error) {
    console.error('ResendConfirmationCode error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};

export const forgotPassword = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    const command = new ForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email
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
    const { email, confirmationCode, newPassword } = JSON.parse(event.body);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
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
