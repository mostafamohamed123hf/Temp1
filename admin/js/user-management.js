document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated first
    if (!isAuthenticated()) {
        // Redirect to login page if not authenticated
        window.location.href = 'admin-login.html';
        return;
    }

    // Initializations
    initializeUserManagement();
    initializeVisitorTracking();

    // Event listeners
    addEventListeners();
});

/**
 * Initialize User Management functionality
 */
function initializeUserManagement() {
    // Load users from API
    loadUsers();
    
    // Setup UI elements
    setupUI();
}

/**
 * Initialize Visitor Tracking
 */
function initializeVisitorTracking() {
    // Load visitors data from API
    loadVisitors();
    
    // Track current visit if not already tracked
    trackCurrentVisit();
    
    // Update visitor statistics
    updateVisitorStats();
}

/**
 * Setup UI elements and initial state
 */
function setupUI() {
    const userModalTitle = document.getElementById('user-modal-title');
    const userForm = document.getElementById('user-form');
    const closeUserModal = document.getElementById('close-user-modal');
    const addUserBtn = document.getElementById('add-user-btn');
    
    // Close modal when clicking the X
    if (closeUserModal) {
        closeUserModal.addEventListener('click', function() {
            document.getElementById('user-modal').classList.remove('show');
        });
    }
    
    // Open modal when clicking add user button
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            openUserModal();
        });
    }
    
    // Handle form submission
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveUser();
        });
    }
    
    // Setup role change handler to adjust permissions based on role
    const roleSelect = document.getElementById('user-role');
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            adjustPermissionsByRole(this.value);
        });
    }
    
    // Setup search functionality
    setupSearch('users-search', 'users-table-body', filterUsers);
    setupSearch('visitors-search', 'visitors-table-body', filterVisitors);
    
    // Setup filter functionality
    setupFilter('users-filter', filterUsers);
    setupFilter('visitors-filter', filterVisitors);
}

/**
 * Add all event listeners for the user management section
 */
function addEventListeners() {
    // Event delegation for edit and delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-user-btn')) {
            const userId = e.target.closest('.edit-user-btn').getAttribute('data-id');
            editUser(userId);
        } else if (e.target.closest('.delete-user-btn')) {
            const userId = e.target.closest('.delete-user-btn').getAttribute('data-id');
            deleteUser(userId);
        }
    });
}

/**
 * Load users from API
 */
