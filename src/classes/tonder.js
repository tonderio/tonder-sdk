import { AES } from "crypto-js";

export class MySDK {

    constructor({ apiKey, type, backgroundColor, color }) {
        this.url = "http://localhost:8081/#/"
        this.apiKey = apiKey
        this.type = type
        this.backgroundColor = backgroundColor
        this.color = color
        this.params = ""

        this.tonderButton = document.createElement('button');
        this.tonderButton.innerHTML = "Proceder al pago";
        this.stylishButton(this.tonderButton)
        this.tonderButton.onclick = this.openCheckout
        document.getElementById("tonder-checkout").appendChild(this.tonderButton);
    }
    stylishButton = (element) => {
        element.style.backgroundColor = this.backgroundColor
        element.style.color = this.color
        element.style.display = 'flex'
        element.style.justifyContent = 'center'
        element.style.border = 'none'
        element.style.padding = '1rem'
        element.style.borderRadius = '10px'
        element.style.fontSize = '1rem'
        element.style.width = '100%'
        element.style.boxShadow = '0 3px 6px 0 rgba(0,0,0,0.16)'
    }
    setPayment = (paymentData) => {
        this.paymentData = paymentData
        console.log(this.paymentData)
    }
    openTabListener = (tab, button) => {
        const tabInterval = setInterval(() => {
            if (tab.closed) {
                clearInterval(tabInterval);
                button.disabled = false
                button.innerHTML = 'Proceder al pago'
            }
        }, 500)
    }
    openCheckout = () => {
        const params = {...this.paymentData, apiKey: this.apiKey, type: this.type}
        const queryString = new URLSearchParams(params).toString();
        const encrypted = AES.encrypt(queryString, 'url-params-encrypt').toString()
        const encodedURL = encodeURIComponent(encrypted);
        this.params = "?" + encodedURL;
        const newWindow = window.open(this.url + this.params, '_blank');
        this.tonderButton.disabled = true
        this.tonderButton.innerHTML = `
            <div class="loader"></div>
            <style>
                .loader {
                border: 4px solid ${this.color};
                border-radius: 50%;
                border-top: 4px solid ${this.backgroundColor};
                width: 0.625rem;
                height: 0.625rem;
                -webkit-animation: spin 2s linear infinite; /* Safari */
                animation: spin 2s linear infinite;
                }

                /* Safari */
                @-webkit-keyframes spin {
                0% { -webkit-transform: rotate(0deg); }
                100% { -webkit-transform: rotate(360deg); }
                }

                @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
                }
            </style>
        `
        this.openTabListener(newWindow, this.tonderButton)
    }
    handleMessage = (event) => {
        if (event.origin === this.url) {
            console.log('Received message: ' + event.data);
        }
    }
}