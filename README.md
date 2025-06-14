# PandasDB Signup System

A serverless authentication backend built with AWS Lambda, API Gateway, and Cognito. Deploy either **email-only** or **phone-only** authentication systems with a single command.

## 📁 Repository Structure

```
pandasdb-signup-system/
├── src/
│   ├── handlers/
│   │   ├── email-auth.js        # Email authentication handlers
│   │   └── phone-auth.js        # Phone authentication handlers
│   └── triggers/
│       └── auth.js              # Cognito Lambda triggers (for future custom auth)
├── frontend-example/            # Complete frontend testing interface
│   ├── index.html               # Main HTML with both email and phone auth
│   ├── css/styles.css           # Modern responsive styling
│   ├── js/
│   │   ├── auth.js              # Core authentication utilities
│   │   ├── email-auth.js        # Email authentication flows
│   │   └── phone-auth.js        # Phone authentication flows
│   └── README.md                # Frontend documentation
├── serverless-email.yml         # Email authentication configuration
├── serverless-phone.yml         # Phone authentication configuration
├── package.json                 # Dependencies and deployment scripts
├── README.md                    # This file
├── .gitignore                   # Git ignore rules
└── node_modules/                # Dependencies (after npm install)
```

## 🚀 **Choose Your Authentication Type**

Deploy either email-based or phone-based authentication. Each deployment creates a focused, optimized system without conflicts.

### **Email Authentication System**
```bash
npm run deploy:email
```

**Features:**
- Email signup with verification codes
- Password-based signin
- Email confirmation flow
- Password reset via email
- Resend verification codes

**Endpoints:**
- `POST /auth/signup` - Email signup
- `POST /auth/signin` - Email signin
- `POST /auth/confirm` - Email confirmation
- `POST /auth/resend` - Resend email code
- `POST /auth/forgot-password` - Password reset
- `POST /auth/confirm-forgot-password` - Confirm reset

### **Phone Authentication System**
```bash
npm run deploy:phone
```

**Features:**
- **Passwordless SMS authentication**
- International phone number support
- SMS verification codes via Amazon SNS
- Auto-user creation on first login
- Resend SMS functionality

**Endpoints:**
- `POST /auth/phone/initiate` - Send SMS verification code
- `POST /auth/phone/confirm` - Verify SMS code & authenticate
- `POST /auth/phone/resend` - Resend SMS code

## 📋 Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate permissions
- Serverless Framework: `npm install -g serverless`

## 🛠️ Installation

```bash
# Clone and setup
git clone <your-repo-url>
cd pandasdb-signup-system

# Install dependencies
npm install

# Deploy your chosen authentication system
npm run deploy:email    # or npm run deploy:phone
```

## 📱 Frontend Testing

A complete frontend testing interface is included in `frontend-example/`:

```bash
# Open the frontend
cd frontend-example
# Open index.html in your browser or serve with:
python -m http.server 8000
# Visit http://localhost:8000
```

**Frontend Features:**
- ✅ **Responsive design** that works on desktop and mobile
- ✅ **Real-time validation** with helpful error messages
- ✅ **Auto-phone formatting** for international numbers
- ✅ **Auto-submit** verification codes when 6 digits entered
- ✅ **Tab switching** between email and phone authentication
- ✅ **API configuration** panel for easy backend URL setup

## 🔧 Configuration

### **AWS Requirements**

**For Email Authentication:**
- Basic AWS account with Cognito permissions
- No additional setup required

**For Phone Authentication:**
- AWS account with Cognito and SNS permissions
- SMS spending limits configured in AWS Console
- International SMS delivery enabled (if needed)

### **Environment Configuration**

The system automatically configures based on deployment type:
- **Region**: `eu-west-1` (configurable in serverless-email.yml or serverless-phone.yml)
- **Auth Type**: Set via deployment command
- **Cognito**: Automatically configured for chosen auth type

## 🌍 International Phone Support

The phone authentication system supports international phone numbers:

- **Format**: Use international format like `+34 633 66 83 96`
- **Countries**: All countries supported by Amazon SNS
- **Auto-formatting**: Frontend automatically formats phone inputs
- **Validation**: Backend accepts and processes international formats

## 🔄 Switching Between Systems

To switch from one authentication type to another:

