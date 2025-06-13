# PandasDB Signup System

A serverless authentication backend built with AWS Lambda, API Gateway, and Cognito. Supports configurable email and phone verification methods.

## 📁 Repository Structure

```
pandasdb-signup-system/
├── src/
│   ├── handlers/
│   │   └── auth.js              # Main authentication handlers
│   └── triggers/
│       └── auth.js              # Cognito Lambda triggers for custom auth
├── serverless.yml               # Serverless framework configuration
├── package.json                 # Dependencies and scripts
├── README.md                    # This file
├── .gitignore                   # Git ignore rules
└── node_modules/                # Dependencies (after npm install)
```

### File Descriptions

- **`src/handlers/auth.js`** - Core authentication logic (signup, signin, confirm, etc.)
- **`src/triggers/auth.js`** - Lambda triggers for passwordless SMS authentication
- **`serverless.yml`** - Infrastructure as Code (Cognito, Lambda, API Gateway)
- **`package.json`** - Project dependencies and deployment scripts

## Features

- **Email Verification**: Traditional email-based signup and signin
- **Phone Verification**: SMS-based signup and signin  
- **Flexible Deployment**: Choose verification method at deploy time
- **Complete Auth Flow**: Signup, signin, confirmation, password reset
- **CORS Enabled**: Ready for frontend integration

## Prerequisites

- Node.js 18+
- AWS CLI configured
- Serverless Framework

## Installation

```bash
npm install
```

## Deployment Options

### Email Verification (Default)
```bash
npm run deploy:email
# or
npm run deploy
```

### Phone Verification
```bash
npm run deploy:phone
```

### Both Email and Phone
```bash
npm run deploy:both
```

## API Endpoints

All endpoints support CORS and expect JSON payloads.

### POST /auth/signup
Register a new user (traditional signup with password).

**Email Mode:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Phone Mode:**
```json
{
  "phoneNumber": "+1234567890",
  "password": "Password123"
}
```

**Both Mode:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "password": "Password123"
}
```

### POST /auth/signin
Sign in with email/password (traditional signin).

**Request:**
```json
{
  "email": "user@example.com", // or phoneNumber for phone mode
  "password": "Password123"
}
```

### POST /auth/phone/initiate
**Passwordless phone authentication** - initiate SMS OTP (no password needed).

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "message": "SMS code sent",
  "session": "session-token",
  "challengeName": "CUSTOM_CHALLENGE"
}
```

### POST /auth/phone/confirm
Complete passwordless phone authentication with SMS code.

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "code": "123456",
  "session": "session-token-from-initiate"
}
```

### POST /auth/confirm
Confirm user registration with verification code.

**Request:**
```json
{
  "email": "user@example.com", // or phoneNumber for phone mode
  "confirmationCode": "123456"
}
```

### POST /auth/resend
Resend confirmation code.

**Request:**
```json
{
  "email": "user@example.com" // or phoneNumber for phone mode
}
```

### POST /auth/forgot-password
Initiate password reset.

**Request:**
```json
{
  "email": "user@example.com" // or phoneNumber for phone mode
}
```

### POST /auth/confirm-forgot-password
Complete password reset.

**Request:**
```json
{
  "email": "user@example.com", // or phoneNumber for phone mode
  "confirmationCode": "123456",
  "newPassword": "NewPassword123"
}
```

## Authentication Flows

### 1. Traditional Email/Password Flow
1. `POST /auth/signup` → User gets verification email
2. `POST /auth/confirm` → User confirms with email code  
3. `POST /auth/signin` → User signs in with email + password

### 2. Traditional Phone/Password Flow  
1. `POST /auth/signup` → User gets verification SMS
2. `POST /auth/confirm` → User confirms with SMS code
3. `POST /auth/signin` → User signs in with phone + password

### 3. **Passwordless Phone Flow (SMS OTP)**
1. `POST /auth/phone/initiate` → User enters phone, gets SMS code instantly
2. `POST /auth/phone/confirm` → User enters SMS code, gets logged in

**No password required!** Perfect for modern mobile-first apps.

After deployment, use the API Gateway URL from the stack outputs. The Cognito User Pool ID and Client ID are also available in the outputs for direct SDK integration.

**Example fetch:**
```javascript
const response = await fetch('https://your-api-id.execute-api.region.amazonaws.com/dev/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123'
  })
});
```

## Environment Variables

The following are automatically set during deployment:
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID  
- `VERIFICATION_TYPE`: email, phone_number, or both

## Password Policy

- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter  
- Must contain number
- Symbols optional

## Cleanup

```bash
npm run remove
```

## Development

View logs:
```bash
npm run logs signUp
```

Invoke function locally:
```bash
npm run invoke signUp -- --data '{"body": "{\"email\":\"test@example.com\",\"password\":\"Test123\"}"}'
```
