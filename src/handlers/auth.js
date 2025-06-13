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

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const USER_POOL_ID = process.env.USER_POOL_ID;
const VERIFICATION_TYPE = process.env.VERIFICATION_TYPE;

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

    // Determine username and user attributes based on verification type
    let username, userAttributes = [];

    if (VERIFICATION_TYPE === 'email' || VERIFICATION_TYPE === 'both') {
      username = email;
      userAttributes.push({
        Name: 'email',
        Value: email
      });
    }

    if (VERIFICATION_TYPE === 'phone_number') {
      username = phoneNumber;
      userAttributes.push({
        Name: 'phone_number',
        Value: phoneNumber
      });
    }

    if (VERIFICATION_TYPE === 'both' && phoneNumber) {
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
    if (VERIFICATION_TYPE === 'email' || VERIFICATION_TYPE === 'both') {
      username = email;
    } else if (VERIFICATION_TYPE === 'phone_number') {
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
    if (VERIFICATION_TYPE === 'email' || VERIFICATION_TYPE === 'both') {
      username = email;
    } else if (VERIFICATION_TYPE === 'phone_number') {
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
    if (VERIFICATION_TYPE === 'email' || VERIFICATION_TYPE === 'both') {
      username = email;
    } else if (VERIFICATION_TYPE === 'phone_number') {
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
    if (VERIFICATION_TYPE === 'email' || VERIFICATION_TYPE === 'both') {
      username = email;
    } else if (VERIFICATION_TYPE === 'phone_number') {
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
    if (VERIFICATION_TYPE === 'email' || VERIFICATION_TYPE === 'both') {
      username = email;
    } else if (VERIFICATION_TYPE === 'phone_number') {
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

    // For passwordless auth, we need to use custom auth flow
    // First, we'll use the phone number as username and trigger SMS
    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: 'CUSTOM_AUTH',
      AuthParameters: {
        USERNAME: phoneNumber
      }
    });

    const response = await cognitoClient.send(command);

    return createResponse(200, {
      message: 'SMS code sent',
      session: response.Session,
      challengeName: response.ChallengeName
    });

  } catch (error) {
    // If user doesn't exist, create them first (phone-only signup)
    if (error.name === 'UserNotFoundException') {
      try {
        // Create user with phone number only
        const createCommand = new AdminCreateUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: phoneNumber,
          UserAttributes: [
            {
              Name: 'phone_number',
              Value: phoneNumber
            },
            {
              Name: 'phone_number_verified',
              Value: 'true'
            }
          ],
          MessageAction: 'SUPPRESS', // Don't send welcome email
          TemporaryPassword: Math.random().toString(36).slice(-8) // Temp password
        });

        await cognitoClient.send(createCommand);

        // Now initiate auth again
        const authCommand = new AdminInitiateAuthCommand({
          UserPoolId: USER_POOL_ID,
          ClientId: USER_POOL_CLIENT_ID,
          AuthFlow: 'CUSTOM_AUTH',
          AuthParameters: {
            USERNAME: phoneNumber
          }
        });

        const authResponse = await cognitoClient.send(authCommand);

        return createResponse(200, {
          message: 'SMS code sent',
          session: authResponse.Session,
          challengeName: authResponse.ChallengeName,
          newUser: true
        });

      } catch (createError) {
        console.error('Create user error:', createError);
        return createResponse(400, {
          error: createError.name,
          message: createError.message
        });
      }
    }

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

    const command = new RespondToAuthChallengeCommand({
      ClientId: USER_POOL_CLIENT_ID,
      ChallengeName: 'CUSTOM_CHALLENGE',
      Session: session,
      ChallengeResponses: {
        USERNAME: phoneNumber,
        ANSWER: code
      }
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      return createResponse(200, {
        message: 'Phone authentication successful',
        authenticationResult: response.AuthenticationResult
      });
    } else {
      return createResponse(400, {
        error: 'InvalidCode',
        message: 'Invalid verification code'
      });
    }

  } catch (error) {
    console.error('ConfirmPhoneAuth error:', error);
    return createResponse(400, {
      error: error.name,
      message: error.message
    });
  }
};
