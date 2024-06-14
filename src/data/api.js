import { buildErrorResponse, buildErrorResponseFromCatch } from "../helpers/utils";

export async function getOpenpayDeviceSessionID(merchant_id, public_key, signal) {
  let openpay = await window.OpenPay;
  openpay.setId(merchant_id);
  openpay.setApiKey(public_key);
  openpay.setSandboxMode(true);
  var response = await openpay.deviceData.setup({signal});
  return response;
}

export async function getBusiness(baseUrlTonder, apiKeyTonder, signal) {
  const getBusiness = await fetch(
    `${baseUrlTonder}/api/v1/payments/business/${apiKeyTonder}`,
    {
      headers: {
        Authorization: `Token ${apiKeyTonder}`,
      },
      signal: signal,
    }
  );
  const response = await getBusiness.json();
  return response
}

export async function customerRegister(baseUrlTonder, apiKeyTonder, customer, signal) {
  const url = `${baseUrlTonder}/api/v1/customer/`;
  const data = { 
    email: customer.email,
    first_name: customer?.firstName,
    last_name: customer?.lastName,
    phone: customer?.phone,
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKeyTonder}`,
    },
    signal: signal,
    body: JSON.stringify(data),
  });

  if (response.status === 201) {
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`Error: ${response.statusText}`);
  }
}

export async function createOrder(baseUrlTonder, apiKeyTonder, orderItems) {
  const url = `${baseUrlTonder}/api/v1/orders/`;
  const data = orderItems;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKeyTonder}`,
    },
    body: JSON.stringify(data),
  });
  if (response.status === 201) {
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`Error: ${response.statusText}`);
  }
}

export async function createPayment(baseUrlTonder, apiKeyTonder, paymentItems) {
  const url = `${baseUrlTonder}/api/v1/business/${paymentItems.business_pk}/payments/`;
  const data = paymentItems;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKeyTonder}`,
    },
    body: JSON.stringify(data),
  });
  if (response.status >= 200 && response.status <=299) {
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`Error: ${response.statusText}`);
  }
}

export async function startCheckoutRouter(baseUrlTonder, apiKeyTonder, routerItems) {
  try {
    const url = `${baseUrlTonder}/api/v1/checkout-router/`;
    const data = routerItems;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKeyTonder}`,
      },
      body: JSON.stringify(data),
    });
    if (response.status >= 200 && response.status <= 299) {
      const jsonResponse = await response.json();
      return jsonResponse;
    } else {
      throw new Error("Failed to start checkout router")
    }
  } catch (error) {
    throw error
  }
}

export async function registerCard(baseUrlTonder, customerToken, data) {
  try {
    const response = await fetch(`${baseUrlTonder}/api/v1/cards/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${customerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) return await response.json();
    if (response.status === 409){
      const res_json = await response.json()
      if(res_json.error = 'Card number already exists.'){
        return {
          code: 200,
          body: res_json,
          name: '',
          message: res_json.error,
        }
      }
    }
    throw await buildErrorResponse(response);
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}
export async function deleteCustomerCard(baseUrlTonder, customerToken, skyflowId = "") {
  try {
    const response = await fetch(`${baseUrlTonder}/api/v1/cards/${skyflowId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${customerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) return true;
    throw await buildErrorResponse(response);
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}
export async function getCustomerCards(baseUrlTonder, customerToken, query = "", signal) {
  try {
    const response = await fetch(`${baseUrlTonder}/api/v1/cards/${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${customerToken}`,
        'Content-Type': 'application/json'
      },
      signal
    });

    if (response.ok) return await response.json();
    throw await buildErrorResponse(response);
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}

export async function getCustomerAPMs(baseUrlTonder, customerToken, query = "", signal) {
  try {
    const response = await fetch(
      // `${baseUrlTonder}/api/v1/cards/${query}`,
      'http://demo1106857.mockable.io/api/v1/payment_methods', // TODO: CHANGE WITH REAL API
      {
      method: 'GET',
      headers: {
        'Authorization': `Token ${customerToken}`,
        'Content-Type': 'application/json'
      },
      signal
    });

    if (response.ok) return await response.json();
    throw await buildErrorResponse(response);
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}