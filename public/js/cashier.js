// Cashier System JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Cashier system initialized');
    
    // Initialize theme toggle functionality
    initThemeToggle();
    
    // Load initial data
    loadActiveOrders();
    loadRecentActivity();
    
    // Handle checking for table orders
    document.getElementById('check-table-button').addEventListener('click', function() {
        checkTableOrder();
    });
    
    // Allow pressing Enter in the table number input to check
    document.getElementById('table-number-input').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            checkTableOrder();
        }
    });
    
    // Modal close buttons
    document.getElementById('close-order-modal').addEventListener('click', closeOrderModal);
    
    // Order action buttons
    document.getElementById('complete-order-button').addEventListener('click', completeOrder);
    document.getElementById('print-receipt-button').addEventListener('click', printReceipt);
    document.getElementById('cancel-order-button').addEventListener('click', cancelOrder);
    
    // Close modal when clicking outside
    const modal = document.getElementById('order-details-modal');
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeOrderModal();
        }
    });
    
    // Add keyboard shortcut for closing modal (Escape)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            closeOrderModal();
        }
    });
    
    // Listen for new orders from other pages (like cart.html)
    window.addEventListener('newOrderCreated', function(event) {
        console.log('New order created event received:', event.detail);
        // Immediately refresh orders to show the new order
        loadActiveOrders();
        // Play notification sound and show alert
        showFixedNotification(
            'طلب جديد!',
            `تم استلام طلب جديد للطاولة رقم ${event.detail.tableNumber || '0'} بقيمة ${event.detail.total.toFixed(2)} جنية`,
            'success'
        );
    });
    
    // Also listen for storage events (for when orders are created in other tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'orders') {
            console.log('Orders changed in another tab, refreshing...');
            loadActiveOrders();
            // Check for new orders that haven't been notified
            checkForNewOrders();
        }
        
        // Refresh when discount or menu items change
        if (e.key === 'original_prices' || e.key === 'menuItems') {
            // Refresh active orders to reflect updated prices
            loadActiveOrders();
        }
        
        // Handle cross-tab discount change event
        if (e.key === 'discount_change_event') {
            loadActiveOrders();
        }
        
        // Handle cross-tab cart change event
        if (e.key === 'cart_change_event' || e.key === 'cartItems') {
            console.log('Cart updated in another tab');
            // This might not need immediate action in cashier view
            // unless we want to show pending carts before checkout
        }
    });
    
    // Listen for custom discount change event
    window.addEventListener('digital_menu_discount_change', function() {
        // Refresh active orders with new prices
        loadActiveOrders();
    });
    
    // Listen for custom cart change event
    window.addEventListener('digital_menu_cart_change', function() {
        console.log('Cart change event received');
        // This might not need immediate action in cashier view
        // unless we want to show pending carts before checkout
    });
    
    // Start auto-refresh for orders (every 30 seconds)
    startAutoRefresh();
    
    // Remove old notification wrapper if it exists
    const oldWrapper = document.querySelector('.notifications-wrapper');
    if (oldWrapper) {
        oldWrapper.remove();
    }
    
    // Make sure our new container exists
    if (!document.getElementById('cashier-notifications')) {
        const container = document.createElement('div');
        container.id = 'cashier-notifications';
        container.className = 'cashier-notifications';
        document.body.appendChild(container);
    }
    
    // Show welcome notification after a short delay
    setTimeout(() => {
        showFixedNotification(
            'مرحباً بك في نظام الكاشير',
            'تم تحميل النظام بنجاح وجاهز للاستخدام',
            'info'
        );
    }, 1000);
    
    // Test the new fixed notification system
    setTimeout(() => {
        console.log('Testing fixed notification system');
        showFixedNotification(
            'نظام الإشعارات الجديد',
            'تم تحديث نظام الإشعارات بنجاح بتصميم جديد',
            'success'
        );
    }, 1500);
});

// Theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('switch');
    
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.checked = false;
    }
    
    // Toggle theme when switch is clicked
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Load active orders from localStorage
function loadActiveOrders() {
    // Get orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
    
    // Filter only active (not completed) orders
    let activeOrders = orders.filter(order => 
        order.status !== 'completed' && 
        order.status !== 'cancelled'
    );
    
    const ordersGrid = document.getElementById('orders-grid');
    const noOrdersMessage = document.getElementById('no-orders-message') || 
        createNoOrdersMessage();
    
    // Clear existing content
    ordersGrid.innerHTML = '';
    
    if (activeOrders.length === 0) {
        ordersGrid.appendChild(noOrdersMessage);
        return;
    }
    
    // Sort by most recent first
    activeOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create order cards
    activeOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersGrid.appendChild(orderCard);
    });
}

