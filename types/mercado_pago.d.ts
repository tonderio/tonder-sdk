export interface IMPConfigRequest {
  payment_methods?: IMPPreferencePaymentMethod;
  binary_mode?: boolean;
  shipments?: IMPPreferenceShipment;
  back_urls?: IMPPreferenceBackUrl;
  statement_descriptor?: string;
  additional_info?: string;
  auto_return?: "approved" | "all";
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  marketplace?: string;
  marketplace_fee?: number;
  differential_pricing?: {
    id: number;
  };
  tracks?: {
    type: "google_ad" | "facebook_ad";
    values: {
      conversion_id?: string;
      conversion_label?: string;
      pixel_id?: string;
    };
  }[];
}
export interface IMPPreferencePaymentMethod {
  excluded_payment_methods?: {
    id: string;
  }[];
  excluded_payment_types?: {
    id: string;
  }[];
  default_payment_method_id?: string;
  installments?: number;
  default_installments?: number;
}
export interface IMPPreferenceShipment {
  mode?: "customer" | "me2" | "not_specified";
  local_pickup?: boolean;
  dimensions?: string;
  default_shipping_method?: number;
  free_methods?: {
    id: number;
  }[];
  cost?: number;
  free_shipping?: boolean;
  receiver_address?: {
    zip_code?: string;
    street_name?: string;
    city_name?: string;
    state_name?: string;
    street_number?: number;
    floor?: string;
    apartment?: string;
    country_name?: string;
  };
}
export interface IMPPreferenceBackUrl {
  success?: string;
  pending?: string;
  failure?: string;
}
