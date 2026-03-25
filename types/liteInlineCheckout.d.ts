import {
  IConfigureCheckout,
  IInlineCheckoutBaseOptions,
  ICardEvents,
  ICardInputStyles,
  ICardStyles,
} from "./common";
import { ICustomerCardsResponse, ISaveCardResponse } from "./card";
import { IPaymentMethod } from "./paymentMethod";
import { IProcessPaymentRequest, IStartCheckoutResponse } from "./checkout";
import { ITransaction } from "./transaction";

// ── CardField type ────────────────────────────────────────────────────────────

export type CardFieldValue =
  | "card_number"
  | "cvv"
  | "expiration_month"
  | "expiration_year"
  | "cardholder_name";

// ── Customization ─────────────────────────────────────────────────────────────

export interface ILiteCustomizationLabels {
  cardholder_name?: string;
  card_number?: string;
  cvv?: string;
  expiration_month?: string;
  expiration_year?: string;
}

export interface ILiteCustomization {
  styles?: ICardStyles;
  labels?: ILiteCustomizationLabels;
  placeholders?: ILiteCustomizationLabels;
}

// ── mountCardFields ───────────────────────────────────────────────────────────

export type ILiteFieldEntry = CardFieldValue | { field: CardFieldValue; container_id?: string };

export interface ILiteMountCardFieldsRequest {
  fields: ILiteFieldEntry[];
  /**
   * Skyflow ID of the card being updated. When set, mounts CVV in context
   * `update:<card_id>` and appends `_<card_id>` to default container IDs.
   */
  card_id?: string;
  /**
   * Controls which previously mounted contexts are unmounted before mounting.
   * - `"all"` (default): unmount all contexts
   * - `"current"`: unmount only the same context
   * - `"none"`: do not unmount anything
   * - any other string: unmount that specific context key
   */
  unmount_context?: "all" | "current" | "none" | (string & {});
}

// ── revealCardFields ──────────────────────────────────────────────────────────

/** CVV cannot be revealed (PCI DSS req. 3.2.1). */
export type ILiteRevealableField = Exclude<CardFieldValue, "cvv">;

export interface ILiteRevealElementStyles {
  inputStyles?: ICardInputStyles;
  labelStyles?: { base?: Record<string, any> };
  errorTextStyles?: { base?: Record<string, any> };
}

export interface ILiteRevealField {
  field: ILiteRevealableField;
  /** Default: `#reveal_<field>` */
  container_id?: string;
  altText?: string;
  label?: string;
  styles?: ILiteRevealElementStyles;
}

export interface ILiteRevealCardFieldsRequest {
  fields: Array<ILiteRevealableField | ILiteRevealField>;
  /** Global styles applied to all reveal elements. */
  styles?: ILiteRevealElementStyles;
}

// ── payment() override ────────────────────────────────────────────────────────

/**
 * Payment request for LiteInlineCheckout.
 * `card` only accepts a saved-card `skyflow_id` string.
 * Omit `card` entirely to pay with the currently mounted card fields.
 */
export interface ILiteProcessPaymentRequest extends Omit<IProcessPaymentRequest, "card"> {
  card?: string;
}

// ── Constructor options ───────────────────────────────────────────────────────

export interface IInlineLiteCheckoutOptions extends IInlineCheckoutBaseOptions {
  customization?: ILiteCustomization;
  events?: ICardEvents;
}

// ── Class declaration ─────────────────────────────────────────────────────────

export class LiteInlineCheckout {
  constructor(options: IInlineLiteCheckoutOptions);

  /**
   * Sets initial checkout information (customer, cart, etc.).
   */
  configureCheckout(data: IConfigureCheckout): void;

  /**
   * Initializes the checkout environment (fetches merchant data, etc.).
   * Must be called before mountCardFields().
   */
  injectCheckout(): Promise<void>;

  /**
   * Mounts Skyflow secure iframe inputs into developer-provided containers.
   * Call this after injectCheckout() and before payment() or saveCustomerCard().
   */
  mountCardFields(request: ILiteMountCardFieldsRequest): Promise<void>;

  /**
   * Unmounts Skyflow elements previously mounted via mountCardFields().
   * @param context - `"all"` unmounts everything; otherwise unmounts by context key.
   */
  unmountCardFields(context?: string): void;

  /**
   * Reveals tokenized card data in developer-provided containers.
   * Must be called after a successful saveCustomerCard() or payment() with a new card.
   * CVV is never revealed (PCI DSS req. 3.2.1).
   */
  revealCardFields(request: ILiteRevealCardFieldsRequest): Promise<void>;

  /**
   * Processes a payment using the mounted Skyflow card fields or a saved card skyflow_id.
   */
  payment(data: ILiteProcessPaymentRequest): Promise<IStartCheckoutResponse>;

  /**
   * Verifies the 3DS transaction status.
   */
  verify3dsTransaction(): Promise<ITransaction | void>;

  /**
   * Retrieves the list of cards associated with the customer.
   */
  getCustomerCards(): Promise<ICustomerCardsResponse>;

  /**
   * Saves a card using data collected from the mounted Skyflow fields.
   * Call mountCardFields() with all required fields before calling this method.
   */
  saveCustomerCard(): Promise<ISaveCardResponse>;

  /**
   * Removes a card from the customer's account.
   * @param skyflowId - The Skyflow ID of the card to delete.
   */
  removeCustomerCard(skyflowId: string): Promise<void>;

  /**
   * Retrieves the list of available Alternative Payment Methods (APMs).
   */
  getCustomerPaymentMethods(): Promise<IPaymentMethod[]>;
}
