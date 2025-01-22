import "accordion-js/dist/accordion.min.css";
import { getCardFormLabels, getCardType } from "./utils";
import { getPaymentMethodDetails } from "../shared/catalog/paymentMethodsCatalog";
import { defaultStyles } from "./styles";
import { COMMON_LOGOS } from "../shared/catalog/commonLogosCatalog";
import get from "lodash.get";
import { FIELD_PATH_NAMES } from "../shared/constants/fieldPathNames";
import { HTML_TONDER_IDS } from "../shared/constants/htmlTonderIds";

export const containerCheckoutTemplate = data => {
  return `
    <div class="container-tonder" id="${HTML_TONDER_IDS.tonderContainer}">
      <div id="${HTML_TONDER_IDS.globalLoader}" class="global-loader"></div>
    </div>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");
      ${getCommonStyles(data)}
      .container-tonder {
        background-color: #FFFFFF;
        margin: 0 auto !important;
        padding: 0;
        overflow: hidden;
        transition: max-height 0.5s ease-out;
        max-width: 600px;
        border: solid 1px #CED0D1;
        position: relative;
        font-family: ${getFontFamily(data)};
        border-radius: 11px;
      }
    </style>
  `;
};

export const cardTemplate = data => {
  const showPaymentButton = get(data, FIELD_PATH_NAMES.paymentButton, false);
  const existCardsOrPaymentMethods =
    data.cardsData.length > 0 || data.paymentMethodsData.length > 0;
  const paddingTopContainerForm = existCardsOrPaymentMethods ? "5px" : "30px";
  const { cardLabel, cvvLabel, expiryDateLabel, nameLabel } = getCardFormLabels(
    data.customStyles,
  ).labels;

  return `
    ${data?.customization?.saveCards?.showSaved ? `<div id="cardsListContainer" class="cards-list-container"></div>` : ``}
    ${
      existCardsOrPaymentMethods
        ? `
      <div class="pay-new-card">
        <input checked id="new" class="card_selected" name="card_selected" type="radio"/>
        <label class="card-item-label-new" for="new">
          <img class="card-image" src="${getCardType("XXXX")}" alt="" />
          <div class="card-number">Tarjeta</div>
        </label>
      </div>
    `
        : ``
    }
    <div class="container-form">
      <div id="collectCardholderName" class="empty-div tndr-card-holder"></div>
      <div id="collectCardNumber" class="empty-div tndr-card-number"></div>
      <div class="collect-row">
        <div class="containerExpirationDate">
          <label class="tndr-form-label">${expiryDateLabel}</label>
          <div class="containerExpirationDateInput">
            <div id="collectExpirationMonth" class="empty-div empty-div-date"></div>
            <div id="collectExpirationYear" class="empty-div empty-div-date"></div>
          </div>
        </div>
        <div class="cvvContainerCard" id="cvvContainerCard">
          <label class="tndr-form-label">${cvvLabel}</label>
          <div id="collectCvv" class="empty-div card-collect-cvv empty-div-date">
              <div class="tndr-simulate-input-cvv-container">
                  <div class="tndr-simulate-input-cvv">
                      <svg class="cvvIconCard" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="40" height="24" viewBox="0 0 270 178">
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
                      <input/>
                  </div>
              </div>
          </div>
        </div>
      </div>
      ${
        !!data.customization?.saveCards?.showSaveCardOption
          ? `
            <div class="checkbox" id="save-card-container">
              <input id="save-checkout-card" type="checkbox">
              <label for="save-checkout-card">
                Guardar tarjeta para futuros pagos
              </label>
            </div>
          `
          : ``
      }
      <div class="container-pay-button">
          <button id="tonderPayButton" class="pay-button hidden">${data.customization?.paymentButton?.text}</button>
      </div>
      <div id="msgError"></div>
      <div id="msgNotification"></div>
    </div>
    ${
      data?.customization?.paymentMethods?.show
        ? `
          <div id="apmsListContainer" class="apms-list-container"></div>
          `
        : ``
    }
    <div class="tndr-footer">
      <div class="tndr-footer-secure">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18" height="18" viewBox="0 0 33 33">
            <image id="Material_Icon_Lock_1_" data-name="Material Icon Lock (1)" width="33" height="33" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAAXNSR0IArs4c6QAAA5dJREFUeF7tnWFSwjAQRls4mHgZOpxCOQVTLqMejFbjEIep1mz7bXYzzccvRtkmvJfdpE2BtuHDlUDr2jobbyjAeRBQAAXICFwul8Nutzu0bfsUI8ZxPITnbdu+x7/dbrdzeH46nX7+JmvB51XFZ0Df969N07wsxROlBCElyyhWwFrwM6LOXdcFkcU9ihOgDH4KvDgRRQnIDD/KKEpCMQKM4H9LCPPD8Xh8LqEeFSHger2+xRWNIZQiMsFdgOXI/0OuuwRXAUvhh9IxjuNHADkMw3tcXk7PERZmk6sEbwHjgpIjBrVUbNd1bhzcGpZCCqN+zclUyIr9fv8izAax3AUDRvRSFwH3kvEm6CEMRiraKwtcBEhWPZpLRUl7X6tTWLZgQP16SbEChmF41rqGI804jywwFyCEoT4aJaVIU7o0G4oToFl6phAEpUhdfEqEuYAUhJwCUlmQs+05EcUJyDkZUkDTNKkMyFmHU/NPFRnQ9/2/Z7+5VyLe7U9LkXkJ8gbg3T4FOGcgBVAA54DHLOAcMKkJuRcBLEEsQSxBLEH/XKDZRAkKp/zhHk7hblTqepX7/+Ne9OM+tFanVCfh1LUWrU47H0f1iqmagErgq99dpyKgMviqEmABqSuMzuUia/MaEzYsoNLRr5YFsIDU9f2sQ9D54Br7B7CA1OVdZ0bZm0fLEAWAiigABIiGUwBKEIynABAgGk4BKEEwngJAgGg4BaAEwXgKAAGi4RSAEgTjKQAEiIZTAEoQjKcAECAaXquA89znhK33oWsTkNyPtd6fqElAEn4sJ5YSahEghm8tYfMCkF0ni82izQtAPjNmUYo2LwD5zJjFHRubF4C+wdxlCO1f8XvC6BukAPBUkyUoATD3COMk7C+gWVuGLG4aW9u3iLX4OeDeUZ6IzSWCQQmKTYslWKz/Y6dqyQCxBEv4oVO1Cfj+1tvw1ZV/XY5e8y3r4CKtPgEoMO346jJAGyB6PApACYLxFAACRMMpACUIxlMACBANpwCUIBhPASBANJwCUIJgPAWAANFwCkAJgvEUAAJEwykAJQjGuwuw2HUCGWULR24ai53S2BFb9WOb2ajYHli8STTXLVhAOLDhrpgt3kRryB0bahlwF1BjFsCjP7BTyYAKJajAVxVQkQQ1+OoCwgEff1bQ+uNCuSaIuA+d40eh1UpQrje/9eNSgLNhCqAAZwLOzTMDKMCZgHPzzAAKcCbg3PwnnbeGf25S3XwAAAAASUVORK5CYII="/>
          </svg>
          <p>Pagos seguros con Tonder</p>
      </div>
      <div class="tndr-footer-logos">
          <img class="tndr-pci-logo" src="${COMMON_LOGOS.pci}" alt="pci"/>
          <div class="tndr-footer-logos-divider"></div>
          <img class="tndr-tonder-logo" src="${COMMON_LOGOS.tonderBlue}" alt="tonder"/>
      </div>
    </div>
  <style>
  .container-pay-button{
    padding: ${!!showPaymentButton ? "30px 0" : ""};
  }
  
  .container-form {
    padding:  ${!!showPaymentButton ? `${paddingTopContainerForm} 30px 0 30px` : `${paddingTopContainerForm} 30px 20px 30px`}; 
  }
  
  .collect-row {
   display: flex;
    flex-wrap: wrap; 
    justify-content: space-between;
    width: 100% !important;
    gap: 16px; 
  }
  
  .collect-row > * {
    flex: 1 1 calc(50% - 8px);
    box-sizing: border-box;
  }
  .containerExpirationDate{
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-end;
  }
  .tndr-form-label{
    line-height: ${data?.customStyles?.labelStyles?.base?.lineHeight ? data?.customStyles?.labelStyles?.base?.lineHeight : "22px"};
    color: ${data?.customStyles?.labelStyles?.base?.color ? data?.customStyles?.labelStyles?.base?.color : defaultStyles.labelStyles.base.color};
    font-size: ${data?.customStyles?.labelStyles?.base?.fontSize ? data?.customStyles?.labelStyles?.base?.fontSize : defaultStyles.labelStyles.base.fontSize};
    font-family: ${data?.customStyles?.labelStyles?.base?.fontFamily ? data?.customStyles?.labelStyles?.base?.fontFamily : defaultStyles.labelStyles.base.fontFamily};
    font-weight: ${data?.customStyles?.labelStyles?.base?.fontWeight ? data?.customStyles?.labelStyles?.base?.fontWeight : defaultStyles.labelStyles.base.fontWeight};
    text-align: ${data?.customStyles?.labelStyles?.base?.textAlign ? data?.customStyles?.labelStyles?.base?.textAlign : "start"};
  }
  
  .containerExpirationDateInput{
      display: flex;
      align-items: center;
  }
  .expiration-year {
    position: relative !important;
    /*padding-top: 12px !important;*/
  }
  .empty-div {
    position: relative;
    margin-top: 2px;
    margin-bottom: 4px;
  }
  .tndr-card-holder {
    height: ${nameLabel === "" ? "60px" : "80px"};
  }
  .tndr-card-number {
    height: ${cardLabel === "" ? "60px" : "80px"};
  }
  .empty-div-date {
    height: 60px !important;
  }
  .card-collect-cvv{
      width: 100%;
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
    font-weight: 400;
    min-height: 2.3rem;
    border-radius: 5px;
    cursor: pointer;
    width: 100%;
    padding: .5em 1em;
    text-align: center;
    border: none;
    background-color: #000;
    color: #fff;
    margin-bottom: 0;
    font-family: "Inter", sans-serif;
  }
  .pay-button-text{
    margin: .5em 0;  
  }
  .hidden{
    display: none;
  }
  .cvvContainerCard{
   position: relative;
   padding: 0;
   display: flex;
   flex-direction: column;
   align-items: flex-start;
   justify-content: flex-end;
  }
  .cvvIconCard {
    position: absolute;
    right: -12px;
    top: 55%;
    transform: translate(-50%, -50%);
  }
  .spinner-tndr {
      width: 30px;
      height: 30px;
      border: 2px solid #FFF;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: spin-tndr 1s linear infinite;
  }
  .tndr-footer{
      padding: 70px 20px 40px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 20px;
      border-top: solid 1px #CED0D1;
  }
  .tndr-footer .tndr-footer-secure {
      display: flex;
      align-items: center;
      gap: 5px;
      text-align: start;
  }
  .tndr-footer .tndr-footer-secure p {
      margin: 0;
      color: #999999;
      font-size: 14px;
  }
  .tndr-footer .tndr-footer-logos {
      display: flex;
      align-items: center;
      border: 1px solid #CCCCCC;
      border-radius: 30px;
      font-weight: 400;
      gap: 12px;
      padding: 8px 12px;
  }
  .tndr-footer .tndr-footer-logos img {
      width: 100%;
      height: auto;
      object-fit: contain;
  }
  .tndr-pci-logo {
      max-width: 30px;
  }
  .tndr-tonder-logo {
      max-width: 80px;
  }
  .tndr-footer-logos-divider{
      width: .1px;
      height: 24px;
      background-color: #CCCCCC;
  }
  .tndr-simulate-input-cvv-container{
      height: 100%;
      width: 100%;
      position: absolute;
      pointer-events: none;
      
  }
  .tndr-simulate-input-cvv {
      width: 100%;
      pointer-events: none;
      position: relative;
  }
  .tndr-simulate-input-cvv-container label{
    line-height: ${data?.customStyles?.labelStyles?.base?.lineHeight ? data?.customStyles?.labelStyles?.base?.lineHeight : ""};
    color: transparent;
    font-size: ${data?.customStyles?.labelStyles?.base?.fontSize ? data?.customStyles?.labelStyles?.base?.fontSize : defaultStyles.labelStyles.base.fontSize};
    font-family: ${data?.customStyles?.labelStyles?.base?.fontFamily ? data?.customStyles?.labelStyles?.base?.fontFamily : defaultStyles.labelStyles.base.fontFamily};
    font-weight: ${data?.customStyles?.labelStyles?.base?.fontWeight ? data?.customStyles?.labelStyles?.base?.fontWeight : defaultStyles.labelStyles.base.fontWeight};
    text-align: ${data?.customStyles?.labelStyles?.base?.textAlign ? data?.customStyles?.labelStyles?.base?.textAlign : "start"};
    pointer-events: none;
  }
  .tndr-simulate-input-cvv input {
      width: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      min-height: 44px;
      background-color: transparent;
      pointer-events: none;
  }
  
  
  @keyframes spin-tndr {
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
    margin-left: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #333333;
  }
  
  .checkbox {
    margin-top: 10px;
    margin-bottom: 0;
    text-align: left;
    padding: 0;
    display: flex;
    align-items: center;
  }
  
  .checkbox input{
      appearance: none;
      margin: 0;
      min-width: 20px;
      border-radius: 3px;
      width: 20px;
      height: 20px;
      border: 1px solid #CED0D1;
      position: relative; 
  }
  
  .checkbox input:checked {
    background-color: #000000;
  }
  
  .checkbox input:checked::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 6px;
      width: 4px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
  }
  
  .cards-list-container {
    display: flex;
    flex-direction: column;
    padding: 0;
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
    color: #333333;
    gap: 12px;
    margin-top: 5px;
    padding: 5px 30px;
    position: relative;
  }
  
  .pay-new-card .card-number {
    font-size: 14px;
    font-weight: 600;
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
    color: #333333;
    gap: 12px;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 100%;
  }
  
  .error-custom-inputs-tonder {
    background-color: white;
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 100%;
    font-size: 12px;
    color: red;
  }
  
  .expiration-year .error-custom-inputs-tonder {
    background-color: white;
    position: absolute;
    left: 0;
    bottom: 3px;
    width: 100%;
    font-size: 12px;
    color: red;
  }
    @media screen and (max-width: 450px) and (min-width: 364px) {
      .tndr-footer-logos-divider{
          width: 1px;
      }
    }
    
    @media screen and (max-width: 363px) {
      .tndr-footer-logos-divider{
          width: 2px;
      }
    }
    @media screen and (max-width: 768px) {
    .tndr-pci-logo {
          max-width: 25px;
      }
      .tndr-tonder-logo {
          max-width: 60px;
      }
        .tndr-footer {
          padding: 70px 0 40px 0;
      }
    }
    @media screen and (max-width: 420px) {
      .collect-row > * {
        flex: 1 1 100%;
      }
      .collect-row {
         gap: 0;
         flex-direction: column;
      }
   }
  </style>
`;
};

