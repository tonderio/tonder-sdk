/**
 * Generates an Openpay device session ID.
 * @param {string} merchant_id - The Openpay merchant ID.
 * @param {string} public_key - The Openpay public key.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<string>} The generated device session ID.
 */

export async function getOpenpayDeviceSessionID(merchant_id, public_key, signal) {
    let openpay = await window.OpenPay;
    openpay.setId(merchant_id);
    openpay.setApiKey(public_key);
    openpay.setSandboxMode(true);
    var response = await openpay.deviceData.setup({signal});
    return response;
}