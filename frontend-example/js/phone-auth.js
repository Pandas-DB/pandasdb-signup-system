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
            
            // Format phone number
            const formattedPhone = formatPhoneNumber(phoneInput);
            
            if (formattedPhone.length < 10) {
                showStatusMessage('Please enter a valid phone number', 'error');
                return;
            }
            
            try {
                setButtonLoading('phone-signin-form', true);
                
                const response = await authAPI.makeRequest('/auth/phone/initiate', {
                    method: 'POST',
                    body: JSON.stringify({
                        phoneNumber: formattedPhone
                    })
                });
                
                showStatusMessage('SMS code sent! Please check your messages.', 'success');
                
                // Store phone and session for verification
                phoneAuthState.currentPhone = formattedPhone;
                phoneAuthState.currentSession = response.session;
                phoneAuthState.pendingVerification = true;
                
                // Show verification form
                document.getElementById('phone-verify-number').textContent = formattedPhone;
                showPhoneForm('verify');
                
                // Focus on verification code input
                setTimeout(() => {
                    document.getElementById('phone-verification-code').focus();
                }, 100);
                
            } catch (error) {
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
            
            if (!phoneNumber || !session) {
                showStatusMessage('Session expired. Please request a new code.', 'error');
                showPhoneForm('signin');
                return;
            }
            
            if (!verificationCode || verificationCode.length !== 6) {
                showStatusMessage('Please enter the 6-digit verification code', 'error');
                return;
            }
            
            try {
                setButtonLoading('phone-verify-form', true);
                
                const response = await authAPI.makeRequest('/auth/phone/confirm', {
                    method: 'POST',
                    body: JSON.stringify({
                        phoneNumber: phoneNumber,
                        code: verificationCode,
                        session: session
                    })
                });
                
                if (response.authenticationResult) {
                    // Successful authentication
                    authAPI.setAuthToken(response.authenticationResult.AccessToken);
                    
                    showStatusMessage('Signed in successfully!', 'success');
                    
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
                    throw new Error('Authentication failed - no tokens received');
                }
                
            } catch (error) {
                showStatusMessage(`Verification failed: ${error.message}`, 'error');
                
                // If code is invalid, stay on verification form
                if (error.message.includes('Invalid') || error.message.includes('Code')) {
                    // Clear the input for retry
                    document.getElementById('phone-verification-code').value = '';
                    document.getElementById('phone-verification-code').focus();
                } else {
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
    
    if (!phoneNumber) {
        showStatusMessage('Phone number not found. Please start over.', 'error');
        showPhoneForm('signin');
        return;
    }
    
    initiatePhoneAuth(phoneNumber);
}

async function initiatePhoneAuth(phoneNumber) {
    try {
        const response = await authAPI.makeRequest('/auth/phone/initiate', {
            method: 'POST',
            body: JSON.stringify({
                phoneNumber: phoneNumber
            })
        });
        
        showStatusMessage('New SMS code sent! Please check your messages.', 'success');
        
        // Update session
        phoneAuthState.currentSession = response.session;
        
        // Clear verification input
        document.getElementById('phone-verification-code').value = '';
        document.getElementById('phone-verification-code').focus();
        
    } catch (error) {
        showStatusMessage(`Failed to resend SMS: ${error.message}`, 'error');
    }
}

// Auto-format phone number input
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone-signin-number');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            
            // Format as (XXX) XXX-XXXX for US numbers
            if (value.length <= 10) {
                if (value.length >= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
                } else if (value.length >= 3) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                }
            } else {
                // International format - just add spaces
                value = `+${value.slice(0, 1)} ${value.slice(1, 4)} ${value.slice(4, 7)} ${value.slice(7)}`;
            }
            
            e.target.value = value;
        });
        
        phoneInput.addEventListener('blur', function(e) {
            // On blur, format to international format
            const formatted = formatPhoneNumber(e.target.value);
            if (formatted !== e.target.value) {
                e.target.value = formatted;
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
            
            // Auto-submit when 6 digits entered
            if (e.target.value.length === 6) {
                setTimeout(() => {
                    const form = document.getElementById('phone-verify-form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }, 100);
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
