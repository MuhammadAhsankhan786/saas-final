/**
 * RBAC Watchdog - Runtime protection for Reception role
 * Wraps fetchWithAuth to block/rewrite unauthorized API calls
 */

import { isAllowedEndpoint, getStaffEquivalentEndpoint } from '../../rbac/reception-role-validator.js';
import { notify } from './toast';

/**
 * Wraps fetchWithAuth to add RBAC protection
 * @param {Function} originalFetchWithAuth - The original fetchWithAuth function
 * @returns {Function} - Wrapped function with RBAC protection
 */
export function wrapFetchWithAuth(originalFetchWithAuth) {
  return async function fetchWithAuthWithRBAC(url, options = {}) {
    // Get current user role
    let userRole = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userRole = user.role;
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
    
    // Only apply RBAC for reception role
    if (userRole === 'reception') {
      const originalUrl = url;
      
      // Check if URL contains /admin/
      if (url.includes('/admin/')) {
        console.warn(`🚨 RBAC warning: role=reception attempted admin endpoint: ${url}`);
        
        // Try to get staff-equivalent endpoint
        const staffEquivalent = getStaffEquivalentEndpoint(url);
        
        if (staffEquivalent) {
          console.log(`✅ RBAC fix applied: ${url} → ${staffEquivalent}`);
          url = staffEquivalent;
        } else {
          // Block the request entirely
          const errorMessage = `Access restricted for Reception role: ${originalUrl}`;
          notify.error('Access restricted for Reception role');
          console.error(`❌ RBAC blocked: ${originalUrl}`);
          
          // Throw an error to prevent the request
          throw new Error(errorMessage);
        }
      }
      
      // Validate endpoint is allowed
      if (!isAllowedEndpoint(url)) {
        // For unknown endpoints that don't start with /staff/, block them
        if (!url.startsWith('/staff/') && !url.includes('/client/appointments/form-data')) {
          console.warn(`🚨 RBAC warning: role=reception attempted unauthorized endpoint: ${url}`);
          notify.error('Access restricted for Reception role');
          throw new Error(`Unauthorized endpoint for Reception role: ${url}`);
        }
      }
    }
    
    // Call original fetchWithAuth with potentially modified URL
    return originalFetchWithAuth(url, options);
  };
}

/**
 * Initialize RBAC Watchdog by wrapping fetchWithAuth
 * This should be called once during app initialization
 */
export function initRBACWatchdog() {
  console.log('🛡️ RBAC Watchdog initialized for Reception role');
  
  // The actual wrapping will happen when api.js loads
  // We export this function to be called from api.js
  return {
    wrapFetchWithAuth
  };
}

