/**
 * Optional customer billing address. Every field is optional — provide as much as you
 * have. Some payment methods may require it; when in doubt, send the full address. It is
 * passed at the root of the payment request (alongside `customer`), not inside `customer`.
 */
export type IBillingAddress = {
  street?: string;
  street2?: string;
  state?: string;
  country?: string;
  zip_code?: string;
};

export type ICustomer = {
  firstName: string;
  lastName: string;
  country?: string;
  street?: string;
  city?: string;
  state?: string;
  postCode?: string;
  email: string;
  phone?: string;
  address?: string;
  identification?: {
    type: string;
    number: string;
  };
};
