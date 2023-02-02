import { Checkout } from "../index";

const config = {
    apiKey:"f4ab1f9140ce5b17a1bbd0b62b7f949cdd18967b",
    type:"payment",
}
const sdk = new Checkout(config);
const params = {
    email:"123@gmail.com",
    productName:"Playera",
    productPrice:"400.12",
    productImage:"https://cdn.shopify.com/s/files/1/0532/1025/1461/products/IPLAYBANGblueberryraspberry.jpg?v=1657302782",
    shippingCost:"150",
}
sdk.setPayment(params)
