export async function openpayCheckoutTonder(merchant_id, public_key) {
  let openpay = await window.OpenPay;
  openpay.setId(merchant_id);
  openpay.setApiKey(public_key);
  openpay.setSandboxMode(true);
  var response = await openpay.deviceData.setup();
  return response;
}
