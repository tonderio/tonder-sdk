import "accordion-js/dist/accordion.min.css";
import { getCardType } from "./utils";
import {getPaymentMethodDetails} from "../shared/catalog/paymentMethodsCatalog";

export const cardTemplate = (data) => `
<div class="container-tonder">
  ${ data.customization?.saveCards?.showSaved ?
    `<div id="cardsListContainer" class="cards-list-container"></div>`
    :``
  }
  <div class="pay-new-card">
    <input checked id="new" class="card_selected" name="card_selected" type="radio"/>
    <label class="card-item-label-new" for="new">
      <img class="card-image" src="${getCardType("XXXX")}" />
      <div class="card-number">Pagar con tarjeta</div>
    </label>
  </div>
  <div id="global-loader" class="global-loader"></div>
  <div class="container-form">
    <div id="collectCardholderName" class="empty-div"></div>
    <div id="collectCardNumber" class="empty-div"></div>
    <div class="collect-row">
      <div id="collectExpirationMonth" class="empty-div"></div>
      <div id="collectExpirationYear" class="expiration-year"></div>
      <div id="collectCvv" class="empty-div"></div>
    </div>
    ${!!data.customization?.saveCards?.showSaveCardOption 
    ? `
    <div class="checkbox" id="save-card-container">
      <input id="save-checkout-card" type="checkbox">
      <label for="save-checkout-card">
        Guardar tarjeta para futuros pagos
      </label>
    </div>
    `
    :``}

    <div id="msgError"></div>
    <div id="msgNotification"></div>
  </div>
  <div id="apmsListContainer" class="apms-list-container"></div>
  <div class="container-pay-button">
    <button id="tonderPayButton" class="pay-button hidden">Pagar</button>
  </div>
</div>

<style>

.container-tonder {
  background-color: #F9F9F9;
  margin: 0 auto !important;
  padding: 0px;
  overflow: hidden;
  transition: max-height 0.5s ease-out;
  max-width: 600px;
  border: solid 1px #e3e3e3;
  position: relative;
  font-family: ${getFontFamily(data)};
}
.container-pay-button{
  padding: ${!!data['renderPaymentButton'] ? '30px 25px':''};
}

.container-form {
  padding: 25px 25px 0px 25px;
}

.collect-row {
  display: flex !important;
  justify-content: space-between !important;
  width: 100% !important;
}

.collect-row > :first-child {
  min-width: 120px; !important
}

.expiration-year {
  position: relative !important;
  padding-top: 25px !important;
}

.empty-div {
  position: relative;
  height: 80px !important;
  margin-top: 2px;
  margin-bottom: 4px;
  margin-left: 10px !important;
  margin-right: 10px !important;
}

.error-container {
  color: red !important;
  background-color: #FFDBDB !important;
  margin-bottom: 13px !important;
  font-size: 80% !important;
  padding: 8px 10px !important;
  border-radius: 10px !important;
  text-align: left !important;
}

.message-container{
  color: #3bc635 !important;
  background-color: #DAFCE4 !important;
  margin-bottom: 13px !important;
  font-size: 80% !important;
  padding: 8px 10px !important;
  border-radius: 10px !important;
  text-align: left !important;
}

.pay-button {
  font-size: 16px;
  font-weight: bold;
  min-height: 2.3rem;
  border-radius: 0.5rem;
  cursor: pointer;
  width: 100%;
  padding: 1rem;
  text-align: center;
  border: none;
  background-color: #000;
  color: #fff;
  margin-bottom: 0px;
}
.hidden{
  display: none;
}

.lds-dual-ring {
  display: inline-block;
  width: 14px;
  height: 14px;
}

.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.global-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

@media screen and (max-width: 600px) {
  .payment_method_zplit {
    font-size: 16px !important;
    width: 100% !important;
  }

  .payment_method_zplit  label img {
    display: none !important;
  }
}

.checkbox label {
  margin-left: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #1D1D1D;
}

.checkbox {
  margin-top: 10px;
  margin-bottom: 20px;
  text-align: left;
  padding: 0 8px;
}

.cards-list-container {
  display: flex;
  flex-direction: column;
  padding: 0px;
  gap: 33% 20px;
}

.apms-list-container {
  display: flex;
  flex-direction: column;
  gap: 33% 20px;
  max-height: 300px;
  overflow-y: auto;
}
.pay-new-card {
  display: flex;
  justify-content: start;
  align-items: center;
  color: #1D1D1D;
  gap: 33% 15px;
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 0px 30px;
  width: 100%;
  position: relative;
}

.pay-new-card .card-number {
  font-size: 16px;
}
.card-image {
  width: 39px;
  height: 24px;
  text-align: left;
}

.card-item-label-new {
  display: flex;
  justify-content: start;
  align-items: center;
  color: #1D1D1D;
  gap: 33% 20px;
  margin-top: 10px;
  margin-bottom: 10px;
  width: 100%;
}

.card_selected {
  position: relative;
  width: 16px;
  height: 16px;
  min-width: 16px;
  appearance: none;
  cursor: pointer;
  border-radius: 100%;
  border: 1px #bababa solid;
  color: #3bc635;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.card_selected:before {
  width: 8px;
  height: 8px;
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  transform: translate(-50%, -50%);
  border-radius: 100%;
  background-color: #3bc635;
  opacity: 0;
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.card_selected:checked {
  border: 1px #3bc635 solid;
  position: relative;
  width: 16px;
  height: 16px;
  min-width: 16px;
  appearance: none;
  cursor: pointer;
  border-radius: 100%;
  color: #3bc635;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.card_selected:checked:before {
  content: "";
  border: 1px #3bc635 solid;
  width: 8px;
  height: 8px;
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  transform: translate(-50%, -50%);
  border-radius: 100%;
  background-color: #3bc635;
  opacity: 50;
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.card_selected:hover:before {
  width: 8px;
  height: 8px;
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  transform: translate(-50%, -50%);
  border-radius: 100%;
  background-color: #3bc635;
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  opacity: 10;
}


.error-custom-inputs-tonder {
  background-color: white;
  position: absolute;
  left: 0px;
  bottom: -4px;
  width: 100%;
  font-size: 12px;
  color: red;
}

.expiration-year .error-custom-inputs-tonder {
  background-color: white;
  position: absolute;
  left: 0px;
  bottom: 3px;
  width: 100%;
  font-size: 12px;
  color: red;
}
</style>
`