// Create an order card element
function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.dataset.orderId = order.id;
    orderCard.dataset.tableNumber = order.tableNumber || '0';
    
    // Format date and time
    const orderDate = new Date(order.date);
    const timeOrdered = orderDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    // Always show as table order
    const tableIcon = 'fa-table';
    const tableLabel = `طاولة ${order.tableNumber || '0'}`;
    
    orderCard.innerHTML = `
        <div class="order-header">
            <div class="table-number">
                <i class="fas ${tableIcon}"></i> ${tableLabel}
            </div>
            <div class="order-time">${timeOrdered}</div>
        </div>
        <div class="order-info">
            <div class="order-info-row">
                <span class="info-label">رقم الطلب:</span>
                <span class="info-value">${order.id}</span>
            </div>
            <div class="order-info-row">
                <span class="info-label">عدد العناصر:</span>
                <span class="info-value">${order.items.length}</span>
            </div>
        </div>
        <div class="order-footer">
            <div class="order-total">${order.total.toFixed(2)} جنية</div>
            <button class="view-order-button" onclick="viewOrderDetails('${order.id}')">
                <i class="fas fa-eye"></i> عرض
            </button>
        </div>
    `;
    
    return orderCard;
}

// Create a "no orders" message element
function createNoOrdersMessage() {
    const noOrdersMessage = document.createElement('div');
    noOrdersMessage.id = 'no-orders-message';
    noOrdersMessage.className = 'empty-message';
    noOrdersMessage.innerHTML = `
        <i class="fas fa-clipboard-list"></i>
        <p>لا توجد طلبات نشطة</p>
    `;
    return noOrdersMessage;
}

