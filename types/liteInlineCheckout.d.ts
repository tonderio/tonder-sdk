import { IConfigureCheckout, IInlineCheckoutBaseOptions } from "./common";
import { ICustomerCardsResponse, ISaveCardRequest, ISaveCardResponse } from "./card";
import { IPaymentMethod } from "./paymentMethod";
import { IProcessPaymentRequest, IStartCheckoutResponse } from "./checkout";
import { ITransaction } from "./transaction";

export class LiteInlineCheckout {
  constructor(options: IInlineLiteCheckoutOptions);

  /**
   * The configureCheckout function allows you to set initial information, such as the customer's email, which is used to retrieve a list of saved cards.
   * @param {import("../types").IConfigureCheckout} data - Configuration data including customer information and potentially other settings.
   * @returns {Promise<void>}.
   * @public
   */
  configureCheckout(data: IConfigureCheckout): void;

  /**
   * Initializes and prepares the checkout for use.
   * This method set up the initial environment.
   * @returns {Promise<void>} A promise that resolves when the checkout has been initialized.
   * @throws {Error} If there's any problem during the checkout initialization.
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
   * Retrieves the list of cards associated with a customer.
   * @returns {Promise<import("../types").ICustomerCardsResponse>} A promise that resolves with the customer's card data.
   *
   * @throws {import("../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  getCustomerCards(): Promise<ICustomerCardsResponse>;

  /**
   * Saves a card to a customer's account. This method can be used to add a new card
   * or update an existing one.
   * @param {import("../types").ISaveCardRequest} card - The card information to be saved.
   * @returns {Promise<import("../types").ISaveCardResponse>} A promise that resolves with the saved card data.
   *
   * @throws {import("../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  saveCustomerCard(card: ISaveCardRequest): Promise<ISaveCardResponse>;

  /**
   * Removes a card from a customer's account.
   * @param {string} skyflowId - The unique identifier of the card to be deleted.
   * @returns {Promise<string>} A promise that resolves when the card is successfully deleted.
   *
   * @throws {import("../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  removeCustomerCard(skyflowId: string): Promise<void>;

  /**
   * Retrieves the list of available Alternative Payment Methods (APMs).
   * @returns {Promise<import("../types").IPaymentMethod[]>} A promise that resolves with the list of APMs.
   *
   * @throws {import("../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  getCustomerPaymentMethods(): Promise<IPaymentMethod[]>;
}

export interface IInlineLiteCheckoutOptions extends IInlineCheckoutBaseOptions {}