export const cardItemsTemplate = data => {
  const showPaymentButton = get(data, FIELD_PATH_NAMES.paymentButton, false);

  const cardItemsHTML = data.cards.reduce((total, card) => {
    return `${total}
    <div class="ac ac-cards" id="option_container-${card.skyflow_id}">
      <div class="card-item" >
          <input id="${card.skyflow_id}" class="cards card_selected" name="card_selected" type="radio"/>
          <label class="card-item-label" for="${card.skyflow_id}">
            <div class="card-item-data">
              <img class="card-image" src="${getCardType(card.card_scheme)}" alt="" />
              <div class="card-number">${card.card_number}</div>
              <div class="card-expiration">Exp. ${card.expiration_month}/${card.expiration_year}</div>
            </div>
            <div class="card-delete-icon">
              <button id="delete_button_${card.skyflow_id}" class="card-delete-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 26.972 30.898">
                  <path id="Delete_Icon" data-name="Delete Icon" d="M165.057-809.1a3.218,3.218,0,0,1-2.381-1.008,3.336,3.336,0,0,1-.99-2.425V-834.85H160v-3.433h8.429V-840h10.114v1.717h8.429v3.433h-1.686v22.315a3.336,3.336,0,0,1-.99,2.425,3.218,3.218,0,0,1-2.381,1.008Zm3.371-6.866H171.8v-15.449h-3.371Zm6.743,0h3.371v-15.449h-3.371Z" transform="translate(-160 840)"/>
                </svg>
              </button>
            </div>
          </label>
      </div>
      <div class="ac-panel">
        <div class="ac-option-panel-container" id="acContainer${card.skyflow_id}">
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
           ${
             showPaymentButton
               ? `<div class="container-card-pay-button">
                <button id="tonderPayButton${card.skyflow_id}" class="card-pay-button pay-button">${data.customization?.paymentButton?.text}</button>
               </div> `
               : ``
           }
        </div>
      </div>
    </div>`;
  }, "");
  const cardItemStyle = `
    <style>
    ${getCommonStyles(data)}
      .ac-cards{
        border: none;
        border-bottom: 1px solid #CED0D1;
      }
      .cvvContainer{
       max-width: 50%; 
       position: relative;
       padding: 0 0 0 40px;
      }
      .cvvIcon {
        position: absolute;
        right: -12px;
        top: 54%;
        opacity: 0;
        transform: translate(-50%, 10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .cvvContainer.show .cvvIcon {
        opacity: 1;
        transform: translate(-50%,-50%);
        transition-delay: 0.3s;
      }
      .ac-option-panel-container.show .card-pay-button {
        opacity: 1;
        transform: translateY(0);
        transition-delay: 0.3s;
      }
      .container-card-pay-button{
         margin: 20px 0 40px 0;
      }
      .card-item-label {
        justify-content: space-between;
      }
      .card-item-data{
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .card-item {
        position: relative;
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 12px;
        padding: 5px 30px;
      }

      .card-item .card-number,
      .card-item .card-expiration {
        font-size: 14px;
        font-weight: 600;
      }
      .card-item .card-expiration {
        margin-left: 2.5em;
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
        padding: 0;
        display: flex;
        align-items: center;
      }

      .card-delete-button:hover {
        background-color: transparent !important;
        color: #D91C1C !important;
      }
      
      @media screen and (max-width: 768px) {
        .cvvContainer {
          max-width: 60%;
        }
      }
    
      @media screen and (max-width: 480px) {
        .cvvContainer {
          max-width: 100%;
        }
        .cvvIcon {
            top: 58%;
          }
      }
    </style>
  `;
  return `
    <div class="accordion-container">
    ${cardItemsHTML}
  </div>
  ${cardItemStyle}
  `;
};

