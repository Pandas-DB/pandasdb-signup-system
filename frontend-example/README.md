# Frontend Example - Signup System

This is a complete frontend implementation for testing the Signup System authentication backend. It demonstrates all authentication flows including email/password and passwordless phone authentication.

## 🚀 Quick Start

1. **Deploy the backend first**:
   ```bash
   cd ..
   npm run deploy:email  # or deploy:phone or deploy:both
   ```

2. **Get your API URL** from the deployment output

3. **Open the frontend**:
   ```bash
   cd frontend-example
   # Open index.html in your browser
   # Or serve with a simple HTTP server:
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

4. **Configure the API URL** in the settings section of the page

## 📱 Features

### Email Authentication
- **Sign Up**: Register with email and password
- **Email Verification**: Confirm account via email code
- **Sign In**: Login with email and password
- **Forgot Password**: Reset password via email
- **Password Reset**: Confirm new password with code

### Phone Authentication (Passwordless)
- **SMS Sign In**: Enter phone number → receive SMS → enter code → logged in
- **Auto-formatting**: Phone numbers are automatically formatted
- **Auto-submit**: Verification codes auto-submit when 6 digits entered
- **Resend**: Easy resend functionality

### General Features
- **Responsive Design**: Works on desktop and mobile
- **Real-time Validation**: Form validation with helpful error messages
- **Loading States**: Visual feedback during API calls
- **Session Management**: Remembers login state
- **Tab Switching**: Easy switching between email and phone auth
- **Status Messages**: Clear success/error notifications

## 🎨 UI Design

The interface matches the design shown in your mockups:
- Clean, modern design with gradient backgrounds
- Card-based forms with subtle shadows
- Purple/blue color scheme
- Consistent spacing and typography
- Mobile-responsive layout

## 🔧 Configuration

### API Setup
1. Click the "⚙️ API Configuration" section
2. Enter your API Gateway URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/dev`)
3. Configuration is automatically saved

### Testing Different Verification Types

The frontend automatically adapts to your backend configuration:

- **Email Mode**: Only shows email authentication
- **Phone Mode**: Only shows phone authentication  
- **Both Mode**: Shows both tabs for testing

## 📝 Code Structure

```
frontend-example/
├── index.html           # Main HTML structure
├── css/
│   └── styles.css       # Complete styling
├── js/
│   ├── auth.js          # Core authentication utilities
│   ├── email-auth.js    # Email authentication flows
│   └── phone-auth.js    # Phone authentication flows
└── README.md           # This file
```

### JavaScript Modules

- **`auth.js`**: Core API client, utilities, and shared functions
- **`email-auth.js`**: Email signup, signin, confirmation, password reset
- **`phone-auth.js`**: Passwordless phone authentication with SMS

## 🧪 Testing Scenarios

### Email Flow Testing
1. **New User Registration**:
   - Sign up with email/password
   - Check email for verification code
   - Confirm account
   - Sign in with credentials

2. **Existing User**:
   - Sign in with email/password
   - Test "Remember me" functionality

3. **Password Reset**:
   - Use "Forgot password" link
   - Check email for reset code
   - Set new password

### Phone Flow Testing
1. **First-time User**:
   - Enter phone number
   - Receive SMS code
   - Enter code → automatically signed in

2. **Returning User**:
   - Same flow (passwordless each time)
   - No account creation needed

### Error Testing
- Invalid email formats
- Weak passwords
- Wrong verification codes
- Network errors
- API timeouts

## 🔍 Debugging

### Console Logging
All API requests and responses are logged to the browser console. Open Developer Tools (F12) to see:
- Request URLs and payloads
- Response data
- Error details

### Common Issues

1. **CORS Errors**: Make sure your backend has CORS enabled (it should by default)
2. **API URL**: Ensure the API URL is correct and includes the full path
3. **Phone Format**: Phone numbers should include country code (e.g., +1234567890)
4. **Email Delivery**: Check spam folders for verification emails
5. **SMS Delivery**: SMS may take a few minutes in some regions

## 🚀 Deployment Ready

This frontend can be easily deployed to any static hosting service:

- **GitHub Pages**: Commit to a repository and enable Pages
- **Netlify**: Drag and drop the frontend-example folder
- **Vercel**: Deploy directly from Git
- **AWS S3**: Upload as static website
- **Any web server**: Just serve the static files

## 🔐 Security Notes

- Tokens are stored in localStorage (for demo purposes)
- Passwords are properly validated client-side
- All sensitive operations happen server-side
- Phone numbers are formatted consistently
- No sensitive data is logged to console

## 💡 Customization

### Styling
Edit `css/styles.css` to match your brand:
- Change the gradient colors
- Update the purple theme
- Modify card shadows and borders
- Adjust responsive breakpoints

### Functionality
- Add social login buttons
- Implement biometric authentication
- Add multi-factor authentication
- Customize validation rules

This frontend serves as both a testing tool and a reference implementation for integrating with your Signup System backend!
