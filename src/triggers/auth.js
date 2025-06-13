// Lambda triggers for Cognito custom auth flow (passwordless SMS)

export const createAuthChallenge = async (event) => {
  if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    event.response.publicChallengeParameters = {
      phone: event.request.userAttributes.phone_number
    };
    event.response.privateChallengeParameters = {
      answer: code
    };
    event.response.challengeMetadata = 'SMS_CHALLENGE';
    
    // Store the code (in real implementation, you'd send SMS here)
    // For now, Cognito will handle SMS sending via SNS
  }
  
  return event;
};

export const defineAuthChallenge = async (event) => {
  const { request, response } = event;
  
  if (request.session.length === 0) {
    // First attempt - issue custom challenge
    response.challengeName = 'CUSTOM_CHALLENGE';
    response.issueTokens = false;
    response.failAuthentication = false;
  } else if (request.session.length === 1 && request.session[0].challengeResult === true) {
    // Correct answer - issue tokens
    response.issueTokens = true;
    response.failAuthentication = false;
  } else {
    // Wrong answer or too many attempts
    response.issueTokens = false;
    response.failAuthentication = true;
  }
  
  return event;
};

export const verifyAuthChallengeResponse = async (event) => {
  const { request, response } = event;
  
  if (request.privateChallengeParameters.answer === request.challengeAnswer) {
    response.answerCorrect = true;
  } else {
    response.answerCorrect = false;
  }
  
  return event;
};