// Load recent activity from order history
function loadRecentActivity() {
    // Get orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
    
    // Filter completed or cancelled orders
    const completedOrders = orders.filter(order => 
        order.status === 'completed' || order.status === 'cancelled'
    );
    
    const activityList = document.getElementById('activity-list');
    const activityHeader = document.querySelector('.recent-activity-header');
    
    // Add reset button if it doesn't exist
    if (!document.getElementById('reset-activity-button')) {
        const resetButton = document.createElement('button');
        resetButton.id = 'reset-activity-button';
        resetButton.className = 'reset-button';
        resetButton.innerHTML = '<i class="fas fa-trash-alt"></i> مسح السجل';
        resetButton.addEventListener('click', resetRecentActivity);
        activityHeader.appendChild(resetButton);
    }
    
    // Clear existing content
    activityList.innerHTML = '';
    
    if (completedOrders.length === 0) {
        activityList.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-history"></i>
                <p>لا يوجد نشاط حديث</p>
            </div>
        `;
        return;
    }
    
    // Sort by most recent first and limit to recent 10
    completedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentActivity = completedOrders.slice(0, 10);
    
    // Create activity items
    recentActivity.forEach(order => {
        const activityItem = document.createElement('div');
        activityItem.className = `activity-item ${order.status}`;
        
        const iconClass = order.status === 'completed' ? 'fa-check-circle' : 'fa-times-circle';
        const actionText = order.status === 'completed' ? 'تم إنهاء' : 'تم إلغاء';
        
        // Always display as table order
        const orderLabel = `طلب الطاولة ${order.tableNumber || '0'}`;
        
        // Format date and time
        const orderDate = new Date(order.date);
        const timeCompleted = orderDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        const dateFormatted = orderDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
        
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">${actionText} ${orderLabel}</div>
                <div class="activity-meta">
                    <span>${timeCompleted} - ${dateFormatted}</span>
                    <span>${order.total.toFixed(2)} جنية</span>
                </div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
    
    // Add "View All Orders" button if there are more orders than shown
    if (completedOrders.length > 10) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'view-all-button';
        viewAllButton.innerHTML = '<i class="fas fa-list"></i> عرض كل الطلبات';
        viewAllButton.addEventListener('click', viewAllOrders);
        activityList.appendChild(viewAllButton);
    }
}

// Reset recent activity
function resetRecentActivity() {
    if (confirm('هل أنت متأكد من مسح سجل النشاط الحديث؟')) {
        // Get orders from localStorage
        let orders = [];
        try {
            const savedOrders = localStorage.getItem('orders');
            if (savedOrders) {
                orders = JSON.parse(savedOrders);
                
                // Keep only active orders
                const activeOrders = orders.filter(order => 
                    order.status !== 'completed' && 
                    order.status !== 'cancelled'
                );
                
                // Save back only active orders
                localStorage.setItem('orders', JSON.stringify(activeOrders));
                
                // Reload activity
                loadRecentActivity();
                
                // Show notification
                showFixedNotification('تم مسح السجل', 'تم مسح سجل النشاط الحديث بنجاح', 'success');
            }
        } catch (error) {
            console.error('Error resetting activity:', error);
            showFixedNotification('خطأ', 'حدث خطأ أثناء مسح سجل النشاط', 'error');
        }
    }
}

// View All Orders History
function viewAllOrders() {
    // Would navigate to a full orders history page in a real app
    showFixedNotification('قادم قريباً', 'سيتم إضافة صفحة كاملة لسجل الطلبات في التحديث القادم', 'info');
}

// View order details
function viewOrderDetails(orderId) {
    if (!orderId) {
        showFixedNotification('خطأ', 'لم يتم تحديد معرف الطلب', 'error');
        return;
    }
    
    // Get orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showFixedNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات الطلبات', 'error');
        return;
    }
    
    // Find the order
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showFixedNotification('خطأ', 'لم يتم العثور على الطلب', 'error');
        return;
    }
    
    // Format date and time
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('ar-EG', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    const formattedTime = orderDate.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Get modal elements
    const modal = document.getElementById('order-details-modal');
    const modalTitle = document.getElementById('order-details-title');
    const orderItems = document.getElementById('order-items');
    const orderSubtotal = document.getElementById('order-subtotal');
    const orderTax = document.getElementById('order-tax');
    const orderDiscount = document.getElementById('order-discount');
    const orderTotal = document.getElementById('order-total');
    const completeButton = document.getElementById('complete-order-button');
    const cancelButton = document.getElementById('cancel-order-button');
    const printButton = document.getElementById('print-receipt-button');
    
    // Set modal title
    modalTitle.textContent = `تفاصيل الطلب: ${order.id}${order.tableNumber ? ` - طاولة ${order.tableNumber}` : ''}`;
    
    // Clear previous items
    orderItems.innerHTML = '';
    
    // Add order items
    order.items.forEach(item => {
        const row = document.createElement('tr');
        
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.price.toFixed(2)} جنية</td>
            <td>${item.quantity}</td>
            <td>${itemTotal} جنية</td>
        `;
        
        orderItems.appendChild(row);
    });
    
    // Set order totals
    orderSubtotal.textContent = `${order.subtotal.toFixed(2)} جنية`;
    
    // Handle tax display
    if (order.tax && orderTax) {
        orderTax.textContent = `${order.tax.value.toFixed(2)} جنية`;
        document.getElementById('tax-row').style.display = 'table-row';
    } else {
        document.getElementById('tax-row').style.display = 'none';
    }
    
    // Handle service tax display
    const orderServiceTax = document.getElementById('order-service-tax');
    if (order.serviceTax && orderServiceTax) {
        orderServiceTax.textContent = `${order.serviceTax.value.toFixed(2)} جنية`;
        document.getElementById('service-tax-row').style.display = 'table-row';
    } else {
        document.getElementById('service-tax-row').style.display = 'none';
    }
    
    // Handle discount display
    if (order.discount && orderDiscount) {
        orderDiscount.textContent = `${order.discount.value.toFixed(2)} جنية`;
        document.getElementById('discount-row').style.display = 'table-row';
    } else {
        document.getElementById('discount-row').style.display = 'none';
    }
    
    orderTotal.textContent = `${order.total.toFixed(2)} جنية`;
    
    // Add information about when the order was placed
    const orderInfoDiv = document.getElementById('order-info') || document.createElement('div');
    orderInfoDiv.id = 'order-info';
    orderInfoDiv.className = 'order-info mb-3';
    orderInfoDiv.innerHTML = `
        <p><strong>تاريخ الطلب:</strong> ${formattedDate}</p>
        <p><strong>وقت الطلب:</strong> ${formattedTime}</p>
        ${order.tableNumber ? `<p><strong>رقم الطاولة:</strong> ${order.tableNumber}</p>` : ''}
        <p><strong>حالة الطلب:</strong> <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></p>
    `;
    
    // Insert the order info before the items table
    const itemsTable = document.querySelector('.order-items-table');
    itemsTable.parentNode.insertBefore(orderInfoDiv, itemsTable);
    
    // Set data attributes for buttons
    completeButton.dataset.orderId = order.id;
    cancelButton.dataset.orderId = order.id;
    printButton.dataset.orderId = order.id;
    
    // Disable buttons if the order is already completed or cancelled
    const isActive = order.status !== 'completed' && order.status !== 'cancelled';
    completeButton.disabled = !isActive;
    cancelButton.disabled = !isActive;
    
    // Show modal
    modal.classList.add('show');
}

