import { getBaseUrlByEnv } from "../shared/utils/apiFetch";
import { fetchCoreTransaction, resolveCoreUrl } from "../data/coreApi";
import { OPEN_PAYMENT_STATUSES, PAYMENT_ENGINE } from "../shared/constants/paymentEngine";
import { toLegacyCheckoutError, toLegacyTransaction } from "../helpers/coreCheckout";

export class ThreeDSHandler {
  engine = PAYMENT_ENGINE.LEGACY;

  constructor({ payload = null, apiKey, baseUrl, coreUrl, mode }) {
    this.baseUrl = baseUrl;
    this.coreUrl = coreUrl;
    this.apiKey = apiKey;
    this.payload = payload;
    this.mode = mode;
  }

  saveVerifyTransactionUrl() {
    const url = this.payload?.next_action?.redirect_to_url?.verify_transaction_status_url;
    if (url) {
      this.saveUrlWithExpiration(url);
    } else {
      const url = this.payload?.next_action?.iframe_resources?.verify_transaction_status_url;
      if (url) {
        this.saveUrlWithExpiration(url);
      } else {
        console.log("No verify_transaction_status_url found");
      }
    }
  }

  saveUrlWithExpiration(url) {
    try {
      const now = new Date();
      const item = {
        url: url,
        engine: this.engine,
        // Expires after 20 minutes
        expires: now.getTime() + 20 * 60 * 1000,
      };
      localStorage.setItem("verify_transaction_status", JSON.stringify(item));
    } catch (error) {
      console.log("error: ", error);
    }
  }

  getUrlWithExpiration() {
    const item = JSON.parse(localStorage.getItem("verify_transaction_status"));
    if (!item) return;

    const now = new Date();
    if (now.getTime() > item.expires) {
      this.removeVerifyTransactionUrl();
      return null;
    } else {
      return item.url;
    }
  }

  // Engine of the payment that stored the verify URL; states stored before engines existed are legacy.
  getStoredEngine() {
    try {
      return (
        JSON.parse(localStorage.getItem("verify_transaction_status"))?.engine ||
        PAYMENT_ENGINE.LEGACY
      );
    } catch {
      return PAYMENT_ENGINE.LEGACY;
    }
  }

  setEngine(engine) {
    this.engine = engine;
  }

  removeVerifyTransactionUrl() {
    localStorage.removeItem("verify_transaction_status");
  }

  getVerifyTransactionUrl() {
    return localStorage.getItem("verify_transaction_status");
  }

  loadIframe() {
    const iframe = this.payload?.next_action?.iframe_resources?.iframe;
    if (iframe) {
      return new Promise((resolve, reject) => {
        const iframe = this.payload?.next_action?.iframe_resources?.iframe;

        if (iframe) {
          // TODO: This is not working for Azul
          this.saveVerifyTransactionUrl();
          const container = document.createElement("div");
          container.innerHTML = iframe;
          document.body.appendChild(container);

          // Create and append the script tag manually
          const script = document.createElement("script");
          script.textContent = 'document.getElementById("tdsMmethodForm").submit();';
          container.appendChild(script);

          // Resolve the promise when the iframe is loaded
          const iframeElement = document.getElementById("tdsMmethodTgtFrame");
          iframeElement.onload = () => resolve(true);
        } else {
          console.log("No redirection found");
          reject(false);
        }
      });
    }
  }

  getRedirectUrl() {
    return this.payload?.next_action?.redirect_to_url?.url;
  }

  redirectToChallenge() {
    const url = this.getRedirectUrl();
    if (url) {
      this.saveVerifyTransactionUrl();
      window.location = url;
    } else {
      console.log("No redirection found");
    }
  }

  // Returns an object
  // https://example.com/?name=John&age=30&city=NewYork
  // { name: "John", age: "30", city: "NewYork" }
  getURLParameters() {
    const parameters = {};
    const urlParams = new URLSearchParams(window.location.search);

    for (const [key, value] of urlParams) {
      parameters[key] = value;
    }

    return parameters;
  }

  // TODO: Remove this duplication
  handleSuccessTransaction(response) {
    this.removeVerifyTransactionUrl();
    console.log("Transacción autorizada");
    return response;
  }

  handleDeclinedTransaction(response) {
    this.removeVerifyTransactionUrl();
    return response;
  }

  async handle3dsChallenge(response_json) {
    // Create the form element:
    const form = document.createElement("form");
    form.name = "frm";
    form.method = "POST";
    form.action = response_json.redirect_post_url;

    // Add hidden fields:
    const creqInput = document.createElement("input");
    creqInput.type = "hidden";
    creqInput.name = "creq";
    creqInput.value = response_json.creq;
    form.appendChild(creqInput);

    if (response_json.term_url) {
      const termUrlInput = document.createElement("input");
      termUrlInput.type = "hidden";
      termUrlInput.name = "TermUrl";
      termUrlInput.value = response_json.term_url;
      form.appendChild(termUrlInput);
    }

    // Append the form to the body:
    document.body.appendChild(form);
    form.submit();
  }

  // TODO: This works for Azul
  async handleTransactionResponse(response) {
    const response_json = await response.json();
    // Azul property
    if (response_json.status === "Pending" && response_json.redirect_post_url) {
      return await this.handle3dsChallenge(response_json);
    } else if (["Success", "Authorized"].includes(response_json.status)) {
      return this.handleSuccessTransaction(response_json);
    } else {
      this.handleDeclinedTransaction();
      return response_json;
    }
  }

  async verifyCoreTransaction() {
    const verifyUrl = this.getUrlWithExpiration();
    if (!verifyUrl) {
      console.log("No verify_transaction_status_url found");
      return;
    }
    const url = resolveCoreUrl(this.coreUrl, verifyUrl);
    if (!url) {
      console.error("The stored verify URL does not belong to the core.");
      this.removeVerifyTransactionUrl();
      return;
    }
    try {
      const { status, body } = await fetchCoreTransaction(url, this.apiKey);
      if (status !== 200) {
        console.error("The verification of the transaction failed.");
        // Only an unauthorized or unknown payment is definitive; anything else may be retried.
        if ([401, 404].includes(status)) this.removeVerifyTransactionUrl();
        return toLegacyCheckoutError(status, body);
      }
      // The core already continued the route: the answer is the payment's current state.
      if (!OPEN_PAYMENT_STATUSES.includes(body.status)) this.removeVerifyTransactionUrl();
      return toLegacyTransaction(body);
    } catch (error) {
      console.error("Error verifying the transaction:", error);
    }
  }

  async verifyTransactionStatus() {
    if (this.getStoredEngine() === PAYMENT_ENGINE.CORE) return this.verifyCoreTransaction();
    const verifyUrl = this.getUrlWithExpiration();
    if (verifyUrl) {
      const url = verifyUrl.startsWith("https://") ? verifyUrl : `${this.baseUrl}${verifyUrl}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${this.apiKey}`,
          },
          // body: JSON.stringify(data),
        });
        if (response.status !== 200) {
          console.error("La verificación de la transacción falló.");
          this.removeVerifyTransactionUrl();
          return response;
        }

        return await this.handleTransactionResponse(response);
      } catch (error) {
        console.error("Error al verificar la transacción:", error);
        this.removeVerifyTransactionUrl();
      }
    } else {
      console.log("No verify_transaction_status_url found");
    }
  }

  setPayload = payload => {
    this.payload = payload;
  };
}
