import React, { useContext } from 'react'

import { CartContext } from '../context/CartContext'

const Cart = () => {
    const cart = useContext(CartContext)

    return (
        <>
            <h3>Cart</h3>
            <div>
                { cart.items.map((product, index) => {
                    return (
                        <div key={index}>
                            <div>{product.title}</div>
                            <div>{product.price}</div>
                            <div>{product.quantity}</div>
                        </div>
                    )
                })}
                <div>
                    Total: <span id="cart-total">{cart.getTotalCost()}</span>
                </div>
            </div>
        </>
    )
}

export default Cart