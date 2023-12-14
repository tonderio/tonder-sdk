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

export async function customerRegister(baseUrlTonder, apiKeyTonder, email, signal) {
  const url = `${baseUrlTonder}/api/v1/customer/`;
  const data = { email: email };
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
