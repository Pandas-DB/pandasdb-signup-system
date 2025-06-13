// Email authentication functions
let emailAuthState = {
    currentEmail: '',
    pendingConfirmation: false
};

function showEmailForm(formType) {
    // Hide all email forms
    document.querySelectorAll('#email-auth .auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    document.getElementById(`email-${formType}`).classList.add('active');
}

// Email Sign Up
document.addEventListener('DOMContentLoaded', function() {
    const emailSignupForm = document.getElementById('email-signup-form');
    if (emailSignupForm) {
        emailSignupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email-signup-email').value.trim();
            const password = document.getElementById('email-signup-password').value;
            const confirmPassword = document.getElementById('email-confirm-password').value;
            
            // Validation
            if (!isValidEmail(email)) {
                showStatusMessage('Please enter a valid email address', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showStatusMessage('Passwords do not match', 'error');
                return;
            }
            
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                showStatusMessage(passwordValidation.errors[0], 'error');
                return;
            }
            
            const agreeTerms = document.getElementById('agree-terms').checked;
            if (!agreeTerms) {
                showStatusMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
                return;
            }
            
            try {
                setButtonLoading('email-signup-form', true);
                
                const response = await authAPI.makeRequest('/auth/signup', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });
                
                showStatusMessage('Account created! Please check your email for verification code.', 'success');
                
                // Store email for confirmation
                emailAuthState.currentEmail = email;
                emailAuthState.pendingConfirmation = true;
                
                // Show confirmation form
                document.getElementById('email-confirm-address').textContent = email;
                showEmailForm('confirm');
                
            } catch (error) {
                showStatusMessage(`Sign up failed: ${error.message}`, 'error');
            } finally {
                setButtonLoading('email-signup-form', false);
            }
        });
    }
});

// Email Sign In
document.addEventListener('DOMContentLoaded', function() {
    const emailSigninForm = document.getElementById('email-signin-form');
    if (emailSigninForm) {
        emailSigninForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email-signin-email').value.trim();
            const password = document.getElementById('email-signin-password').value;
            
            // Validation
            if (!isValidEmail(email)) {
                showStatusMessage('Please enter a valid email address', 'error');
                return;
            }
            
            if (!password) {
                showStatusMessage('Please enter your password', 'error');
                return;
            }
            
            try {
                setButtonLoading('email-signin-form', true);
                
                const response = await authAPI.makeRequest('/auth/signin', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });
                
                if (response.authenticationResult) {
                    // Successful sign in
                    authAPI.setAuthToken(response.authenticationResult.AccessToken);
                    
                    showStatusMessage('Signed in successfully!', 'success');
                    
                    // Extract user info from token (basic info)
                    const userInfo = {
                        email: email,
                        accessToken: response.authenticationResult.AccessToken,
                        refreshToken: response.authenticationResult.RefreshToken,
                        idToken: response.authenticationResult.IdToken
                    };
                    
                    showDashboard(userInfo);
                    
                } else if (response.challengeName) {
                    // Handle additional challenges if needed
                    showStatusMessage(`Additional verification required: ${response.challengeName}`, 'info');
                } else {
                    throw new Error('Unexpected response format');
                }
                
            } catch (error) {
                if (error.message.includes('UserNotConfirmedException')) {
                    showStatusMessage('Please verify your email address first', 'error');
                    emailAuthState.currentEmail = email;
                    document.getElementById('email-confirm-address').textContent = email;
                    showEmailForm('confirm');
                } else {
                    showStatusMessage(`Sign in failed: ${error.message}`, 'error');
                }
            } finally {
                setButtonLoading('email-signin-form', false);
            }
        });
    }
});

// Email Confirmation
document.addEventListener('DOMContentLoaded', function() {
    const emailConfirmForm = document.getElementById('email-confirm-form');
    if (emailConfirmForm) {
        emailConfirmForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const confirmationCode = document.getElementById('email-confirmation-code').value.trim();
            const email = emailAuthState.currentEmail;
            
            if (!email) {
                showStatusMessage('Email address not found. Please try signing up again.', 'error');
                showEmailForm('signup');
                return;
            }
            
            if (!confirmationCode) {
                showStatusMessage('Please enter the verification code', 'error');
                return;
            }
            
            try {
                setButtonLoading('email-confirm-form', true);
                
                const response = await authAPI.makeRequest('/auth/confirm', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email,
                        confirmationCode: confirmationCode
                    })
                });
                
                showStatusMessage('Email verified successfully! You can now sign in.', 'success');
                
                // Clear confirmation state
                emailAuthState.currentEmail = '';
                emailAuthState.pendingConfirmation = false;
                
                // Show sign in form
                showEmailForm('signin');
                
                // Pre-fill email in sign in form
                document.getElementById('email-signin-email').value = email;
                
            } catch (error) {
                showStatusMessage(`Verification failed: ${error.message}`, 'error');
            } finally {
                setButtonLoading('email-confirm-form', false);
            }
        });
    }
});

