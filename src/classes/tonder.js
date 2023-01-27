import { AES } from "crypto-js";

export class MySDK {

    constructor() {
        this.url = ""
    }
    openWindow(url, width = 500, height = 500, left = 0, top = 0, params) {
        console.log(url)
        if (params) {
            const queryString = new URLSearchParams(params).toString();
            const encrypted = AES.encrypt(queryString, 'url-params-encrypt').toString()
            const encodedURL = encodeURIComponent(encrypted);
            url = url + "?" + encodedURL;
            console.log(url)
        }
        const newWindow = window.open(url, '_blank', `width=${width},height=${height},left=${left},top=${top}`);
        const checkoutInterval = setInterval(() => {
            if (newWindow.closed) {
                console.log("The tab was closed!");
                clearInterval(checkoutInterval);
            }
        }, 500);
    }

    handleMessage(event) {
        if (event.origin === this.url) {
            console.log('Received message: ' + event.data);
        }
    }
}