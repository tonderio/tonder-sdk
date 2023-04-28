import { Checkout } from './classes/checkout'
import { InlineCheckout } from './classes/inlinecheckout'
export {
    Checkout,
    InlineCheckout,
}


const root = document.querySelector('#tonder-checkout')
const form = document.querySelector('#payment-form')
const tonderOption = document.querySelector('#tonder-pay')

const inlineCheckout = new InlineCheckout({radioName: "payment", form: form})

root.innerHTML = inlineCheckout.injectCheckout()
inlineCheckout.fetchTonderData()