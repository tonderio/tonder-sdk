import { AES } from "crypto-js";

export class Checkout {

    constructor({ apiKey, type = "payment", backgroundColor="#141414", color="#EBEBEB" }) {
        this.url = "http://checkout.tonder.io/#/"
        this.apiKey = apiKey
        this.type = type
        this.backgroundColor = backgroundColor
        this.color = color
        this.params = ""
    }
    generateButton = (buttonText) => {
        this.buttonText = buttonText ? buttonText : this.buttonText
        this.tonderButton = document.createElement('button');
        this.tonderButton.innerHTML = this.buttonText;
        this.stylishButton(this.tonderButton)
        this.tonderButton.onclick = this.openCheckout
    }
    getButton = ({buttonText}) => {
        this.generateButton(buttonText)
        return this.tonderButton
    }
    mountButton = ({buttonText}) => {
        this.generateButton(buttonText)
        const entryPoint = document.getElementById("tonder-checkout")
        try {
            entryPoint.innerHTML = ""
            entryPoint.append(this.tonderButton)
        } catch(error) {
            console.error(error)
        }
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
        const params = { apiKey: this.apiKey, ...this.paymentData, type: this.type}
        if (params.products) {
            params.products = JSON.stringify(params.products)
        }
        const queryString = new URLSearchParams(params).toString();
        const encrypted = AES.encrypt(queryString, 'url-params-encrypt').toString()
        const encodedURL = encodeURIComponent(encrypted);
        this.params = "?" + encodedURL;
        const newWindow = window.open(this.url + this.params, '_blank', `width=1200,height=$800,left=0,top=0`);
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
            return event.data
        }
    }
}