export const cardItemsTemplate = (cards) => {


  const cardItemsHTML = cards.reduce((total, card) => {
    return `${total}
    <div class="ac" id="card_container-${card.skyflow_id}">
      <div class="card-item" >
          <input id="${card.skyflow_id}" class="card_selected" name="card_selected" type="radio"/>
          <label class="card-item-label" for="${card.skyflow_id}">
<!--            <div class="ac-trigger">-->
              <img class="card-image" src="${getCardType(card.card_scheme)}" />
              <div class="card-number">${card.card_number}</div>
              <div class="card-expiration">Exp. ${card.expiration_month}/${card.expiration_year}</div>
<!--            </div>-->
            <div class="card-delete-icon">
              <button id="delete_button_${card.skyflow_id}" class="card-delete-button">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
                  <path fill="currentColor" d="M292.309-140.001q-30.308 0-51.308-21t-21-51.308V-720h-40v-59.999H360v-35.384h240v35.384h179.999V-720h-40v507.691q0 30.308-21 51.308t-51.308 21H292.309ZM376.155-280h59.999v-360h-59.999v360Zm147.691 0h59.999v-360h-59.999v360Z"/>
                </svg>
              </button>
            </div>
          </label>
      </div>
      <div class="ac-panel">
        <div class="ac-card-panel-container" id="acContainer${card.skyflow_id}">
           <div class="cvvContainer" id="cvvContainer${card.skyflow_id}">
            <div id="collectCvv${card.skyflow_id}" class="empty-div"></div>
            <svg class="cvvIcon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="40" height="24" viewBox="0 0 270 178">
              <defs>
                <linearGradient id="linear-gradient" x1="0.5" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0" stop-color="#386bbf"/>
                  <stop offset="1" stop-color="#032ea3"/>
                </linearGradient>
                <linearGradient id="linear-gradient-2" x1="0.5" y1="0.115" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0" stop-color="#1c1c1c"/>
                  <stop offset="1" stop-color="#151515"/>
                </linearGradient>
              </defs>
              <g id="Grupo_3" data-name="Grupo 3" transform="translate(-69 -312)">
                <g id="Grupo_2" data-name="Grupo 2">
                  <rect id="Rectángulo_58" data-name="Rectángulo 58" width="253" height="165" rx="25" transform="translate(69 312)" fill="url(#linear-gradient)"/>
                  <rect id="Rectángulo_61" data-name="Rectángulo 61" width="68" height="8" rx="4" transform="translate(86 437)" fill="#fff" opacity="0.877"/>
                  <rect id="Rectángulo_66" data-name="Rectángulo 66" width="253" height="24" transform="translate(69 347)" fill="url(#linear-gradient-2)"/>
                  <g id="Elipse_4" data-name="Elipse 4" transform="translate(221 374)" fill="#fff" stroke="#191919" stroke-width="1">
                    <ellipse cx="59" cy="58" rx="59" ry="58" stroke="none"/>
                    <ellipse cx="59" cy="58" rx="58.5" ry="57.5" fill="none"/>
                  </g>
                </g>
                <text id="_123" data-name="123" transform="translate(240 448)" font-size="45" font-family="Menlo-Regular, Menlo"><tspan x="0" y="0">123</tspan></text>
              </g>
            </svg>
           </div>
           <div class="container-card-pay-button">
            <button id="tonderPayButton${card.skyflow_id}" class="card-pay-button pay-button">Pagar</button>
           </div> 
        </div>
      </div>
    </div>`

  }, "");
  const cardItemStyle = `
    <style>
      .ac {
        background-color: transparent !important;
        margin-bottom: 0 !important;
        border-bottom: 1px solid #e2e8f0;
      }
      .ac-card-panel-container{
        /*padding: 20px 60px 0px 60px;*/
        padding: 20px 32px 0px 32px;
      }
      .cvvContainer{
       max-width: 45%; 
       position: relative;
       padding: 0px 28px 0px 28px;
      }
      .cvvIcon {
        position: absolute;
        right: 16%;
        top: 43%;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .cvvContainer.show .cvvIcon,
      .ac-card-panel-container.show .card-pay-button {
        opacity: 1;
        transform: translateY(0);
        transition-delay: 0.3s;
      }
      .container-card-pay-button{
        margin: 20px 0px;
      }
      .card-pay-button{
        display: block;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .card-item-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #1D1D1D;
        gap: 33% 20px;
        margin-top: 15px;
        margin-bottom: 15px;
        width: 100%;
      }
      .card-item {
        position: relative;
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 33% 15px;
        padding: 0px 30px;
      }

      .card-item .card-number {
        font-size: 16px;
      }

      .card-item .card-expiration {
        font-size: 16px;
      }

      .card-image {
        width: 39px;
        height: 24px;
        text-align: left;
      }

      .card-delete-button {
        background-color: transparent !important;
        color: #000000 !important;
        border: none;
      }

      .card-delete-button:hover {
        background-color: transparent !important;
        color: #D91C1C !important;
      }
      .card_selected {
        position: relative;
        width: 16px;
        min-width: 16px;
        height: 16px;
        appearance: none;
        cursor: pointer;
        border-radius: 100%;
        border: 1px #bababa solid;
        color: #3bc635;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:before {
        width: 8px;
        height: 8px;
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #3bc635;
        opacity: 0;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:checked {
        border: 1px #3bc635 solid;
        position: relative;
        width: 16px;
        height: 16px;
        min-width: 16px;
        appearance: none;
        cursor: pointer;
        border-radius: 100%;
        color: #3bc635;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:checked:before {
        content: "";
        border: 1px #3bc635 solid;
        width: 8px;
        height: 8px;
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #3bc635;
        opacity: 50;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:hover:before {
        width: 8px;
        height: 8px;
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #3bc635;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
        opacity: 10;
      }

    </style>
  `
  const cardItem = `
    <div class="accordion-container">
    ${cardItemsHTML}
  </div>
  ${cardItemStyle}
  `
  return cardItem;
}

