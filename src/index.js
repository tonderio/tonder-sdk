import { MySDK } from "./classes/tonder";

const sdk = new MySDK();
const params = {
    "apiKey":"a60caf40384ae8ff16cab82f70fc6fc0a0297b54",
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
    sdk.openWindow('http://checkout.tonder.io/#/', 800, 600, 100, 100,params);
}
document.getElementById("tonder-checkout").appendChild(btn);