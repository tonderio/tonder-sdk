import { MySDK } from "./classes/tonder";

const config = {
    apiKey:"a1f4db756764234940828bf0eb6c4d07588bf454",
    type:"full",
    backgroundColor: '#4ecfd6',
    color: '#fff'
}
const sdk = new MySDK(config);
const params = {
    email:"123@gmail.com",
    productName:"Playera",
    productPrice:"400.12",
    productImage:"https://cdn.shopify.com/s/files/1/0532/1025/1461/products/IPLAYBANGblueberryraspberry.jpg?v=1657302782",
    shippingCost:"150",
}
sdk.setPayment(params)
