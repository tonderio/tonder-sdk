export class ThreeDSHandler {
  constructor({
    payload = null,
    apiKey,
    baseUrl,
  }) {
    this.baseUrl = baseUrl,
    this.apiKey = apiKey,
    this.payload = payload;
  }

  saveVerifyTransactionUrl() {
    const url = this.payload?.next_action?.redirect_to_url?.verify_transaction_status_url
    if (url) {
      localStorage.setItem("verify_transaction_status_url", url)
    }
  }

  removeVerifyTransactionUrl() {
    localStorage.removeItem("verify_transaction_status_url")
  }

  getVerifyTransactionUrl() {
    return localStorage.getItem("verify_transaction_status_url") 
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

        if (response.status === 200) {
          console.log('La transacción se verificó con éxito.');
          this.removeVerifyTransactionUrl();
          return response;
        } else {
          console.error('La verificación de la transacción falló.');
        }
      } catch (error) {
        console.error('Error al verificar la transacción:', error);
        return error;
      }
    } else {
      console.log('No verify_transaction_status_url found');
    }
  }
}