// Get status text based on status code
function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'قيد الانتظار';
        case 'in-progress':
            return 'قيد التحضير';
        case 'ready':
            return 'جاهز للتسليم';
        case 'completed':
            return 'مكتمل';
        case 'cancelled':
            return 'ملغى';
        default:
            return 'غير معروف';
    }
}

// Check table order
function checkTableOrder() {
    const tableNumberInput = document.getElementById('table-number-input');
    const tableNumber = tableNumberInput.value.trim();
    
    if (!tableNumber) {
        showFixedNotification('خطأ', 'الرجاء إدخال رقم الطاولة', 'error');
        return;
    }
    
    // Get orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
    
    // Filter active orders for this table
    const tableOrders = orders.filter(order => 
        order.tableNumber === tableNumber && 
        order.status !== 'completed' && 
        order.status !== 'cancelled'
    );
    
    if (tableOrders.length === 0) {
        showFixedNotification('تنبيه', `لا توجد طلبات نشطة للطاولة رقم ${tableNumber}`, 'warning');
        return;
    }
    
    // If there's more than one order, show the most recent one
    tableOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestOrder = tableOrders[0];
    
    // View the order details
    viewOrderDetails(latestOrder.id);
}

// Complete an order
function completeOrder() {
    // Get the current order ID
    const orderId = document.getElementById('complete-order-button').dataset.orderId;
    
    if (!orderId) {
        showFixedNotification('خطأ', 'لم يتم العثور على معرف الطلب', 'error');
        return;
    }
    
    // Get orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showFixedNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات الطلبات', 'error');
        return;
    }
    
    // Find the order
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        showFixedNotification('خطأ', 'لم يتم العثور على الطلب', 'error');
        return;
    }
    
    // Update order status
    orders[orderIndex].status = 'completed';
    orders[orderIndex].completedDate = new Date().toISOString();
        
    // Save updated orders
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Close the order modal
    closeOrderModal();
    
    // Display success notification
    showFixedNotification(
        'تم إنهاء الطلب',
        `تم إنهاء الطلب #${orderId} بنجاح وإضافته إلى سجل اليوم`,
        'success'
    );
    
    // Optional: Generate receipt
    printReceipt(orderId);
        
    // Update the orders list
        loadActiveOrders();
    
    // Update the recent activity list
        loadRecentActivity();
        
    // Notify the customer if applicable
    if (orders[orderIndex].tableNumber) {
        sendCustomerNotification(
            orderId,
            orders[orderIndex].tableNumber,
            orders[orderIndex].total
        );
    }
}