// Resend Email Confirmation Code
function resendEmailCode() {
    const email = emailAuthState.currentEmail;
    
    if (!email) {
        showStatusMessage('Email address not found. Please try signing up again.', 'error');
        showEmailForm('signup');
        return;
    }
    
    resendEmailConfirmation(email);
}

async function resendEmailConfirmation(email) {
    try {
        const response = await authAPI.makeRequest('/auth/resend', {
            method: 'POST',
            body: JSON.stringify({
                email: email
            })
        });
        
        showStatusMessage('Verification code sent! Please check your email.', 'success');
        
    } catch (error) {
        showStatusMessage(`Failed to resend code: ${error.message}`, 'error');
    }
}

// Forgot Password
document.addEventListener('DOMContentLoaded', function() {
    const emailForgotForm = document.getElementById('email-forgot-form');
    if (emailForgotForm) {
        emailForgotForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email-forgot-email').value.trim();
            
            if (!isValidEmail(email)) {
                showStatusMessage('Please enter a valid email address', 'error');
                return;
            }
            
            try {
                setButtonLoading('email-forgot-form', true);
                
                const response = await authAPI.makeRequest('/auth/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email
                    })
                });
                
                showStatusMessage('Password reset instructions sent! Please check your email.', 'success');
                
                // Store email for reset confirmation
                emailAuthState.currentEmail = email;
                
                // Show reset confirmation form
                showEmailForm('reset-confirm');
                
            } catch (error) {
                showStatusMessage(`Failed to send reset instructions: ${error.message}`, 'error');
            } finally {
                setButtonLoading('email-forgot-form', false);
            }
        });
    }
});

// Confirm Password Reset
document.addEventListener('DOMContentLoaded', function() {
    const emailResetForm = document.getElementById('email-reset-form');
    if (emailResetForm) {
        emailResetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const confirmationCode = document.getElementById('email-reset-code').value.trim();
            const newPassword = document.getElementById('email-new-password').value;
            const email = emailAuthState.currentEmail;
            
            if (!email) {
                showStatusMessage('Email address not found. Please try the forgot password process again.', 'error');
                showEmailForm('forgot-password');
                return;
            }
            
            if (!confirmationCode) {
                showStatusMessage('Please enter the verification code from your email', 'error');
                return;
            }
            
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.valid) {
                showStatusMessage(passwordValidation.errors[0], 'error');
                return;
            }
            
            try {
                setButtonLoading('email-reset-form', true);
                
                const response = await authAPI.makeRequest('/auth/confirm-forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email,
                        confirmationCode: confirmationCode,
                        newPassword: newPassword
                    })
                });
                
                showStatusMessage('Password reset successfully! You can now sign in with your new password.', 'success');
                
                // Clear state
                emailAuthState.currentEmail = '';
                
                // Show sign in form
                showEmailForm('signin');
                
                // Pre-fill email
                document.getElementById('email-signin-email').value = email;
                
            } catch (error) {
                showStatusMessage(`Password reset failed: ${error.message}`, 'error');
            } finally {
                setButtonLoading('email-reset-form', false);
            }
        });
    }
});

// Auto-focus and validation for verification codes
document.addEventListener('DOMContentLoaded', function() {
    const emailConfirmationInput = document.getElementById('email-confirmation-code');
    if (emailConfirmationInput) {
        emailConfirmationInput.addEventListener('input', function(e) {
            // Only allow digits
            e.target.value = e.target.value.replace(/\D/g, '');
            
            // Auto-submit when 6 digits entered
            if (e.target.value.length === 6) {
                setTimeout(() => {
                    const form = document.getElementById('email-confirm-form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }, 100);
            }
        });
    }
});
