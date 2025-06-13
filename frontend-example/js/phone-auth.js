// Phone authentication functions (passwordless SMS OTP)
let phoneAuthState = {
    currentPhone: '',
    currentSession: '',
    pendingVerification: false
};

function showPhoneForm(formType) {
    // Hide all phone forms
    document.querySelectorAll('#phone-auth .auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    document.getElementById(`phone-${formType}`).classList.add('active');
}

// Phone Sign In - Initiate SMS
document.addEventListener('DOMContentLoaded', function() {
    const phoneSigninForm = document.getElementById('phone-signin-form');
    if (phoneSigninForm) {
        phoneSigninForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const phoneInput = document.getElementById('phone-signin-number').value.trim();
            
            if (!phoneInput) {
                showStatusMessage('Please enter your phone number', 'error');
                return;
            }
            
            // Format phone number - clean it the same way as backend
            const cleanPhone = phoneInput.replace(/\s/g, '').replace(/[^\+\d]/g, '');
            console.log('Frontend: Original phone:', phoneInput);
            console.log('Frontend: Cleaned phone:', cleanPhone);
            
            if (cleanPhone.length < 10) {
                showStatusMessage('Please enter a valid phone number', 'error');
                return;
            }
            
            try {
                setButtonLoading('phone-signin-form', true);
                
                console.log('Frontend: Sending initiate request with phone:', cleanPhone);
                const response = await authAPI.makeRequest('/auth/phone/initiate', {
                    method: 'POST',
                    body: JSON.stringify({
                        phoneNumber: cleanPhone
                    })
                });
                
                console.log('Frontend: Initiate response:', response);
                showStatusMessage('SMS code sent! Please check your messages.', 'success');
                
                // Store phone and session for verification
                phoneAuthState.currentPhone = cleanPhone;
                phoneAuthState.currentSession = response.session;
                phoneAuthState.pendingVerification = true;
                
                console.log('Frontend: Stored phone state:', phoneAuthState);
                
                // Show verification form
                document.getElementById('phone-verify-number').textContent = cleanPhone;
                showPhoneForm('verify');
                
                // Focus on verification code input
                setTimeout(() => {
                    document.getElementById('phone-verification-code').focus();
                }, 100);
                
            } catch (error) {
                console.error('Frontend: Initiate error:', error);
                showStatusMessage(`Failed to send SMS: ${error.message}`, 'error');
            } finally {
                setButtonLoading('phone-signin-form', false);
            }
        });
    }
});

// Phone Verification - Confirm SMS Code
document.addEventListener('DOMContentLoaded', function() {
    const phoneVerifyForm = document.getElementById('phone-verify-form');
    if (phoneVerifyForm) {
        phoneVerifyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const verificationCode = document.getElementById('phone-verification-code').value.trim();
            const phoneNumber = phoneAuthState.currentPhone;
            const session = phoneAuthState.currentSession;
            
            console.log('Frontend: Confirm attempt with:');
            console.log('  - Phone:', phoneNumber);
            console.log('  - Code:', verificationCode);
            console.log('  - Session:', session);
            console.log('  - Full state:', phoneAuthState);
            
            if (!phoneNumber || !session) {
                console.error('Frontend: Missing phone or session');
                showStatusMessage('Session expired. Please request a new code.', 'error');
                showPhoneForm('signin');
                return;
            }
            
            if (!verificationCode) {
                showStatusMessage('Please enter the verification code', 'error');
                return;
            }
            
            try {
                setButtonLoading('phone-verify-form', true);
                
                console.log('Frontend: Sending confirm request...');
                const response = await authAPI.makeRequest('/auth/phone/confirm', {
                    method: 'POST',
                    body: JSON.stringify({
                        phoneNumber: phoneNumber,
                        code: verificationCode,
                        session: session
                    })
                });
                
                console.log('Frontend: Confirm response:', response);
                
                if (response.authenticationResult) {
                    // Successful authentication
                    authAPI.setAuthToken(response.authenticationResult.AccessToken);
                    
                    showStatusMessage('Signed in successfully!', 'success');
                    console.log('Frontend: Authentication successful!');
                    
                    // Extract user info
                    const userInfo = {
                        phone_number: phoneNumber,
                        accessToken: response.authenticationResult.AccessToken,
                        refreshToken: response.authenticationResult.RefreshToken,
                        idToken: response.authenticationResult.IdToken
                    };
                    
                    // Clear phone auth state
                    phoneAuthState.currentPhone = '';
                    phoneAuthState.currentSession = '';
                    phoneAuthState.pendingVerification = false;
                    
                    showDashboard(userInfo);
                    
                } else {
                    console.error('Frontend: No authentication result in response');
                    throw new Error('Authentication failed - no tokens received');
                }
                
            } catch (error) {
                console.error('Frontend: Confirm error:', error);
                console.error('Frontend: Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                
                showStatusMessage(`Verification failed: ${error.message}`, 'error');
                
                // If code is invalid, stay on verification form
                if (error.message.includes('Invalid') || error.message.includes('Code') || error.message.includes('Incorrect')) {
                    console.log('Frontend: Invalid code, staying on verification form');
                    // Clear the input for retry
                    document.getElementById('phone-verification-code').value = '';
                    document.getElementById('phone-verification-code').focus();
                } else {
                    console.log('Frontend: Other error, going back to signin');
                    // For other errors, go back to phone input
                    showPhoneForm('signin');
                }
            } finally {
                setButtonLoading('phone-verify-form', false);
            }
        });
    }
});