async function loadUsers() {
    try {
        console.log("Loading users...");
        // Show loading indicator
        const tableBody = document.getElementById('users-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="loading-message"><i class="fas fa-spinner fa-spin"></i> جاري تحميل البيانات...</td></tr>';
        }
        
        const result = await window.apiService.getUsers({
            limit: 50 // Get up to 50 users
        });
        
        if (result.success && result.data) {
            console.log("Users loaded successfully:", result.data);
            renderUsers(result.data);
        } else {
            console.error("Failed to load users:", result);
            showNotification('فشل في تحميل المستخدمين', 'error');
            
            // Clear loading and show error
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="error-message"><i class="fas fa-exclamation-circle"></i> فشل في تحميل البيانات</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('فشل في تحميل المستخدمين', 'error');
        
        // Generate sample users if API fails
        generateSampleUsers();
    }
}

/**
 * Generate sample users when API fails
 */
function generateSampleUsers() {
    console.log("Generating sample users as fallback");
    const sampleUsers = [
        {
            _id: 'admin1',
            username: 'admin',
            displayName: 'مدير النظام',
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
            lastLogin: new Date().toISOString(),
            permissions: {
                stats: true,
                productsView: true,
                productsEdit: true,
                vouchersView: true,
                vouchersEdit: true,
                tax: true,
                qr: true,
                users: true
            }
        },
        {
            _id: 'editor1',
            username: 'editor',
            displayName: 'محرر المحتوى',
            email: 'editor@example.com',
            role: 'editor',
            status: 'active',
            lastLogin: new Date(Date.now() - 86400000).toISOString(), // yesterday
            permissions: {
                stats: true,
                productsView: true,
                productsEdit: true,
                vouchersView: true,
                vouchersEdit: true,
                tax: false,
                qr: true,
                users: false
            }
        },
        {
            _id: 'viewer1',
            username: 'viewer',
            displayName: 'مشاهد فقط',
            email: 'viewer@example.com',
            role: 'viewer',
            status: 'active',
            lastLogin: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            permissions: {
                stats: true,
                productsView: true,
                productsEdit: false,
                vouchersView: true,
                vouchersEdit: false,
                tax: false,
                qr: false,
                users: false
            }
        },
        {
            _id: 'inactive1',
            username: 'inactive',
            displayName: 'حساب غير نشط',
            email: 'inactive@example.com',
            role: 'editor',
            status: 'inactive',
            lastLogin: null,
            permissions: {
                stats: true,
                productsView: true,
                productsEdit: true,
                vouchersView: true,
                vouchersEdit: true,
                tax: false,
                qr: true,
                users: false
            }
        }
    ];
    
    renderUsers(sampleUsers);
}

/**
 * Render users in the users table
 */
function renderUsers(users) {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    
    let html = '';
    
    if (users.length === 0) {
        html = `<tr><td colspan="6" class="empty-message">لا يوجد مستخدمين</td></tr>`;
    } else {
        users.forEach(user => {
            // Format the permissions display
            const permissionsText = formatPermissions(user.permissions);
            
            // Role badge styling based on role
            let roleBadgeClass = '';
            switch(user.role) {
                case 'admin':
                    roleBadgeClass = 'primary';
                    break;
                case 'editor':
                    roleBadgeClass = 'success';
                    break;
                case 'viewer':
                    roleBadgeClass = 'info';
                    break;
                case 'cashier':
                    roleBadgeClass = 'warning';
                    break;
                default:
                    roleBadgeClass = 'secondary';
            }
            
            // Status badge styling
            let statusBadgeClass = '';
            switch(user.status) {
                case 'active':
                    statusBadgeClass = 'success';
                    break;
                case 'inactive':
                    statusBadgeClass = 'danger';
                    break;
                default:
                    statusBadgeClass = 'secondary';
            }
            
            // Role and status badges
            const roleBadge = `<span class="role-badge ${roleBadgeClass}">${getRoleName(user.role)}</span>`;
            const statusBadge = `<span class="status-badge ${statusBadgeClass}">${getStatusName(user.status)}</span>`;
            
            // Format last login date with relative time
            let lastLoginText = 'لم يسجل دخول بعد';
            if (user.lastLogin) {
                const lastLoginDate = new Date(user.lastLogin);
                const now = new Date();
                const diffMs = now - lastLoginDate;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) {
                    // Today
                    lastLoginText = `اليوم ${lastLoginDate.toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`;
                } else if (diffDays === 1) {
                    // Yesterday
                    lastLoginText = 'الأمس';
                } else if (diffDays < 7) {
                    // Less than a week
                    lastLoginText = `منذ ${diffDays} أيام`;
                } else {
                    // More than a week
                    lastLoginText = formatDate(lastLoginDate);
                }
            }
            
            // Get user avatar - generate from first letter of name or username
            const displayName = user.displayName || user.username || '';
            const avatarLetter = displayName.charAt(0).toUpperCase();
            const avatarColors = [
                'avatar-primary', 'avatar-success', 'avatar-info', 
                'avatar-warning', 'avatar-danger', 'avatar-purple'
            ];
            // Generate consistent color based on user ID
            const avatarColorIndex = user._id.charCodeAt(0) % avatarColors.length;
            const avatarColorClass = avatarColors[avatarColorIndex];
            
            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar ${avatarColorClass}">${avatarLetter}</div>
                            <div class="user-details">
                                <span class="user-name">${user.displayName || ''}</span>
                                <span class="user-username">@${user.username}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="user-contact">
                            ${user.email ? `<div><i class="fas fa-envelope"></i> ${user.email}</div>` : ''}
                            ${user.phone ? `<div><i class="fas fa-phone"></i> ${user.phone}</div>` : ''}
                        </div>
                    </td>
                    <td class="permissions-cell">
                        <div class="permissions-wrapper">
                            ${permissionsText}
                        </div>
                    </td>
                    <td class="last-login-cell">${lastLoginText}</td>
                    <td class="status-cell">
                        <div class="user-role-status">
                            ${roleBadge}
                            ${statusBadge}
                        </div>
                    </td>
                    <td>
                        <div class="user-actions">
                            <button type="button" class="edit-user-btn" data-id="${user._id}" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="delete-user-btn" data-id="${user._id}" title="حذف"
                                ${user.role === 'admin' ? 'disabled' : ''}>
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = html;
    
    // Add some basic CSS for new elements if not already present
    const styleId = 'user-management-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .user-info {
                display: flex;
                align-items: center;
            }
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                margin-left: 10px;
            }
            .avatar-primary { background-color: #4a6cf7; }
            .avatar-success { background-color: #42d158; }
            .avatar-info { background-color: #17a2b8; }
            .avatar-warning { background-color: #ffc107; }
            .avatar-danger { background-color: #dc3545; }
            .avatar-purple { background-color: #8c44f7; }
            
            .user-details {
                display: flex;
                flex-direction: column;
            }
            .user-name {
                font-weight: bold;
            }
            .user-username {
                color: #666;
                font-size: 0.9em;
            }
            
            .user-contact {
                font-size: 0.9em;
                color: #555;
            }
            
            .role-badge, .status-badge {
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 0.9em;
                display: inline-block;
                margin: 2px;
                color: white;
            }
            
            .role-badge.primary { background-color: #4a6cf7; }
            .role-badge.success { background-color: #42d158; }
            .role-badge.info { background-color: #17a2b8; }
            .role-badge.warning { background-color: #ffc107; color: #212529; }
            .role-badge.secondary { background-color: #6c757d; }
            
            .status-badge.success { background-color: #42d158; }
            .status-badge.danger { background-color: #dc3545; }
            .status-badge.secondary { background-color: #6c757d; }
            
            .loading-message, .error-message, .empty-message {
                text-align: center;
                padding: 20px;
                color: #666;
            }
            
            .loading-message i, .error-message i {
                margin-left: 10px;
            }
            
            .error-message {
                color: #dc3545;
            }
            
            .user-role-status {
                display: flex;
                flex-direction: column;
            }
            
            .permissions-wrapper {
                max-width: 200px;
            }
            
            button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Format permissions into a readable string
 */
function formatPermissions(permissions) {
    const permLabels = [];
    
    // Add null check for permissions
    if (!permissions) {
        return 'لا توجد صلاحيات';
    }
    
    if (permissions.stats) permLabels.push('الإحصائيات');
    if (permissions.productsView) permLabels.push('عرض المنتجات');
    if (permissions.productsEdit) permLabels.push('تعديل المنتجات');
    if (permissions.vouchersView) permLabels.push('عرض القسائم');
    if (permissions.vouchersEdit) permLabels.push('تعديل القسائم');
    if (permissions.tax) permLabels.push('الضريبة');
    if (permissions.qr) permLabels.push('رموز QR');
    if (permissions.users) permLabels.push('المستخدمين');
    
    // If there are too many permissions, truncate the list
    if (permLabels.length > 3) {
        return `${permLabels.slice(0, 2).join('، ')} و${permLabels.length - 2} أخرى`;
    }
    
    return permLabels.join('، ') || 'لا توجد صلاحيات';
}

/**
 * Get role name in Arabic
 */
function getRoleName(role) {
    const roles = {
        'admin': 'مدير',
        'editor': 'محرر',
        'viewer': 'مشاهد'
    };
    
    return roles[role] || role;
}

/**
 * Get status name in Arabic
 */
function getStatusName(status) {
    const statuses = {
        'active': 'نشط',
        'inactive': 'غير نشط'
    };
    
    return statuses[status] || status;
}

/**
 * Open user modal for adding or editing a user
 */
async function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const modalTitle = document.getElementById('user-modal-title');
    const userForm = document.getElementById('user-form');
    const userIdInput = document.getElementById('user-id');
    
    // Clear the form
    userForm.reset();
    
    if (userId) {
        // Editing existing user
        modalTitle.textContent = 'تعديل المستخدم';
        
        try {
            // Get user data from API
            const result = await window.apiService.getUser(userId);
            
            if (result.success) {
                const user = result.data;
                
                // Fill the form with user data
                userIdInput.value = user._id;
                document.getElementById('user-display-name').value = user.displayName;
                document.getElementById('user-username').value = user.username;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-phone').value = user.phone || '';
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-status').value = user.status;
                
                // Set permission checkboxes
                document.getElementById('perm-stats').checked = user.permissions.stats;
                document.getElementById('perm-products-view').checked = user.permissions.productsView;
                document.getElementById('perm-products-edit').checked = user.permissions.productsEdit;
                document.getElementById('perm-vouchers-view').checked = user.permissions.vouchersView;
                document.getElementById('perm-vouchers-edit').checked = user.permissions.vouchersEdit;
                document.getElementById('perm-tax').checked = user.permissions.tax;
                document.getElementById('perm-qr').checked = user.permissions.qr;
                document.getElementById('perm-users').checked = user.permissions.users;
            } else {
                showNotification('فشل في تحميل بيانات المستخدم', 'error');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            showNotification('فشل في تحميل بيانات المستخدم', 'error');
        }
    } else {
        // Adding new user
        modalTitle.textContent = 'إضافة مستخدم جديد';
        userIdInput.value = '';
        
        // Set default role to viewer
        document.getElementById('user-role').value = 'viewer';
        
        // Adjust permissions based on the default role
        adjustPermissionsByRole('viewer');
    }
    
    // Show the modal
    modal.classList.add('show');
}

/**
 * Adjust permissions checkboxes based on selected role
 */
function adjustPermissionsByRole(role) {
    // Set permissions based on role
    if (role === 'admin') {
        // Admin has all permissions
        setAllPermissions(true);
    } else if (role === 'editor') {
        // Editor can view and edit products and vouchers, but not users or tax
        document.getElementById('perm-stats').checked = true;
        document.getElementById('perm-products-view').checked = true;
        document.getElementById('perm-products-edit').checked = true;
        document.getElementById('perm-vouchers-view').checked = true;
        document.getElementById('perm-vouchers-edit').checked = true;
        document.getElementById('perm-tax').checked = false;
        document.getElementById('perm-qr').checked = true;
        document.getElementById('perm-users').checked = false;
    } else if (role === 'viewer') {
        // Viewer can only view stuff, not edit
        document.getElementById('perm-stats').checked = true;
        document.getElementById('perm-products-view').checked = true;
        document.getElementById('perm-products-edit').checked = false;
        document.getElementById('perm-vouchers-view').checked = true;
        document.getElementById('perm-vouchers-edit').checked = false;
        document.getElementById('perm-tax').checked = false;
        document.getElementById('perm-qr').checked = false;
        document.getElementById('perm-users').checked = false;
    }
}

/**
 * Set all permission checkboxes to a specific state
 */
function setAllPermissions(state) {
    document.getElementById('perm-stats').checked = state;
    document.getElementById('perm-products-view').checked = state;
    document.getElementById('perm-products-edit').checked = state;
    document.getElementById('perm-vouchers-view').checked = state;
    document.getElementById('perm-vouchers-edit').checked = state;
    document.getElementById('perm-tax').checked = state;
    document.getElementById('perm-qr').checked = state;
    document.getElementById('perm-users').checked = state;
}

/**
 * Save user data (add new or update existing)
 */
async function saveUser() {
    // Get form data
    const userId = document.getElementById('user-id').value;
    const displayName = document.getElementById('user-display-name').value;
    const username = document.getElementById('user-username').value;
    const email = document.getElementById('user-email').value;
    const phone = document.getElementById('user-phone').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;
    
    // Get permissions
    const permissions = {
        stats: document.getElementById('perm-stats').checked,
        productsView: document.getElementById('perm-products-view').checked,
        productsEdit: document.getElementById('perm-products-edit').checked,
        vouchersView: document.getElementById('perm-vouchers-view').checked,
        vouchersEdit: document.getElementById('perm-vouchers-edit').checked,
        tax: document.getElementById('perm-tax').checked,
        qr: document.getElementById('perm-qr').checked,
        users: document.getElementById('perm-users').checked
    };
    
    // Create user object
    const userData = {
        displayName,
        username,
        email,
        phone,
        role,
        status,
        permissions
    };
    
    // Add password only for new users or if changed
    if (!userId || password) {
        userData.password = password;
    }
    
    try {
        let result;
        
        if (userId) {
            // Update existing user
            result = await window.apiService.updateUser(userId, userData);
        } else {
            // Add new user
            result = await window.apiService.createUser(userData);
        }
        
        if (result.success) {
            // Close the modal
            document.getElementById('user-modal').classList.remove('show');
            
            // Refresh the users table
            loadUsers();
            
            // Show success notification
            showNotification(userId ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح', 'success');
        } else {
            showNotification(result.message || 'فشل في حفظ بيانات المستخدم', 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('فشل في حفظ بيانات المستخدم', 'error');
    }
}

/**
 * Edit user 
 */
function editUser(userId) {
    openUserModal(userId);
}

/**
 * Delete user
 */
async function deleteUser(userId) {
    // Confirm deletion
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        return;
    }
    
    try {
        const result = await window.apiService.deleteUser(userId);
        
        if (result.success) {
            // Refresh the users table
            loadUsers();
            
            // Show success notification
            showNotification('تم حذف المستخدم بنجاح', 'success');
        } else {
            showNotification(result.message || 'فشل في حذف المستخدم', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('فشل في حذف المستخدم', 'error');
    }
}

/**
 * Setup search functionality
 */
function setupSearch(inputId, tableBodyId, filterFunction) {
    const searchInput = document.getElementById(inputId);
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filterSelect = this.closest('.admin-search-container').querySelector('select');
            const filterValue = filterSelect ? filterSelect.value : 'all';
            
            filterFunction(this.value, filterValue);
        });
    }
}

/**
 * Setup filter functionality
 */
function setupFilter(selectId, filterFunction) {
    const filterSelect = document.getElementById(selectId);
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const searchInput = this.closest('.admin-search-container').querySelector('input');
            const searchValue = searchInput ? searchInput.value : '';
            
            filterFunction(searchValue, this.value);
        });
    }
}

/**
 * Filter users based on search term and filter value
 */
async function filterUsers(searchTerm, filterValue) {
    try {
        // Prepare query parameters for API
        const params = {};
        
        if (searchTerm) {
            params.search = searchTerm;
        }
        
        if (filterValue !== 'all') {
            params.role = filterValue;
        }
        
        // Call API with filters
        const result = await window.apiService.getUsers(params);
        
        if (result.success) {
            renderUsers(result.data);
        } else {
            showNotification('فشل في تصفية المستخدمين', 'error');
        }
    } catch (error) {
        console.error('Error filtering users:', error);
        showNotification('فشل في تصفية المستخدمين', 'error');
    }
}

/**
 * Load visitors data from API
 */
async function loadVisitors() {
    try {
        // Show loading indicator in the table
        const tableBody = document.getElementById('visitors-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="loading-message"><i class="fas fa-spinner fa-spin"></i> جاري تحميل البيانات...</td></tr>';
        }
        
        // Call the API to get visitors
        const response = await window.apiService.getVisitors({
            limit: 50 // Get up to 50 visitors
        });
        
        // Check if response is successful and contains data
        if (response && response.success && Array.isArray(response.data)) {
            renderVisitors(response.data);
        } else if (response && response.success && typeof response.data === 'object') {
            // Handle case where data might not be an array
            renderVisitors([response.data]);
        } else {
            // Generate mock data if API failed or returned no data
            generateMockVisitors();
            showNotification('تم إنشاء بيانات تجريبية للزوار', 'info');
        }
    } catch (error) {
        console.error('Error loading visitors:', error);
        showNotification('فشل في تحميل بيانات الزوار', 'error');
        
        // Generate mock data when API fails
        generateMockVisitors();
    }
}

/**
 * Generate mock visitors data when API fails
 */
function generateMockVisitors() {
    const mockVisitors = generateMockVisitorsData();
    renderVisitors(mockVisitors);
}

/**
 * Filter visitors based on search term and filter value
 */
async function filterVisitors(searchTerm, filterValue) {
    try {
        // Prepare query parameters for API
        const params = {};
        
        if (searchTerm) {
            params.search = searchTerm;
        }
        
        if (filterValue !== 'all') {
            params.deviceType = filterValue;
        }
        
        // Call API with filters
        const response = await window.apiService.getVisitors(params);
        
        // Check if response is successful and contains data
        if (response && response.success && Array.isArray(response.data)) {
            renderVisitors(response.data);
        } else if (response && response.success && typeof response.data === 'object') {
            // Handle case where data might not be an array
            renderVisitors([response.data]);
        } else {
            // Use mock data but apply the filters
            let mockVisitors = generateMockVisitorsData();
            
            // Apply filters to mock data
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                mockVisitors = mockVisitors.filter(visitor => 
                    (visitor.ipAddress && visitor.ipAddress.toLowerCase().includes(searchLower)) || 
                    (visitor.browser && visitor.browser.toLowerCase().includes(searchLower)) ||
                    (visitor.entryPage && visitor.entryPage.toLowerCase().includes(searchLower))
                );
            }
            
            if (filterValue !== 'all') {
                mockVisitors = mockVisitors.filter(visitor => visitor.deviceType === filterValue);
            }
            
            renderVisitors(mockVisitors);
        }
    } catch (error) {
        console.error('Error filtering visitors:', error);
        showNotification('فشل في تصفية بيانات الزوار', 'error');
        
        // Use mock data with filters applied when API fails
        let mockVisitors = generateMockVisitorsData();
        
        // Apply filters to mock data
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            mockVisitors = mockVisitors.filter(visitor => 
                (visitor.ipAddress && visitor.ipAddress.toLowerCase().includes(searchLower)) || 
                (visitor.browser && visitor.browser.toLowerCase().includes(searchLower)) ||
                (visitor.entryPage && visitor.entryPage.toLowerCase().includes(searchLower))
            );
        }
        
        if (filterValue !== 'all') {
            mockVisitors = mockVisitors.filter(visitor => visitor.deviceType === filterValue);
        }
        
        renderVisitors(mockVisitors);
    }
}

/**
 * Generate mock visitors data - helper function
 * @returns {Array} Array of mock visitor objects
 */
function generateMockVisitorsData() {
    return [
        {
            _id: 'visit1',
            ipAddress: '192.168.1.1',
            deviceType: 'mobile',
            browser: 'Chrome',
            timestamp: new Date().toISOString(),
            entryPage: 'index.html'
        },
        {
            _id: 'visit2',
            ipAddress: '192.168.1.2',
            deviceType: 'desktop',
            browser: 'Firefox',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            entryPage: 'menu.html'
        },
        {
            _id: 'visit3',
            ipAddress: '192.168.1.3',
            deviceType: 'tablet',
            browser: 'Safari',
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            entryPage: 'cart.html'
        }
    ];
}

/**
 * Render visitors in the visitors table
 */
function renderVisitors(visitors) {
    const tableBody = document.getElementById('visitors-table-body');
    if (!tableBody) return;
    
    let html = '';
    
    if (visitors.length === 0) {
        html = `<tr><td colspan="6" class="empty-message">لا يوجد زوار</td></tr>`;
    } else {
        // Sort visitors by timestamp, newest first
        visitors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        visitors.forEach((visitor, index) => {
            // Ensure visitor properties are defined
            const deviceType = visitor.deviceType || 'unknown';
            
            // Format device type icon
            let deviceIcon = '';
            if (deviceType === 'mobile') {
                deviceIcon = '<i class="fas fa-mobile-alt device-mobile"></i>';
            } else if (deviceType === 'desktop') {
                deviceIcon = '<i class="fas fa-desktop device-desktop"></i>';
            } else if (deviceType === 'tablet') {
                deviceIcon = '<i class="fas fa-tablet-alt device-tablet"></i>';
            } else {
                deviceIcon = '<i class="fas fa-question-circle"></i>'; // Default icon for unknown device type
            }
            
            // Format timestamp
            const visitDate = formatDate(new Date(visitor.timestamp || new Date()));
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${visitor.ipAddress || '-'}</td>
                    <td><div class="device-type">${deviceIcon} ${capitalizeFirstLetter(deviceType)}</div></td>
                    <td>${visitor.browser || '-'}</td>
                    <td>${visitDate}</td>
                    <td>${visitor.entryPage || '-'}</td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = html;
}

/**
 * Track the current visit
 */
async function trackCurrentVisit() {
    try {
        // Get device info
        const visitorData = await getVisitorData();
        
        // Try to record visit through API
        try {
            await window.apiService.recordVisit(visitorData);
        } catch (apiError) {
            console.error('Error recording visit to API:', apiError);
            // Continue execution even if API fails
        }
        
        // Update stats and table
        updateVisitorStats();
        loadVisitors();
    } catch (error) {
        console.error('Error tracking visit:', error);
    }
}

/**
 * Get visitor data including device type, browser, etc.
 */
async function getVisitorData() {
    // Determine device type
    let deviceType;
    
    if (window.innerWidth <= 768) {
        deviceType = 'mobile';
    } else if (window.innerWidth <= 1024) {
        deviceType = 'tablet';
    } else {
        deviceType = 'desktop';
    }
    
    // Determine browser
    const browser = getBrowser();
    
    // Get entry page
    const entryPage = window.location.pathname.split('/').pop() || 'index.html';
    
    return {
        deviceType,
        browser,
        entryPage,
        userAgent: navigator.userAgent,
        referrer: document.referrer
    };
}

/**
 * Get the user's browser name
 */
function getBrowser() {
    const userAgent = navigator.userAgent;
    let browserName;
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
        browserName = "Opera";
    } else if (userAgent.match(/edg/i)) {
        browserName = "Edge";
    } else {
        browserName = "Unknown";
    }
    
    return browserName;
}

/**
 * Update visitor statistics
 */
async function updateVisitorStats() {
    try {
        const result = await window.apiService.getVisitorStats('all');
        
        if (result.success && result.data) {
            const stats = result.data;
            
            // Get UI elements
            const totalVisitorsEl = document.getElementById('total-visitors');
            const mobileVisitorsEl = document.getElementById('mobile-visitors');
            const desktopVisitorsEl = document.getElementById('desktop-visitors');
            const tabletVisitorsEl = document.getElementById('tablet-visitors');
            
            // Update total visitors if element exists
            if (totalVisitorsEl && stats.totalVisitors !== undefined) {
                totalVisitorsEl.textContent = stats.totalVisitors;
            }
            
            // Check if deviceCounts exists before trying to access its properties
            if (stats.deviceCounts) {
                // Update device-specific counts if elements exist
                if (mobileVisitorsEl && stats.deviceCounts.mobile !== undefined) {
                    mobileVisitorsEl.textContent = stats.deviceCounts.mobile;
                }
                if (desktopVisitorsEl && stats.deviceCounts.desktop !== undefined) {
                    desktopVisitorsEl.textContent = stats.deviceCounts.desktop;
                }
                if (tabletVisitorsEl && stats.deviceCounts.tablet !== undefined) {
                    tabletVisitorsEl.textContent = stats.deviceCounts.tablet;
                }
            }
        }
    } catch (error) {
        console.error('Error updating visitor stats:', error);
    }
}

/**
 * Format a date for display
 */
function formatDate(date) {
    // Check if the date is valid
    if (!date || isNaN(date.getTime())) {
        return '-';
    }
    
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
    if (!string) return ''; // Return empty string if null, undefined, or empty
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const adminSession = JSON.parse(localStorage.getItem('adminSession'));
    const token = localStorage.getItem('token');
    
    // Check if session exists and is valid
    return adminSession && 
        adminSession.isLoggedIn && 
        adminSession.expiresAt > Date.now() &&
        token;
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create a notification element
    const notification = document.createElement('div');
    notification.classList.add('notification');
    
    // Add type class
    if (type) {
        notification.classList.add(type);
    }
    
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after a delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 