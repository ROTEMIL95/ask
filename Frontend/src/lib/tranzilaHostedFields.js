/**
 * Tranzila Hosted Fields Helper
 *
 * This module provides helper functions for working with Tranzila's Hosted Fields SDK.
 * The SDK is loaded globally via script tag in index.html.
 */

/**
 * Check if TzlaHostedFields SDK is loaded
 * @returns {boolean}
 */
export const isTranzilaSDKLoaded = () => {
  return typeof window.TzlaHostedFields !== 'undefined';
};

/**
 * Create Tranzila Hosted Fields instance with site styling
 * @param {Object} options - Configuration options
 * @param {Object} options.fields - Field selectors configuration
 * @param {Object} options.styles - Custom styles (optional)
 * @returns {Object} Hosted Fields instance
 */
export const createHostedFields = (options = {}) => {
  if (!isTranzilaSDKLoaded()) {
    throw new Error('TzlaHostedFields SDK is not loaded. Make sure the script tag is in index.html');
  }

  const defaultFields = {
    credit_card_number: {
      selector: '#card-number',
      placeholder: '1234 5678 9012 3456',
      tabindex: 1
    },
    cvv: {
      selector: '#cvv',
      placeholder: '123',
      tabindex: 3
    },
    expiry: {
      selector: '#expiry',
      placeholder: 'MM/YY',
      tabindex: 2
    },
    card_holder_id_number: {
      selector: '#israeli-id',
      placeholder: '123456789',
      tabindex: 4
    }
  };

  // Default styles matching the site design
  const defaultStyles = {
    'input': {
      'font-size': '15px',
      'color': '#fff',
      'background-color': '#0e1736',
      'border': 'none',
      'padding': '12px',
      'border-radius': '0',
      'font-family': 'inherit',
      'width': '100%',
      'box-sizing': 'border-box'
    },
    'input::placeholder': {
      'color': '#9ca3af',
      'opacity': '0.7'
    },
    'input:focus': {
      'outline': 'none'
    },
    '.invalid': {
      'border-color': '#ef4444'
    },
    '.valid': {
      'border-color': '#10b981'
    }
  };

  const config = {
    fields: { ...defaultFields, ...options.fields },
    styles: { ...defaultStyles, ...options.styles },
    autocomplete: options.autocomplete || false,
    sandbox: options.sandbox || false
  };


  try {
    const instance = window.TzlaHostedFields.create(config);

    return instance;
  } catch (error) {

    throw error;
  }
};

/**
 * Charge payment using hosted fields
 * @param {Object} hostedFields - Hosted Fields instance
 * @param {Object} params - Payment parameters
 * @param {string} params.terminal_name - Tranzila terminal name
 * @param {string} params.sum - Amount to charge
 * @param {string} params.currency - Currency code (1 = ILS)
 * @param {string} params.contact - Customer name
 * @param {string} params.email - Customer email
 * @param {Function} callback - Callback function (err, response)
 */
export const chargePayment = (hostedFields, params, callback) => {

  if (!hostedFields) {

    callback(new Error('Hosted Fields instance not initialized'), null);
    return;
  }

  const paymentParams = {
    terminal_name: params.terminal_name,
    amount: params.amount, // Changed from 'sum' to match Tranzila API docs
    currency_code: params.currency_code || "ILS", // ISO code string: ILS, USD, EUR
    tran_mode: params.tran_mode || 'A', // Changed from 'tranmode', A=debit
    contact: params.contact,
    email: params.email,
    pdesc: params.pdesc || 'Payment',
    // Include handshake token and validation flag if provided
    ...(params.thtk && { thtk: params.thtk }),
    ...(params.new_process && { new_process: params.new_process }),
    ...params.extra // Any additional parameters
  };


  try {
    hostedFields.charge(paymentParams, (err, response) => {

      if (err) {

        callback(err, null);
      } else {

        callback(null, response);
      }
    });

  } catch (error) {

    callback(error, null);
  }
};

/**
 * Setup event listeners for hosted fields
 * @param {Object} hostedFields - Hosted Fields instance
 * @param {Object} handlers - Event handlers
 * @param {Function} handlers.onReady - Called when fields are ready
 * @param {Function} handlers.onValidityChange - Called when field validity changes
 * @param {Function} handlers.onCardTypeChange - Called when card type is detected
 * @param {Function} handlers.onFocus - Called when field is focused
 * @param {Function} handlers.onBlur - Called when field loses focus
 */
export const setupEventListeners = (hostedFields, handlers = {}) => {
  if (!hostedFields) {

    return;
  }

  if (handlers.onReady) {
    hostedFields.onEvent('ready', () => {

      handlers.onReady();
    });
  }

  if (handlers.onValidityChange) {
    hostedFields.onEvent('validityChange', (event) => {

      handlers.onValidityChange(event);
    });
  }

  if (handlers.onCardTypeChange) {
    hostedFields.onEvent('cardTypeChange', (event) => {

      handlers.onCardTypeChange(event);
    });
  }

  if (handlers.onFocus) {
    hostedFields.onEvent('focus', (event) => {
      handlers.onFocus(event);
    });
  }

  if (handlers.onBlur) {
    hostedFields.onEvent('blur', (event) => {
      handlers.onBlur(event);
    });
  }
};

/**
 * Get user-friendly error message
 * @param {Object|string} error - Error object or message
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && error.message) {
    return error.message;
  }

  if (error && error.response) {
    return error.response.message || 'Payment failed';
  }

  return 'An unexpected error occurred. Please try again.';
};
