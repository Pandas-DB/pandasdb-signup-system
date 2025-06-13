# Frontend Authentication Examples

This directory contains separate frontend implementations for email and phone authentication systems.

## 📁 Structure

```
frontend-example/
├── email-auth.html          # Email authentication interface
├── phone-auth.html          # Phone authentication interface
├── css/
│   └── styles.css           # Shared styles for both systems
├── js/
│   ├── auth.js              # Core authentication utilities (shared)
│   ├── email-auth.js        # Email authentication logic
│   └── phone-auth.js        # Phone authentication logic
└── README.md                # This file
```

## 🚀 Quick Start

### Email Authentication Frontend
```bash
# Serve the email frontend
python -m http.server 8000
# Open: http://localhost:8000/email-auth.html
```

### Phone Authentication Frontend
```bash
# Serve the phone frontend
python -m http.server 8000
# Open: http://localhost:8000/phone-auth.html
```

## 📱 Features

### **Email Authentication (email-auth.html)**
- ✅ **Email signup** with password requirements
- ✅ **Email signin** with remember me option
- ✅ **Email verification** with resend functionality
- ✅ **Password reset** flow
- ✅ **Real-time validation** and error handling
- ✅ **Password visibility toggle**

### **Phone Authentication (phone-auth.html)**
- ✅ **Passwordless SMS authentication**
- ✅ **Auto-phone formatting** for international numbers
- ✅ **Auto-submit** verification codes when 6 digits entered
- ✅ **SMS resend** functionality
- ✅ **Real-time validation** and error handling
- ✅ **International phone support**

## 🔧 Configuration

### **API Setup**
1. Deploy your backend using either:
   - `npm run deploy:email` (for email frontend)
   - `npm run deploy:phone` (for phone frontend)

2. Copy the API Gateway URL from the deployment output

3. Open the appropriate frontend file and configure the API URL:
   - Click the "⚙️ API Configuration" section
   - Paste your API URL
   - Click "Save Config"

### **Example API URLs**
```
Email API: https://abc123.execute-api.eu-west-1.amazonaws.com/dev
Phone API: https://def456.execute-api.eu-west-1.amazonaws.com/dev
```

## 📊 File Descriptions

### **Core Files**

**`auth.js`** - Shared authentication utilities:
- API communication class
- Token management
- UI utility functions
- Form validation helpers

**`email-auth.js`** - Email-specific functionality:
- Email signup/signin flows
- Email verification handling
- Password reset functionality
- Email validation

**`phone-auth.js`** - Phone-specific functionality:
- SMS initiation and verification
- Phone number formatting
- Auto-submit verification codes
- International phone support

**`styles.css`** - Responsive styling:
- Modern gradient design
- Mobile-friendly layout
- Loading states and animations
- Status message notifications

## 🎯 Authentication Flows

### **Email Authentication Flow**
1. **Signup**: Email + Password → Email verification → Account confirmed
2. **Signin**: Email + Password → Authenticated
3. **Reset**: Email → Reset code → New password → Updated

### **Phone Authentication Flow**
1. **Signin**: Phone number → SMS code → Authenticated
2. **Resend**: Request new SMS code if needed

## 🔒 Security Features

- **Input validation** on both client and server
- **HTTPS-only** communication (when deployed)
- **JWT token storage** in localStorage
- **Auto-logout** on token expiration
- **Secure error handling** without information leakage

## 🌍 International Support

### **Phone Numbers**
- Supports all international formats
- Auto-formatting for better UX
- Validation for proper formatting
- Examples: `+1 555 123 4567`, `+34 633 66 83 96`

### **Email Addresses**
- Standard email validation
- International domain support
- Proper encoding handling

## 🛠️ Development

### **Local Development**
```bash
# Start local server
python -m http.server 8000

# Or with Node.js
npx http-server .

# Or with PHP
php -S localhost:8000
```

### **Testing**
1. Configure API endpoint in the frontend
2. Test signup/signin flows
3. Verify email/SMS delivery
4. Test error scenarios
5. Check responsive design on mobile

### **Customization**
- Modify `styles.css` for custom branding
- Update validation rules in respective auth files
- Add additional form fields as needed
- Customize error messages and UI text

## 📱 Mobile Optimization

- **Responsive design** works on all screen sizes
- **Touch-friendly** buttons and inputs
- **Auto-zoom prevention** on form inputs
- **Mobile keyboard optimization** for phone/email inputs

## 🔗 Integration

### **Copy for Your Project**
1. Copy the relevant HTML file (`email-auth.html` or `phone-auth.html`)
2. Copy the `css/` and `js/` directories
3. Update API endpoints in the configuration
4. Customize styling and branding as needed

### **Framework Integration**
- **React**: Convert HTML to JSX components
- **Vue**: Use as template references
- **Angular**: Adapt forms and API calls
- **Vanilla JS**: Use as-is or customize further

## 🆘 Troubleshooting

### **Common Issues**

**"API Error: Failed to fetch"**
- Check if API URL is correct
- Verify CORS is enabled on backend
- Ensure API is deployed and accessible

**"SMS not received"**
- Check phone number format
- Verify AWS SNS is configured
- Check SMS spending limits in AWS Console

**"Email not received"**
- Check spam folder
- Verify AWS SES is configured (if using custom email)
- Check AWS Cognito email settings

**"Configuration not saving"**
- Ensure localStorage is enabled in browser
- Check for browser errors in console
- Try clearing browser cache

### **Debug Mode**
Open browser developer tools to see:
- Network requests and responses
- Console logs for API calls
- Local storage data
- JavaScript errors

## 📞 Support

- Check the main project README for backend setup
- Verify AWS service configurations
- Test with browser developer tools open
- Check AWS CloudWatch logs for backend errors