// Print a receipt for the order
function printReceipt() {
    // Get the current order ID
    const orderId = document.getElementById('print-receipt-button').dataset.orderId;
    
    if (!orderId) {
        showFixedNotification('خطأ', 'لم يتم العثور على معرف الطلب', 'error');
        return;
    }
    
    // Get orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showFixedNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات الطلبات', 'error');
        return;
    }
    
    // Find the order
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showFixedNotification('خطأ', 'لم يتم العثور على الطلب', 'error');
        return;
    }
    
    // Create a receipt window
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (!receiptWindow) {
        showFixedNotification('تنبيه', 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لطباعة الإيصال.', 'warning');
        return;
    }
    
    // Format date and time
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('ar-EG', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    const formattedTime = orderDate.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Create receipt content
    let receiptContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>إيصال الطلب ${order.id}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                body {
                    font-family: 'Cairo', sans-serif;
                    margin: 0;
                    padding: 20px;
                    font-size: 12px;
                    color: #333;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 1px dashed #ccc;
                    padding-bottom: 10px;
                }
                .restaurant-name {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0;
                }
                .receipt-subtitle {
                    font-size: 12px;
                    color: #666;
                    margin: 5px 0;
                }
                .receipt-info {
                    margin: 15px 0;
                    font-size: 12px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .items-table th {
                    text-align: right;
                    padding: 5px;
                    border-bottom: 1px solid #ddd;
                    font-weight: 600;
                }
                .items-table td {
                    padding: 5px;
                    border-bottom: 1px dashed #eee;
                }
                .item-price, .item-total {
                    text-align: left;
                }
                .totals {
                    margin-top: 15px;
                    border-top: 1px dashed #ccc;
                    padding-top: 10px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                .grand-total {
                    font-weight: bold;
                    font-size: 14px;
                    border-top: 1px solid #999;
                    margin-top: 5px;
                    padding-top: 5px;
                }
                .receipt-footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 11px;
                    color: #777;
                }
                @media print {
                    body {
                        width: 80mm;
                        padding: 5mm;
                    }
                    .print-button {
                        display: none;
                    }
                }
                .print-button {
                    display: block;
                    width: 100%;
                    padding: 10px;
                    background: #42d158;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h1 class="restaurant-name">المطعم الرقمي</h1>
                <p class="receipt-subtitle">إيصال طلب</p>
            </div>
            
            <div class="receipt-info">
                <div class="info-row">
                    <span>رقم الطلب:</span>
                    <span>${order.id}</span>
                </div>
                <div class="info-row">
                    <span>التاريخ:</span>
                    <span>${formattedDate}</span>
                </div>
                <div class="info-row">
                    <span>الوقت:</span>
                    <span>${formattedTime}</span>
                </div>
    `;
    
    // Add table number if available
    if (order.tableNumber) {
        receiptContent += `
                <div class="info-row">
                    <span>رقم الطاولة:</span>
                    <span>${order.tableNumber}</span>
                </div>
        `;
    }
    
    // Add items table
    receiptContent += `
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>الصنف</th>
                        <th>السعر</th>
                        <th>العدد</th>
                        <th class="item-total">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add item rows
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        receiptContent += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        <td class="item-total">${itemTotal.toFixed(2)}</td>
                    </tr>
        `;
    });
    
    // Add totals
    receiptContent += `
                </tbody>
            </table>
            
            <div class="totals">
                <div class="total-row">
                    <span>المجموع الفرعي:</span>
                    <span>${order.subtotal.toFixed(2)} جنية</span>
                </div>
    `;
    
    // Add tax if present
    if (order.tax) {
        receiptContent += `
                <div class="total-row">
                    <span>الضريبة (${order.tax.rate || 15}%):</span>
                    <span>${order.tax.value.toFixed(2)} جنية</span>
                </div>
            `;
    }
    
    // Add service tax if present
    if (order.serviceTax) {
        receiptContent += `
                <div class="total-row">
                    <span>ضريبة الخدمة (${order.serviceTax.rate || 10}%):</span>
                    <span>${order.serviceTax.value.toFixed(2)} جنية</span>
                </div>
            `;
    }
    
    // Add discount if present
    if (order.discount) {
        receiptContent += `
                <div class="total-row discount">
                    <span>الخصم (${order.discount.discount}%):</span>
                    <span>${order.discount.value.toFixed(2)} جنية</span>
                </div>
            `;
    }
    
    // Add grand total and footer
    receiptContent += `
                <div class="total-row grand-total">
                    <span>الإجمالي:</span>
                    <span>${order.total.toFixed(2)} جنية</span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>شكراً لزيارتكم المطعم الرقمي</p>
                <p>نتمنى لكم وجبة شهية</p>
            </div>
            
            <button class="print-button" onclick="window.print();">طباعة الإيصال</button>
        </body>
        </html>
    `;
    
    // Write content to the window and print
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
    
    // Show notification
    showFixedNotification('تم إنشاء الإيصال', 'تم إنشاء إيصال الطلب بنجاح', 'success');
}

// Cancel an order
function cancelOrder() {
    // Get the current order ID
    const orderId = document.getElementById('cancel-order-button').dataset.orderId;
    
    if (!orderId) {
        showFixedNotification('خطأ', 'لم يتم العثور على معرف الطلب', 'error');
        return;
    }
    
    // Confirm cancellation
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
        return;
    }
    
    // Get orders from localStorage
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showFixedNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات الطلبات', 'error');
        return;
    }
    
    // Find the order
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        showFixedNotification('خطأ', 'لم يتم العثور على الطلب', 'error');
        return;
    }
    
    // Get table number for activity tracking
    const tableNumber = orders[orderIndex].tableNumber;
    
    // Update order status
    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].cancelledDate = new Date().toISOString();
    
    // Save updated orders
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Close the order modal
    closeOrderModal();
    
    // Display success notification
    showFixedNotification(
        'تم إلغاء الطلب',
        `تم إلغاء الطلب #${orderId} بنجاح`,
        'warning'
    );
    
    // Update the orders list
    loadActiveOrders();
    
    // Update the recent activity list
    loadRecentActivity();
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
}

// Close order details modal
function closeOrderModal() {
    // Reset buttons state
    document.getElementById('complete-order-button').disabled = false;
    document.getElementById('cancel-order-button').disabled = false;
    
    // Hide the modal
    const modal = document.getElementById('order-details-modal');
    modal.classList.remove('show');
    
    // Clear any order info that was added dynamically
    const orderInfo = document.getElementById('order-info');
    if (orderInfo) {
        orderInfo.remove();
    }
}

// Show fixed notification
function showFixedNotification(title, message, type = 'info') {
    const container = document.getElementById('fixed-notifications');
    if (!container) {
        console.error('Fixed notifications container not found');
        return;
    }
    
    // Create notification element with HTML
    const notification = document.createElement('div');
    notification.className = `fixed-notification ${type}`;
    notification.setAttribute('dir', 'rtl');
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // Use HTML for content to ensure text appears correctly
    notification.innerHTML = `
        <div class="fixed-notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="fixed-notification-content">
            <span class="fixed-notification-title">${title}</span>
            <span class="fixed-notification-message">${message}</span>
        </div>
        <button class="fixed-notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Play sound for important types
    if (type === 'error' || type === 'warning') {
        playNotificationSound();
    }
    
    // Add close button event
    const closeButton = notification.querySelector('.fixed-notification-close');
    closeButton.addEventListener('click', () => {
        dismissFixedNotification(notification);
    });
    
    // Auto dismiss after 5 seconds
    const timeout = setTimeout(() => {
        dismissFixedNotification(notification);
    }, 5000);
    
    // Store timeout
    notification.dataset.timeoutId = timeout;
    
    return notification;
}

// Dismiss fixed notification
function dismissFixedNotification(notification) {
    if (!notification.classList.contains('exiting')) {
        // Clear timeout
        if (notification.dataset.timeoutId) {
            clearTimeout(parseInt(notification.dataset.timeoutId));
        }
        
        // Add exit animation
        notification.classList.add('exiting');
        
        // Remove after animation completes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Send notification to customer (in a real app, this would be a push notification or SMS)
function sendCustomerNotification(orderId, tableNumber, total) {
    // In a real app, this would connect to a notification service
    console.log(`Sending notification for order ${orderId} to table ${tableNumber} for total ${total}`);
    
    // Show a notification just for UX purposes
    showFixedNotification(
        'تم إرسال إشعار',
        `تم إرسال إشعار بإكمال الطلب للطاولة رقم ${tableNumber}`,
        'info'
    );
    
    // In a real app, you might do something like this:
    // 
    // fetch('/api/send-notification', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         orderId,
    //         tableNumber,
    //         total,
    //         message: 'تم إكمال طلبك بنجاح. شكراً لك!'
    //     }),
    // })
    // .then(response => response.json())
    // .then(data => {
    //     console.log('Notification sent successfully:', data);
    // })
    // .catch(error => {
    //     console.error('Error sending notification:', error);
    //     showFixedNotification('خطأ', 'فشل في إرسال الإشعار للعميل', 'error');
    // });
}

// Refresh orders list after completing or cancelling an order
function refreshOrdersList(completedOrderId) {
    // In a real app, you would fetch the updated list from the server
    // For now, we'll just remove the completed order from the DOM
    const orderElement = document.querySelector(`.order-card[data-order-id="${completedOrderId}"]`);
    if (orderElement) {
        orderElement.remove();
    }
    
    // Check if there are no more orders
    const ordersGrid = document.getElementById('orders-grid');
    if (ordersGrid.children.length === 0) {
        const noOrdersMessage = document.getElementById('no-orders-message');
        ordersGrid.appendChild(noOrdersMessage);
    }
}

// Add to recent activity
function addToRecentActivity(activityData) {
    const activityList = document.getElementById('activity-list');
    
    // Remove empty message if it exists
    const emptyMessage = activityList.querySelector('.empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // Create new activity item
    const activityItem = document.createElement('div');
    activityItem.className = `activity-item ${activityData.type}`;
    
    const iconClass = activityData.type === 'completed' ? 'fa-check-circle' : 'fa-times-circle';
    const actionText = activityData.type === 'completed' ? 'تم إنهاء' : 'تم إلغاء';
    
    activityItem.innerHTML = `
        <div class="activity-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="activity-details">
            <div class="activity-title">${actionText} طلب الطاولة ${activityData.tableNumber}</div>
            <div class="activity-meta">
                <span>${activityData.time}</span>
                <span>${activityData.total.toFixed(2)} جنية</span>
            </div>
        </div>
    `;
    
    // Add to the top of the list
    activityList.insertBefore(activityItem, activityList.firstChild);
}

// Helper function to get order table number
function getOrderTableNumber(orderId) {
    // In a real app, you would get this from your data store
    const mockOrders = [
        { id: 'ORD12345', tableNumber: 3, total: 144.33 },
        { id: 'ORD12346', tableNumber: 5, total: 109.25 }
    ];
    
    const order = mockOrders.find(o => o.id === orderId);
    return order ? order.tableNumber : 0;
}

// Helper function to get order total
function getOrderTotal(orderId) {
    // In a real app, you would get this from your data store
    const mockOrders = [
        { id: 'ORD12345', tableNumber: 3, total: 144.33 },
        { id: 'ORD12346', tableNumber: 5, total: 109.25 }
    ];
    
    const order = mockOrders.find(o => o.id === orderId);
    return order ? order.total : 0;
}

// Helper function to get current time
function getCurrentTime() {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Global function to view order details (used in HTML onclick)
window.viewOrderDetails = viewOrderDetails; 

// Start auto-refresh for orders (every 30 seconds)
function startAutoRefresh() {
    // Check for new orders every 10 seconds
    setInterval(checkForNewOrders, 10000);
    
    // Refresh displayed orders and activity every 30 seconds
    setInterval(() => {
        loadActiveOrders();
        loadRecentActivity();
    }, 30000);
    
    // In a real application, this would use WebSockets or a similar technology
    // to get real-time updates from the server
}

// Check for new orders periodically
function checkForNewOrders() {
    // In a real app, this would check with a server for new orders
    // For our demo, we'll check localStorage for any new pending orders
    
    let orders = [];
    try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        return;
    }
    
    // Get pending orders that haven't been notified yet
    const newOrders = orders.filter(order => 
        order.status === 'pending' && 
        !order.notified
    );
    
    if (newOrders.length > 0) {
        // Play notification sound
        playNotificationSound();
        
        // Show notification for each new order
        newOrders.forEach(order => {
            // Mark as notified
            order.notified = true;
            
            // Show notification
            showFixedNotification(
                'طلب جديد!',
                `تم استلام طلب جديد للطاولة رقم ${order.tableNumber || '0'} بقيمة ${order.total.toFixed(2)} جنية`,
                'info'
            );
            
            // Highlight the order in UI
            setTimeout(() => {
                const orderElement = document.querySelector(`.order-card[data-order-id="${order.id}"]`);
                if (orderElement) {
                    orderElement.classList.add('new-order');
                    setTimeout(() => {
                        orderElement.classList.remove('new-order');
                    }, 5000);
                }
            }, 500);
        });
        
        // Save back to localStorage with notified flag
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Refresh orders display
        loadActiveOrders();
    }
}

// Play notification sound
function playNotificationSound() {
    // Get the audio element
    const audio = document.getElementById('notification-sound');
    
    // Try to play the sound
    if (audio) {
        audio.currentTime = 0; // Reset to start in case it was already playing
        audio.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    }
} 