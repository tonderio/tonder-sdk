import { ICustomer } from "./customer";

export interface IStartCheckoutRequestBase {
  name: any;
  last_name: string;
  email_client: any;
  phone_number: any;
  return_url?: string;
  id_product: string;
  quantity_product: number;
  id_ship: string;
  instance_id_ship: string;
  amount: any;
  title_ship: string;
  description: string;
  device_session_id: any;
  token_id: string;
  order_id: any;
  business_id: any;
  payment_id: any;
  source: string;
  browser_info?: any;
  metadata: any;
  currency: string;
}

export type IStartCheckoutRequestWithCard = IStartCheckoutRequestBase & {
  card: any;
  payment_method?: never;
};

export type IStartCheckoutRequestWithPaymentMethod = IStartCheckoutRequestBase & {
  card?: never;
  payment_method: string;
};

export type IStartCheckoutRequest =
  | IStartCheckoutRequestWithCard
  | IStartCheckoutRequestWithPaymentMethod;

export interface IStartCheckoutIdRequest {
  checkout_id: string;
}

export interface IStartCheckoutErrorResponse {
  status: string;
  message: string;
  psp_response: [
    {
      status: number;
      response: Object;
    },
  ];
  checkout_id: string;
  is_route_finished: boolean;
}

export interface IStartCheckoutResponse {
  status: string;
  message: string;
  psp_response: Record<string, any>;
  checkout_id: string;
  is_route_finished: Boolean;
  transaction_status: string;
  transaction_id: number;
  payment_id: number;
  provider: string;
  next_action: {
    redirect_to_url: {
      url: string;
      return_url: string;
      verify_transaction_status_url: string;
    };
    iframe_resources?: {
      iframe: string;
    };
  };
  actions: IStartCheckoutActionResponse[];
}

export interface IStartCheckoutActionResponse {
  name: string;
  url: string;
  method: string;
}

export interface IItem {
  description: string;
  quantity: number;
  price_unit: number;
  discount: number;
  taxes: number;
  product_reference: string | number;
  name: string;
  amount_total: number;
}

export interface IProcessPaymentRequest {
  customer: ICustomer;
  cart: {
    total: string | number;
    items: IItem[];
  };
  metadata?: Record<string, any>;
  currency?: string;
  payment_method?: string;
  card?: ICardFields | string;
}

export interface ICardFields {
  card_number: string;
  cvv: string;
  expiration_month: string;
  expiration_year: string;
  cardholder_name: string;
}
