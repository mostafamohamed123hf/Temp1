document.addEventListener("DOMContentLoaded", function () {
  // Initialize cart counter
  let cartCount = 0;
  const cartCountElement = document.querySelector(".cart-count");
  const cartNotification = document.getElementById("cart-notification");

  // Handle table number from URL (for QR code scans)
  checkForTableNumber();

  // Update cart count from localStorage on page load
  updateCartCountFromStorage();

  // Load products dynamically from API or localStorage
  loadProducts();

  // Listen for changes in localStorage (like when the cart page updates the cart)
  window.addEventListener("storage", function (e) {
    if (e.key === "cartItems" || e.key === "cartCount") {
      updateCartCountFromStorage();
    }

    // Refresh when menu items or discount status changes
    if (e.key === "menuItems" || e.key === "original_prices") {
      console.log("Storage event detected for menu items, refreshing products");
      loadProducts();
    }

    // Handle cross-tab discount change event
    if (e.key === "discount_change_event") {
      loadProducts();
    }

    // Handle cross-tab cart change event
    if (e.key === "cart_change_event") {
      updateCartCountFromStorage();
    }
  });

  // Listen for custom discount change event
  window.addEventListener("digital_menu_discount_change", function () {
    loadProducts();
  });

  // Listen for custom product change event
  window.addEventListener("digital_menu_product_change", function (event) {
    console.log("Product change event received:", event.detail);
    loadProducts();
  });

  // Function to load products from API, falling back to localStorage if needed
  async function loadProducts() {
    const productGrid = document.querySelector(".product-grid");

    // Show loading spinner
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="loading-spinner" id="products-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>جاري تحميل المنتجات...</p>
        </div>
      `;
    }

    try {
      // Try to fetch products from API
      const response = await fetch("/api/products");

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          console.log(`Loaded ${result.data.length} products from API`);

          // Save to localStorage for offline usage
          localStorage.setItem("menuItems", JSON.stringify(result.data));

          // Render the products
          renderProducts(result.data);
          return;
        }
      } else {
        console.warn("API request failed, falling back to localStorage");
      }
    } catch (error) {
      console.error("Error fetching products from API:", error);
      console.warn("Falling back to localStorage due to API error");
    }

    // Fallback to localStorage if API fails
    loadProductsFromStorage();
  }

  // Function to load and render products from localStorage (as fallback)
  function loadProductsFromStorage() {
    const savedProducts = localStorage.getItem("menuItems");
    const productGrid = document.querySelector(".product-grid");

    if (savedProducts) {
      try {
        const products = JSON.parse(savedProducts);
        console.log(`Loaded ${products.length} products from localStorage`);

        if (products && products.length > 0) {
          renderProducts(products);
        } else {
          console.warn("Products array is empty, creating default products");
          createDefaultProducts();
        }
      } catch (error) {
        console.error("Error parsing product data from localStorage:", error);
        createDefaultProducts();
      }
    } else {
      console.warn(
        "No products found in localStorage, creating default products"
      );
      createDefaultProducts();
    }
  }

  // Create default products when none exist
  async function createDefaultProducts() {
    console.log("Creating default products");

    try {
      // Try to create default products via API
      const response = await fetch("/api/products/default/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          console.log(
            `Created ${result.data.length} default products from API`
          );

          // Save to localStorage for offline usage
          localStorage.setItem("menuItems", JSON.stringify(result.data));

          // Render the products
          renderProducts(result.data);
          return;
        }
      } else {
        console.warn(
          "API default product creation failed, using local defaults"
        );
      }
    } catch (error) {
      console.error("Error creating default products via API:", error);
      console.warn("Using local default products due to API error");
    }

    // Fallback to local default products if API fails
    const defaultProducts = [
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
    localStorage.setItem("menuItems", JSON.stringify(defaultProducts));
    console.log("Default products saved successfully");

    // Render the default products
    renderProducts(defaultProducts);
  }

  // Helper function to show empty products message
  function showEmptyProductsMessage() {
    const productGrid = document.querySelector(".product-grid");
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-utensils"></i>
          <p>لا توجد منتجات متاحة حالياً</p>
          <button id="create-default-products" style="
            margin-top: 15px;
            padding: 10px 20px;
            background-color: #42d158;
            color: white;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          ">
            <i class="fas fa-sync-alt"></i> إضافة المنتجات الافتراضية
          </button>
        </div>
      `;

      // Add event listener to the button
      const createDefaultBtn = document.getElementById(
        "create-default-products"
      );
      if (createDefaultBtn) {
        createDefaultBtn.addEventListener("click", function () {
          createDefaultProducts();
        });
      }
    }
  }

  // Function to render products in the product grid
  function renderProducts(products) {
    const productGrid = document.querySelector(".product-grid");
    if (!productGrid || !products || products.length === 0) return;

    // Clear current products
    productGrid.innerHTML = "";

    // Check if a global discount is applied by checking for original_prices in localStorage
    const originalPricesJSON = localStorage.getItem("original_prices");
    const originalPrices = originalPricesJSON
      ? JSON.parse(originalPricesJSON)
      : null;
    const hasDiscount = !!originalPrices;

    // Create and append product cards
    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.setAttribute("data-category", product.category);

      // Create the price HTML based on whether a discount is applied
      let priceHTML = "";
      if (hasDiscount && originalPrices[product.id]) {
        const originalPrice = originalPrices[product.id];
        // Calculate the discount percentage
        const discountPercent = Math.round(
          ((originalPrice - product.price) / originalPrice) * 100
        );
        // Add high-discount class for discounts 20% or higher
        const highDiscountClass = discountPercent >= 20 ? "high-discount" : "";

        priceHTML = `
                    <div class="price-container">
                        <span class="original-price">${originalPrice.toFixed(
                          2
                        )}</span>
                        <span class="current-price">${product.price.toFixed(
                          2
                        )}</span>
                        <span class="discount-badge ${highDiscountClass}">-${discountPercent}%</span>
                    </div>
                `;
      } else {
        priceHTML = `<span class="price">${product.price.toFixed(2)}</span>`;
      }

      productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${product.rating || 4.5}</span>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        ${priceHTML}
                        <button class="add-to-cart">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            `;

      productGrid.appendChild(productCard);
    });

    // Reattach event listeners to new product cards
    attachProductEventListeners();

    // Reapply current category filter
    const activeFilter = document.querySelector(".filter.active");
    if (activeFilter) {
      filterProducts(activeFilter.getAttribute("data-category"));
    }
  }

  // Function to attach event listeners to product cards
  function attachProductEventListeners() {
    // Add to Cart Buttons
    const addToCartButtons = document.querySelectorAll(".add-to-cart");
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        // Animation effect
        this.classList.add("clicked");
        setTimeout(() => {
          this.classList.remove("clicked");
        }, 200);

        // Get product details
        const card = this.closest(".product-card");
        const productName = card.querySelector(".product-name").textContent;

        // Get the product price - check for current-price first (discounted price)
        let productPrice;
        const currentPriceEl = card.querySelector(".current-price");
        if (currentPriceEl) {
          productPrice = parseFloat(currentPriceEl.textContent);
        } else {
          productPrice = parseFloat(card.querySelector(".price").textContent);
        }
        const productImage = card.querySelector(".product-image img").src;

        // Add to cart
        addToCart(null, productName, productPrice, productImage);

        // Increment cart counter
        cartCount++;
        cartCountElement.textContent = cartCount;

        // Show notification
        showCartNotification();

        // Store cart count in localStorage
        localStorage.setItem("cartCount", cartCount);
      });
    });
  }

  // Function to update cart count from localStorage
  function updateCartCountFromStorage() {
    const savedCartItems = localStorage.getItem("cartItems");
    if (savedCartItems) {
      const cartItems = JSON.parse(savedCartItems);
      let totalCount = 0;
      cartItems.forEach((item) => {
        totalCount += item.quantity;
      });
      cartCount = totalCount;
      cartCountElement.textContent = cartCount;
    } else {
      cartCount = 0;
      cartCountElement.textContent = "0";
    }
  }

  // New banner order button
  const orderNowBtn = document.querySelector(".order-now-btn");
  if (orderNowBtn) {
    orderNowBtn.addEventListener("click", function () {
      // Get category from data attribute
      const category = this.getAttribute("data-category");

      // Find the corresponding filter
      const filter = document.querySelector(
        `.filter[data-category="${category}"]`
      );
      if (filter) {
        // Remove active class from all filters
        document.querySelectorAll(".filter").forEach((f) => {
          f.classList.remove("active");
        });

        // Add active class to matching filter
        filter.classList.add("active");

        // Filter products
        filterProducts(category);

        // Scroll to products section
        document.querySelector(".product-grid").scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  }

  // Add hover effect to order now button
  if (orderNowBtn) {
    orderNowBtn.addEventListener("mouseenter", function () {
      this.querySelector("i").style.transform = "translateX(5px)";
    });

    orderNowBtn.addEventListener("mouseleave", function () {
      this.querySelector("i").style.transform = "translateX(0)";
    });
  }

  // Banner action buttons
  document.querySelectorAll(".banner-action").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();

      // Get category from parent element
      const banner = this.closest(".banner-content");
      let category = "burger"; // Default to burger since we only have one banner now

      // Select corresponding category filter
      const filter = document.querySelector(
        `.filter[data-category="${category}"]`
      );
      if (filter) {
        // Remove active class from all filters
        document.querySelectorAll(".filter").forEach((f) => {
          f.classList.remove("active");
        });

        // Add active class to matching filter
        filter.classList.add("active");

        // Filter products
        filterProducts(category);

        // Scroll to products section
        document.querySelector(".product-grid").scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Add ripple effect to banner action buttons
  document.querySelectorAll(".banner-action").forEach((button) => {
    button.addEventListener("click", function (e) {
      // Create ripple element
      const ripple = document.createElement("span");
      ripple.classList.add("ripple");
      this.appendChild(ripple);

      // Position the ripple
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Remove ripple after animation completes
      setTimeout(() => {
        ripple.remove();
      }, 1000);
    });
  });

  // Enhanced Dark/Light Mode Toggle
  const toggleSwitch = document.getElementById("switch");
  const body = document.body;

  // Check for saved theme preference
  const currentTheme = localStorage.getItem("theme") || "dark";

  // Apply the saved theme on load
  if (currentTheme === "light") {
    body.classList.add("light-mode");
    toggleSwitch.checked = false;
    updateThemeColors("light");
  } else {
    toggleSwitch.checked = true;
    updateThemeColors("dark");
  }

  // Toggle theme when switch is clicked
  toggleSwitch.addEventListener("change", function () {
    if (this.checked) {
      // Dark mode
      body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");

      // Animate transition
      animateThemeChange("dark");

      // Update colors for UI components
      updateThemeColors("dark");
    } else {
      // Light mode
      body.classList.add("light-mode");
      localStorage.setItem("theme", "light");

      // Animate transition
      animateThemeChange("light");

      // Update colors for UI components
      updateThemeColors("light");
    }
  });

  // Function to animate theme change
  function animateThemeChange(theme) {
    const overlay = document.createElement("div");
    overlay.className = "theme-transition-overlay";
    document.body.appendChild(overlay);

    // Set overlay color based on theme
    if (theme === "light") {
      overlay.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
    } else {
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    }

    // Animate and remove overlay
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
      }, 500);
    }, 100);
  }

  // Function to update theme colors
  function updateThemeColors(theme) {
    // Update primary colors based on theme
    const root = document.documentElement;

    if (theme === "light") {
      // Light theme colors
      root.style.setProperty("--primary-color", "#42d158");
    } else {
      // Dark theme colors
      root.style.setProperty("--primary-color", "#42d158");
    }
  }

  // Category Filters
  const filters = document.querySelectorAll(".filter");

  filters.forEach((filter) => {
    filter.addEventListener("click", function () {
      // Remove active class from all filters
      filters.forEach((f) => f.classList.remove("active"));
      // Add active class to clicked filter
      this.classList.add("active");

      const category = this.getAttribute("data-category");

      // Filter products
      filterProducts(category);
    });
  });

  function filterProducts(category) {
    const productCards = document.querySelectorAll(".product-card");

    if (productCards.length === 0) return;

    productCards.forEach((card) => {
      // Apply fade in animation
      card.style.animation = "none";
      card.offsetHeight; // Trigger reflow
      card.style.animation = "fadeIn 0.5s ease forwards";

      if (
        category === "all" ||
        card.getAttribute("data-category") === category
      ) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Search functionality
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();

      if (searchTerm === "") {
        // If search is empty, reset to showing all products or current category
        const activeFilter = document.querySelector(".filter.active");
        filterProducts(activeFilter.getAttribute("data-category"));
        return;
      }

      // Then filter by search term
      const productCards = document.querySelectorAll(".product-card");

      productCards.forEach((card) => {
        const productName = card
          .querySelector(".product-name")
          .textContent.toLowerCase();
        const productDesc = card
          .querySelector(".product-description")
          .textContent.toLowerCase();

        if (
          productName.includes(searchTerm) ||
          productDesc.includes(searchTerm)
        ) {
          card.style.display = "block";
          card.style.animation = "fadeIn 0.5s ease forwards";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  // Function to add item to cart
  function addToCart(id, name, price, image) {
    console.log("Adding to cart:", { id, name, price, image });

    // Get existing cart items from localStorage
    let cartItems = [];
    try {
      const savedCart = localStorage.getItem("cartItems");
      console.log("Saved cart:", savedCart);

      if (savedCart) {
        cartItems = JSON.parse(savedCart);
        console.log("Current cart items:", cartItems);
      }

      // Create a consistent ID based on name instead of random ID
      const productId = name.toLowerCase().replace(/\s+/g, "-");

      // Check if item already exists
      const existingItemIndex = cartItems.findIndex(
        (item) => item.name === name
      );

      if (existingItemIndex !== -1) {
        // Increase quantity if item exists
        cartItems[existingItemIndex].quantity += 1;
        console.log(
          "Increased quantity for existing item:",
          cartItems[existingItemIndex]
        );
      } else {
        // Add new item
        const newItem = {
          id: productId,
          name: name,
          price: price,
          image: image,
          quantity: 1,
        };
        cartItems.push(newItem);
        console.log("Added new item:", newItem);
      }

      // Save updated cart to localStorage
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      console.log("Updated cart saved to localStorage", cartItems);

      // Dispatch custom event to notify other components about cart update
      dispatchCartChangeEvent();
    } catch (error) {
      console.error("Error adding item to cart:", error);
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

  function showCartNotification() {
    cartNotification.classList.add("show");
    setTimeout(() => {
      cartNotification.classList.remove("show");
    }, 2000);
  }

  // Bottom Navigation functionality
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    if (item.id === "cart-icon") {
      // Special case for cart icon - preserve the direct link
      item.addEventListener("click", function () {
        // Add tapped animation class
        this.classList.add("tapped");

        // Remove the class after animation completes
        setTimeout(() => {
          this.classList.remove("tapped");
        }, 300);
      });
    } else {
      item.addEventListener("click", function (e) {
        // Add tapped animation class
        this.classList.add("tapped");

        // Remove the class after animation completes
        setTimeout(() => {
          this.classList.remove("tapped");
        }, 300);

        if (!this.classList.contains("active")) {
          e.preventDefault();

          // Remove active class from all items
          navItems.forEach((navItem) => navItem.classList.remove("active"));

          // Add active class to clicked item
          this.classList.add("active");
        }
      });
    }

    // For mobile touch events
    item.addEventListener("touchstart", function () {
      this.style.opacity = "0.8";
    });

    item.addEventListener("touchend", function () {
      this.style.opacity = "1";
    });
  });

  // Add touch effects for mobile
  document
    .querySelectorAll(".product-card, .filter, .add-to-cart")
    .forEach((element) => {
      element.addEventListener("touchstart", function () {
        this.style.opacity = "0.8";
      });

      element.addEventListener("touchend", function () {
        this.style.opacity = "1";
      });
    });

  // Initialize category filter functionality
  initCategoryFilter();

  // Initialize product rating functionality
  initProductRating();

  // Initialize category selection functionality
  initCategorySelection();

  // Initialize the notification badge functionality
  updateNotificationBadge();

  // Initialize product quantity controls
  initQuantityControls();

  // Update cart total when page loads
  updateCartTotal();

  // Initialize sample vouchers if running in development mode
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    // Load and execute the voucher initialization script
    const script = document.createElement("script");
    script.src = "init-vouchers.js";
    document.body.appendChild(script);
  }

  // Function to check for table number in URL parameters
  function checkForTableNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get("table");

    if (tableNumber) {
      // Get the table number display element
      const tableNumberDisplay = document.getElementById(
        "table-number-display"
      );

      // Update its content
      tableNumberDisplay.innerHTML = `
                <i class="fas fa-utensils"></i>
                <span>طاولة ${tableNumber}</span>
            `;

      // Display with animation
      setTimeout(() => {
        tableNumberDisplay.classList.add("show");
      }, 500);

      // Save table number in session storage for cart page
      sessionStorage.setItem("tableNumber", tableNumber);

      // Add table number to any anchor elements that point to cart.html
      const cartLinks = document.querySelectorAll('a[href="cart.html"]');
      cartLinks.forEach((link) => {
        link.href = `cart.html?table=${tableNumber}`;
      });
    }
  }

  // Add a reload products button
  const productGrid = document.querySelector(".product-grid");

  // Create reload button
  if (productGrid) {
    const reloadButtonContainer = document.createElement("div");
    reloadButtonContainer.className = "reload-button-container";
    reloadButtonContainer.style.textAlign = "center";
    reloadButtonContainer.style.margin = "20px 0";

    const reloadButton = document.createElement("button");
    reloadButton.className = "reload-products-button";
    reloadButton.innerHTML =
      '<i class="fas fa-sync-alt"></i> إعادة تحميل المنتجات';
    reloadButton.style.padding = "10px 20px";
    reloadButton.style.backgroundColor = "#42d158";
    reloadButton.style.color = "white";
    reloadButton.style.border = "none";
    reloadButton.style.borderRadius = "30px";
    reloadButton.style.cursor = "pointer";
    reloadButton.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    reloadButton.style.fontWeight = "bold";

    // Add event listener
    reloadButton.addEventListener("click", function () {
      this.classList.add("rotating");
      createDefaultProducts();

      // Remove rotating class after animation completes
      setTimeout(() => {
        this.classList.remove("rotating");
      }, 1000);
    });

    // Add CSS for rotation animation
    const style = document.createElement("style");
    style.textContent = `
      .rotating {
        animation: rotate-animation 1s ease;
      }
      @keyframes rotate-animation {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Add to DOM
    reloadButtonContainer.appendChild(reloadButton);
    const categorySection = document.querySelector(".category-filters");
    if (categorySection) {
      categorySection.parentNode.insertBefore(
        reloadButtonContainer,
        categorySection.nextSibling
      );
    } else {
      productGrid.parentNode.insertBefore(reloadButtonContainer, productGrid);
    }
  }
});

// Initialize category filter functionality
function initCategoryFilter() {
  // ... existing code ...
}

// ... existing code ...
