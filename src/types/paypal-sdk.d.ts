/**
 * Minimal ambient types for the PayPal JS SDK (Everplans Money Prompt 8) -
 * loaded client-side via a plain `<script src="https://www.paypal.com/sdk/js?...">`
 * tag (`next/script`), never an npm package (`@paypal/paypal-js`/
 * `@paypal/react-paypal-js` would be an unnecessary dependency for what
 * amounts to using a global `window.paypal` object). Only the shapes this
 * codebase actually calls are declared - not a full SDK type surface.
 *
 * `createOrder`/`onApprove` both call back into Everplans' own Server
 * Actions (`checkout/actions.ts`) - the SDK itself never decides a payment
 * succeeded, it only reports "the customer approved this specific PayPal
 * order," which those actions then independently verify.
 */

declare global {
  interface PayPalHostedField {
    render: (container: string) => Promise<void>;
  }

  interface PayPalCardFieldsState {
    isFormValid: boolean;
    fields: Record<string, { isValid: boolean } | undefined>;
  }

  interface PayPalCardFieldsInstance {
    NumberField: (options?: { placeholder?: string }) => PayPalHostedField;
    ExpiryField: (options?: { placeholder?: string }) => PayPalHostedField;
    CVVField: (options?: { placeholder?: string }) => PayPalHostedField;
    NameField: (options?: { placeholder?: string }) => PayPalHostedField;
    submit: (options?: { billingAddress?: { postalCode?: string; countryCode?: string } }) => Promise<void>;
    getState: () => Promise<PayPalCardFieldsState>;
  }

  interface PayPalCardFieldsOptions {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void> | void;
    onError?: (error: unknown) => void;
    style?: Record<string, Record<string, string>>;
  }

  interface PayPalButtonsInstance {
    render: (container: string) => Promise<void>;
    close?: () => Promise<void>;
  }

  interface PayPalButtonsOptions {
    style?: { layout?: "vertical" | "horizontal"; shape?: "rect" | "pill"; label?: string; height?: number };
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void> | void;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }

  interface PayPalNamespace {
    Buttons: (options: PayPalButtonsOptions) => PayPalButtonsInstance;
    CardFields: {
      (options: PayPalCardFieldsOptions): PayPalCardFieldsInstance;
      isEligible: () => boolean;
    };
  }

  interface Window {
    paypal?: PayPalNamespace;
  }
}

export {};
