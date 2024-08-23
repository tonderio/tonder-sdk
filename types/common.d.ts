import { ICustomer } from "./customer";

export interface IInlineCheckoutBaseOptions {
  mode?: "production" | "sandbox" | "stage" | "development";
  apiKey: string;
  returnUrl: string;
  callBack?: (response: any) => void;
}

export interface IConfigureCheckout {
  customer: ICustomer;
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