// Resend Phone Code
function resendPhoneCode() {
    const phoneNumber = phoneAuthState.currentPhone;
    
    console.log('Frontend: Resend requested for phone:', phoneNumber);
    
    if (!phoneNumber) {
        showStatusMessage('Phone number not found. Please start over.', 'error');
        showPhoneForm('signin');
        return;
    }
    
    initiatePhoneAuth(phoneNumber);
}

async function initiatePhoneAuth(phoneNumber) {
    try {
        console.log('Frontend: Resending SMS to:', phoneNumber);
        const response = await authAPI.makeRequest('/auth/phone/initiate', {
            method: 'POST',
            body: JSON.stringify({
                phoneNumber: phoneNumber
            })
        });
        
        console.log('Frontend: Resend response:', response);
        showStatusMessage('New SMS code sent! Please check your messages.', 'success');
        
        // Update session
        phoneAuthState.currentSession = response.session;
        
        // Clear verification input
        document.getElementById('phone-verification-code').value = '';
        document.getElementById('phone-verification-code').focus();
        
    } catch (error) {
        console.error('Frontend: Resend error:', error);
        showStatusMessage(`Failed to resend SMS: ${error.message}`, 'error');
    }
}

// Auto-format phone number input (simplified for better compatibility)
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone-signin-number');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function(e) {
            // Clean the phone number on blur
            const cleaned = e.target.value.replace(/\s/g, '').replace(/[^\+\d]/g, '');
            console.log('Frontend: Phone input cleaned:', e.target.value, '→', cleaned);
            if (cleaned !== e.target.value) {
                e.target.value = cleaned;
            }
        });
    }
});

// Auto-submit verification code when 6 digits entered
document.addEventListener('DOMContentLoaded', function() {
    const verificationInput = document.getElementById('phone-verification-code');
    if (verificationInput) {
        verificationInput.addEventListener('input', function(e) {
            // Only allow digits
            e.target.value = e.target.value.replace(/\D/g, '');
            
            console.log('Frontend: Code input:', e.target.value, 'Length:', e.target.value.length);
            
            // Auto-submit when 6 digits entered (more robust approach)
            if (e.target.value.length === 6) {
                console.log('Frontend: Auto-submitting 6-digit code');
                setTimeout(() => {
                    try {
                        const form = document.getElementById('phone-verify-form');
                        if (form) {
                            // Use click on submit button instead of form.submit() to avoid extension conflicts
                            const submitButton = form.querySelector('button[type="submit"]');
                            if (submitButton) {
                                console.log('Frontend: Clicking submit button');
                                submitButton.click();
                            } else {
                                console.log('Frontend: No submit button found, dispatching submit event');
                                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                            }
                        } else {
                            console.error('Frontend: Verify form not found');
                        }
                    } catch (error) {
                        console.error('Frontend: Auto-submit error:', error);
                    }
                }, 300); // Increased delay to avoid conflicts
            }
        });
        
        verificationInput.addEventListener('keydown', function(e) {
            // Allow backspace, delete, arrow keys, tab
            if ([8, 9, 27, 46, 37, 38, 39, 40].includes(e.keyCode) ||
                // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey) ||
                (e.keyCode === 67 && e.ctrlKey) ||
                (e.keyCode === 86 && e.ctrlKey) ||
                (e.keyCode === 88 && e.ctrlKey)) {
                return;
            }
            
            // Ensure that it's a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    }
});