```bash
# Remove current system
npm run remove:email  # or npm run remove:phone

# Deploy new system
npm run deploy:phone  # or npm run deploy:email
```

**Note**: This will delete all existing users. In production, you'd want to migrate users between systems.

## 📊 API Response Examples

### **Email Signup Response**
```json
{
  "message": "User registered successfully",
  "userSub": "uuid-here",
  "codeDeliveryDetails": {
    "Destination": "u***@e***.com",
    "DeliveryMedium": "EMAIL"
  }
}
```

### **Phone Authentication Response**
```json
{
  "message": "SMS code sent",
  "session": "phone-auth-session",
  "codeDeliveryDetails": {
    "Destination": "+34***96",
    "DeliveryMedium": "SMS"
  }
}
```

### **Successful Authentication**
```json
{
  "message": "Authentication successful",
  "authenticationResult": {
    "AccessToken": "jwt-access-token",
    "RefreshToken": "jwt-refresh-token",
    "IdToken": "jwt-id-token",
    "ExpiresIn": 3600
  }
}
```

## 🔒 Security Features

- **Password Policy**: 8+ characters, uppercase, lowercase, numbers required
- **JWT Tokens**: Secure token-based authentication
- **CORS Enabled**: Ready for cross-origin frontend integration
- **Rate Limiting**: Built-in AWS API Gateway rate limiting
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Secure error messages without information leakage

## 🛠️ Development

### **View Logs**
```bash
npm run logs:email signUp
npm run logs:phone initiatePhoneAuth
```

### **Test Functions Locally**
```bash
npm run invoke:email signUp -- --data '{"body": "{\"email\":\"test@example.com\",\"password\":\"Test123\"}"}'
```

### **Custom Configuration**
Edit `serverless-email.yml` or `serverless-phone.yml` to customize:
- AWS region
- Password policies
- Function timeouts
- Memory allocation

## 🚀 Production Deployment

### **Email System Production Checklist**
- [ ] Configure custom domain for API
- [ ] Set up SES for custom email sending (optional)
- [ ] Configure CloudWatch alarms
- [ ] Set up proper IAM roles
- [ ] Enable AWS WAF for API protection

### **Phone System Production Checklist**
- [ ] Configure SMS spending limits in AWS Console
- [ ] Set up international SMS delivery regions
- [ ] Monitor SMS costs via CloudWatch
- [ ] Configure phone number validation rules
- [ ] Set up SMS delivery failure handling

## 📈 Monitoring

### **CloudWatch Metrics**
- Lambda function duration and errors
- API Gateway requests and latency
- Cognito user pool metrics
- SNS SMS delivery status (phone system)

### **Useful CloudWatch Queries**
```bash
# View authentication errors
aws logs filter-log-events --log-group-name /aws/lambda/pandasdb-signup-system-email-dev-signUp

# Monitor SMS delivery
aws logs filter-log-events --log-group-name /aws/lambda/pandasdb-signup-system-phone-dev-initiatePhoneAuth
```

## 🧹 Cleanup

```bash
npm run remove:email  # or npm run remove:phone
```

This removes all AWS resources created by the deployment.

## 🔗 Integration Examples

### **React Integration**
```javascript
const signUp = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

### **Phone Authentication**
```javascript
const initiatePhoneAuth = async (phoneNumber) => {
  const response = await fetch(`${API_URL}/auth/phone/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  return response.json();
};
```

## 🎯 Use Cases

### **Email Authentication Best For:**
- Web applications
- Traditional signup flows
- Users comfortable with passwords
- B2B applications
- Desktop-first applications

### **Phone Authentication Best For:**
- Mobile applications
- Quick onboarding flows
- International users
- Guest checkout processes
- Modern consumer apps

## Future Work

- Social login
- Sign up & Sign in Captcha

### **Phone Authentication Best For:**
- Mobile applications
- Quick onboarding flows
- International users
- Guest checkout processes
- Modern consumer apps


## 📞 Support

- **Documentation**: Check this README and frontend-example/README.md
- **AWS Documentation**: [Cognito](https://docs.aws.amazon.com/cognito/) and [SNS](https://docs.aws.amazon.com/sns/)
- **Serverless Framework**: [Documentation](https://www.serverless.com/framework/docs/)

## 🏷️ License

MIT License - see LICENSE file for details.
