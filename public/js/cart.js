document.addEventListener("DOMContentLoaded", function () {
  console.log("Cart JS loaded");

  // DOM Elements
  const cartItemsContainer = document.getElementById("cart-items");
  const cartEmptyMessage = document.getElementById("cart-empty");
  const subtotalElement = document.getElementById("subtotal");
  const taxElement = document.getElementById("tax");
  const serviceTaxElement = document.getElementById("service-tax");
  const serviceTaxRow = document.getElementById("service-tax-row");
  const totalElement = document.getElementById("total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const clearCartBtn = document.getElementById("clear-cart");
  const checkoutComplete = document.getElementById("checkout-complete");

  // Voucher elements
  const voucherCodeInput = document.getElementById("voucher-code");
  const applyVoucherBtn = document.getElementById("apply-voucher");
  const voucherMessage = document.getElementById("voucher-message");
  const discountRow = document.getElementById("discount-row");
  const discountAmount = document.getElementById("discount-amount");

  // Table number from URL or session storage
  let tableNumber = getTableNumber();
  if (tableNumber) {
    displayTableIndicator(tableNumber);
  }

  // Verify DOM elements are found
  if (!cartItemsContainer) console.error("Cart items container not found");
  if (!cartEmptyMessage) console.error("Cart empty message not found");
  if (!checkoutComplete) console.error("Checkout complete element not found");

  // Sync theme with main page
  applyThemeFromStorage();

  // Cart data
  let cartItems = [];
  let activeVoucher = null;

  // Initialize cart
  initCart();

  // Event listeners
  clearCartBtn.addEventListener("click", function () {
    // Add feedback animation
    this.classList.add("clicked");
    setTimeout(() => {
      this.classList.remove("clicked");
      clearCart();
    }, 150);
  });

  checkoutBtn.addEventListener("click", checkoutOrder);

  // Voucher event listener
  if (applyVoucherBtn) {
    applyVoucherBtn.addEventListener("click", applyVoucher);

    // Also apply voucher when pressing Enter in the input field
    voucherCodeInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        applyVoucher();
      }
    });
  }

  // Listen for storage changes (tax settings may be updated from admin)
  window.addEventListener("storage", function (e) {
    if (e.key === "taxSettings") {
      // Tax settings have been updated, recalculate totals
      console.log("Tax settings changed, recalculating totals");
      calculateTotals();
    }

    // Refresh when discount status changes
    if (e.key === "original_prices" || e.key === "menuItems") {
      // Reload cart items to get updated prices
      initCart();
    }

    // Handle cross-tab discount change event
    if (e.key === "discount_change_event") {
      initCart();
    }

    // Handle cross-tab cart change event
    if (e.key === "cart_change_event" || e.key === "cartItems") {
      console.log("Cart updated in another tab, refreshing cart");
      initCart();
    }
  });

  // Listen for custom discount change event
  window.addEventListener("digital_menu_discount_change", function () {
    // Reload cart items with new prices
    initCart();
  });

  // Listen for custom cart change event
  window.addEventListener("digital_menu_cart_change", function () {
    console.log("Cart change event received, updating cart");
    initCart();
  });

  // Functions
  function applyThemeFromStorage() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }

    // Listen for theme changes while the cart page is open
    window.addEventListener("storage", function (e) {
      if (e.key === "theme") {
        if (e.newValue === "light") {
          document.body.classList.add("light-mode");
        } else {
          document.body.classList.remove("light-mode");
        }
      }
    });
  }

  function initCart() {
    console.log("Initializing cart");
    // Load cart items from localStorage
    try {
      const savedCart = localStorage.getItem("cartItems");
      console.log("Saved cart:", savedCart);

      if (savedCart) {
        cartItems = JSON.parse(savedCart);
        console.log("Parsed cart items:", cartItems);
        updateCartDisplay();
      } else {
        console.log("No cart items found in localStorage");
        showEmptyCart();
      }

      // Load active voucher from localStorage
      const savedVoucher = localStorage.getItem("activeVoucher");
      if (savedVoucher) {
        activeVoucher = JSON.parse(savedVoucher);
        console.log("Active voucher loaded:", activeVoucher);
        displayAppliedVoucher();
      }

      // Make sure to calculate totals with the latest tax settings
      // This ensures tax settings are applied after a page refresh
      calculateTotals();
    } catch (error) {
      console.error("Error initializing cart:", error);
      showEmptyCart();
    }
  }

  function updateCartDisplay() {
    console.log("Updating cart display");
    // Clear all existing cart items - completely rebuild the display
    clearCartDisplay();

    if (cartItems.length === 0) {
      console.log("Cart is empty, showing empty message");
      showEmptyCart();
      return;
    }

    console.log("Cart has items, rendering items");
    hideEmptyCart();
    renderCartItems();
    calculateTotals();
  }

  function clearCartDisplay() {
    // Remove all child elements except the empty message
    const childElements = Array.from(cartItemsContainer.children);
    childElements.forEach((child) => {
      if (child !== cartEmptyMessage) {
        cartItemsContainer.removeChild(child);
      }
    });
  }

  function renderCartItems() {
    console.log("Rendering cart items:", cartItems);
    // Add cart items
    cartItems.forEach((item, index) => {
      const cartItem = createCartItemElement(item, index);
      // Insert cart item before the empty message
      cartItemsContainer.insertBefore(cartItem, cartEmptyMessage);
    });

    // Add event listeners after all items are rendered
    addCartItemEventListeners();
  }

  function addCartItemEventListeners() {
    // Add event listeners to quantity buttons
    document.querySelectorAll(".decrease-btn").forEach((button) => {
      const index = parseInt(button.getAttribute("data-index"));
      button.addEventListener("click", () => decreaseQuantity(index));
    });

    document.querySelectorAll(".increase-btn").forEach((button) => {
      const index = parseInt(button.getAttribute("data-index"));
      button.addEventListener("click", () => increaseQuantity(index));
    });

    document.querySelectorAll(".remove-item").forEach((button) => {
      const index = parseInt(button.getAttribute("data-index"));
      button.addEventListener("click", () => removeItem(index));
    });
  }

  function createCartItemElement(item, index) {
    const itemElement = document.createElement("div");
    itemElement.classList.add("cart-item");

    const itemTotal = item.price * item.quantity;

    itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${itemTotal.toFixed(2)} جنية</div>
                <div class="item-quantity">
                    <button class="quantity-btn decrease-btn" data-index="${index}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-index="${index}">+</button>
                </div>
            </div>
            <button class="remove-item" data-index="${index}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;

    return itemElement;
  }

  function decreaseQuantity(index) {
    if (cartItems[index].quantity > 1) {
      cartItems[index].quantity--;
      saveCart();
      updateCartDisplay();
    } else {
      removeItem(index);
    }
  }

  function increaseQuantity(index) {
    cartItems[index].quantity++;
    saveCart();
    updateCartDisplay();
  }

  function removeItem(index) {
    cartItems.splice(index, 1);
    saveCart();
    updateCartDisplay();
  }

  function calculateTotals() {
    console.log("Calculating totals");
    // Calculate subtotal
    let subtotal = 0;
    cartItems.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    // Format and display subtotal
    subtotalElement.textContent = subtotal.toFixed(2) + " جنية";

    // Get tax settings first - always get fresh tax settings from localStorage
    const taxSettings = getTaxRate();
    console.log("Tax settings:", taxSettings);
    let taxRate = 0;
    let taxValue = 0;
    let serviceTaxRate = 0;
    let serviceTaxValue = 0;

    // Calculate and display tax first (before discount)
    if (taxSettings.enabled) {
      taxRate = taxSettings.rate;
      taxValue = (subtotal * taxRate) / 100;

      // Show tax row and update value
      taxElement.parentElement.style.display = "flex";
      taxElement.textContent = taxValue.toFixed(2) + " جنية";

      // Update tax info percentage
      const taxInfoElement = document.getElementById("tax-info");
      if (taxInfoElement) {
        taxInfoElement.textContent = ` (${taxRate}%)`;
      }
    } else {
      // Hide tax row
      taxElement.parentElement.style.display = "none";

      // Update tax info
      const taxInfoElement = document.getElementById("tax-info");
      if (taxInfoElement) {
        taxInfoElement.textContent = " (معفى)";
      }
    }

    // Calculate and display service tax
    if (taxSettings.serviceEnabled) {
      serviceTaxRate = taxSettings.serviceRate;
      serviceTaxValue = (subtotal * serviceTaxRate) / 100;

      // Show service tax row and update value
      serviceTaxRow.style.display = "flex";
      serviceTaxElement.textContent = serviceTaxValue.toFixed(2) + " جنية";

      // Update service tax info percentage
      const serviceTaxInfoElement = document.getElementById("service-tax-info");
      if (serviceTaxInfoElement) {
        serviceTaxInfoElement.textContent = ` (${serviceTaxRate}%)`;
      }
    } else {
      // Hide service tax row
      serviceTaxRow.style.display = "none";
    }

    // Calculate discount if voucher is applied (after tax is calculated)
    let discountValue = 0;
    let discountDetails = null;

    if (activeVoucher) {
      discountValue = (subtotal * activeVoucher.discount) / 100;
      discountDetails = {
        code: activeVoucher.code,
        name: activeVoucher.code,
        discount: activeVoucher.discount,
        value: discountValue,
      };

      // Show discount row
      discountRow.style.display = "flex";

      // Update discount amount
      if (discountAmount) {
        discountAmount.textContent = discountValue.toFixed(2) + " جنية";
      }
    } else {
      // Hide discount row if no active voucher
      discountRow.style.display = "none";
    }

    // Calculate total (subtotal + tax - discount)
    const total = subtotal + taxValue + serviceTaxValue - discountValue;

    // Format and display total
    totalElement.textContent = total.toFixed(2) + " جنية";

    // Update checkout button text
    checkoutBtn.textContent = `إتمام الطلب (${total.toFixed(2)} جنية)`;

    // Enable/disable checkout button based on cart status
    checkoutBtn.disabled = cartItems.length === 0;
  }

  function showEmptyCart() {
    cartEmptyMessage.style.display = "flex";
    subtotalElement.textContent = "0.00 جنية";
    taxElement.textContent = "0.00 جنية";
    serviceTaxElement.textContent = "0.00 جنية";
    serviceTaxRow.style.display = "none";
    totalElement.textContent = "0.00 جنية";
    discountRow.style.display = "none";
    checkoutBtn.disabled = true;
    checkoutBtn.style.opacity = "0.6";
    checkoutBtn.style.cursor = "not-allowed";
  }

  function hideEmptyCart() {
    cartEmptyMessage.style.display = "none";
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = "1";
    checkoutBtn.style.cursor = "pointer";
  }

  function clearCart() {
    cartItems = [];
    clearVoucher();
    saveCart();
    updateCartDisplay();
  }

  function saveCart() {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      updateCartCountDisplay();

      // Dispatch custom event to notify other components about cart update
      dispatchCartChangeEvent();
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }

  // Helper function to dispatch cart change event
  function dispatchCartChangeEvent() {
    // Create and dispatch a custom event
    const cartChangeEvent = new CustomEvent("digital_menu_cart_change");
    window.dispatchEvent(cartChangeEvent);

    // Also broadcast through localStorage for cross-tab communication
    // Using a timestamp ensures the event is unique each time
    localStorage.setItem("cart_change_event", Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem("cart_change_event");
    }, 100);
  }

  function updateCartCountDisplay() {
    let totalCount = 0;
    cartItems.forEach((item) => {
      totalCount += item.quantity;
    });

    try {
      localStorage.setItem("cartCount", totalCount.toString());
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }

  async function checkoutOrder() {
    console.log("Checking out order");

    // Create order object
    try {
      // Disable checkout button to prevent double submissions
      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> جاري تأكيد الطلب...';

      // Calculate totals for the order
      let subtotal = 0;
      cartItems.forEach((item) => {
        subtotal += item.price * item.quantity;
      });

      // Get voucher details if available
      const voucherInfo = getVoucherInfoForOrder();

      // Format order items for API
      const orderItems = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        notes: item.notes || "",
      }));

      // Create customer info
      const customerInfo = {
        name: "Guest Customer", // You could add a name input field in the future
        phone: "", // You could add a phone input field in the future
      };

      // Create the API order request
      const orderData = {
        items: orderItems,
        tableNumber: tableNumber || "0",
        notes: "",
        customer: customerInfo,
      };

      console.log("Sending order to API:", orderData);

      // Send order to backend API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      // Process API response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const result = await response.json();
      console.log("Order created successfully:", result);

      // If voucher was used and API call was successful, apply the voucher
      if (voucherInfo && result.success) {
        try {
          await applyVoucherToOrder(voucherInfo.voucherId, subtotal);
        } catch (voucherError) {
          console.error("Error applying voucher to order:", voucherError);
          // Continue with checkout even if voucher application fails
        }
      }

      // Clear the cart
      clearCart();

      // Clear any active voucher
      clearVoucherAfterOrder();

      // Show success message
      showCheckoutSuccess();
    } catch (error) {
      console.error("Error during checkout:", error);

      // Re-enable checkout button
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = 'إتمام الطلب <i class="fas fa-check"></i>';

      // Show error message
      alert(
        `حدث خطأ أثناء إتمام الطلب: ${error.message}. الرجاء المحاولة مرة أخرى.`
      );
    }
  }

  // Apply voucher to order in the backend
  async function applyVoucherToOrder(voucherId, orderValue) {
    const response = await fetch("/api/vouchers/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voucherId: voucherId,
        orderValue: orderValue,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to apply voucher to order");
    }

    return await response.json();
  }

  // Get voucher info for order
  function getVoucherInfoForOrder() {
    const activeVoucherJson = localStorage.getItem("activeVoucher");

    if (!activeVoucherJson) {
      return null;
    }

    try {
      const activeVoucher = JSON.parse(activeVoucherJson);
      return {
        voucherId: activeVoucher.id,
        code: activeVoucher.code,
        discountAmount: activeVoucher.discountAmount,
      };
    } catch (error) {
      console.error("Error parsing active voucher:", error);
      return null;
    }
  }

  function showCheckoutSuccess() {
    console.log("Showing checkout success message");

    if (checkoutComplete) {
      // Update message to show that order was sent to cashier
      const checkoutMessage = checkoutComplete.querySelector(
        ".checkout-message h2"
      );
      if (checkoutMessage) {
        checkoutMessage.textContent = "تم تأكيد طلبك وإرساله إلى الكاشير!";
      }

      const checkoutSubMessage = checkoutComplete.querySelector(
        ".checkout-message p"
      );
      if (checkoutSubMessage) {
        // Always use the table number (either from URL or default '0')
        const displayTableNum = tableNumber || "0";
        checkoutSubMessage.textContent = `سيتم تحضير طلبك للطاولة رقم ${displayTableNum} في أقرب وقت`;
      }

      checkoutComplete.classList.add("show");

      // Redirect to home page after a delay
      setTimeout(() => {
        checkoutComplete.classList.remove("show");
        window.location.href =
          "index.html" + (tableNumber ? `?table=${tableNumber}` : "");
      }, 3000);
    } else {
      console.error("Checkout complete element not found");
      // Redirect to home page after a shorter delay
      setTimeout(() => {
        window.location.href =
          "index.html" + (tableNumber ? `?table=${tableNumber}` : "");
      }, 1500);
    }
  }

  // Voucher functions
  function applyVoucher() {
    const code = voucherCodeInput.value.trim();

    if (!code) {
      showVoucherMessage("الرجاء إدخال كود قسيمة صالح", "error");
      return;
    }

    // If there's already an active voucher, clear it first
    if (activeVoucher) {
      clearVoucher();
    }

    // Get all vouchers from localStorage
    const savedVouchers = localStorage.getItem("vouchers");
    if (!savedVouchers) {
      showVoucherMessage("كود القسيمة غير صالح", "error");
      return;
    }

    const vouchers = JSON.parse(savedVouchers);
    const voucher = vouchers.find((v) => v.code === code);

    if (!voucher) {
      showVoucherMessage("كود القسيمة غير صالح", "error");
      return;
    }

    // Validate voucher
    const validationResult = validateVoucher(voucher);
    if (!validationResult.valid) {
      showVoucherMessage(validationResult.message, "error");
      return;
    }

    // Apply voucher
    activeVoucher = voucher;
    localStorage.setItem("activeVoucher", JSON.stringify(activeVoucher));
    showVoucherMessage(`تم تطبيق القسيمة: ${voucher.code}`, "success");

    // Display voucher information
    displayAppliedVoucher();

    // Recalculate totals
    calculateTotals();

    // Add animation to show success
    voucherCodeInput.classList.add("success-applied");

    // Remove success animation after a short delay
    setTimeout(() => {
      voucherCodeInput.classList.remove("success-applied");
    }, 1500);
  }

  function validateVoucher(voucher) {
    // Check if voucher has expired
    const expiryDate = new Date(voucher.expiryDate);
    const today = new Date();

    if (today > expiryDate) {
      return {
        valid: false,
        message: "هذه القسيمة منتهية الصلاحية",
      };
    }

    // Check if there are cart items
    if (cartItems.length === 0) {
      return {
        valid: false,
        message: "لا يمكن تطبيق القسيمة على سلة فارغة",
      };
    }

    return {
      valid: true,
    };
  }

  function displayAppliedVoucher() {
    if (!activeVoucher) return;

    // Calculate the discount amount to display immediately
    let discountValue = 0;
    if (cartItems.length > 0) {
      let subtotal = 0;
      cartItems.forEach((item) => {
        subtotal += item.price * item.quantity;
      });
      discountValue = (subtotal * activeVoucher.discount) / 100;
    }

    // Show the discount row
    discountRow.style.display = "flex";

    // Update discount amount
    if (discountAmount) {
      discountAmount.textContent = discountValue.toFixed(2) + " جنية";
    }

    // Show voucher info
    const voucherInfo = document.createElement("div");
    voucherInfo.classList.add("applied-voucher");
    voucherInfo.innerHTML = `
            <div class="voucher-info">
                <span class="voucher-name">${activeVoucher.code}</span>
                <span class="voucher-discount">${activeVoucher.discount}% خصم</span>
            </div>
            <button class="clear-voucher" id="clear-voucher">
                <i class="fas fa-times"></i>
            </button>
        `;

    // Replace the existing message
    voucherMessage.innerHTML = "";
    voucherMessage.appendChild(voucherInfo);

    // Add event listener to clear button
    document
      .getElementById("clear-voucher")
      .addEventListener("click", clearVoucher);

    // Disable input and apply button
    voucherCodeInput.disabled = true;
    applyVoucherBtn.disabled = true;
  }

  function showVoucherMessage(message, type) {
    voucherMessage.textContent = message;
    voucherMessage.className = "voucher-message";
    voucherMessage.classList.add(type);

    // Add animation
    voucherMessage.style.animation = "none";
    voucherMessage.offsetHeight; // Trigger reflow
    voucherMessage.style.animation = "fadeIn 0.3s forwards";
  }

  function clearVoucher() {
    // Remove active voucher
    activeVoucher = null;
    localStorage.removeItem("activeVoucher");

    // Reset UI
    voucherCodeInput.value = "";
    voucherCodeInput.disabled = false;
    applyVoucherBtn.disabled = false;
    voucherMessage.innerHTML = "";

    // Hide discount row
    discountRow.style.display = "none";

    // Recalculate totals
    calculateTotals();
  }

  function getTaxRate() {
    try {
      const savedTaxSettings = localStorage.getItem("taxSettings");
      if (savedTaxSettings) {
        console.log("Found tax settings in localStorage:", savedTaxSettings);
        return JSON.parse(savedTaxSettings);
      } else {
        console.log("No tax settings found in localStorage, using defaults");
      }
    } catch (error) {
      console.error("Error getting tax settings:", error);
    }

    // Default tax settings if not found
    return {
      rate: 15,
      enabled: true,
      serviceRate: 10,
      serviceEnabled: false,
    };
  }

  function generateOrderId() {
    return "ORD-" + Date.now().toString(36).toUpperCase();
  }

  function saveOrder(order) {
    // Add table number to order if available
    if (tableNumber) {
      order.tableNumber = tableNumber;
    } else {
      // If no table number is available, use a default table number
      // instead of making it a takeaway order
      order.tableNumber = "0"; // Using '0' for orders without a specific table
    }

    // Always set type to 'dine-in' since we don't have takeaway
    order.type = "dine-in";

    // Get existing orders
    try {
      let orders = [];
      const savedOrders = localStorage.getItem("orders");

      if (savedOrders) {
        orders = JSON.parse(savedOrders);
      }

      // Add new order
      orders.push(order);

      // Save to localStorage
      localStorage.setItem("orders", JSON.stringify(orders));
      console.log("Order saved successfully");

      // If a voucher was used, update its usage count in the vouchers list
      if (order.discount && order.discount.code) {
        updateVoucherUsage(order.discount.code);
      }

      // Send a custom event to notify other pages (like cashier.html) if they're open
      const orderEvent = new CustomEvent("newOrderCreated", {
        detail: {
          orderId: order.id,
          tableNumber: order.tableNumber,
          total: order.total,
        },
      });
      window.dispatchEvent(orderEvent);
    } catch (error) {
      console.error("Error saving order:", error);
    }
  }

  function updateVoucherUsage(voucherCode) {
    try {
      const savedVouchers = localStorage.getItem("vouchers");
      if (savedVouchers) {
        let vouchers = JSON.parse(savedVouchers);
        const voucherIndex = vouchers.findIndex((v) => v.code === voucherCode);

        if (voucherIndex !== -1) {
          // Initialize usageCount if it doesn't exist
          if (!vouchers[voucherIndex].usageCount) {
            vouchers[voucherIndex].usageCount = 0;
          }

          // Increment usage count
          vouchers[voucherIndex].usageCount++;
          localStorage.setItem("vouchers", JSON.stringify(vouchers));
          console.log(`Updated usage count for voucher ${voucherCode}`);
        }
      }
    } catch (error) {
      console.error("Error updating voucher usage:", error);
    }
  }

  // Get table number from URL or session storage
  function getTableNumber() {
    // First check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let table = urlParams.get("table");

    // If not in URL, check session storage (from index.html)
    if (!table) {
      table = sessionStorage.getItem("tableNumber");
    }

    return table;
  }

  // Display table indicator if table number is present
  function displayTableIndicator(tableNum) {
    // Create table indicator element
    const tableIndicator = document.createElement("div");
    tableIndicator.className = "table-indicator";
    tableIndicator.innerHTML = `
            <div class="table-indicator-content">
                <i class="fas fa-utensils"></i>
                <span>طاولة رقم ${tableNum}</span>
            </div>
        `;

    // Add to the body
    document.body.appendChild(tableIndicator);

    // Display with animation
    setTimeout(() => {
      tableIndicator.classList.add("show");
    }, 500);

    // Update return/back link to preserve table number
    const backLink = document.querySelector(".back-button a");
    if (backLink) {
      backLink.href = `index.html?table=${tableNum}`;
    }

    const browseMenuBtn = document.querySelector(".browse-menu-btn");
    if (browseMenuBtn) {
      browseMenuBtn.href = `index.html?table=${tableNum}`;
    }
  }
});
