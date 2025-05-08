(function() {
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on an admin page
        const isAdminPage = window.location.pathname.includes('/admin/');
        
        // If this is an admin page, only track if authenticated
        if (isAdminPage) {
            // Check if the user is authenticated before tracking
            if (isAuthenticated()) {
                trackVisit();
            }
        } else {
            // For non-admin pages, always track visits
            trackVisit();
        }
    });
    
    /**
     * Check if user is authenticated for admin pages
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
     * Track a new website visit
     */
    function trackVisit() {
        try {
            console.log('Tracking visitor...');
            
            // Get device type
            const deviceType = getDeviceType();
            
            // Get browser info
            const browserInfo = getBrowserInfo();
            
            // Create visitor record
            const visitorData = {
                id: generateUniqueId(),
                ipAddress: "Client IP",
                deviceType: deviceType,
                browser: browserInfo,
                timestamp: new Date().toISOString(),
                entryPage: window.location.pathname,
                referrer: document.referrer || 'direct'
            };
            
            // Get current visitors
            let visitors = [];
            const storedVisitors = localStorage.getItem('visitors');
            
            if (storedVisitors) {
                visitors = JSON.parse(storedVisitors);
            }
            
            // Add to visitors array
            visitors.push(visitorData);
            
            // Limit stored visitors to most recent 500 for performance
            if (visitors.length > 500) {
                visitors = visitors.slice(-500);
            }
            
            // Save to localStorage
            localStorage.setItem('visitors', JSON.stringify(visitors));
            
            // Optional: Dispatch an event to notify other parts of the app
            const event = new CustomEvent('visitor_tracked', { detail: visitorData });
            document.dispatchEvent(event);
            
            console.log('Visit tracked successfully');
        } catch (error) {
            console.error('Error tracking visit:', error);
        }
    }
    
    /**
     * Generate a unique ID for the visitor
     */
    function generateUniqueId() {
        // Simple implementation of RFC4122 version 4 UUID
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Detect device type based on screen size and user agent
     */
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }
    
    /**
     * Get browser information
     */
    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.indexOf('Chrome') > -1) {
            browser = 'Chrome';
        } else if (ua.indexOf('Safari') > -1) {
            browser = 'Safari';
        } else if (ua.indexOf('Firefox') > -1) {
            browser = 'Firefox';
        } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) {
            browser = 'Internet Explorer';
        } else if (ua.indexOf('Edge') > -1) {
            browser = 'Edge';
        } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
            browser = 'Opera';
        }
        
        return browser;
    }
})(); 