import { Checkout } from './classes/checkout'
import { InlineCheckout } from './classes/inlinecheckout'
export {
    Checkout,
    InlineCheckout,
}

const inlineCheckout = new InlineCheckout()

const root = document.querySelector('#tonder-checkout')

root.innerHTML = inlineCheckout.injectCheckout()
inlineCheckout.fetchTonderData()