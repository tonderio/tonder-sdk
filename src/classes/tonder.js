var AES = require("../../node_modules/crypto-js/aes");

class MySDK {

    constructor() {
        this.url = ""
    }
    openWindow(url, width = 500, height = 500, left = 0, top = 0, params) {
        if (params) {
            this.url = url + "?" + new URLSearchParams(params).toString();
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
const sdk = new MySDK();
const params = {
    "api_key":"670d64ccf469709a5a47deae2d8055620ae9f81a",
    "email":"123@gmail.com",
    "type":"payment",
    "product_name":"Playera",
    "product_price":"400",
    "product_image":"https://cdn.shopify.com/s/files/1/0532/1025/1461/products/IPLAYBANGblueberryraspberry.jpg?v=1657302782",
    "shipping_cost":"150",
}
const btn = document.createElement('button');
btn.innerHTML = "Open Checkout";
btn.onclick = function(){
    sdk.openWindow('http://checkout.tonder.io/', 800, 600, 100, 100,params);
}
document.getElementById("tonder-checkout").appendChild(btn);