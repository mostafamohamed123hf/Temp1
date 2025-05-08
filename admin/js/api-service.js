/**
 * API Service for handling communication with the backend
 */
class ApiService {
  constructor() {
    // Use localhost explicitly since the server is running locally
    this.apiUrl = "http://localhost:5000/api";
    this.token = localStorage.getItem("token");
  }

  /**
   * Set the auth token for API requests
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers with Authorization token
   */
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise} Response promise
   */
  async request(endpoint, method = "GET", data = null) {
    const url = `${this.apiUrl}/${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      // Check if unauthorized (token expired)
      if (response.status === 401) {
        // Clear token and notify about session expiration
        this.setToken(null);

        // Redirect to login page if not already there
        if (!window.location.href.includes("admin-login.html")) {
          alert("Your session has expired. Please login again.");
          window.location.href = "admin-login.html";
        }
      }

      if (!response.ok) {
        throw new Error(result.message || "API request failed");
      }

      return result;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // Authentication API calls

  /**
   * Login with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise} Authentication result
   */
  async login(username, password) {
    const result = await this.request("auth/login", "POST", {
      username,
      password,
    });

    if (result.success && result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Registration result
   */
  async register(userData) {
    const result = await this.request("auth/register", "POST", userData);

    if (result.success && result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  /**
   * Logout current user
   * @returns {Promise} Logout result
   */
  async logout() {
    const result = await this.request("auth/logout");
    this.setToken(null);
    return result;
  }

  /**
   * Get current user information
   * @returns {Promise} User info
   */
  async getCurrentUser() {
    return await this.request("auth/me");
  }

  /**
   * Update user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Update result
   */
  async updatePassword(currentPassword, newPassword) {
    return await this.request("auth/updatepassword", "PUT", {
      currentPassword,
      newPassword,
    });
  }

  // Users API calls

  /**
   * Get all users with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise} Users list
   */
  async getUsers(params = {}) {
    console.log("Mock getUsers", params);

    // Create sample user data
    const allUsers = [
      {
        _id: "admin1",
        username: "admin",
        displayName: "مدير النظام",
        email: "admin@example.com",
        phone: "+1234567890",
        role: "admin",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: true,
          vouchersView: true,
          vouchersEdit: true,
          tax: true,
          qr: true,
          users: true,
        },
      },
      {
        _id: "editor1",
        username: "editor",
        displayName: "محرر المحتوى",
        email: "editor@example.com",
        phone: "+2345678901",
        role: "editor",
        status: "active",
        lastLogin: new Date(Date.now() - 86400000).toISOString(), // yesterday
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), // 20 days ago
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: true,
          vouchersView: true,
          vouchersEdit: true,
          tax: false,
          qr: true,
          users: false,
        },
      },
      {
        _id: "viewer1",
        username: "viewer",
        displayName: "مشاهد فقط",
        email: "viewer@example.com",
        phone: "+3456789012",
        role: "viewer",
        status: "active",
        lastLogin: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), // 15 days ago
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: false,
          vouchersView: true,
          vouchersEdit: false,
          tax: false,
          qr: false,
          users: false,
        },
      },
      {
        _id: "inactive1",
        username: "inactive",
        displayName: "حساب غير نشط",
        email: "inactive@example.com",
        phone: "+4567890123",
        role: "editor",
        status: "inactive",
        lastLogin: null,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: true,
          vouchersView: true,
          vouchersEdit: true,
          tax: false,
          qr: true,
          users: false,
        },
      },
      {
        _id: "cashier1",
        username: "cashier",
        displayName: "موظف الكاشير",
        email: "cashier@example.com",
        phone: "+5678901234",
        role: "cashier",
        status: "active",
        lastLogin: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: false,
          vouchersView: true,
          vouchersEdit: false,
          tax: true,
          qr: true,
          users: false,
        },
      },
    ];

    // Apply search filter if provided
    let filteredUsers = [...allUsers];
    if (params.search) {
      const search = params.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.displayName.toLowerCase().includes(search) ||
          user.username.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          (user.phone && user.phone.includes(search))
      );
    }

    // Apply role filter if provided
    if (params.role && params.role !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === params.role);
    }

    // Apply status filter if provided
    if (params.status && params.status !== "all") {
      filteredUsers = filteredUsers.filter(
        (user) => user.status === params.status
      );
    }

    // Calculate pagination
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Get paginated results
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedUsers,
      pagination: {
        total: filteredUsers.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
      },
    };
  }

  /**
   * Get a single user by ID
   * @param {string} userId - User ID
   * @returns {Promise} User data
   */
  async getUser(userId) {
    console.log("Mock getUser", userId);

    // Use the same users defined in getUsers
    const allUsers = [
      {
        _id: "admin1",
        username: "admin",
        displayName: "مدير النظام",
        email: "admin@example.com",
        phone: "+1234567890",
        role: "admin",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: true,
          vouchersView: true,
          vouchersEdit: true,
          tax: true,
          qr: true,
          users: true,
        },
      },
      {
        _id: "editor1",
        username: "editor",
        displayName: "محرر المحتوى",
        email: "editor@example.com",
        phone: "+2345678901",
        role: "editor",
        status: "active",
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: true,
          vouchersView: true,
          vouchersEdit: true,
          tax: false,
          qr: true,
          users: false,
        },
      },
      {
        _id: "viewer1",
        username: "viewer",
        displayName: "مشاهد فقط",
        email: "viewer@example.com",
        phone: "+3456789012",
        role: "viewer",
        status: "active",
        lastLogin: new Date(Date.now() - 172800000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: false,
          vouchersView: true,
          vouchersEdit: false,
          tax: false,
          qr: false,
          users: false,
        },
      },
      {
        _id: "inactive1",
        username: "inactive",
        displayName: "حساب غير نشط",
        email: "inactive@example.com",
        phone: "+4567890123",
        role: "editor",
        status: "inactive",
        lastLogin: null,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: true,
          vouchersView: true,
          vouchersEdit: true,
          tax: false,
          qr: true,
          users: false,
        },
      },
      {
        _id: "cashier1",
        username: "cashier",
        displayName: "موظف الكاشير",
        email: "cashier@example.com",
        phone: "+5678901234",
        role: "cashier",
        status: "active",
        lastLogin: new Date(Date.now() - 43200000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: false,
          vouchersView: true,
          vouchersEdit: false,
          tax: true,
          qr: true,
          users: false,
        },
      },
    ];

    // Find user by ID
    const user = allUsers.find((user) => user._id === userId);

    if (user) {
      return {
        success: true,
        data: user,
      };
    } else {
      return {
        success: false,
        message: "المستخدم غير موجود",
      };
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise} Created user
   */
  async createUser(userData) {
    console.log("Mock createUser", userData);

    // Validate required fields
    if (!userData.username || !userData.displayName || !userData.password) {
      return {
        success: false,
        message: "جميع الحقول المطلوبة يجب ملؤها",
      };
    }

    // Check if username already exists
    if (
      ["admin", "editor", "viewer", "inactive", "cashier"].includes(
        userData.username.toLowerCase()
      )
    ) {
      return {
        success: false,
        message: "اسم المستخدم موجود بالفعل",
      };
    }

    // Create new user ID
    const userId = "user-" + Math.random().toString(36).substring(2, 10);

    // Create new user object
    const newUser = {
      _id: userId,
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email || "",
      phone: userData.phone || "",
      role: userData.role || "viewer",
      status: userData.status || "active",
      lastLogin: null,
      createdAt: new Date().toISOString(),
      permissions: userData.permissions || {
        stats: false,
        productsView: false,
        productsEdit: false,
        vouchersView: false,
        vouchersEdit: false,
        tax: false,
        qr: false,
        users: false,
      },
    };

    // In a real app, we would add to the database here

    return {
      success: true,
      data: newUser,
      message: "تم إنشاء المستخدم بنجاح",
    };
  }

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user
   */
  async updateUser(userId, userData) {
    console.log("Mock updateUser", userId, userData);

    // For mock purposes, we'll use the same user array as the getUser method
    const allUsers = [
      {
        _id: "admin1",
        username: "admin",
        displayName: "مدير النظام",
        email: "admin@example.com",
        phone: "+1234567890",
        role: "admin",
        status: "active",
      },
      {
        _id: "editor1",
        username: "editor",
        displayName: "محرر المحتوى",
        email: "editor@example.com",
        phone: "+2345678901",
        role: "editor",
        status: "active",
      },
      {
        _id: "viewer1",
        username: "viewer",
        displayName: "مشاهد فقط",
        email: "viewer@example.com",
        phone: "+3456789012",
        role: "viewer",
        status: "active",
      },
      {
        _id: "inactive1",
        username: "inactive",
        displayName: "حساب غير نشط",
        email: "inactive@example.com",
        phone: "+4567890123",
        role: "editor",
        status: "inactive",
      },
      {
        _id: "cashier1",
        username: "cashier",
        displayName: "موظف الكاشير",
        email: "cashier@example.com",
        phone: "+5678901234",
        role: "cashier",
        status: "active",
      },
    ];

    // Find the user to update
    const userIndex = allUsers.findIndex((user) => user._id === userId);

    if (userIndex === -1) {
      return {
        success: false,
        message: "المستخدم غير موجود",
      };
    }

    // In a real app, we would update the user in the database
    // Here we just simulate a successful update

    // Create updated user object
    const updatedUser = {
      ...allUsers[userIndex],
      ...userData,
      _id: userId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedUser,
      message: "تم تحديث المستخدم بنجاح",
    };
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise} Delete result
   */
  async deleteUser(userId) {
    console.log("Mock deleteUser", userId);

    // Check for protected users that cannot be deleted
    if (["admin1"].includes(userId)) {
      return {
        success: false,
        message: "لا يمكن حذف حساب المدير الرئيسي",
      };
    }

    // In a real app, we would check if the user exists first
    // For mock purposes, we'll use the same user array as other methods
    const allUsers = [
      { _id: "admin1", username: "admin", role: "admin" },
      { _id: "editor1", username: "editor", role: "editor" },
      { _id: "viewer1", username: "viewer", role: "viewer" },
      { _id: "inactive1", username: "inactive", role: "editor" },
      { _id: "cashier1", username: "cashier", role: "cashier" },
    ];

    // Find the user to delete
    const userExists = allUsers.some((user) => user._id === userId);

    if (!userExists) {
      return {
        success: false,
        message: "المستخدم غير موجود",
      };
    }

    // In a real app, we would delete from the database
    // Here we just simulate a successful deletion

    return {
      success: true,
      message: "تم حذف المستخدم بنجاح",
    };
  }

  // Visitors API calls

  /**
   * Record a visitor
   * @param {Object} visitorData - Visitor data
   * @returns {Promise} Recorded visitor
   */
  async recordVisit(visitorData) {
    return await this.request("visitors", "POST", visitorData);
  }

  /**
   * Get all visitors with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise} Visitors list
   */
  async getVisitors(params = {}) {
    console.log("Mock getVisitors", params);

    // Create mock visitor data with the correct properties
    const mockVisitors = [
      {
        _id: "visit1",
        ipAddress: "192.168.1.1",
        deviceType: "mobile",
        browser: "Chrome",
        timestamp: new Date().toISOString(),
        entryPage: "index.html",
      },
      {
        _id: "visit2",
        ipAddress: "192.168.1.2",
        deviceType: "desktop",
        browser: "Firefox",
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        entryPage: "menu.html",
      },
      {
        _id: "visit3",
        ipAddress: "192.168.1.3",
        deviceType: "tablet",
        browser: "Safari",
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        entryPage: "cart.html",
      },
    ];

    // Apply search filter if provided
    let filteredVisitors = [...mockVisitors];
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredVisitors = filteredVisitors.filter(
        (visitor) =>
          visitor.ipAddress.includes(searchLower) ||
          visitor.browser.toLowerCase().includes(searchLower) ||
          visitor.entryPage.toLowerCase().includes(searchLower)
      );
    }

    // Apply device type filter if provided
    if (params.deviceType && params.deviceType !== "all") {
      filteredVisitors = filteredVisitors.filter(
        (visitor) => visitor.deviceType === params.deviceType
      );
    }

    return {
      success: true,
      data: filteredVisitors,
    };
  }

  /**
   * Get visitor statistics
   * @param {string} period - Time period (today, week, month, all)
   * @returns {Promise} Visitor statistics
   */
  async getVisitorStats(period = "all") {
    return await this.request(`visitors/stats?period=${period}`);
  }

  // Product API calls

  /**
   * Get all products
   * @returns {Promise} Products list
   */
  async getProducts() {
    return await this.request("products");
  }

  /**
   * Get a specific product by ID
   * @param {string} productId - Product ID
   * @returns {Promise} Product details
   */
  async getProduct(productId) {
    return await this.request(`products/${productId}`);
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise} Created product
   */
  async createProduct(productData) {
    return await this.request("products", "POST", productData);
  }

  /**
   * Update an existing product
   * @param {string} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise} Updated product
   */
  async updateProduct(productId, productData) {
    return await this.request(`products/${productId}`, "PUT", productData);
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise} Delete result
   */
  async deleteProduct(productId) {
    return await this.request(`products/${productId}`, "DELETE");
  }

  /**
   * Create default products
   * @returns {Promise} Default products creation result
   */
  async createDefaultProducts() {
    return await this.request("products/default/create", "POST");
  }
}

// Create a singleton instance
const apiService = new ApiService();

// Export the singleton
window.apiService = apiService;

// API Service Mock
// This file mocks the API calls for testing without a real backend

(function () {
  // Define the API service object
  window.apiService = {
    baseUrl: "http://localhost:5000/api",

    // Login method
    login: async function (username, password) {
      console.log(`Mock login for: ${username}`);
      // Always return success in this mock version
      return {
        success: true,
        token: "mock-token-" + Math.random().toString(36).substr(2),
        user: {
          _id: "admin-id",
          displayName: "Admin User",
          username: username,
          role: "admin",
          permissions: {
            stats: true,
            productsView: true,
            productsEdit: true,
            vouchersView: true,
            vouchersEdit: true,
            tax: true,
            qr: true,
            users: true,
          },
        },
      };
    },

    // Get current user method
    getCurrentUser: async function () {
      console.log("Mock getCurrentUser");
      const adminSession =
        JSON.parse(localStorage.getItem("adminSession")) || {};

      // Always return success in this mock version
      return {
        success: true,
        data: {
          _id: adminSession.userId || "admin-id",
          displayName: adminSession.displayName || "Admin User",
          username: adminSession.username || "admin",
          role: adminSession.role || "admin",
          permissions: adminSession.permissions || {
            stats: true,
            productsView: true,
            productsEdit: true,
            vouchersView: true,
            vouchersEdit: true,
            tax: true,
            qr: true,
            users: true,
          },
        },
      };
    },

    // Logout method
    logout: async function () {
      console.log("Mock logout");
      return { success: true };
    },

    // Update admin credentials
    updateAdminCredentials: async function (data) {
      console.log("Mock updateAdminCredentials", data);
      return {
        success: true,
        message: "تم تحديث البيانات بنجاح",
      };
    },

    // Get users - Adding missing method
    getUsers: async function (params = {}) {
      console.log("Mock getUsers", params);

      // Create sample user data
      const allUsers = [
        {
          _id: "admin1",
          username: "admin",
          displayName: "مدير النظام",
          email: "admin@example.com",
          phone: "+1234567890",
          role: "admin",
          status: "active",
          lastLogin: new Date().toISOString(),
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
          permissions: {
            stats: true,
            productsView: true,
            productsEdit: true,
            vouchersView: true,
            vouchersEdit: true,
            tax: true,
            qr: true,
            users: true,
          },
        },
        {
          _id: "editor1",
          username: "editor",
          displayName: "محرر المحتوى",
          email: "editor@example.com",
          phone: "+2345678901",
          role: "editor",
          status: "active",
          lastLogin: new Date(Date.now() - 86400000).toISOString(), // yesterday
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), // 20 days ago
          permissions: {
            stats: true,
            productsView: true,
            productsEdit: true,
            vouchersView: true,
            vouchersEdit: true,
            tax: false,
            qr: true,
            users: false,
          },
        },
        {
          _id: "viewer1",
          username: "viewer",
          displayName: "مشاهد فقط",
          email: "viewer@example.com",
          phone: "+3456789012",
          role: "viewer",
          status: "active",
          lastLogin: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), // 15 days ago
          permissions: {
            stats: true,
            productsView: true,
            productsEdit: false,
            vouchersView: true,
            vouchersEdit: false,
            tax: false,
            qr: false,
            users: false,
          },
        },
        {
          _id: "inactive1",
          username: "inactive",
          displayName: "حساب غير نشط",
          email: "inactive@example.com",
          phone: "+4567890123",
          role: "editor",
          status: "inactive",
          lastLogin: null,
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
          permissions: {
            stats: true,
            productsView: true,
            productsEdit: true,
            vouchersView: true,
            vouchersEdit: true,
            tax: false,
            qr: true,
            users: false,
          },
        },
        {
          _id: "cashier1",
          username: "cashier",
          displayName: "موظف الكاشير",
          email: "cashier@example.com",
          phone: "+5678901234",
          role: "cashier",
          status: "active",
          lastLogin: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
          permissions: {
            stats: true,
            productsView: true,
            productsEdit: false,
            vouchersView: true,
            vouchersEdit: false,
            tax: true,
            qr: true,
            users: false,
          },
        },
      ];

      // Apply search filter if provided
      let filteredUsers = [...allUsers];
      if (params.search) {
        const search = params.search.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.displayName.toLowerCase().includes(search) ||
            user.username.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            (user.phone && user.phone.includes(search))
        );
      }

      // Apply role filter if provided
      if (params.role && params.role !== "all") {
        filteredUsers = filteredUsers.filter(
          (user) => user.role === params.role
        );
      }

      // Apply status filter if provided
      if (params.status && params.status !== "all") {
        filteredUsers = filteredUsers.filter(
          (user) => user.status === params.status
        );
      }

      // Calculate pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      // Get paginated results
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedUsers,
        pagination: {
          total: filteredUsers.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(filteredUsers.length / limit),
        },
      };
    },

    // Get visitors - Adding missing method
    getVisitors: async function (params = {}) {
      console.log("Mock getVisitors", params);

      // Create mock visitor data with the correct properties
      const mockVisitors = [
        {
          _id: "visit1",
          ipAddress: "192.168.1.1",
          deviceType: "mobile",
          browser: "Chrome",
          timestamp: new Date().toISOString(),
          entryPage: "index.html",
        },
        {
          _id: "visit2",
          ipAddress: "192.168.1.2",
          deviceType: "desktop",
          browser: "Firefox",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          entryPage: "menu.html",
        },
        {
          _id: "visit3",
          ipAddress: "192.168.1.3",
          deviceType: "tablet",
          browser: "Safari",
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          entryPage: "cart.html",
        },
      ];

      // Apply search filter if provided
      let filteredVisitors = [...mockVisitors];
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredVisitors = filteredVisitors.filter(
          (visitor) =>
            visitor.ipAddress.includes(searchLower) ||
            visitor.browser.toLowerCase().includes(searchLower) ||
            visitor.entryPage.toLowerCase().includes(searchLower)
        );
      }

      // Apply device type filter if provided
      if (params.deviceType && params.deviceType !== "all") {
        filteredVisitors = filteredVisitors.filter(
          (visitor) => visitor.deviceType === params.deviceType
        );
      }

      return {
        success: true,
        data: filteredVisitors,
      };
    },

    // Get visitor stats - Adding missing method
    getVisitorStats: async function (period = "all") {
      console.log("Mock getVisitorStats", period);
      return {
        success: true,
        data: {
          totalVisits: 100,
          totalVisitors: 45,
          uniqueVisitors: 45,
          period: period,
          deviceCounts: {
            mobile: 25,
            desktop: 15,
            tablet: 5,
          },
          pageViews: {
            home: 50,
            menu: 30,
            contact: 20,
          },
          dailyStats: [
            { date: "2023-01-01", count: 10 },
            { date: "2023-01-02", count: 15 },
            { date: "2023-01-03", count: 20 },
          ],
        },
      };
    },

    // Record visit - Adding missing method
    recordVisit: async function (visitorData) {
      console.log("Mock recordVisit", visitorData);
      return {
        success: true,
        data: {
          _id: "new-visit-" + Math.random().toString(36).substr(2),
          ...visitorData,
          timestamp: new Date().toISOString(),
        },
      };
    },

    // Create user - Enhanced mock method
    createUser: async function (userData) {
      console.log("Mock createUser", userData);

      // Validate required fields
      if (!userData.username || !userData.displayName || !userData.password) {
        return {
          success: false,
          message: "جميع الحقول المطلوبة يجب ملؤها",
        };
      }

      // Check if username already exists
      if (
        ["admin", "editor", "viewer", "inactive", "cashier"].includes(
          userData.username.toLowerCase()
        )
      ) {
        return {
          success: false,
          message: "اسم المستخدم موجود بالفعل",
        };
      }

      // Create new user ID
      const userId = "user-" + Math.random().toString(36).substring(2, 10);

      // Create new user object
      const newUser = {
        _id: userId,
        username: userData.username,
        displayName: userData.displayName,
        email: userData.email || "",
        phone: userData.phone || "",
        role: userData.role || "viewer",
        status: userData.status || "active",
        lastLogin: null,
        createdAt: new Date().toISOString(),
        permissions: userData.permissions || {
          stats: false,
          productsView: false,
          productsEdit: false,
          vouchersView: false,
          vouchersEdit: false,
          tax: false,
          qr: false,
          users: false,
        },
      };

      // In a real app, we would add to the database here

      return {
        success: true,
        data: newUser,
        message: "تم إنشاء المستخدم بنجاح",
      };
    },

    // Update user - Enhanced mock method
    updateUser: async function (userId, userData) {
      console.log("Mock updateUser", userId, userData);

      // For mock purposes, we'll use the same user array as the getUser method
      const allUsers = [
        {
          _id: "admin1",
          username: "admin",
          displayName: "مدير النظام",
          email: "admin@example.com",
          phone: "+1234567890",
          role: "admin",
          status: "active",
        },
        {
          _id: "editor1",
          username: "editor",
          displayName: "محرر المحتوى",
          email: "editor@example.com",
          phone: "+2345678901",
          role: "editor",
          status: "active",
        },
        {
          _id: "viewer1",
          username: "viewer",
          displayName: "مشاهد فقط",
          email: "viewer@example.com",
          phone: "+3456789012",
          role: "viewer",
          status: "active",
        },
        {
          _id: "inactive1",
          username: "inactive",
          displayName: "حساب غير نشط",
          email: "inactive@example.com",
          phone: "+4567890123",
          role: "editor",
          status: "inactive",
        },
        {
          _id: "cashier1",
          username: "cashier",
          displayName: "موظف الكاشير",
          email: "cashier@example.com",
          phone: "+5678901234",
          role: "cashier",
          status: "active",
        },
      ];

      // Find the user to update
      const userIndex = allUsers.findIndex((user) => user._id === userId);

      if (userIndex === -1) {
        return {
          success: false,
          message: "المستخدم غير موجود",
        };
      }

      // In a real app, we would update the user in the database
      // Here we just simulate a successful update

      // Create updated user object
      const updatedUser = {
        ...allUsers[userIndex],
        ...userData,
        _id: userId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: updatedUser,
        message: "تم تحديث المستخدم بنجاح",
      };
    },

    // Delete user - Enhanced mock method
    deleteUser: async function (userId) {
      console.log("Mock deleteUser", userId);

      // Check for protected users that cannot be deleted
      if (["admin1"].includes(userId)) {
        return {
          success: false,
          message: "لا يمكن حذف حساب المدير الرئيسي",
        };
      }

      // In a real app, we would check if the user exists first
      // For mock purposes, we'll use the same user array as other methods
      const allUsers = [
        { _id: "admin1", username: "admin", role: "admin" },
        { _id: "editor1", username: "editor", role: "editor" },
        { _id: "viewer1", username: "viewer", role: "viewer" },
        { _id: "inactive1", username: "inactive", role: "editor" },
        { _id: "cashier1", username: "cashier", role: "cashier" },
      ];

      // Find the user to delete
      const userExists = allUsers.some((user) => user._id === userId);

      if (!userExists) {
        return {
          success: false,
          message: "المستخدم غير موجود",
        };
      }

      // In a real app, we would delete from the database
      // Here we just simulate a successful deletion

      return {
        success: true,
        message: "تم حذف المستخدم بنجاح",
      };
    },
  };

  console.log("API Service mock initialized with all required methods");
})();