export const apmItemsTemplate = data => {
  const showPaymentButton = get(data, FIELD_PATH_NAMES.paymentButton, false);

  const apmItemsHTML = data.paymentMethods.reduce((total, apm) => {
    const apm_data = getPaymentMethodDetails(apm.payment_method);
    return `${total}
    <div class="ac ac-paymentMethods" id="option_container-${apm.pk}">
      <div class="apm-item">
          <input id="${apm.pk}" class="paymentMethods card_selected" name="card_selected" type="radio"/>
          <label class="apm-item-label" for="${apm.pk}">
            
            <div class="apm-image">
              <div class="apm-image-border"></div>
              <img src="${apm_data.icon}" alt="${apm_data.label}" />
            </div>
            <div class="apm-name">${apm_data.label}</div>
          </label>
      </div>
      <div class="ac-panel">
        <div class="ac-option-panel-container" id="acContainer${apm.pk}">
        <div class="tndr-hide-text">accordion</div>
          ${
            showPaymentButton
              ? `<div class="container-pm-pay-button">
                 <button id="tonderPayButton${apm.pk}" class="pm-pay-button pay-button">${data.customization?.paymentButton?.text}</button>
               </div> `
              : ``
          }
        </div>
      </div>   
    </div>`;
  }, ``);

  const apmItemStyle = `
    <style>
      .ac-option-panel-container{
        padding-top: 10px;
      }
      .ac-paymentMethods{
        border: none;
        border-top: 1px solid #CED0D1;
      }
      ${getCommonStyles(data)}
      .apm-item-label {
        justify-content: flex-start;
      }
      .apm-item {
        position: relative;
        display: flex;
        justify-content: start;
        align-items: center;
        gap: 22px;
        padding: 5px 30px;
      }
     .container-pm-pay-button{
        margin: 0 0 40px 0;
      }
      .ac-option-panel-container.show .pm-pay-button {
        opacity: 1;
        transform: translateY(0);
      }
      /*.apm-item:first-child {*/
      /*  border-top: 1px solid #CED0D1;*/
      /*}*/

      .apm-item .apm-name {
        font-size: 14px;
        font-weight: 600;
        color: #333333;
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
      .card_selected:before {
        width: 10px;
        height: 10px;
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #FFFFFF;
        opacity: 0;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:checked {
        border: 1px #000000 solid;
        position: relative;
        width: 16px;
        height: 16px;
        min-width: 16px;
        appearance: none;
        cursor: pointer;
        border-radius: 100%;
        color: #FFFFFF;
        background-color: #000000;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:checked:before {
        content: "";
        border: 0;
        width: 9px;
        height: 9px;
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #ffffff;
        opacity: 50;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:hover:before {
        width: 9px;
        height: 9px;
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        transform: translate(-50%, -50%);
        border-radius: 100%;
        background-color: #ffffff;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
        opacity: 10;
      }

    </style>
  `;
  return `
  <div class="accordion-container-apm">
    ${apmItemsHTML}
  </div>
  ${apmItemStyle}
  `;
};

