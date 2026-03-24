import { ICustomer } from "./customer";
import { IProcessPaymentRequest } from "./checkout";

export interface IInlineCheckoutBaseOptions {
  mode?: "production" | "sandbox" | "stage" | "development";
  apiKey: string;
  returnUrl: string;
  callBack?: (response: any) => void;
  signatures?: {
    transaction?: string;
    customer?: string;
  };
}

export interface IConfigureCheckout extends Partial<IProcessPaymentRequest> {
  customer: ICustomer;
  secureToken: string;
}

export interface IApiError {
  code: string;
  body: Record<string, string> | string;
  name: string;
  message: string;
}

export interface IPublicError {
  status: string;
  code: number;
  message: string;
  detail: Record<string, any> | string;
}

export interface IBaseCallback {}

// ── Shared card field events & styles ────────────────────────────────────────

export interface ICardEventPayload {
  elementType: string;
  isEmpty: boolean;
  isFocused: boolean;
  isValid: boolean;
  /** Value is empty in production for sensitive fields (card_number, cvv). */
  value?: string;
}

export interface ICardInputEvents {
  onChange?: (event: ICardEventPayload) => void;
  onFocus?: (event: ICardEventPayload) => void;
  onBlur?: (event: ICardEventPayload) => void;
}

export interface ICardEvents {
  cardNumberEvents?: ICardInputEvents;
  cvvEvents?: ICardInputEvents;
  monthEvents?: ICardInputEvents;
  yearEvents?: ICardInputEvents;
  cardHolderEvents?: ICardInputEvents;
}

export interface ICardInputStyles {
  base?: Record<string, any>;
  focus?: Record<string, any>;
  complete?: Record<string, any>;
  invalid?: Record<string, any>;
  empty?: Record<string, any>;
  cardIcon?: Record<string, any>;
  global?: Record<string, any>;
}

export interface ICardFormStyles {
  inputStyles?: ICardInputStyles;
  labelStyles?: { base?: Record<string, any> };
  /** Error text styles. Maps to Skyflow's errorTextStyles internally. */
  errorStyles?: { base?: Record<string, any> };
}

export interface ICardStyles {
  /** Global styles applied to all fields unless overridden per-field. */
  cardForm?: ICardFormStyles;
  /** Per-field style overrides. */
  cardholderName?: ICardFormStyles;
  cardNumber?: ICardFormStyles;
  cvv?: ICardFormStyles;
  expirationMonth?: ICardFormStyles;
  expirationYear?: ICardFormStyles;
  /** Show the card network icon inside the card_number field. Default: true. */
  enableCardIcon?: boolean;
}
