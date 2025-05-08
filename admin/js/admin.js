document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin page loaded. Performing initial authentication check...");

  // Verify token is present
  const token = localStorage.getItem("token");
  console.log("Token present:", !!token);

  // Verify session is valid
  const sessionData = localStorage.getItem("adminSession");

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      console.log("Session found:", session);
      console.log(
        "Session valid until:",
        new Date(session.expiresAt).toLocaleString()
      );
      console.log("Current time:", new Date().toLocaleString());
      console.log("Session is valid:", session.expiresAt > Date.now());
    } catch (e) {
      console.error("Error parsing session:", e);
    }
  } else {
    console.log("No session data found");
  }

  // Check if user is authenticated first
  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    console.log("Authentication failed, redirecting to login page");
    window.location.href = "admin-login.html";
    return;
  }

  console.log("Authentication successful, continuing with page initialization");

  // DOM Elements - Modals
  const productModal = document.getElementById("product-modal");
  const closeProductModal = document.getElementById("close-product-modal");
  const voucherModal = document.getElementById("voucher-modal");
  const closeVoucherModal = document.getElementById("close-voucher-modal");

  // DOM Elements - Forms
  const productForm = document.getElementById("product-form");
  const voucherForm = document.getElementById("voucher-form");

  // DOM Elements - Buttons
  const addProductBtn = document.getElementById("add-product-btn");
  const saveTaxSettingsBtn = document.getElementById("save-tax-settings");
  const resetStatsBtn = document.getElementById("reset-stats");
  const addVoucherBtn = document.getElementById("add-voucher-btn");
  const applyGlobalDiscountBtn = document.getElementById(
    "apply-global-discount"
  );
  const resetGlobalDiscountBtn = document.getElementById(
    "reset-global-discount"
  );

  // Check if elements are found
  console.log("Elements found:", {
    productModal: !!productModal,
    closeProductModal: !!closeProductModal,
    voucherModal: !!voucherModal,
    closeVoucherModal: !!closeVoucherModal,
    productForm: !!productForm,
    voucherForm: !!voucherForm,
    addProductBtn: !!addProductBtn,
    saveTaxSettingsBtn: !!saveTaxSettingsBtn,
    resetStatsBtn: !!resetStatsBtn,
    addVoucherBtn: !!addVoucherBtn,
    applyGlobalDiscountBtn: !!applyGlobalDiscountBtn,
    resetGlobalDiscountBtn: !!resetGlobalDiscountBtn,
  });

  // DOM Elements - Lists
  const productsList = document.getElementById("products-list");
  const vouchersList = document.getElementById("vouchers-list");

  // DOM Elements - Visitors
  const totalVisitorsElement = document.getElementById("total-visitors");
  const mobileVisitorsElement = document.getElementById("mobile-visitors");
  const desktopVisitorsElement = document.getElementById("desktop-visitors");
  const tabletVisitorsElement = document.getElementById("tablet-visitors");
  const visitorsTableBody = document.getElementById("visitors-table-body");
  const visitorsSearch = document.getElementById("visitors-search");
  const visitorsFilter = document.getElementById("visitors-filter");

  // DOM Elements - Stats
  const totalEarningsElement = document.getElementById("total-earnings");
  const totalOrdersElement = document.getElementById("total-orders");
  const totalProductsElement = document.getElementById("total-products");
  const totalVouchersElement = document.getElementById("total-vouchers");

  // DOM Elements - Tax Settings
  const taxRateInput = document.getElementById("tax-rate");
  const taxEnabledToggle = document.getElementById("tax-enabled");

  // Toggle light/dark mode
  const toggleSwitch = document.getElementById("switch");
  applyThemeFromStorage();

  // Data Storage
  let products = [];
  let orders = [];
  let vouchers = [];
  let visitors = [];
  let taxSettings = {
    rate: 15,
    enabled: true,
    serviceRate: 10,
    serviceEnabled: false,
  };

  // Initialize data from localStorage
  initData();

  // Initialize stats
  updateStats();
  
  // Initialize WebSocket connection for real-time updates
  initWebSocket();

  // Event listeners for visitor search and filter
  if (visitorsSearch) {
    visitorsSearch.addEventListener("input", function () {
      renderVisitorsTable();
    });
  }

  if (visitorsFilter) {
    visitorsFilter.addEventListener("change", function () {
      renderVisitorsTable();
    });
  }

  // Add a button to manually refresh the visitors table
  const visitorsSection = document.getElementById("users-section");
  if (visitorsSection) {
    // Create button container div for better layout
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";

    // Refresh button
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "add-button";
    refreshBtn.innerHTML =
      '<i class="fas fa-sync-alt"></i> تحديث بيانات الزوار';
    refreshBtn.addEventListener("click", function () {
      // Load visitors data
      loadVisitors();

      // Show notification
      showNotification("تم تحديث بيانات الزوار بنجاح", "success");
    });

    // Reset visitors button
    const resetBtn = document.createElement("button");
    resetBtn.className = "add-button";
    resetBtn.style.backgroundColor = "#ff3b30";
    resetBtn.innerHTML =
      '<i class="fas fa-trash-alt"></i> إعادة تعيين بيانات الزوار';
    resetBtn.addEventListener("click", function () {
      if (
        confirm(
          "هل أنت متأكد من إعادة تعيين بيانات الزوار؟ سيتم حذف جميع البيانات الحالية."
        )
      ) {
        resetVisitors();
      }
    });

    // Add buttons to container
    buttonContainer.appendChild(refreshBtn);
    buttonContainer.appendChild(resetBtn);

    // Add the button next to the "Add User" button
    const sectionHeader = visitorsSection.querySelector(".section-header");
    if (sectionHeader) {
      sectionHeader.appendChild(buttonContainer);
    }
  }

  // Event Listeners - Modals
  addProductBtn.addEventListener("click", function () {
    console.log("Add product button clicked");
    openProductModal();
  });
  closeProductModal.addEventListener("click", closeAllModals);

  addVoucherBtn.addEventListener("click", function () {
    console.log("Add voucher button clicked");
    showVoucherModalForced();
  });
  closeVoucherModal.addEventListener("click", closeAllModals);

  // Event Listeners - Forms
  productForm.addEventListener("submit", handleProductSubmit);
  voucherForm.addEventListener("submit", handleVoucherSubmit);

  // Event Listeners - Tax Settings
  saveTaxSettingsBtn.addEventListener("click", saveTaxSettings);

  // Event Listener - Reset Stats
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener("click", confirmResetStats);
  }

  // Event Listeners - Global Discount
  if (applyGlobalDiscountBtn) {
    applyGlobalDiscountBtn.addEventListener("click", applyGlobalDiscount);
  }

  if (resetGlobalDiscountBtn) {
    resetGlobalDiscountBtn.addEventListener("click", resetGlobalDiscount);
  }

  // Handle theme changes
  toggleSwitch.addEventListener("change", function () {
    if (this.checked) {
      // Dark mode
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      // Light mode
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    }
  });

  // Real-time data storage changes
  window.addEventListener("storage", function (e) {
    if (e.key === "orders") {
      // Orders changed (possibly from a new checkout)
      loadOrders();
      updateStats();
    } else if (e.key === "taxSettings") {
      // Tax settings changed
      loadTaxSettings();
    } else if (e.key === "visitors") {
      // Visitors data changed in another tab
      loadVisitors();
    }
  });

  // Add event listener for local storage changes (for cross-tab sync)
  window.addEventListener("storage", function (e) {
    // Check if the discount status changed
    if (e.key === "original_prices" || e.key === "discount_change_event") {
      checkGlobalDiscount();
    }
  });

  // Functions - Reset Stats
  function confirmResetStats() {
    // Show confirmation dialog
    if (
      confirm(
        "هل أنت متأكد من إعادة تعيين جميع الإحصائيات؟ سيتم حذف جميع بيانات الطلبات."
      )
    ) {
      resetStats();
    }
  }

  function resetStats() {
    // Clear orders data
    orders = [];
    localStorage.removeItem("orders");

    // Update stats display
    updateStats();

    // Show notification
    showNotification("تم إعادة تعيين الإحصائيات بنجاح", "success");

    // Apply animation to the reset button
    resetStatsBtn.classList.add("rotating");
    setTimeout(() => {
      resetStatsBtn.classList.remove("rotating");
    }, 1000);
  }

  // Functions - Theme
  function applyThemeFromStorage() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
      toggleSwitch.checked = false;
    } else {
      document.body.classList.remove("light-mode");
      toggleSwitch.checked = true;
    }
  }

  // Functions - Initialization
  function initData() {
    console.log("Initializing data...");

    // Load products first as they are the most important
    loadProducts();
    console.log("Products loaded");

    // Render products immediately to ensure they appear
    renderProducts();
    console.log("Products rendered");

    // Load the rest of the data
    loadOrders();
    loadVouchers();
    loadTaxSettings();
    loadVisitors();

    // Render vouchers
    renderVouchers();

    // Initialize image preview and upload functionality
    initImageHandling();

    // Initialize QR code generator
    initQRCodeGenerator();

    // Check global discount status
    checkGlobalDiscount();

    // Track this visit in visitor stats
    recordVisit();

    // Update stats after all data is loaded
    updateStats();
  }

  // Functions - Visitor Tracking
  function loadVisitors() {
    try {
      const storedVisitors = localStorage.getItem("visitors");
      if (storedVisitors) {
        visitors = JSON.parse(storedVisitors);
      } else {
        // Initialize empty visitors array rather than simulating data
        visitors = [];
        localStorage.setItem("visitors", JSON.stringify(visitors));
      }

      // Update visitors stats
      updateVisitorStats();

      // Render visitors table
      renderVisitorsTable();

      console.log("Loaded", visitors.length, "visitor records");
    } catch (error) {
      console.error("Error loading visitors:", error);
    }
  }

  function getIPAddress() {
    // For privacy reasons in this demo, we'll use a generic format
    // indicating that this is a client IP
    return "Client IP";
  }

  function resetVisitors() {
    // Simply clear visitors data without simulating new data
    if (confirm("هل أنت متأكد من حذف جميع بيانات الزوار؟")) {
      visitors = [];
      localStorage.setItem("visitors", JSON.stringify(visitors));

      // Update stats and table
      updateVisitorStats();
      renderVisitorsTable();

      // Show notification
      showNotification("تم حذف جميع بيانات الزوار بنجاح", "success");
    }
  }

  function updateVisitorStats() {
    if (!totalVisitorsElement) return;

    // Count total visitors
    const totalVisits = visitors.length;
    totalVisitorsElement.textContent = totalVisits;

    // Count by device type
    const mobileVisits = visitors.filter(
      (v) => v.deviceType === "mobile"
    ).length;
    const desktopVisits = visitors.filter(
      (v) => v.deviceType === "desktop"
    ).length;
    const tabletVisits = visitors.filter(
      (v) => v.deviceType === "tablet"
    ).length;

    if (mobileVisitorsElement) mobileVisitorsElement.textContent = mobileVisits;
    if (desktopVisitorsElement)
      desktopVisitorsElement.textContent = desktopVisits;
    if (tabletVisitorsElement) tabletVisitorsElement.textContent = tabletVisits;
  }

  function renderVisitorsTable() {
    if (!visitorsTableBody) return;

    console.log("Rendering visitors table with", visitors.length, "records");

    // Clear the table
    visitorsTableBody.innerHTML = "";

    // Get search term and filter value
    const searchTerm = visitorsSearch ? visitorsSearch.value.toLowerCase() : "";
    const filterValue = visitorsFilter ? visitorsFilter.value : "all";

    // Filter visitors based on search and filter
    let filteredVisitors = [...visitors];

    // Apply search filter
    if (searchTerm) {
      filteredVisitors = filteredVisitors.filter(
        (visitor) =>
          visitor.ipAddress.toLowerCase().includes(searchTerm) ||
          visitor.browser.toLowerCase().includes(searchTerm) ||
          visitor.entryPage.toLowerCase().includes(searchTerm)
      );
    }

    // Apply device type filter
    if (filterValue !== "all") {
      filteredVisitors = filteredVisitors.filter(
        (visitor) => visitor.deviceType === filterValue
      );
    }

    // Sort by timestamp (newest first)
    filteredVisitors.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    console.log("Displaying", filteredVisitors.length, "filtered visitors");

    // Display visitors (limit to latest 50 for performance)
    filteredVisitors.slice(0, 50).forEach((visitor, index) => {
      const row = document.createElement("tr");

      const visitDate = new Date(visitor.timestamp);
      const formattedDate = `${visitDate.toLocaleDateString()} ${visitDate.toLocaleTimeString()}`;

      // Create device type icon
      let deviceIcon = "";
      if (visitor.deviceType === "mobile") {
        deviceIcon = '<i class="fas fa-mobile-alt device-mobile"></i>';
      } else if (visitor.deviceType === "desktop") {
        deviceIcon = '<i class="fas fa-desktop device-desktop"></i>';
      } else if (visitor.deviceType === "tablet") {
        deviceIcon = '<i class="fas fa-tablet-alt device-tablet"></i>';
      }

      row.innerHTML = `
                <td>${index + 1}</td>
                <td>${visitor.ipAddress}</td>
                <td><div class="device-type">${deviceIcon} ${
        visitor.deviceType
      }</div></td>
                <td>${visitor.browser}</td>
                <td>${formattedDate}</td>
                <td>${visitor.entryPage}</td>
            `;

      visitorsTableBody.appendChild(row);
    });

    // Show "no data" message if no visitors
    if (filteredVisitors.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td colspan="6" style="text-align: center; padding: 20px;">
                    <div class="empty-message">
                        <i class="fas fa-users"></i>
                        <p>لا توجد بيانات للزوار</p>
                    </div>
                </td>
            `;
      visitorsTableBody.appendChild(row);
    }
  }

  function recordVisit() {
    try {
      console.log("Recording a new visitor...");

      // Get device type
      const deviceType = getDeviceType();

      // Get browser info
      const browserInfo = getBrowserInfo();

      // Create visitor record
      const visitorData = {
        id: generateUniqueId(),
        ipAddress: "Client IP", // For privacy in this demo
        deviceType: deviceType,
        browser: browserInfo,
        timestamp: new Date().toISOString(),
        entryPage: window.location.pathname,
        referrer: document.referrer || "direct",
      };

      console.log("New visitor data:", visitorData);

      // Get current visitors
      let currentVisitors = [];
      const storedVisitors = localStorage.getItem("visitors");

      if (storedVisitors) {
        currentVisitors = JSON.parse(storedVisitors);
      }

      // Add to visitors array
      currentVisitors.push(visitorData);

      // Limit stored visitors to most recent 500 for performance
      if (currentVisitors.length > 500) {
        currentVisitors = currentVisitors.slice(-500);
      }

      // Save to localStorage
      localStorage.setItem("visitors", JSON.stringify(currentVisitors));

      // Update global visitors array
      visitors = currentVisitors;

      // Update stats and table
      updateVisitorStats();
      renderVisitorsTable();

      // Show success notification
      showNotification("تم تسجيل زيارة جديدة بنجاح", "success");

      return true;
    } catch (error) {
      console.error("Error recording visit:", error);
      showNotification("حدث خطأ أثناء تسجيل الزيارة", "error");
      return false;
    }
  }

  function getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent);
    const isTablet =
      /tablet|ipad|playbook|silk/i.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isMobile && !isTablet) return "mobile";
    if (isTablet) return "tablet";
    return "desktop";
  }

  function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browser = "Unknown Browser";

    if (userAgent.match(/edge/i)) {
      browser = "Edge";
    } else if (userAgent.match(/firefox|fxios/i)) {
      browser = "Firefox";
    } else if (userAgent.match(/opr\//i)) {
      browser = "Opera";
    } else if (userAgent.match(/chrome|chromium|crios/i)) {
      browser = "Chrome";
    } else if (userAgent.match(/safari/i)) {
      browser = "Safari";
    } else if (userAgent.match(/trident/i)) {
      browser = "Internet Explorer";
    } else if (userAgent.match(/ucbrowser/i)) {
      browser = "UC Browser";
    }

    return browser;
  }

  // Check if global discount is applied and update UI
  function checkGlobalDiscount() {
    // Get the discount input element
    const discountInput = document.getElementById("global-discount-percentage");
    const applyBtn = document.getElementById("apply-global-discount");
    const resetBtn = document.getElementById("reset-global-discount");

    if (!discountInput || !applyBtn || !resetBtn) return;

    // Get discount container element
    const discountContainer = document.querySelector(
      ".global-discount-container"
    );

    // Check if original prices exist in localStorage
    const originalPrices = localStorage.getItem("original_prices");
    if (originalPrices) {
      // Discount is applied, calculate the current discount percentage
      const originalPricesObj = JSON.parse(originalPrices);
      let totalDiscount = 0;
      let productCount = 0;

      products.forEach((product) => {
        if (originalPricesObj[product.id]) {
          const originalPrice = originalPricesObj[product.id];
          const currentPrice = product.price;
          const discountPercent =
            ((originalPrice - currentPrice) / originalPrice) * 100;
          totalDiscount += discountPercent;
          productCount++;
        }
      });

      // Calculate average discount
      const avgDiscountPercent = Math.round(
        totalDiscount / (productCount || 1)
      );

      // Update UI to show current discount
      discountInput.value = avgDiscountPercent;

      // Add a visual indicator that discount is active
      if (discountContainer) {
        discountContainer.classList.add("discount-active");
      }

      // Show notification that discount is active
      showNotification(
        `يوجد خصم عام مطبق بنسبة ${avgDiscountPercent}%`,
        "info"
      );
    } else {
      // No discount is active, reset UI
      if (discountContainer) {
        discountContainer.classList.remove("discount-active");
      }
      discountInput.value = 10; // Reset to default value
    }
  }

  // Initialize image handling functionality
  function initImageHandling() {
    // Initialize image preview button
    const previewImageBtn = document.getElementById("preview-image-btn");
    if (previewImageBtn) {
      previewImageBtn.addEventListener("click", function () {
        const productImageInput = document.getElementById("product-image");
        previewImageFromUrl(productImageInput.value);
      });
    }

    // Initialize image upload functionality
    const fileUploadInput = document.getElementById("product-image-upload");
    if (fileUploadInput) {
      const fileUploadWrapper = fileUploadInput.closest(".file-upload-wrapper");
      const fileUploadBox = fileUploadWrapper.querySelector(".file-upload-box");

      // Handle file selection
      fileUploadInput.addEventListener("change", function (e) {
        handleFileUpload(this.files[0], fileUploadWrapper);
      });

      // Handle drag and drop
      fileUploadBox.addEventListener("dragover", function (e) {
        e.preventDefault();
        fileUploadWrapper.classList.add("dragging");
      });

      fileUploadBox.addEventListener("dragleave", function (e) {
        e.preventDefault();
        fileUploadWrapper.classList.remove("dragging");
      });

      fileUploadBox.addEventListener("drop", function (e) {
        e.preventDefault();
        fileUploadWrapper.classList.remove("dragging");

        if (e.dataTransfer.files.length) {
          handleFileUpload(e.dataTransfer.files[0], fileUploadWrapper);
        }
      });
    }

    // Initialize tab switching
    const imageTabs = document.querySelectorAll(".image-tab");
    if (imageTabs.length) {
      imageTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
          // Remove active class from all tabs and contents
          document
            .querySelectorAll(".image-tab")
            .forEach((t) => t.classList.remove("active"));
          document
            .querySelectorAll(".image-tab-content")
            .forEach((c) => c.classList.remove("active"));

          // Add active class to clicked tab and its content
          this.classList.add("active");
          const tabId = this.getAttribute("data-tab");
          document.getElementById(tabId + "-tab").classList.add("active");
        });
      });
    }
  }

  // Preview image from URL
  function previewImageFromUrl(imageUrl) {
    const previewImg = document.getElementById("preview-img");
    const noPreviewDiv = document.getElementById("no-preview");
    const productImageFinal = document.getElementById("product-image-final");

    if (imageUrl) {
      previewImg.src = imageUrl;
      previewImg.onload = function () {
        previewImg.style.display = "block";
        noPreviewDiv.style.display = "none";
        productImageFinal.value = imageUrl;
      };
      previewImg.onerror = function () {
        previewImg.style.display = "none";
        noPreviewDiv.style.display = "flex";
        productImageFinal.value = "";
        showNotification("لا يمكن تحميل الصورة، تأكد من صحة الرابط");
      };
    } else {
      previewImg.style.display = "none";
      noPreviewDiv.style.display = "flex";
      productImageFinal.value = "";
      showNotification("أدخل رابط الصورة أولاً");
    }
  }

  // Handle file upload
  function handleFileUpload(file, wrapper) {
    const previewImg = document.getElementById("preview-img");
    const noPreviewDiv = document.getElementById("no-preview");
    const productImageFinal = document.getElementById("product-image-final");
    const statusText = wrapper.querySelector("p");

    // Reset error state
    wrapper.classList.remove("error");

    // Validate file
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      wrapper.classList.add("error");
      statusText.textContent =
        "نوع الملف غير صالح. يرجى اختيار صورة (JPG, PNG, GIF, WEBP)";
      showNotification("نوع الملف غير صالح. يرجى اختيار صورة صالحة");
      return;
    }

    // File size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      wrapper.classList.add("error");
      statusText.textContent = "حجم الملف كبير جداً. الحد الأقصى هو 2 ميجابايت";
      showNotification("حجم الملف كبير جداً. الحد الأقصى هو 2 ميجابايت");
      return;
    }

    // Show loading state
    wrapper.classList.add("has-file");
    statusText.textContent = "جاري تحميل الصورة...";

    // Read the file and convert to data URL
    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;

      // Update preview
      previewImg.src = dataUrl;
      previewImg.style.display = "block";
      noPreviewDiv.style.display = "none";

      // Update hidden input
      productImageFinal.value = dataUrl;

      // Update status
      statusText.textContent = "تم تحميل الصورة بنجاح";

      // Show success notification
      showNotification("تم تحميل الصورة بنجاح");
    };

    reader.onerror = function () {
      wrapper.classList.add("error");
      statusText.textContent = "حدث خطأ أثناء قراءة الملف";
      showNotification("حدث خطأ أثناء قراءة الملف");
    };

    reader.readAsDataURL(file);
  }

  async function loadProducts() {
    // Show loading spinner in the products list
    productsList.innerHTML = `
      <div class="loading-spinner" id="products-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>جاري تحميل المنتجات...</p>
      </div>
    `;

    try {
      // Try to fetch products from API using the ApiService
      const apiService = new ApiService();
      const result = await apiService.getProducts();

      if (result.success && result.data && result.data.length > 0) {
        products = result.data;
        console.log(`Loaded ${products.length} products from API`);

        // Save to localStorage for offline usage
        localStorage.setItem("menuItems", JSON.stringify(products));

        // Update UI
        renderProducts();
        updateStats();
        return;
      } else {
        console.warn(
          "API request succeeded but no products returned, falling back to localStorage"
        );
      }
    } catch (error) {
      console.error("Error fetching products from API:", error);
      console.warn("Falling back to localStorage");
    }

    // Fallback to localStorage if API fails
    const savedProducts = localStorage.getItem("menuItems");
    if (savedProducts) {
      try {
        products = JSON.parse(savedProducts);
        console.log("Loaded products from localStorage:", products.length);
        renderProducts();
        updateStats();
      } catch (error) {
        console.error("Error parsing saved products:", error);
        products = [];
      }
    }

    // If no products are found in localStorage or the array is empty, add default products
    if (!products || products.length === 0) {
      console.log(
        "No products found in localStorage, creating default products"
      );
      createDefaultProducts();
    }
  }

  async function createDefaultProducts() {
    try {
      // Try to create default products via API
      const apiService = new ApiService();
      const result = await apiService.createDefaultProducts();

      if (result.success && result.data && result.data.length > 0) {
        products = result.data;
        console.log(`Created ${products.length} default products from API`);

        // Save to localStorage for offline usage
        localStorage.setItem("menuItems", JSON.stringify(products));

        // Update UI
        renderProducts();
        updateStats();

        // Show success notification
        showNotification("تم إنشاء المنتجات الافتراضية بنجاح", "success");
        return;
      } else {
        console.warn(
          "API default product creation failed, using local defaults"
        );
      }
    } catch (error) {
      console.error("Error creating default products via API:", error);
      console.warn("Using local default products due to API error");
    }

    // Use local default products if API fails
    products = [
      {
        id: "pizza1",
        name: "بيتزا بيروني غنائي",
        description:
          "بيتزا بيروني مع الجبن الموزاريلا وصلصة الطماطم، بيتزا ايطالية اصلية",
        price: 140.0,
        category: "pizza",
        image:
          "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
      },
      {
        id: "pizza2",
        name: "بيتزا بيروني غنائي",
        description:
          "بيتزا بيروني مع الجبن الموزاريلا وصلصة الطماطم، بيتزا ايطالية اصلية",
        price: 140.0,
        category: "pizza",
        image:
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
      },
      {
        id: "burger1",
        name: "برجر لحم أنغوس",
        description: "برجر لحم بقري أنغوس مع جبنة شيدر وصلصة خاصة",
        price: 120.0,
        category: "burger",
        image:
          "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
      },
      {
        id: "burger2",
        name: "برجر دجاج مقرمش",
        description: "برجر دجاج مقرمش محمر مع صلصة الثوم والخس",
        price: 95.0,
        category: "burger",
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        rating: 4.6,
      },
      {
        id: "sandwich1",
        name: "سندويتش شاورما",
        description: "شاورما دجاج مع صلصة طحينة وخضار منوعة",
        price: 65.0,
        category: "sandwich",
        image:
          "https://images.unsplash.com/photo-1485451456034-3f9391c6f769?auto=format&fit=crop&w=800&q=80",
        rating: 4.7,
      },
      {
        id: "drink1",
        name: "عصير فواكه طازج",
        description: "مزيج من الفواكه الطازجة المنعشة",
        price: 35.0,
        category: "drink",
        image:
          "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
        rating: 4.5,
      },
    ];

    // Save default products to localStorage
    saveProducts();
    console.log("Default products saved to localStorage");
  }

  function loadOrders() {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      orders = JSON.parse(savedOrders);
    }
  }

  function loadVouchers() {
    const savedVouchers = localStorage.getItem("vouchers");
    if (savedVouchers) {
      vouchers = JSON.parse(savedVouchers);
    }
  }

  function loadTaxSettings() {
    const savedTaxSettings = localStorage.getItem("taxSettings");
    if (savedTaxSettings) {
      taxSettings = JSON.parse(savedTaxSettings);

      // Update UI with saved tax settings
      taxRateInput.value = taxSettings.rate;
      taxEnabledToggle.checked = taxSettings.enabled;

      // Update service tax UI if those settings exist
      const serviceTaxRateInput = document.getElementById("service-tax-rate");
      const serviceTaxEnabledToggle = document.getElementById(
        "service-tax-enabled"
      );

      if (serviceTaxRateInput && taxSettings.serviceRate !== undefined) {
        serviceTaxRateInput.value = taxSettings.serviceRate;
      }

      if (serviceTaxEnabledToggle && taxSettings.serviceEnabled !== undefined) {
        serviceTaxEnabledToggle.checked = taxSettings.serviceEnabled;
      }
    }
  }

  // Functions - Stats
  function updateStats() {
    // Calculate total earnings from orders
    let totalEarnings = 0;

    orders.forEach((order) => {
      totalEarnings += order.total;
    });

    // Format earnings with thousands separator
    const formattedEarnings = totalEarnings
      .toFixed(2)
      .replace(/\d(?=(\d{3})+\.)/g, "$&,");

    // Count active and expired vouchers
    const today = new Date();
    const activeVouchers = vouchers.filter(
      (v) => new Date(v.expiryDate) >= today
    ).length;
    const expiredVouchers = vouchers.length - activeVouchers;

    // Update UI
    totalEarningsElement.textContent = `${formattedEarnings} جنية`;
    totalOrdersElement.textContent = orders.length;
    totalProductsElement.textContent = products.length;

    // Show only total vouchers count
    totalVouchersElement.textContent = vouchers.length;

    // Apply animation to stats when they change
    animateStatsChange();

    // Update recent orders list
    updateRecentOrders();
  }

  function animateStatsChange() {
    const statCards = document.querySelectorAll(".stat-card");
    statCards.forEach((card) => {
      card.classList.add("stat-updated");
      setTimeout(() => {
        card.classList.remove("stat-updated");
      }, 1000);
    });
  }

  function updateRecentOrders() {
    const recentOrdersContainer = document.getElementById("recent-orders");
    if (!recentOrdersContainer) return;

    // Clear container
    recentOrdersContainer.innerHTML = "";

    if (orders.length === 0) {
      // Show empty message
      const emptyMessage = document.createElement("div");
      emptyMessage.classList.add("empty-message");
      emptyMessage.innerHTML =
        '<i class="fas fa-receipt"></i><p>لا توجد طلبات حديثة</p>';
      recentOrdersContainer.appendChild(emptyMessage);
      return;
    }

    // Sort orders by date (newest first)
    const recentOrders = [...orders].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Show only the 5 most recent orders
    const ordersToShow = recentOrders.slice(0, 5);

    // Create order items
    ordersToShow.forEach((order) => {
      const orderItem = document.createElement("div");
      orderItem.classList.add("order-item");

      // Format the date
      const orderDate = new Date(order.date);
      const formattedDate = formatDate(orderDate);

      // Format the total with thousands separator
      const formattedTotal = order.total
        .toFixed(2)
        .replace(/\d(?=(\d{3})+\.)/g, "$&,");

      // Create the HTML
      orderItem.innerHTML = `
                <div class="order-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <div class="order-details">
                    <div class="order-id">${order.id}</div>
                    <div class="order-date">${formattedDate}</div>
                </div>
                <div class="order-total">${formattedTotal} جنية</div>
            `;

      recentOrdersContainer.appendChild(orderItem);
    });
  }

  // Functions - Products
  function renderProducts() {
    // Clear products list
    productsList.innerHTML = "";

    // Add search box
    const searchContainer = document.createElement("div");
    searchContainer.className = "admin-search-container";
    searchContainer.innerHTML = `
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="product-search" placeholder="البحث عن منتج...">
            </div>
            <div class="filter-group">
                <select id="product-category-filter">
                    <option value="all">جميع الفئات</option>
                    <option value="pizza">بيتزا</option>
                    <option value="burger">برجر</option>
                    <option value="sandwich">سندوتش</option>
                    <option value="drink">مشروبات</option>
                </select>
            </div>
        `;
    productsList.appendChild(searchContainer);

    // Create products grid
    const productsGrid = document.createElement("div");
    productsGrid.className = "products-grid";
    productsList.appendChild(productsGrid);

    // Check if there are products
    if (products.length === 0) {
      productsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>لا توجد منتجات بعد. أضف منتجات جديدة لعرضها هنا.</p>
                </div>
            `;
      return;
    }

    // Create product cards
    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "admin-product-card";
      productCard.setAttribute("data-category", product.category);
      productCard.setAttribute("data-name", product.name);
      productCard.setAttribute("data-id", product.id);

      productCard.innerHTML = `
                <div class="product-preview">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-category-badge">${getCategoryName(
                      product.category
                    )}</div>
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-desc">${product.description.substring(
                      0,
                      80
                    )}${product.description.length > 80 ? "..." : ""}</p>
                    <div class="product-meta">
                        <span class="product-price">${product.price.toFixed(
                          2
                        )} جنية</span>
                        ${
                          product.rating
                            ? `
                        <span class="product-rating">
                            <i class="fas fa-star"></i> ${product.rating}
                        </span>`
                            : ""
                        }
                    </div>
                    <div class="product-actions">
                        <button class="edit-button" data-id="${product.id}">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="delete-button" data-id="${product.id}">
                            <i class="fas fa-trash-alt"></i> حذف
                        </button>
                    </div>
                </div>
            `;

      productsGrid.appendChild(productCard);
    });

    // Update total products count in stats
    if (totalProductsElement) {
      totalProductsElement.textContent = products.length;
    }

    // Add event listeners to edit and delete buttons
    document.querySelectorAll(".edit-button").forEach((button) => {
      button.addEventListener("click", function () {
        const productId = this.getAttribute("data-id");
        const product = products.find((p) => p.id === productId);
        if (product) {
          openProductModal(product);
        }
      });
    });

    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", function () {
        const productId = this.getAttribute("data-id");
        deleteProduct(productId);
      });
    });

    // Add event listener to search input
    const searchInput = document.getElementById("product-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();
        const categoryFilter = document.getElementById(
          "product-category-filter"
        ).value;

        document.querySelectorAll(".admin-product-card").forEach((card) => {
          const productName = card.getAttribute("data-name").toLowerCase();
          const productCategory = card.getAttribute("data-category");

          const matchesSearch = productName.includes(searchTerm);
          const matchesCategory =
            categoryFilter === "all" || productCategory === categoryFilter;

          if (matchesSearch && matchesCategory) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        });
      });
    }

    // Add event listener to category filter
    const categoryFilter = document.getElementById("product-category-filter");
    if (categoryFilter) {
      categoryFilter.addEventListener("change", function () {
        const selectedCategory = this.value;
        const searchTerm = document
          .getElementById("product-search")
          .value.toLowerCase();

        document.querySelectorAll(".admin-product-card").forEach((card) => {
          const productName = card.getAttribute("data-name").toLowerCase();
          const productCategory = card.getAttribute("data-category");

          const matchesSearch = productName.includes(searchTerm);
          const matchesCategory =
            selectedCategory === "all" || productCategory === selectedCategory;

          if (matchesSearch && matchesCategory) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        });
      });
    }
  }

  function openProductModal(product = null) {
    // Clear previous form data
    productForm.reset();

    // Set modal title and form fields
    const modalTitle = document.getElementById("product-modal-title");
    const productIdInput = document.getElementById("product-id");
    const productNameInput = document.getElementById("product-name");
    const productDescriptionInput = document.getElementById(
      "product-description"
    );
    const productPriceInput = document.getElementById("product-price");
    const productCategorySelect = document.getElementById("product-category");
    const productImageInput = document.getElementById("product-image");
    const productImageFinal = document.getElementById("product-image-final");
    const productRatingInput = document.getElementById("product-rating");
    const previewImg = document.getElementById("preview-img");
    const noPreviewDiv = document.getElementById("no-preview");

    // Reset image preview
    previewImg.style.display = "none";
    noPreviewDiv.style.display = "flex";

    // Reset file upload status
    const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
    if (fileUploadWrapper) {
      fileUploadWrapper.classList.remove("has-file", "error");
      const statusText = fileUploadWrapper.querySelector("p");
      if (statusText) {
        statusText.textContent = "اضغط لاختيار صورة أو اسحب وأفلت الصورة هنا";
      }
    }

    // Reset tabs - select URL tab by default
    document
      .querySelectorAll(".image-tab")
      .forEach((tab) => tab.classList.remove("active"));
    document
      .querySelectorAll(".image-tab-content")
      .forEach((content) => content.classList.remove("active"));
    const urlTab = document.querySelector('.image-tab[data-tab="url"]');
    const urlTabContent = document.getElementById("url-tab");
    if (urlTab && urlTabContent) {
      urlTab.classList.add("active");
      urlTabContent.classList.add("active");
    }

    if (product) {
      // Edit mode
      console.log("Opening modal for editing product:", product);
      modalTitle.textContent = "تعديل المنتج";
      productIdInput.value = product.id;

      // Fill form with product data
      productNameInput.value = product.name;
      productDescriptionInput.value = product.description;
      productPriceInput.value = product.price;
      productCategorySelect.value = product.category;
      productRatingInput.value = product.rating || "";

      // Determine if image is a data URL (uploaded image) or URL
      if (product.image) {
        productImageFinal.value = product.image;

        // Check if it's a data URL
        if (product.image.startsWith("data:image/")) {
          // Switch to upload tab
          document
            .querySelectorAll(".image-tab")
            .forEach((tab) => tab.classList.remove("active"));
          document
            .querySelectorAll(".image-tab-content")
            .forEach((content) => content.classList.remove("active"));

          const uploadTab = document.querySelector(
            '.image-tab[data-tab="upload"]'
          );
          const uploadTabContent = document.getElementById("upload-tab");
          if (uploadTab && uploadTabContent) {
            uploadTab.classList.add("active");
            uploadTabContent.classList.add("active");
          }

          // Update file upload status
          if (fileUploadWrapper) {
            fileUploadWrapper.classList.add("has-file");
            const statusText = fileUploadWrapper.querySelector("p");
            if (statusText) {
              statusText.textContent = "تم تحميل الصورة بنجاح";
            }
          }
        } else {
          // Regular URL
          productImageInput.value = product.image;
        }

        // Show preview of the image
        previewImg.src = product.image;
        previewImg.style.display = "block";
        noPreviewDiv.style.display = "none";
      }
    } else {
      // Add mode
      console.log("Opening modal for adding new product");
      modalTitle.textContent = "إضافة منتج جديد";
      productIdInput.value = "";
      productImageFinal.value = "";
    }

    // Show modal
    productModal.style.display = "flex";
    setTimeout(() => {
      productModal.classList.add("show");
    }, 10);
  }

  // Function to validate image URL
  function isValidImageUrl(url) {
    if (!url) return false;

    // If it's a data URL (uploaded image)
    if (url.startsWith("data:image/")) {
      return true;
    }

    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".tiff",
    ];
    const lowerUrl = url.toLowerCase();

    // Check if URL ends with a valid image extension or contains common image hosting domains
    const hasValidExtension = imageExtensions.some((ext) =>
      lowerUrl.endsWith(ext)
    );
    const hasImageHost =
      lowerUrl.includes("unsplash.com") ||
      lowerUrl.includes("imgur.com") ||
      lowerUrl.includes("cloudinary.com") ||
      lowerUrl.includes("pexels.com") ||
      lowerUrl.includes("images.") ||
      lowerUrl.includes("img.") ||
      lowerUrl.includes("photos.") ||
      lowerUrl.includes("picsum.photos") ||
      lowerUrl.includes("image") ||
      lowerUrl.includes("storage.googleapis.com") ||
      lowerUrl.includes("blob.core.windows.net") ||
      lowerUrl.includes("s3.amazonaws.com");

    // Allow URLs with query parameters that might contain image info
    const hasImageQuery =
      lowerUrl.includes("?") &&
      (lowerUrl.includes("format=") ||
        lowerUrl.includes("type=image") ||
        lowerUrl.includes("image") ||
        lowerUrl.includes("width=") ||
        lowerUrl.includes("height="));

    return hasValidExtension || hasImageHost || hasImageQuery;
  }

  // Functions - Product Form Submission
  async function handleProductSubmit(e) {
    e.preventDefault();
    console.log("Product form submitted");

    // Get form fields
    const productId = document.getElementById("product-id").value;
    const productName = document.getElementById("product-name").value.trim();
    const productCategory = document.getElementById("product-category").value;
    const productDescription = document
      .getElementById("product-description")
      .value.trim();
    const productPriceInput = document.getElementById("product-price");
    const productPrice = parseFloat(productPriceInput.value);
    const productRatingInput = document.getElementById("product-rating");
    const productRating = productRatingInput.value
      ? parseFloat(productRatingInput.value)
      : null;
    const productImageFinal = document.getElementById("product-image-final");
    const productImage = productImageFinal.value.trim();

    // Log the form data
    console.log("Form data:", {
      id: productId || "New product",
      name: productName,
      category: productCategory,
      price: productPrice,
      rating: productRating,
      imageLength: productImage ? productImage.length : 0,
    });

    // Validate required fields
    if (
      !productName ||
      !productDescription ||
      !productImage ||
      isNaN(productPrice)
    ) {
      console.error("Form validation failed: Missing required fields");
      showNotification("يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح", "error");
      return;
    }

    // Validate positive price
    if (productPrice <= 0) {
      console.error("Price validation failed: Price must be positive");
      showNotification("يجب أن يكون سعر المنتج أكبر من صفر", "error");
      return;
    }

    // Validate rating range
    if (productRating !== null && (productRating < 0 || productRating > 5)) {
      console.error("Rating validation failed: Rating must be between 0 and 5");
      showNotification("يجب أن يكون التقييم بين 0 و 5", "error");
      return;
    }

    // Generate a new ID if this is a new product
    const finalProductId = productId || generateUniqueId();
    console.log("Using product ID:", finalProductId);

    // Prepare product object
    const product = {
      id: finalProductId,
      name: productName,
      category: productCategory,
      description: productDescription,
      price: productPrice,
      rating: productRating,
      image: productImage,
    };

    try {
      // Create API service instance
      const apiService = new ApiService();

      if (productId) {
        // Update existing product via API
        try {
          await apiService.updateProduct(productId, product);
          console.log("Product updated via API successfully");
        } catch (error) {
          console.error("Error updating product via API:", error);
          showNotification(
            "حدث خطأ أثناء تحديث المنتج على الخادم، سيتم الاحتفاظ بالتغييرات محليًا فقط",
            "warning"
          );
        }

        // Update local array
        const index = products.findIndex((p) => p.id === productId);
        if (index !== -1) {
          products[index] = product;
          console.log("Updated product at index", index);
        } else {
          console.warn("Product ID not found, adding as new product");
          products.push(product);
        }
      } else {
        // Add new product via API
        try {
          const result = await apiService.createProduct(product);
          if (result.success && result.data && result.data.id) {
            // Update with the ID from the server
            product.id = result.data.id;
            console.log("New product created via API with ID:", result.data.id);
          }
        } catch (error) {
          console.error("Error creating product via API:", error);
          showNotification(
            "حدث خطأ أثناء إنشاء المنتج على الخادم، سيتم الاحتفاظ بالتغييرات محليًا فقط",
            "warning"
          );
        }

        // Add to local array
        products.push(product);
        console.log("Added new product with ID:", product.id);
      }

      // Save products to localStorage as backup
      localStorage.setItem("menuItems", JSON.stringify(products));
      console.log("Products saved to localStorage successfully");

      // Visual feedback for success
      const saveButton = document.getElementById("save-product");
      saveButton.classList.add("saved");
      setTimeout(() => {
        saveButton.classList.remove("saved");
      }, 1500);

      // Close modal
      closeAllModals();

      // Re-render products list
      renderProducts();

      // Update stats
      updateStats();

      // Dispatch custom event for real-time updates
      const productChangeEvent = new CustomEvent(
        "digital_menu_product_change",
        {
          detail: { action: "update", timestamp: Date.now() },
        }
      );
      window.dispatchEvent(productChangeEvent);

      // Trigger the 'storage' event for other pages to update immediately
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "menuItems",
          newValue: JSON.stringify(products),
        })
      );

      // Show notification
      showNotification(
        productId ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح",
        "success"
      );
    } catch (error) {
      console.error("Error saving product:", error);
      showNotification("حدث خطأ أثناء حفظ المنتج: " + error.message, "error");
    }
  }

  async function deleteProduct(productId) {
    // Show confirmation dialog
    if (
      !confirm(
        "هل أنت متأكد من رغبتك في حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه."
      )
    ) {
      return;
    }

    try {
      // Try to delete from API first
      const apiService = new ApiService();
      await apiService.deleteProduct(productId);
      console.log(`Product ${productId} deleted from API successfully`);
    } catch (error) {
      console.error(`Error deleting product ${productId} from API:`, error);
      showNotification(
        `حدث خطأ أثناء محاولة حذف المنتج: ${error.message}`,
        "error"
      );
      // Continue with local deletion even if API call fails
    }

    // Remove from local array
    products = products.filter((product) => product.id !== productId);

    // Save updated products list
    await saveProducts();

    // Show success notification
    showNotification("تم حذف المنتج بنجاح", "success");
  }

  async function saveProducts() {
    try {
      console.log("Saving products:", products);

      // Save to API using ApiService
      const apiService = new ApiService();

      // First, delete all existing products and then recreate them
      // This is a simple approach - a more sophisticated one would track changes
      for (const product of products) {
        try {
          if (product.id) {
            // Try to update if product exists
            await apiService.updateProduct(product.id, product);
          } else {
            // Create new product if it doesn't have an ID
            const result = await apiService.createProduct(product);
            // Update local object with the ID from server
            if (result.success && result.data && result.data.id) {
              product.id = result.data.id;
            }
          }
        } catch (error) {
          console.warn(
            `Error saving product ${product.id || "new"} to API:`,
            error
          );
          // Continue with other products even if one fails
        }
      }

      // Save to localStorage as backup and for offline usage
      localStorage.setItem("menuItems", JSON.stringify(products));
      console.log("Products saved successfully");

      // Update UI
      renderProducts();

      // Update stats
      updateStats();

      // Dispatch custom event for real-time updates
      const productChangeEvent = new CustomEvent(
        "digital_menu_product_change",
        {
          detail: { action: "update", timestamp: Date.now() },
        }
      );
      window.dispatchEvent(productChangeEvent);
      console.log("Product change event dispatched");

      // Trigger the 'storage' event for other pages to update immediately
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "menuItems",
          newValue: JSON.stringify(products),
        })
      );
      console.log("Storage event dispatched");

      return true;
    } catch (error) {
      console.error("Error saving products:", error);
      showNotification("حدث خطأ أثناء حفظ المنتجات: " + error.message, "error");
      return false;
    }
  }

  // Functions - Tax Settings
  function saveTaxSettings() {
    // Get settings from form
    const taxRate = parseFloat(taxRateInput.value);
    const taxEnabled = taxEnabledToggle.checked;

    // Get service tax settings
    const serviceTaxRateInput = document.getElementById("service-tax-rate");
    const serviceTaxEnabledToggle = document.getElementById(
      "service-tax-enabled"
    );
    const serviceTaxRate = serviceTaxRateInput
      ? parseFloat(serviceTaxRateInput.value)
      : 10;
    const serviceTaxEnabled = serviceTaxEnabledToggle
      ? serviceTaxEnabledToggle.checked
      : false;

    // Validate tax rate
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      showNotification("يرجى إدخال نسبة ضريبة صالحة بين 0 و 100", "error");
      return;
    }

    // Validate service tax rate
    if (isNaN(serviceTaxRate) || serviceTaxRate < 0 || serviceTaxRate > 100) {
      showNotification("يرجى إدخال نسبة ضريبة خدمة صالحة بين 0 و 100", "error");
      return;
    }

    // Update tax settings
    taxSettings = {
      rate: taxRate,
      enabled: taxEnabled,
      serviceRate: serviceTaxRate,
      serviceEnabled: serviceTaxEnabled,
    };

    // Save to localStorage
    localStorage.setItem("taxSettings", JSON.stringify(taxSettings));

    // Show success notification
    showNotification("تم حفظ إعدادات الضريبة بنجاح", "success");

    // Animate button to show success
    const saveButton = document.getElementById("save-tax-settings");
    saveButton.classList.add("saved");

    // Remove animation after a delay
    setTimeout(() => {
      saveButton.classList.remove("saved");
    }, 2000);
  }

  // Functions - Orders Management
  function createOrdersReport() {
    if (orders.length === 0) {
      showNotification("لا توجد طلبات لإنشاء تقرير");
      return;
    }

    // Simple orders report
    let report = "تقرير الطلبات\n\n";

    // Sort by date (newest first)
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedOrders.forEach((order, index) => {
      const orderDate = new Date(order.date);
      report += `طلب #${index + 1} (${formatDate(orderDate)})\n`;
      report += `رقم الطلب: ${order.id}\n`;
      report += "المنتجات:\n";

      order.items.forEach((item) => {
        report += `- ${item.name} × ${item.quantity} = ${(
          item.price * item.quantity
        ).toFixed(2)} جنية\n`;
      });

      report += `المجموع الفرعي: ${order.subtotal.toFixed(2)} جنية\n`;
      report += `الضريبة: ${order.tax.toFixed(2)} جنية\n`;
      report += `المجموع النهائي: ${order.total.toFixed(2)} جنية\n\n`;
    });

    // Create a Blob with the report content
    const blob = new Blob([report], { type: "text/plain" });

    // Create a download link
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `orders_report_${
      new Date().toISOString().split("T")[0]
    }.txt`;

    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  // Functions - Modals
  function closeAllModals() {
    // Close product modal
    productModal.classList.remove("show");
    setTimeout(() => {
      productModal.style.display = "none";

      // Reset form
      productForm.reset();
      productForm.removeAttribute("data-id");

      // Reset image preview
      const previewImg = document.getElementById("preview-img");
      const noPreviewDiv = document.getElementById("no-preview");
      if (previewImg && noPreviewDiv) {
        previewImg.style.display = "none";
        noPreviewDiv.style.display = "flex";
      }

      // Reset hidden image field
      const productImageFinal = document.getElementById("product-image-final");
      if (productImageFinal) {
        productImageFinal.value = "";
      }

      // Reset file upload status
      const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
      if (fileUploadWrapper) {
        fileUploadWrapper.classList.remove("has-file", "error");
        const statusText = fileUploadWrapper.querySelector("p");
        if (statusText) {
          statusText.textContent = "اضغط لاختيار صورة أو اسحب وأفلت الصورة هنا";
        }
      }

      // Reset tabs - select URL tab by default
      document
        .querySelectorAll(".image-tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".image-tab-content")
        .forEach((content) => content.classList.remove("active"));
      const urlTab = document.querySelector('.image-tab[data-tab="url"]');
      const urlTabContent = document.getElementById("url-tab");
      if (urlTab && urlTabContent) {
        urlTab.classList.add("active");
        urlTabContent.classList.add("active");
      }
    }, 300);

    // Close voucher modal with forced reset
    const modal = document.getElementById("voucher-modal");
    if (modal) {
      modal.classList.remove("show");
      modal.style.cssText = "display: none; opacity: 0;";

      // Reset form
      const form = document.getElementById("voucher-form");
      if (form) {
        form.reset();
        form.removeAttribute("data-id");
      }
    }
  }

  // Utility Functions
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function getCategoryName(category) {
    const categories = {
      pizza: "بيتزا",
      burger: "برجر",
      sandwich: "سندوتش",
      drink: "مشروبات",
    };

    return categories[category] || category;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG");
  }

  function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  }

  function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.classList.add("notification");

    // Add type class
    if (type) {
      notification.classList.add(type);
    }

    notification.textContent = message;

    // Add notification to body
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Remove notification after a delay
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Close modals when clicking outside
  window.addEventListener("click", function (e) {
    if (e.target === productModal) {
      productModal.style.display = "none";
    }
  });

  // Add export orders button
  const dashboardSection = document.getElementById("dashboard-section");
  if (dashboardSection) {
    const exportButton = document.createElement("button");
    exportButton.className = "export-button";
    exportButton.innerHTML =
      '<i class="fas fa-file-export"></i> تصدير تقرير الطلبات';
    exportButton.addEventListener("click", createOrdersReport);

    dashboardSection.appendChild(exportButton);
  }

  // Update tax rate input to handle decimal values properly
  taxRateInput.addEventListener("input", function () {
    // Ensure we can handle decimal values like 0.5%
    const value = parseFloat(this.value);
    if (!isNaN(value) && value >= 0) {
      // Allow decimal values
      this.setCustomValidity("");
    } else {
      this.setCustomValidity("Please enter a valid tax rate");
    }
  });

  // Setup modals
  if (productModal) {
    productModal
      .querySelector(".close-modal")
      ?.addEventListener("click", () => closeAllModals());
    productModal
      .querySelector(".close-button")
      ?.addEventListener("click", () => closeAllModals());

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === productModal) {
        closeAllModals();
      }
    });
  }

  // Functions - Voucher Management
  function saveVouchers() {
    localStorage.setItem("vouchers", JSON.stringify(vouchers));
    renderVouchers();
  }

  function renderVouchers() {
    // Clear the list
    vouchersList.innerHTML = "";

    if (vouchers.length === 0) {
      // No vouchers message
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-message";
      emptyMessage.innerHTML = `
                <i class="fas fa-ticket-alt"></i>
                <p>لا توجد قسائم حالياً. قم بإضافة قسائم جديدة.</p>
            `;
      vouchersList.appendChild(emptyMessage);
    } else {
      // Create voucher cards
      vouchers.forEach((voucher) => {
        const voucherCard = document.createElement("div");
        voucherCard.className = "voucher-card";

        // Check if voucher is expired
        const isExpired = new Date(voucher.expiryDate) < new Date();
        if (isExpired) {
          voucherCard.classList.add("expired");
        }

        // Get category name if specified
        let categoryDisplay = "";
        if (voucher.category && voucher.category !== "all") {
          categoryDisplay = `<div class="voucher-category">
                        <i class="fas fa-tag"></i>
                        ${getCategoryName(voucher.category)}
                    </div>`;
        }

        // Get minimum order if specified
        let minOrderDisplay = "";
        if (voucher.minOrder && voucher.minOrder > 0) {
          minOrderDisplay = `<div class="min-order">
                        <i class="fas fa-cart-plus"></i>
                        الحد الأدنى: ${voucher.minOrder} جنية
                    </div>`;
        }

        voucherCard.innerHTML = `
                    <div class="voucher-header">
                        <h3 class="voucher-name">${voucher.code}</h3>
                        <div class="voucher-discount">${voucher.discount}%</div>
                    </div>
                    <div class="voucher-details">
                        <div class="voucher-detail">
                            <i class="fas fa-percent"></i>
                            <span>${voucher.discount}% خصم</span>
                        </div>
                        <div class="voucher-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>تاريخ الانتهاء: ${formatDate(
                              voucher.expiryDate
                            )}</span>
                        </div>
                        ${categoryDisplay}
                        ${minOrderDisplay}
                        
                        <div class="expiry-status ${
                          isExpired ? "expired" : "active"
                        }">
                            ${
                              isExpired
                                ? '<i class="fas fa-times-circle"></i> منتهية الصلاحية'
                                : '<i class="fas fa-check-circle"></i> سارية المفعول'
                            }
                        </div>
                        
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="edit-button edit-btn" data-id="${
                              voucher.id
                            }">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-button delete-btn" data-id="${
                              voucher.id
                            }">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;

        vouchersList.appendChild(voucherCard);

        // Attach event listeners to action buttons
        voucherCard.querySelector(".edit-btn").addEventListener("click", () => {
          openVoucherModal(voucher);
        });

        voucherCard
          .querySelector(".delete-btn")
          .addEventListener("click", () => {
            deleteVoucher(voucher.id);
          });
      });
    }
  }

  function openVoucherModal(voucher = null) {
    console.log("openVoucherModal called", voucher);

    const modalTitle = document.getElementById("voucher-modal-title");
    const voucherCode = document.getElementById("voucher-code");
    const voucherDiscount = document.getElementById("voucher-discount");
    const voucherMinOrder = document.getElementById("voucher-min-order");
    const voucherCategory = document.getElementById("voucher-category");
    const voucherExpiry = document.getElementById("voucher-expiry");
    const generateCodeBtn = document.getElementById("generate-code-btn");

    console.log("Modal elements:", {
      modalTitle,
      voucherCode,
      voucherDiscount,
      voucherExpiry,
      voucherModal: voucherModal,
    });

    // Add event listener for the generate code button
    generateCodeBtn.addEventListener("click", function () {
      voucherCode.value = generateVoucherCode();
    });

    if (voucher) {
      // Edit existing voucher
      modalTitle.textContent = "تعديل القسيمة";
      voucherForm.dataset.id = voucher.id;
      voucherCode.value = voucher.code;
      voucherDiscount.value = voucher.discount;
      voucherMinOrder.value = voucher.minOrder || 0;
      voucherCategory.value = voucher.category || "all";
      voucherExpiry.value = formatDateForInput(voucher.expiryDate);
    } else {
      // Create new voucher
      modalTitle.textContent = "إضافة قسيمة جديدة";
      voucherForm.removeAttribute("data-id");
      voucherCode.value = generateVoucherCode();
      voucherDiscount.value = "10";
      voucherMinOrder.value = "0";
      voucherCategory.value = "all";

      // Set default expiry date to 30 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      voucherExpiry.value = formatDateForInput(defaultDate);
    }

    console.log("About to show modal");
    voucherModal.style.display = "flex";
    setTimeout(() => {
      console.log("Adding show class");
      voucherModal.classList.add("show");
      voucherCode.focus();
    }, 10);
  }

  function handleVoucherSubmit(e) {
    e.preventDefault();

    // Get form fields
    const voucherId = document.getElementById("voucher-id")?.value;
    const voucherCode = document
      .getElementById("voucher-code")
      .value.trim()
      .toUpperCase();
    const voucherDiscount = parseInt(
      document.getElementById("voucher-discount").value
    );
    const voucherMinOrder =
      parseFloat(document.getElementById("voucher-min-order").value) || 0;
    const voucherCategory = document.getElementById("voucher-category").value;
    const voucherExpiry = document.getElementById("voucher-expiry").value;

    // Validate required fields
    if (!voucherCode || isNaN(voucherDiscount) || !voucherExpiry) {
      showNotification("يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح", "error");
      return;
    }

    // Validate code format (only allow letters and numbers)
    if (!/^[A-Z0-9]+$/.test(voucherCode)) {
      showNotification("يجب أن يحتوي كود القسيمة على أحرف وأرقام فقط", "error");
      return;
    }

    // Validate discount range
    if (voucherDiscount < 1 || voucherDiscount > 100) {
      showNotification("يجب أن تكون نسبة الخصم بين 1% و 100%", "error");
      return;
    }

    // Validate expiry date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day
    const expiryDate = new Date(voucherExpiry);

    if (expiryDate < currentDate) {
      showNotification(
        "يجب أن يكون تاريخ انتهاء الصلاحية في المستقبل",
        "error"
      );
      return;
    }

    // Check if code already exists (for new vouchers)
    if (!voucherId) {
      const existingVoucher = vouchers.find((v) => v.code === voucherCode);
      if (existingVoucher) {
        showNotification(
          "كود القسيمة موجود بالفعل. يرجى اختيار كود آخر",
          "error"
        );
        return;
      }
    }

    // Create voucher object
    const voucher = {
      id: voucherId || generateUniqueId(),
      code: voucherCode,
      discount: voucherDiscount,
      minOrderAmount: voucherMinOrder,
      category: voucherCategory,
      expiryDate: voucherExpiry,
      dateCreated: new Date().toISOString(),
    };

    // Add or update voucher
    if (voucherId) {
      // Update existing voucher
      const index = vouchers.findIndex((v) => v.id === voucherId);
      if (index !== -1) {
        // Preserve original creation date
        voucher.dateCreated = vouchers[index].dateCreated;
        vouchers[index] = voucher;
      }
    } else {
      // Add new voucher
      vouchers.push(voucher);
    }

    // Save vouchers
    saveVouchers();

    // Close modal
    closeAllModals();

    // Re-render vouchers
    renderVouchers();

    // Update stats
    updateStats();

    // Show notification
    showNotification(
      voucherId ? "تم تحديث القسيمة بنجاح" : "تم إضافة القسيمة بنجاح",
      "success"
    );
  }

  function deleteVoucher(voucherId) {
    // Ask for confirmation
    if (!confirm("هل أنت متأكد من حذف هذه القسيمة؟")) {
      return;
    }

    // Find voucher index
    const index = vouchers.findIndex((v) => v.id === voucherId);

    // Remove voucher if found
    if (index !== -1) {
      vouchers.splice(index, 1);

      // Save updated vouchers
      saveVouchers();

      // Re-render vouchers list
      renderVouchers();

      // Update stats
      updateStats();

      // Show notification
      showNotification("تم حذف القسيمة بنجاح", "success");
    }
  }

  // New modal display function
  function showVoucherModalForced() {
    console.log("Using forced voucher modal display");

    // Get the voucher modal and ensure it exists
    const modal = document.getElementById("voucher-modal");
    if (!modal) {
      console.error("Modal not found in DOM!");
      alert("عذراً، حدث خطأ في تحميل الشاشة المنبثقة");
      return;
    }

    // Prepare default values
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const defaultExpiryDate = formatDateForInput(defaultDate);

    // Generate a random code
    const randomCode = generateVoucherCode();

    // Set modal title and form values directly
    document.getElementById("voucher-modal-title").textContent =
      "إضافة قسيمة جديدة";
    document.getElementById("voucher-code").value = randomCode;
    document.getElementById("voucher-discount").value = "10";
    document.getElementById("voucher-min-order").value = "0";
    document.getElementById("voucher-category").value = "all";
    document.getElementById("voucher-expiry").value = defaultExpiryDate;

    // Add event listener for generate code button
    const generateCodeBtn = document.getElementById("generate-code-btn");
    generateCodeBtn.addEventListener("click", function () {
      document.getElementById("voucher-code").value = generateVoucherCode();
    });

    // Show the modal
    voucherForm.removeAttribute("data-id");
    modal.style.display = "flex";
    setTimeout(() => {
      modal.classList.add("show");
      document.getElementById("voucher-code").focus();
    }, 10);
  }

  // Generate a random voucher code
  function generateVoucherCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // removed similar looking characters
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // QR Code Generator Functions
  function initQRCodeGenerator() {
    // DOM elements
    const tableNumberInput = document.getElementById("table-number");
    const createQRBtn = document.getElementById("create-qr-btn");
    const qrPreview = document.getElementById("qr-preview");
    const qrListContainer = document.querySelector(".qr-list-container");

    // Load saved QR codes from local storage
    loadSavedQRCodes();

    // Create QR Code button event listener
    createQRBtn.addEventListener("click", () => {
      const tableNumber = tableNumberInput.value;
      if (!tableNumber || isNaN(tableNumber) || tableNumber < 1) {
        showNotification("الرجاء إدخال رقم طاولة صحيح", "error");
        return;
      }

      // Generate QR code and display in preview
      generateQRCode(tableNumber, qrPreview, true);
    });

    // Event delegation for QR list actions (print, delete)
    qrListContainer.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;

      const qrItem = target.closest(".qr-table-item");
      const tableNumber = qrItem.dataset.table;

      if (target.classList.contains("print-qr")) {
        printQRCode(tableNumber);
      } else if (target.classList.contains("delete-qr")) {
        deleteQRCode(tableNumber, qrItem);
      }
    });
  }

  function generateQRCode(tableNumber, container, isPreview = false) {
    // Clear the container
    container.innerHTML = "";

    // Create URL with table number for the QR code
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/") + 1);
    const menuUrl = baseUrl + `index.html?table=${tableNumber}`;

    // Generate QR code
    const qr = qrcode(0, "M");
    qr.addData(menuUrl);
    qr.make();

    // Create QR code image element
    const qrImg = document.createElement("img");
    qrImg.src = qr.createDataURL();
    qrImg.alt = `QR Code for Table ${tableNumber}`;
    qrImg.classList.add("qr-code-image");

    // Add table info
    const tableInfo = document.createElement("div");
    tableInfo.classList.add("table-info");
    tableInfo.innerHTML = `<i class="fas fa-utensils"></i> طاولة رقم ${tableNumber}`;

    // Append to container
    container.appendChild(qrImg);
    container.appendChild(tableInfo);

    // If generating the preview, add a save button
    if (isPreview) {
      const saveBtn = document.createElement("button");
      saveBtn.classList.add("generate-qr-button");
      saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ رمز QR';
      saveBtn.style.marginTop = "15px";

      saveBtn.addEventListener("click", () => {
        saveQRCode(tableNumber, qrImg.src);
      });

      container.appendChild(saveBtn);
    }
  }

  function saveQRCode(tableNumber, qrImageSrc) {
    // Get saved QR codes from localStorage or initialize empty array
    let savedQRCodes = JSON.parse(localStorage.getItem("qrCodes")) || [];

    // Check if QR code for this table already exists
    const existingIndex = savedQRCodes.findIndex(
      (qr) => qr.tableNumber === tableNumber
    );

    if (existingIndex !== -1) {
      // Update existing QR code
      savedQRCodes[existingIndex] = { tableNumber, qrImageSrc };
      showNotification(`تم تحديث رمز QR للطاولة رقم ${tableNumber}`, "success");
    } else {
      // Add new QR code
      savedQRCodes.push({ tableNumber, qrImageSrc });
      showNotification(`تم حفظ رمز QR للطاولة رقم ${tableNumber}`, "success");
    }

    // Save to localStorage
    localStorage.setItem("qrCodes", JSON.stringify(savedQRCodes));

    // Reload the QR codes list
    loadSavedQRCodes();
  }

  function loadSavedQRCodes() {
    const qrListContainer = document.querySelector(".qr-list-container");
    qrListContainer.innerHTML = "";

    // Get saved QR codes from localStorage
    const savedQRCodes = JSON.parse(localStorage.getItem("qrCodes")) || [];

    // Sort by table number
    savedQRCodes.sort(
      (a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber)
    );

    if (savedQRCodes.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.classList.add("empty-list-message");
      emptyMessage.innerHTML =
        '<i class="fas fa-info-circle"></i> لم يتم إنشاء أي رموز QR بعد';
      qrListContainer.appendChild(emptyMessage);
      return;
    }

    // Create and append QR code items
    savedQRCodes.forEach((qr) => {
      const qrItem = createQRCodeItem(qr.tableNumber, qr.qrImageSrc);
      qrListContainer.appendChild(qrItem);
    });
  }

  function createQRCodeItem(tableNumber, qrImageSrc) {
    const qrItem = document.createElement("div");
    qrItem.classList.add("qr-table-item");
    qrItem.dataset.table = tableNumber;

    qrItem.innerHTML = `
            <div class="qr-code">
                <img src="${qrImageSrc}" alt="QR Code for Table ${tableNumber}">
            </div>
            <div class="qr-table-footer">
                <span class="table-number">طاولة ${tableNumber}</span>
                <div class="qr-actions">
                    <button class="print-qr" title="طباعة"><i class="fas fa-print"></i></button>
                    <button class="delete-qr" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

    return qrItem;
  }

  function printQRCode(tableNumber) {
    // Get saved QR codes from localStorage
    const savedQRCodes = JSON.parse(localStorage.getItem("qrCodes")) || [];
    const qrCode = savedQRCodes.find((qr) => qr.tableNumber === tableNumber);

    if (!qrCode) {
      showNotification("لم يتم العثور على رمز QR للطاولة المحددة", "error");
      return;
    }

    // Create print window
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <html>
            <head>
                <title>طباعة رمز QR للطاولة ${tableNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                    
                    body {
                        font-family: 'Cairo', Arial, sans-serif;
                        text-align: center;
                        direction: rtl;
                        margin: 0;
                        padding: 0;
                        background-color: #f8f9fa;
                    }
                    
                    .qr-container {
                        max-width: 400px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: white;
                        border-radius: 15px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        margin-top: 30px;
                    }
                    
                    .restaurant-name {
                        font-size: 28px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #42d158;
                    }
                    
                    .table-number {
                        font-size: 22px;
                        margin-bottom: 20px;
                        background-color: #42d158;
                        color: white;
                        padding: 8px 15px;
                        border-radius: 30px;
                        display: inline-block;
                    }
                    
                    .qr-image {
                        max-width: 100%;
                        height: auto;
                        border: 10px solid white;
                        border-radius: 10px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        margin-bottom: 20px;
                    }
                    
                    .instructions {
                        margin-top: 20px;
                        font-size: 18px;
                        color: #666;
                        line-height: 1.5;
                    }
                    
                    .footer {
                        margin-top: 30px;
                        font-size: 14px;
                        color: #999;
                    }
                    @media print {
                        @page {
                            size: 100mm 150mm;
                            margin: 0;
                        }
                        body {
                            margin: 0.5cm;
                        }
                        .print-button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div class="restaurant-name">المطعم الرقمي</div>
                    <div class="table-number">طاولة رقم ${tableNumber}</div>
                    <img class="qr-image" src="${qrCode.qrImageSrc}" alt="QR Code for Table ${tableNumber}">
                    <div class="instructions">امسح الرمز باستخدام كاميرا هاتفك لعرض القائمة</div>
                    <div class="footer">شكراً لاختياركم مطعمنا</div>
                    <button class="print-button" onclick="window.print(); setTimeout(function(){ window.close(); }, 500);">طباعة</button>
                </div>
                <script>
                    // Auto print when loaded
                    window.onload = function() {
                        setTimeout(function() {
                            document.querySelector('.print-button').click();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
    printWindow.document.close();
  }

  function deleteQRCode(tableNumber, qrItem) {
    if (confirm(`هل أنت متأكد من حذف رمز QR للطاولة رقم ${tableNumber}؟`)) {
      // Get saved QR codes from localStorage
      let savedQRCodes = JSON.parse(localStorage.getItem("qrCodes")) || [];

      // Filter out the one to delete
      savedQRCodes = savedQRCodes.filter(
        (qr) => qr.tableNumber !== tableNumber
      );

      // Save back to localStorage
      localStorage.setItem("qrCodes", JSON.stringify(savedQRCodes));

      // Remove from DOM
      qrItem.remove();

      // Update empty state if needed
      if (savedQRCodes.length === 0) {
        loadSavedQRCodes();
      }

      showNotification(`تم حذف رمز QR للطاولة رقم ${tableNumber}`, "success");
    }
  }

  // Global Discount Functions
  function applyGlobalDiscount() {
    // Get the discount percentage
    const discountInput = document.getElementById("global-discount-percentage");
    const discountPercentage = parseFloat(discountInput.value);

    // Validate the discount percentage
    if (
      isNaN(discountPercentage) ||
      discountPercentage < 0 ||
      discountPercentage > 90
    ) {
      showNotification("يرجى إدخال نسبة خصم صالحة بين 0 و 90%", "error");
      return;
    }

    if (discountPercentage === 0) {
      showNotification("يرجى إدخال نسبة خصم أكبر من 0%", "error");
      return;
    }

    // Confirm with the user before applying the discount
    if (
      !confirm(
        `هل أنت متأكد من تطبيق خصم ${discountPercentage}% على جميع المنتجات؟`
      )
    ) {
      return;
    }

    // Store original prices if not already stored
    if (!localStorage.getItem("original_prices")) {
      // Create a mapping of product IDs to original prices
      const originalPrices = {};
      products.forEach((product) => {
        originalPrices[product.id] = product.price;
      });

      // Store the original prices
      localStorage.setItem("original_prices", JSON.stringify(originalPrices));
    }

    // Apply the discount to the products
    const originalPrices = JSON.parse(localStorage.getItem("original_prices"));

    products.forEach((product) => {
      // Get the original price
      const originalPrice = originalPrices[product.id];

      // Calculate the discounted price
      const discountFactor = 1 - discountPercentage / 100;
      product.price = Math.round(originalPrice * discountFactor * 100) / 100;
    });

    // Save the updated products
    saveProducts();

    // Show notification
    showNotification(
      `تم تطبيق خصم ${discountPercentage}% على جميع المنتجات`,
      "success"
    );

    // Update the UI
    renderProducts();

    // Update the discount container UI
    const discountContainer = document.querySelector(
      ".global-discount-container"
    );
    if (discountContainer) {
      discountContainer.classList.add("discount-active");
    }

    // Dispatch custom event for automatic refresh across all pages
    dispatchDiscountChangeEvent();
  }

  function resetGlobalDiscount() {
    // Check if original prices exist
    if (!localStorage.getItem("original_prices")) {
      showNotification("لا يوجد خصم مطبق حالياً", "warning");
      return;
    }

    // Confirm with the user before resetting the prices
    if (!confirm("هل أنت متأكد من إلغاء الخصم العام وإعادة الأسعار الأصلية؟")) {
      return;
    }

    // Get original prices
    const originalPrices = JSON.parse(localStorage.getItem("original_prices"));

    // Restore original prices
    products.forEach((product) => {
      if (originalPrices[product.id]) {
        product.price = originalPrices[product.id];
      }
    });

    // Save updated products
    saveProducts();

    // Remove original prices from storage
    localStorage.removeItem("original_prices");

    // Show notification
    showNotification("تم إلغاء الخصم وإعادة الأسعار الأصلية", "success");

    // Update the UI
    renderProducts();

    // Update the discount container UI
    const discountContainer = document.querySelector(
      ".global-discount-container"
    );
    if (discountContainer) {
      discountContainer.classList.remove("discount-active");
    }

    // Dispatch custom event for automatic refresh across all pages
    dispatchDiscountChangeEvent();
  }

  // Helper function to dispatch discount change event
  function dispatchDiscountChangeEvent() {
    // Create and dispatch a custom event
    const discountChangeEvent = new CustomEvent("digital_menu_discount_change");
    window.dispatchEvent(discountChangeEvent);

    // Also broadcast through localStorage for cross-tab communication
    // Using a timestamp ensures the event is unique each time
    localStorage.setItem("discount_change_event", Date.now().toString());
    localStorage.removeItem("discount_change_event");
  }

  // Force synchronization between admin and client pages
  function forceSyncProducts() {
    console.log(
      "Forcing synchronization of products between admin and client pages"
    );

    // Save current products to localStorage again to ensure they're up to date
    localStorage.setItem("menuItems", JSON.stringify(products));

    // Dispatch events to notify all pages
    window.dispatchEvent(
      new CustomEvent("digital_menu_product_change", {
        detail: { action: "sync", timestamp: Date.now() },
      })
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "menuItems",
        newValue: JSON.stringify(products),
      })
    );

    showNotification("تم مزامنة المنتجات بنجاح", "success");

    return true;
  }

  // Add button to force sync products
  document.addEventListener("DOMContentLoaded", function () {
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      const sectionHeader = productsSection.querySelector(".section-header");
      if (sectionHeader) {
        const syncButton = document.createElement("button");
        syncButton.className = "add-button sync-button";
        syncButton.innerHTML = '<i class="fas fa-sync"></i> مزامنة المنتجات';
        syncButton.addEventListener("click", forceSyncProducts);
        syncButton.style.marginRight = "10px";
        syncButton.style.backgroundColor = "#4a6fa1";

        // Insert before the add product button
        const addButton = sectionHeader.querySelector(".add-button");
        if (addButton) {
          sectionHeader.insertBefore(syncButton, addButton);
        } else {
          sectionHeader.appendChild(syncButton);
        }
      }
    }
  });

  // Function to reset products to default values
  async function resetProductsToDefault() {
    if (
      confirm(
        "هل أنت متأكد من إعادة تعيين جميع المنتجات للافتراضية؟ سيتم استبدال المنتجات الحالية."
      )
    ) {
      console.log("Resetting products to default values");

      // Show loading spinner in the products list
      productsList.innerHTML = `
        <div class="loading-spinner" id="products-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>جاري إعادة تعيين المنتجات...</p>
        </div>
      `;

      try {
        // First delete all existing products from the API
        const apiService = new ApiService();

        // Get current products
        const result = await apiService.getProducts();
        if (result.success && result.data && result.data.length > 0) {
          // Delete each product
          for (const product of result.data) {
            try {
              await apiService.deleteProduct(product.id);
              console.log(`Deleted product ${product.id} from API`);
            } catch (error) {
              console.warn(`Error deleting product ${product.id}:`, error);
              // Continue with other products
            }
          }
        }

        // Create default products via API
        await apiService.createDefaultProducts();
        console.log("Created default products via API");

        // Reload products from API
        await loadProducts();

        // Clear any discounts
        localStorage.removeItem("original_prices");

        // Show notification
        showNotification("تم إعادة تعيين المنتجات للافتراضية بنجاح", "success");
      } catch (error) {
        console.error("Error resetting products via API:", error);

        // Fallback to local reset if API fails
        showNotification(
          "حدث خطأ أثناء إعادة التعيين عبر الخادم، سيتم الإعادة محليًا",
          "warning"
        );

        // Set default products locally
        products = [
          {
            id: "pizza1",
            name: "بيتزا بيروني غنائي",
            description:
              "بيتزا بيروني مع الجبن الموزاريلا وصلصة الطماطم، بيتزا ايطالية اصلية",
            price: 140.0,
            category: "pizza",
            image:
              "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80",
            rating: 4.8,
          },
          {
            id: "pizza2",
            name: "بيتزا بيروني غنائي",
            description:
              "بيتزا بيروني مع الجبن الموزاريلا وصلصة الطماطم، بيتزا ايطالية اصلية",
            price: 140.0,
            category: "pizza",
            image:
              "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
            rating: 4.8,
          },
          {
            id: "burger1",
            name: "برجر لحم أنغوس",
            description: "برجر لحم بقري أنغوس مع جبنة شيدر وصلصة خاصة",
            price: 120.0,
            category: "burger",
            image:
              "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
            rating: 4.9,
          },
          {
            id: "burger2",
            name: "برجر دجاج مقرمش",
            description: "برجر دجاج مقرمش محمر مع صلصة الثوم والخس",
            price: 95.0,
            category: "burger",
            image:
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
            rating: 4.6,
          },
          {
            id: "sandwich1",
            name: "سندويتش شاورما",
            description: "شاورما دجاج مع صلصة طحينة وخضار منوعة",
            price: 65.0,
            category: "sandwich",
            image:
              "https://images.unsplash.com/photo-1485451456034-3f9391c6f769?auto=format&fit=crop&w=800&q=80",
            rating: 4.7,
          },
          {
            id: "drink1",
            name: "عصير فواكه طازج",
            description: "مزيج من الفواكه الطازجة المنعشة",
            price: 35.0,
            category: "drink",
            image:
              "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
            rating: 4.5,
          },
        ];

        // Save to localStorage
        localStorage.setItem("menuItems", JSON.stringify(products));

        // Re-render products
        renderProducts();

        // Update stats
        updateStats();

        // Dispatch events for cross-tab updates
        window.dispatchEvent(
          new CustomEvent("digital_menu_product_change", {
            detail: { action: "reset", timestamp: Date.now() },
          })
        );

        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "menuItems",
            newValue: JSON.stringify(products),
          })
        );
      }
    }
  }

  // Add button to products section header
  document.addEventListener("DOMContentLoaded", function () {
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      const sectionHeader = productsSection.querySelector(".section-header");
      if (sectionHeader) {
        const resetButton = document.createElement("button");
        resetButton.className = "add-button reset-button";
        resetButton.innerHTML =
          '<i class="fas fa-redo-alt"></i> إعادة تعيين المنتجات';
        resetButton.addEventListener("click", resetProductsToDefault);
        resetButton.style.marginRight = "10px";
        resetButton.style.backgroundColor = "#e74c3c";

        // Insert before other buttons
        sectionHeader.insertBefore(resetButton, sectionHeader.firstChild);
      }
    }
  });

  // Initialize WebSocket connection for real-time updates
  let socket;

  function initWebSocket() {
    // Connect to WebSocket server
    socket = new WebSocket("ws://localhost:5000");

    // Connection opened
    socket.addEventListener("open", (event) => {
      console.log("Connected to WebSocket server");
      showNotification("تم الاتصال بخادم التحديثات المباشرة", "info");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        // Handle different types of messages
        switch (data.type) {
          case "product_created":
            handleProductCreated(data.data.product);
            break;
          case "product_updated":
            handleProductUpdated(data.data.product, data.data.oldData);
            break;
          case "product_deleted":
            handleProductDeleted(data.data.product);
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    // Handle connection close
    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed");

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log("Attempting to reconnect to WebSocket server...");
        initWebSocket();
      }, 5000);
    });

    // Handle connection error
    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }

  // Handle product created event
  function handleProductCreated(product) {
    console.log("New product created:", product);

    // Check if product already exists
    const existingIndex = products.findIndex((p) => p.id === product.id);

    if (existingIndex === -1) {
      // Add the new product to the array
      products.push(product);

      // Update the UI
      renderProducts();

      // Show notification
      showNotification(`تم إضافة منتج جديد: ${product.name}`, "success");

      // Update stats
      updateStats();
    }
  }

  // Handle product updated event
  function handleProductUpdated(product, oldData) {
    console.log("Product updated:", product, "Old data:", oldData);

    // Find the product in the array
    const existingIndex = products.findIndex((p) => p.id === product.id);

    if (existingIndex !== -1) {
      // Update the product
      products[existingIndex] = product;

      // Update the UI
      renderProducts();

      // Show notification
      showNotification(`تم تحديث المنتج: ${product.name}`, "info");

      // Update stats if needed
      updateStats();
    }
  }

  // Handle product deleted event
  function handleProductDeleted(deletedProduct) {
    console.log("Product deleted:", deletedProduct);

    // Remove the product from the array
    products = products.filter((p) => p.id !== deletedProduct.id);

    // Update the UI
    renderProducts();

    // Show notification
    showNotification(`تم حذف المنتج: ${deletedProduct.name}`, "warning");

    // Update stats
    updateStats();
  }

  // Init function - add WebSocket initialization
  document.addEventListener("DOMContentLoaded", function () {
    // ... existing initialization code ...

    // Initialize WebSocket connection for real-time updates
    initWebSocket();

    // ... rest of the initialization code ...
  });
});

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  try {
    console.log("Checking authentication...");

    // Get session from localStorage
    const sessionData = localStorage.getItem("adminSession");
    console.log("Session data found:", !!sessionData);

    if (!sessionData) {
      console.log("No session data found");
      return false;
    }

    const adminSession = JSON.parse(sessionData);
    console.log("Parsed session:", adminSession);

    // Check session properties
    if (!adminSession) {
      console.log("Invalid session object");
      return false;
    }

    if (!adminSession.isLoggedIn) {
      console.log("Session not logged in");
      return false;
    }

    const now = Date.now();
    console.log("Current time:", new Date(now).toLocaleString());
    console.log(
      "Session expires:",
      new Date(adminSession.expiresAt).toLocaleString()
    );
    console.log("Time left (ms):", adminSession.expiresAt - now);

    // Check if session is expired
    if (adminSession.expiresAt <= now) {
      console.log("Session expired");
      return false;
    }

    console.log("Authentication successful");
    return true;
  } catch (error) {
    console.error("Error in authentication check:", error);
    return false;
  }
}