const getFontFamily = data => {
  const base = data?.customStyles?.labelStyles?.base;
  return base?.fontFamily || '"Inter", sans-serif';
};

const getCommonStyles = data => `
  .tndr-hide-text {
    color: transparent;
    font-size: 1px;
  }
  .card_selected {
    background-color: #F5F5F5;
    position: relative;
    width: 25px;
    height: 25px;
    min-width: 25px;
    appearance: none;
    cursor: pointer;
    border-radius: 100%;
    border: 1px #000000 solid;
    color: #FFFFFF;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    margin: 0 3px 0 0;
  }
  .card_selected:focus {
    outline: none;
  }
  .card_selected:before {
    width: 10px;
    height: 10px;
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    transform: translate(-50%, -50%);
    border-radius: 100%;
    background-color: #FFFFFF;
    opacity: 0;
    transition-property: opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  .card_selected:checked {
    border: 1px #000000 solid;
    position: relative;
    width: 25px;
    height: 25px;
    min-width: 25px;
    appearance: none;
    cursor: pointer;
    border-radius: 100%;
    color: #FFFFFF;
    background-color: #000000;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  .card_selected:checked:before {
    content: "";
    border: 0;
    width: 9px;
    height: 9px;
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    transform: translate(-50%, -50%);
    border-radius: 100%;
    background-color: #FFFFFF;
    opacity: 50;
    transition-property: opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  .card_selected:hover:before {
    width: 9px;
    height: 9px;
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    transform: translate(-50%, -50%);
    border-radius: 100%;
    background-color: #FFFFFF;
    transition-property: opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    opacity: 10;
  }
  .card-item-label,
  .apm-item-label {
    display: flex;
    align-items: center;
    color: #333333;
    gap: 12px;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 100%;
  }
  .ac {
    background-color: transparent !important;
    margin-bottom: 0 !important;
  }
  .ac-option-panel-container{
    padding: ${get(data, FIELD_PATH_NAMES.paymentButton, false) ? "20px 30px 0px 30px" : "0px 30px 0px 30px"};
  }
  .pm-pay-button,
  .card-pay-button{
        display: block;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
  }
`;
