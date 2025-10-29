// Toast Notification Utility
// Wraps Sonner to provide consistent notification API across the app

import { toast } from "sonner";

/**
 * Central toast notification utility
 * Provides success, error, info, loading, and promise-based notifications
 */
export const notify = {
  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {object} options - Optional configuration
   */
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {object} options - Optional configuration
   */
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {object} options - Optional configuration
   */
  info: (message, options = {}) => {
    return toast.info(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {object} options - Optional configuration
   */
  warning: (message, options = {}) => {
    return toast.warning(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show loading notification
   * @param {string} message - Loading message
   * @param {object} options - Optional configuration
   * @returns {string|number} - Toast ID for dismissal
   */
  loading: (message, options = {}) => {
    return toast.loading(message, {
      duration: Infinity,
      ...options,
    });
  },

  /**
   * Dismiss a specific toast
   * @param {string|number} toastId - Toast ID returned from loading/promise
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Promise-based notification with loading, success, and error states
   * @param {Promise} promise - Promise to track
   * @param {object} messages - { loading, success, error }
   * @returns {Promise} - Same promise
   */
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error || ((err) => err?.message || "An error occurred"),
    });
  },
};

export default notify;