export const apmItemsTemplate = (apms) => {

  const apmItemsHTML = apms.reduce((total, apm) => {
    const apm_data = getPaymentMethodDetails(apm.payment_method);
    return `${total}
    <div class="apm-item" id="card_container-${apm.pk}">
        <input id="${apm.pk}" class="card_selected" name="card_selected" type="radio"/>
        <label class="apm-item-label" for="${apm.pk}">
          
          <div class="apm-image">
            <div class="apm-image-border"></div>
            <img src="${apm_data.icon}" />
          </div>
          <div class="apm-name">${apm_data.label}</div>
        </label>
    </div>`
  }, ``);

  const apmItemStyle = `
    <style>
      .apm-item-label {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        color: #1D1D1D;
        gap: 33% 10px;
        margin-top: 15px;
        margin-bottom: 15px;
        width: 100%;
      }

      .apm-item {
        position: relative;
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 33% 15px;
        border-bottom: 1px solid #e2e8f0;
        padding: 0px 30px;
      }

      .apm-item:first-child {
        border-top: 1px solid #e2e8f0;
      }

      .apm-item .apm-name {
        font-size: 16px;
      }
      .apm-image {
        width: 30px;
        height: 30px;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .apm-image img {
        width: auto;
        height: 30px;
      }
      .apm-image-border{
        position: absolute;
        border: 1px solid #bababa36;
        border-radius: 4px;
        pointer-events: none;
        box-sizing: border-box;
        width: 100%;
        height: 97%;
      }

      .card_selected {
        position: relative;
        width: 16px;
        min-width: 16px;
        height: 16px;
        appearance: none;
        cursor: pointer;
        border-radius: 100%;
        border: 1px #bababa solid;
        color: #3bc635;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:before {
        width: 8px;
        height: 8px;
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #3bc635;
        opacity: 0;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:checked {
        border: 1px #3bc635 solid;
        position: relative;
        width: 16px;
        height: 16px;
        min-width: 16px;
        appearance: none;
        cursor: pointer;
        border-radius: 100%;
        color: #3bc635;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:checked:before {
        content: "";
        border: 1px #3bc635 solid;
        width: 8px;
        height: 8px;
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #3bc635;
        opacity: 50;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:hover:before {
        width: 8px;
        height: 8px;
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #3bc635;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
        opacity: 10;
      }

    </style>
  `
  const apmItem = `
  ${apmItemsHTML}
  ${apmItemStyle}
  `
  return apmItem;
}

const getFontFamily = (data) => {
  const base = data?.customStyles?.labelStyles?.base;
  return base?.fontFamily || '"Inter", sans-serif';
};