import React, { useState, useContext, useEffect } from 'react'
import { InlineCheckout } from 'tonder-sdk-test'
import { CartContext } from '../context/CartContext'

import sdkIcons from "../assets/img/sdk-icons.png";

export const Checkout = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionHidden, setOptionHidden] = useState(true);

  const cart = useContext(CartContext)

  const [checkoutResponse, setCheckoutResponse] = useState({})
  const receiveResponse = (data) => {
      setCheckoutResponse(data)
  }
  const form = document.querySelector("#payment-form");
  const config = {
      apiKey: "Your Tonder API Key",
      type: "payment",
      cb: receiveResponse,
  }

  useEffect(()=>{
    const apiKey = "00d17d61e9240c6e0611fbdb1558e636ed6389db";
    const totalElement = document.querySelector("#cart-total");
    const inlineCheckout = new InlineCheckout({
      form: form,
      apiKey: apiKey,
      totalElementId: totalElement,
    });
    inlineCheckout.injectCheckout();
  }, [])

  // useLayoutEffect(() => {
  //     tonderCheckout.mountButton({ buttonText: 'Proceder al pago' })
  // })

  const checkoutStyle = {
    marginTop: "2rem",
    overflow: "hidden",
    transition: "max-height 0.3s",
  };
  const hiddenStyle = { maxHeight: optionHidden ? "0px" : "1000px" };

  const onRadioChange = (event) => {
    setSelectedOption(event.target.value);
    if (event.target.value === "1") {
      setOptionHidden(false);
    } else {
      setOptionHidden(true);
    }
  };

  return (
    <>
      <h3>{selectedOption}</h3>
      <form id="payment-form">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: "center" }}>
            <input
              onChange={onRadioChange}
              name="payment"
              type="radio"
              id="tonder-pay"
              value="1"
            />
            <label htmlFor="tonder-pay">
              Pago con tarjeta de crédito/débito
            </label>
            <img style={{ width: "150px", marginLeft: "0.5rem" }} src={sdkIcons} alt="" />
          </div>
          <div style={{ ...checkoutStyle, ...hiddenStyle }} id="tonder-checkout">
          </div>
          <p>{checkoutResponse?.data?.status}</p>
        </div>
        <div style={{ marginTop: "2rem" }}>
          <input
            onChange={onRadioChange}
            name="payment"
            type="radio"
            id="other"
            value="2"
          />
          <label htmlFor="other">Otra opcion</label>
        </div>
      </form>
    </>
  );
};
