import { IBaseCallback, IConfigureCheckout, IInlineCheckoutBaseOptions } from "./common";
import { IProcessPaymentRequest, IStartCheckoutResponse } from "./checkout";
import { ITransaction } from "./transaction";

export class InlineCheckout {
  constructor(options: IInlineCheckoutOptions);

  /**
   * The configureCheckout function allows you to set initial information, such as the customer's email, which is used to retrieve a list of saved cards.
   * @param {import("../types").IConfigureCheckout} data - Configuration data including customer information and potentially other settings.
   * @returns {void}.
   * @public
   */
  configureCheckout(data: IConfigureCheckout): void;

  /**
   * Injects the checkout into the DOM and initializes it.
   * Checks for an existing container and sets up an observer if needed.
   * @returns {void}
   * @public
   */
  injectCheckout(): Promise<void>;

  /**
   * Processes a payment.
   * @param {import("../types").IProcessPaymentRequest} data - Payment data including customer, cart, and other relevant information.
   * @returns {Promise<import("../types").IStartCheckoutResponse>} A promise that resolves with the payment response or 3DS redirect or is rejected with an error.
   *
   * @throws {Error} Throws an error if the checkout process fails. The error object contains
   * additional `details` property with the response from the server if available.
   * @property {import("../types").IStartCheckoutErrorResponse} error.details - The response body from the server when an error occurs.
   *
   * @public
   */
  payment(data: IProcessPaymentRequest): Promise<IStartCheckoutResponse>;

  /**
   * Verifies the 3DS transaction status.
   * @returns {Promise<import("../types").ITransaction | void>} The result of the 3DS verification and checkout resumption.
   * @public
   */
  verify3dsTransaction(): Promise<ITransaction | void>;

  /**
   * Removes the checkout from the DOM and cleans up associated resources.
   *
   * This method performs the following actions:
   * 1. Resets the injection status flags for the checkout, cards, and APMs.
   * 2. Aborts any ongoing requests using the AbortController.
   * 3. Creates a new AbortController for future use.
   * 4. Clears any existing injection intervals.
   *
   * Note: This method should be called when you want to completely remove
   * the checkout from the page and reset its state.
   *
   * @returns {void}
   * @public
   */
  removeCheckout(): void;
}

export type CustomizationOptions = {
  displayMode?: "light" | "dark";
  saveCards?: {
    showSaveCardOption?: boolean;
    showSaved?: boolean;
    autoSave?: boolean;
  };
  paymentButton?: {
    show?: boolean;
    text?: string;
    showAmount?: boolean;
  };
  cancelButton?: {
    show?: boolean;
    text?: string;
  };
  paymentMethods?: {
    show?: boolean;
  };
  cardForm?: {
    show?: boolean;
  };
  showMessages?: boolean;
};
export interface IInlineCallbacks extends IBaseCallback {
  onCancel?: () => Promise<void>;
}

export interface IInlineCheckoutOptions extends IInlineCheckoutBaseOptions {
  styles?: Record<string, string>;
  customization?: CustomizationOptions;
  callbacks?: IInlineCallbacks;
}
