/**
 * Maps the answers of the core's SDK support routes (its public contract) onto the results the
 * merchant-facing functions have always returned, so the merchant's code does not change.
 */

/**
 * The monolith's error body for a core error: `detail` carries the message that the SDK's error
 * handling reads, and the core's own body stays available to the merchant.
 */
export const toLegacyErrorBody = body => ({
  ...(body && typeof body === "object" ? body : {}),
  detail: body?.error?.message,
  code: body?.error?.code,
});

export const toLegacyCustomer = body => ({
  id: body.customer_id,
  email: body.email,
  first_name: body.first_name,
  last_name: body.last_name,
  auth_token: body.auth_token,
  auth_token_expires_at: body.auth_token_expires_at,
});

export const toLegacyCards = body => ({
  user_id: body.customer_id,
  cards: (body.data || []).map(({ id, ...fields }) => ({ fields: { skyflow_id: id, ...fields } })),
});

export const toLegacySavedCard = body => ({ skyflow_id: body.id, user_id: body.customer_id });

// The answer the monolith gives, with HTTP 200, when it cannot save a card by phone.
export const PHONE_REQUIRED_ANSWER = Object.freeze({ saved: false, code: "PHONE_REQUIRED" });

export const toLegacyPaymentMethods = body => {
  const results = (body.data || []).map(method => ({ ...method, pk: method.id }));
  return { count: results.length, next: null, previous: null, results };
};

const toLegacyBank = bank => ({
  bank: {
    id: bank.bank_id,
    bank_code: bank.code,
    name: bank.name,
    logo: bank.logo_url,
    country_name: bank.country_name,
    payment_type: bank.payment_type,
    priority: bank.priority,
    channels: bank.channels,
    limits: bank.limits,
    currency: bank.currency,
    locations_url: bank.locations_url,
  },
});

export const toLegacyBanks = body => (body.data || []).map(toLegacyBank);

export const toLegacyBanksByType = body =>
  toLegacyBanks(body).reduce(
    (groups, item) => {
      (groups[item.bank.payment_type] ||= []).push(item);
      return groups;
    },
    { cash: [], transfer: [] },
  );
