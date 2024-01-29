export class ThreeDSHandler {
  constructor({
    payload = null,
    apiKey,
    baseUrl,
    successUrl
  }) {
    this.baseUrl = baseUrl,
    this.apiKey = apiKey,
    this.payload = payload,
    this.successUrl = successUrl
  }

  saveVerifyTransactionUrl() {
    const url = this.payload?.next_action?.redirect_to_url?.verify_transaction_status_url
    if (url) {
      localStorage.setItem("verify_transaction_status_url", url)
    } else {
      const url = this.payload?.next_action?.iframe_resources?.verify_transaction_status_url
      if (url) {
        localStorage.setItem("verify_transaction_status_url", url)
      } else {
        console.log('No verify_transaction_status_url found');
      }
    }
  }

  removeVerifyTransactionUrl() {
    localStorage.removeItem("verify_transaction_status_url")
  }

  getVerifyTransactionUrl() {
    return localStorage.getItem("verify_transaction_status_url") 
  }

  loadIframe() {
    const iframe = this.payload?.next_action?.iframe_resources?.iframe

    if (iframe) {
      this.saveVerifyTransactionUrl()
      const container = document.createElement('div')
      container.innerHTML = iframe
      document.body.appendChild(container)
      return true
    } else {
      console.log('No redirection found');
      return false
    }

  }

  redirectTo3DS() {
    const url = this.payload?.next_action?.redirect_to_url?.url
    if (url) {
      this.saveVerifyTransactionUrl()
      window.location = url;
      // window.open(url, '_blank');
      return true
    } else {
      console.log('No redirection found');
      return false
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

  handleSuccessTransaction(response) {
    this.removeVerifyTransactionUrl();
    window.location = this.successUrl
    console.log('Transacción autorizada exitosamente.');
    return response;
  }

  handleDeclinedTransaction(response) {
    this.removeVerifyTransactionUrl();
    console.log('Transacción rechazada.');
    throw new Error("Transacción rechazada.");
  }

  // TODO: the method below needs to be tested with a real 3DS challenge
  // since we couldn't get a test card that works with this feature
  async handle3dsChallenge(response_json) {
    // Create the form element:
    const form = document.createElement('form');
    form.name = 'frm';
    form.method = 'POST';
    form.action = response_json.redirect_post_url;

    // Add hidden fields:
    const creqInput = document.createElement('input');
    creqInput.type = 'hidden';
    creqInput.name = response_json.creq;
    creqInput.value = response_json.creq;
    form.appendChild(creqInput);

    const termUrlInput = document.createElement('input');
    termUrlInput.type = 'hidden';
    termUrlInput.name =  response_json.term_url;
    termUrlInput.value = response_json.TermUrl;
    form.appendChild(termUrlInput);

    // Append the form to the body:
    document.body.appendChild(form);
    form.submit();

    await this.verifyTransactionStatus();
  }

  async handleTransactionResponse(response) {
    const response_json = await response.json();

    if (response_json.status === "Pending") {
      return await this.handle3dsChallenge(response_json);
    } else if (["Success", "Authorized"].includes(response_json.status)) {
      return this.handleSuccessTransaction(response);
    } else {
      return this.handleDeclinedTransaction(response);
    }
  }

  async verifyTransactionStatus() {
    const verifyUrl = this.getVerifyTransactionUrl();

    if (verifyUrl) {
      const url = `${this.baseUrl}${verifyUrl}`;
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
          console.error('La verificación de la transacción falló.');
          return
        }

        return await this.handleTransactionResponse(response);
      } catch (error) {
        console.error('Error al verificar la transacción:', error);
        return error;
      }
    } else {
      console.log('No verify_transaction_status_url found');
    }
  }
}
