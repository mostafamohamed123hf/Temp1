document.addEventListener('DOMContentLoaded', function() {
    // If we're on the admin login page, set up the login form
    if (window.location.pathname.includes('admin-login.html')) {
        setupLoginPage();
    } 
    // If we're on an admin page but not the login page, verify authentication
    else if (window.location.pathname.includes('/admin/') && !window.location.pathname.includes('admin-login.html')) {
        // The admin.js file already handles redirect logic, but we'll add it here too
        // for extra security and to prevent the page from briefly showing
        if (!isAuthenticated()) {
            // Immediately hide the page content to prevent flashing
            document.body.style.display = 'none';
            window.location.href = 'admin-login.html';
            return;
        }
        // If authenticated, make sure the page is visible
        document.body.style.display = 'block';
        
        setupLogoutButton();
        setupSettingsForm();
        setupPasswordToggles();
    }
    
    /**
     * Set up the login page functionality
     */
    function setupLoginPage() {
        // Toggle password visibility
        const togglePasswordBtn = document.getElementById('toggle-password');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
        
        // Handle login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const errorMessage = document.getElementById('error-message');
                
                // Simple client-side authentication
                if (authenticateUser(username, password)) {
                    // Create a session
                    createSession(username);
                    
                    // Show success message
                    errorMessage.textContent = 'تم تسجيل الدخول بنجاح. جاري التحويل...';
                    errorMessage.classList.add('show', 'success');
                    
                    // Redirect to admin dashboard
                    setTimeout(function() {
                        window.location.href = 'admin.html';
                    }, 1000);
                } else {
                    // Show error message
                    errorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                    errorMessage.classList.add('show');
                    errorMessage.classList.remove('success');
                    
                    // Shake the form for additional feedback
                    loginForm.classList.add('shake');
                    setTimeout(function() {
                        loginForm.classList.remove('shake');
                    }, 500);
                }
            });
        }
        
        // Check if server is online (this is a simulated function)
        checkServerStatus();
    }
    
    /**
     * Authenticate the user with given credentials
     */
    function authenticateUser(username, password) {
        // Get stored admin credentials from localStorage
        const storedCredentials = localStorage.getItem('adminCredentials');
        
        if (storedCredentials) {
            // Parse stored credentials
            const credentials = JSON.parse(storedCredentials);
            
            // Check if credentials match
            if (credentials.username === username && credentials.password === password) {
                return true;
            }
        } else {
            // If no credentials exist yet, create with the supplied credentials
            // This allows for first-time setup without hardcoded defaults
            const newCredentials = {
                displayName: 'المدير',
                username: username,
                password: password
            };
            
            localStorage.setItem('adminCredentials', JSON.stringify(newCredentials));
            return true;
        }
        
        return false;
    }
    
    /**
     * Create a session for the authenticated user
     */
    function createSession(username) {
        // Get stored admin credentials to get the display name
        const storedCredentials = localStorage.getItem('adminCredentials');
        let displayName = 'المدير';
        
        if (storedCredentials) {
            const credentials = JSON.parse(storedCredentials);
            displayName = credentials.displayName || displayName;
        }
        
        // Create a session object with expiry time (24 hours)
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        const session = {
            isLoggedIn: true,
            username: username,
            displayName: displayName,
            expiresAt: expiryTime,
            loginTime: Date.now()
        };
        
        // Save session to localStorage
        localStorage.setItem('adminSession', JSON.stringify(session));
        
        // Also save a simple token for quick checks
        localStorage.setItem('token', 'admin_' + Date.now());
    }
    
    /**
     * Check if user is authenticated
     */
    function isAuthenticated() {
        try {
            // Get session from localStorage
            const sessionData = localStorage.getItem('adminSession');
            
            if (!sessionData) {
                return false;
            }
            
            const adminSession = JSON.parse(sessionData);
            
            // Check session properties
            if (!adminSession || !adminSession.isLoggedIn) {
                return false;
            }
            
            // Check if session is expired
            if (adminSession.expiresAt <= Date.now()) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Error in authentication check:", error);
            return false;
        }
    }
    
    /**
     * Set up the logout button functionality
     */
    function setupLogoutButton() {
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                // Clear session
                localStorage.removeItem('adminSession');
                localStorage.removeItem('token');
                
                // Redirect to login page
                window.location.href = 'admin-login.html';
            });
        }
        
        // Update admin name in the UI
        updateAdminName();
    }
    
    /**
     * Update the admin name in the UI
     */
    function updateAdminName() {
        const adminNameElement = document.getElementById('admin-name');
        if (!adminNameElement) return;
        
        // Get session data
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.displayName) {
                adminNameElement.textContent = session.displayName;
            }
        }
    }
    
    /**
     * Set up the admin settings form
     */
    function setupSettingsForm() {
        const settingsForm = document.getElementById('admin-settings-form');
        if (!settingsForm) return;
        
        // Load current settings
        loadAdminSettings();
        
        // Handle form submission
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAdminSettings();
        });
    }
    
    /**
     * Load admin settings into the form
     */
    function loadAdminSettings() {
        const displayNameInput = document.getElementById('admin-display-name');
        const usernameInput = document.getElementById('admin-username');
        
        // Get stored admin credentials
        const storedCredentials = localStorage.getItem('adminCredentials');
        
        if (storedCredentials && displayNameInput && usernameInput) {
            const credentials = JSON.parse(storedCredentials);
            
            displayNameInput.value = credentials.displayName || 'المدير';
            usernameInput.value = credentials.username || 'admin';
        }
    }
    
    /**
     * Save admin settings from the form
     */
    function saveAdminSettings() {
        const displayNameInput = document.getElementById('admin-display-name');
        const usernameInput = document.getElementById('admin-username');
        const currentPasswordInput = document.getElementById('admin-current-password');
        const newPasswordInput = document.getElementById('admin-new-password');
        const confirmPasswordInput = document.getElementById('admin-confirm-password');
        
        if (!displayNameInput || !usernameInput || !currentPasswordInput) {
            showNotification('لم يتم العثور على حقول النموذج', 'error');
            return;
        }
        
        // Get values
        const displayName = displayNameInput.value;
        const username = usernameInput.value;
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate input
        if (!displayName || !username || !currentPassword) {
            showNotification('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // Get stored admin credentials
        const storedCredentials = localStorage.getItem('adminCredentials');
        
        if (!storedCredentials) {
            showNotification('لم يتم العثور على بيانات المدير. يرجى تسجيل الخروج وإعادة تسجيل الدخول.', 'error');
            return;
        }
        
        const credentials = JSON.parse(storedCredentials);
        
        // Verify current password
        if (credentials.password !== currentPassword) {
            showNotification('كلمة المرور الحالية غير صحيحة', 'error');
            return;
        }
        
        // Check if new password should be updated
        let password = credentials.password;
        
        if (newPassword) {
            // Validate new password
            if (newPassword.length < 4) {
                showNotification('يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل', 'error');
                return;
            }
            
            // Validate confirm password
            if (newPassword !== confirmPassword) {
                showNotification('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'error');
                return;
            }
            
            // Update password
            password = newPassword;
        }
        
        // Update credentials
        const updatedCredentials = {
            displayName,
            username,
            password
        };
        
        // Save updated credentials
        localStorage.setItem('adminCredentials', JSON.stringify(updatedCredentials));
        
        // Update session display name
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            session.displayName = displayName;
            session.username = username;
            localStorage.setItem('adminSession', JSON.stringify(session));
        }
        
        // Update admin name in the UI
        updateAdminName();
        
        // Clear password fields
        currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        
        // Show success notification
        showNotification('تم حفظ بيانات المدير بنجاح', 'success');
    }
    
    /**
     * Show notification message
     */
    function showNotification(message, type = 'info') {
        // Check if notification container exists
        let notificationContainer = document.querySelector('.notification-container');
        
        // Create container if it doesn't exist
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        // Add type class
        if (type) {
            notification.classList.add(type);
        }
        
        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        // Set notification content
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * Set up password toggle buttons
     */
    function setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }
    
    /**
     * Simulate checking server status (for illustration)
     */
    function checkServerStatus() {
        const serverStatus = document.getElementById('server-status');
        if (!serverStatus) return;
        
        // Simulate checking server status
        setTimeout(function() {
            serverStatus.textContent = 'الخادم متصل ويعمل بشكل طبيعي';
            serverStatus.classList.remove('offline');
            serverStatus.classList.add('online');
        }, 1500);
    }
}); 