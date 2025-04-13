/**
 * Utility functions for handling API responses
 */

/**
 * Extract data from API response, handling both new and old response formats.
 * New format: { success: true, message: string, data: any }
 * Old format: directly contains the data
 * 
 * @param {Object} response - Axios response object
 * @returns {any} The extracted data
 */
export const extractResponseData = (response) => {
    if (!response || !response.data) {
        return null;
    }

    // Handle new response format
    if (response.data.hasOwnProperty('success') && response.data.hasOwnProperty('data')) {
        // If success is false, we should handle it as an error elsewhere
        if (response.data.success === false) {
            return null;
        }
        return response.data.data;
    }

    // Return old format directly
    return response.data;
};

/**
 * Check if an API response indicates an error.
 * New format: { success: false, message: string }
 * 
 * @param {Object} response - Axios response object
 * @returns {boolean} True if the response indicates an error
 */
export const isErrorResponse = (response) => {
    if (!response || !response.data) {
        return true;
    }

    return response.data.success === false;
};

/**
 * Extract error message from API response.
 * 
 * @param {Error} error - Axios error object
 * @returns {string} The error message
 */
export const extractErrorMessage = (error) => {
    // Direct error message from response
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    // Error message from error object
    if (error.message) {
        return error.message;
    }

    // Default error message
    return 'An unexpected error occurred';
};

/**
 * Ensure a value is an array.
 * 
 * @param {any} value - Value to check
 * @returns {Array} The value as an array, or an empty array if not arrayable
 */
export const ensureArray = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (value === null || value === undefined) {
        return [];
    }

    // Return empty array for values that can't be meaningfully treated as arrays
    return [];
}; 