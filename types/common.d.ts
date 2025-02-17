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
