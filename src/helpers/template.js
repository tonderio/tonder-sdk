import "accordion-js/dist/accordion.min.css";
import { getCardFormLabels, getCardType } from "./utils";
import { getPaymentMethodDetails } from "../shared/catalog/paymentMethodsCatalog";
import { getDefaultStyles } from "./styles";
import { COMMON_LOGOS } from "../shared/catalog/commonLogosCatalog";
import get from "lodash.get";
import { FIELD_PATH_NAMES } from "../shared/constants/fieldPathNames";
import { HTML_IDS } from "../shared/constants/htmlTonderIds";
import { DISPLAY_MODE } from "../shared/constants/displayMode";
import { COLORS } from "../shared/constants/colors";

export const containerCheckoutTemplate = data => {
  const displayMode = data.customization?.displayMode || DISPLAY_MODE.light;
  const renderPaymentButton = get(data, FIELD_PATH_NAMES.paymentButton, false);
  document.documentElement.setAttribute("data-theme", displayMode);
  return `
    <div class="container-tonder" id="${HTML_IDS.tonderContainer}">
      <div id="${HTML_IDS.globalLoader}" class="global-loader"></div>
    </div>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");
        :root {
          --tndr-gray-dark: ${COLORS.grayDark};
          --tndr-gray-medium: ${COLORS.grayMedium};
          --tndr-white: ${COLORS.white};
          --tndr-black: ${COLORS.black};
          --tndr-purple: ${COLORS.purple};
          --tndr-border-light: ${COLORS.borderLight};
          --tndr-border-dark: ${COLORS.borderDark};
          --tndr-red-extra-light: ${COLORS.redExtraLight};
          --tndr-red: ${COLORS.red};
          --tndr-green-extra-light: ${COLORS.greenExtraLight};
          --tndr-green: ${COLORS.green};
          --tndr-border-medium: ${COLORS.borderMedium};
          --tndr-gray-extra-light: ${COLORS.grayExtraLight};
      }
      .container-tonder {
        background-color: var(--tndr-white);
        margin: 0 auto !important;
        padding: 0;
        overflow: hidden;
        transition: max-height 0.5s ease-out;
        max-width: 600px;
        border: solid 1px var(--tndr-border-light);
        position: relative;
        font-family: ${getFontFamily(data)};
        border-radius: 11px;
      }
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
        border: 1px var(--tndr-black) solid;
        color: var(--tndr-white);
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
        background-color: var(--tndr-white);
        opacity: 0;
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      .card_selected:checked {
        border: 1px var(--tndr-black) solid;
        position: relative;
        width: 25px;
        height: 25px;
        min-width: 25px;
        appearance: none;
        cursor: pointer;
        border-radius: 100%;
        color: var(--tndr-white);
        background-color: var(--tndr-black);
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
        background-color: var(--tndr-white);
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
        background-color: var(--tndr-white);
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
        opacity: 10;
      }
      .card-item-label,
      .apm-item-label {
        display: flex;
        align-items: center;
        color: var(--tndr-gray-medium);
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
        padding: ${renderPaymentButton ? "20px 30px 35px 30px" : "0px 30px 35px 30px"};
      }
      .pm-pay-button,
      .card-pay-button{
            display: block;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .error-container {
        display: none;
        color: var(--tndr-red) !important;
        background-color: var(--tndr-red-extra-light) !important;
        margin-bottom: 13px !important;
        font-size: 14px !important;
        padding: 10px 10px !important;
        border-radius: 5px !important;
        text-align: left !important;
        align-items: center;
        gap: 8px;
        margin-top: 15px;
      }
    
      .message-container {
        display: none;
        color: var(--tndr-green) !important;
        background-color: var(--tndr-green-extra-light) !important;
        margin-bottom: 13px !important;
        font-size: 14px !important;
        padding: 10px 10px !important;
        border-radius: 5px !important;
        text-align: left !important;
        align-items: center;
        gap: 8px;
        margin-top: ${renderPaymentButton ? "0px" : "15px"};
      }
      .error-container p,
      .message-container p {
        margin: 0;
      }
      .tndr-button {
        font-size: 16px;
        font-weight: 400;
        min-height: 2.3rem;
        border-radius: 5px;
        cursor: pointer;
        width: 100%;
        padding: .5em 1em;
        text-align: center;
        border: none;
        color: var(--tndr-white);
        margin-bottom: 0;
        font-family: "Inter", sans-serif;
       }
      .pay-button {
        background-color: var(--tndr-black);
      }
      .cancel-button {
        background-color: #e9e9e9;
        color: var(--tndr-black);
      }
      .pay-button-text,
      .cancel-button-text{
        margin: .4em 0;  
      }
      [data-theme="dark"] .container-tonder {
        background-color: var(--tndr-gray-dark);
      }
      [data-theme="dark"] .card-item-label {
        color: var(--tndr-white);
      }
      [data-theme="dark"] .apm-item-label {
        color: var(--tndr-white);
      }
      [data-theme="dark"] .card-item-label-new {
        color: var(--tndr-white);
      }
      [data-theme="dark"] .checkbox label {
        color: var(--tndr-white);
      }
      [data-theme="dark"] .card_selected:checked {
        background-color: var(--tndr-purple);
        border: none;
      }
      [data-theme="dark"] .card_selected:checked:before {
        background-color: var(--tndr-gray-dark);
      }
      [data-theme="dark"] .card_selected:hover:before {
        background-color: var(--tndr-gray-dark);
      }
      [data-theme="dark"] .card_selected:before {
        background-color: var(--tndr-gray-dark);
      }
      [data-theme="dark"] .card_selected {
        background-color: #5C5C5C;
        border: 1px var(--tndr-border-dark) solid;
      }
      [data-theme="dark"] .card-delete-button svg path {
        fill: var(--tndr-white);
      }
      [data-theme="dark"] .pay-button {
        background-color: var(--tndr-purple);
      }
      [data-theme="dark"] .cancel-button {
        background-color: var(--tndr-gray-dark);
        color: var(--tndr-white);
      }
      [data-theme="dark"] .tndr-footer-logos {
        border: 1px solid var(--tndr-border-medium);
      }
      [data-theme="dark"] .tndr-footer .tndr-footer-secure p {
        color: var(--tndr-gray-extra-light);
      }
    </style>
  `;
};

export const cardTemplate = data => {
  const displayMode = data.customization?.displayMode || DISPLAY_MODE.light;
  const isDarkMode = displayMode === DISPLAY_MODE.dark;
  const defaultStylesData = getDefaultStyles(isDarkMode);
  const showPaymentButton = get(data, FIELD_PATH_NAMES.paymentButton, false);
  const showCancelButton = get(data, FIELD_PATH_NAMES.cancelButton, false);

  const existCardsOrPaymentMethods =
    data.cardsData.length > 0 || data.paymentMethodsData.length > 0;
  const paddingTopContainerForm = existCardsOrPaymentMethods ? "5px" : "30px";
  const { cardLabel, cvvLabel, expiryDateLabel, nameLabel } = getCardFormLabels(
    data.customStyles,
  ).labels;

  return `
    ${data?.customization?.saveCards?.showSaved ? `<div id="${data.collectorIds.cardsListContainer}" class="cards-list-container"></div>` : ``}
    ${
      existCardsOrPaymentMethods && data?.customization?.cardForm?.show
        ? `
      <div class="pay-new-card">
        <input checked id="new" class="card_selected" name="card_selected" type="radio"/>
        <label class="card-item-label-new" for="new">
          <img class="card-image" src="${getCardType("XXXX", displayMode === DISPLAY_MODE.dark)}" alt="" />
          <div class="card-number">Tarjeta</div>
        </label>
      </div>
    `
        : ``
    }
    ${
      data?.customization?.cardForm?.show
        ? `
      <div class="container-form">
        <div id="${data.collectorIds.holderName}" class="empty-div tndr-card-holder"></div>
        <div id="${data.collectorIds.cardNumber}" class="empty-div tndr-card-number"></div>
        <div class="collect-row">
          <div class="containerExpirationDate">
            <label class="tndr-form-label">${expiryDateLabel}</label>
            <div class="containerExpirationDateInput">
              <div id="${data.collectorIds.expirationMonth}" class="empty-div empty-div-date"></div>
              <div id="${data.collectorIds.expirationYear}" class="empty-div empty-div-date"></div>
            </div>
          </div>
          <div class="cvvContainerCard" id="cvvContainerCard">
            <label class="tndr-form-label">${cvvLabel}</label>
            <div id="${data.collectorIds.cvv}" class="empty-div card-collect-cvv empty-div-date">
                <div class="tndr-simulate-input-cvv-container">
                    <div class="tndr-simulate-input-cvv">
                        ${
                          isDarkMode
                            ? `
                           <svg class="cvvIconCard" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="40" height="24" viewBox="0 0 78 52">
                            <image id="BBVA_136_2x" data-name="BBVA – 136@2x" width="78" height="52" xlink:href="data:image/png;base64,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"/>
                          </svg>
                          `
                            : `
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
                          `
                        }
                        <input tabindex="-1"/>
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
        ${buttonAndMessagesTemplate({
          ...data,
          showPaymentButton,
          showCancelButton,
          classContainerButton: "container-pay-button",
          classPayButton: "tndr-button pay-button hidden",
          classCancelButton: "tndr-button cancel-button hidden",
          tonderPayButtonId: data.collectorIds.tonderPayButton,
          tonderCancelButtonId: data.collectorIds.tonderCancelButton,
          msgErrorId: data.collectorIds.msgError,
          msgErrorTextId: data.collectorIds.msgErrorText,
          msgNotificationId: data.collectorIds.msgNotification,
          msgNotificationTextId: data.collectorIds.msgNotificationText,
        })}
      </div>
        `
        : ``
    }
    ${
      data?.customization?.paymentMethods?.show
        ? `
          <div id="${data.collectorIds.apmsListContainer}" class="apms-list-container"></div>
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
          ${
            isDarkMode
              ? `
              <img class="tndr-tonder-logo" src="${COMMON_LOGOS.tonderWhite}" alt="tonder"/>
            `
              : `
              <img class="tndr-tonder-logo" src="${COMMON_LOGOS.tonderBlue}" alt="tonder"/>
            `
          }
      </div>
    </div>
  <style>
  .container-pay-button{
    padding-top: ${!!showPaymentButton ? "25px" : ""};
  }
  .container-cancel-button{
    padding-top: ${showCancelButton ? "10px" : "0"};
    padding-bottom: 0;
  }
  .container-form {
    padding:  ${!!showPaymentButton ? `${paddingTopContainerForm} 30px 35px 30px` : `${paddingTopContainerForm} 30px 35px 30px`}; 
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
    color: ${data?.customStyles?.labelStyles?.base?.color ? data?.customStyles?.labelStyles?.base?.color : defaultStylesData.labelStyles.base.color};
    font-size: ${data?.customStyles?.labelStyles?.base?.fontSize ? data?.customStyles?.labelStyles?.base?.fontSize : defaultStylesData.labelStyles.base.fontSize};
    font-family: ${data?.customStyles?.labelStyles?.base?.fontFamily ? data?.customStyles?.labelStyles?.base?.fontFamily : defaultStylesData.labelStyles.base.fontFamily};
    font-weight: ${data?.customStyles?.labelStyles?.base?.fontWeight ? data?.customStyles?.labelStyles?.base?.fontWeight : defaultStylesData.labelStyles.base.fontWeight};
    text-align: ${data?.customStyles?.labelStyles?.base?.textAlign ? data?.customStyles?.labelStyles?.base?.textAlign : defaultStylesData.labelStyles.base.textAlign};
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
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .spinner-tndr {
      width: 30px;
      height: 30px;
      border: 2px solid var(--tndr-white);
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
      border-top: solid 1px var(--tndr-border-light);
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
      border: 1px solid var(--tndr-border-medium);
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
    font-size: ${data?.customStyles?.labelStyles?.base?.fontSize ? data?.customStyles?.labelStyles?.base?.fontSize : defaultStylesData.labelStyles.base.fontSize};
    font-family: ${data?.customStyles?.labelStyles?.base?.fontFamily ? data?.customStyles?.labelStyles?.base?.fontFamily : defaultStylesData.labelStyles.base.fontFamily};
    font-weight: ${data?.customStyles?.labelStyles?.base?.fontWeight ? data?.customStyles?.labelStyles?.base?.fontWeight : defaultStylesData.labelStyles.base.fontWeight};
    text-align: ${data?.customStyles?.labelStyles?.base?.textAlign ? data?.customStyles?.labelStyles?.base?.textAlign : defaultStylesData.labelStyles.base.textAlign};
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
    color: var(--tndr-gray-medium);
  }
  
  .checkbox {
    margin-top: 10px;
    margin-bottom: 10px;
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
      border: 1px solid var(--tndr-border-light);
      position: relative; 
  }
  
  .checkbox input:checked {
    background-color: var(--tndr-black);
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
    color: var(--tndr-gray-medium);
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
    color: var(--tndr-gray-medium);
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
  const displayMode = data.customization?.displayMode || DISPLAY_MODE.light;
  const isDarkMode = displayMode === DISPLAY_MODE.dark;
  const showPaymentButton = get(data, FIELD_PATH_NAMES.paymentButton, false);
  const showCancelButton = get(data, FIELD_PATH_NAMES.cancelButton, false);
  const { cvvLabel } = getCardFormLabels(data.customStyles).labels;
  console.log("cvvLabel", cvvLabel);
  const cardItemsHTML = data.cards.reduce((total, card) => {
    return `${total}
    <div class="ac ac-cards" id="option_container-${card.skyflow_id}">
      <div class="card-item" >
          <input id="${card.skyflow_id}" class="cards card_selected" name="card_selected" type="radio"/>
          <label class="card-item-label" for="${card.skyflow_id}">
            <div class="card-item-data">
              <img class="card-image" src="${getCardType(card.card_scheme, displayMode === DISPLAY_MODE.dark)}" alt="" />
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
           <label class="tndr-form-label label-cvv-cards">${cvvLabel}</label>
            <div id="${data.collectorIds.cvv}${card.skyflow_id}" class="empty-div">
              <div class="tndr-simulate-input-cvv-container">
                <div class="tndr-simulate-input-cvv">
                    ${
                      isDarkMode
                        ? `
                        <svg class="cvvIcon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="40" height="24" viewBox="0 0 78 52">
                         <image id="BBVA_136_2x" data-name="BBVA – 136@2x" width="78" height="52" xlink:href="data:image/png;base64,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"/>
                        </svg>
                      `
                        : `
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
                      `
                    }
                    <input tabindex="-1"/>
                </div>
              </div>
            </div>

           </div>
              ${buttonAndMessagesTemplate({
                ...data,
                showPaymentButton,
                showCancelButton,
                classContainerButton: "container-pay-button",
                classPayButton: "card-pay-button tndr-button pay-button",
                classCancelButton: "card-pay-button tndr-button cancel-button",
                tonderPayButtonId: `${data.collectorIds.tonderPayButton}${card.skyflow_id}`,
                tonderCancelButtonId: `${data.collectorIds.tonderCancelButton}${card.skyflow_id}`,
                msgErrorId: `${data.collectorIds.msgError}${card.skyflow_id}`,
                msgErrorTextId: `${data.collectorIds.msgErrorText}${card.skyflow_id}`,
                msgNotificationId: `${data.collectorIds.msgNotification}${card.skyflow_id}`,
                msgNotificationTextId: `${data.collectorIds.msgNotificationText}${card.skyflow_id}`,
              })}
             
        </div>
      </div>
    </div>`;
  }, "");
  const cardItemStyle = `
    <style>
      .ac-cards{
        border: none;
        border-bottom: 1px solid var(--tndr-border-light);
      }
      .cvvContainer{
       max-width: 50%; 
       position: relative;
       padding: 0 0 0 40px;
      }
      .label-cvv-cards {
        opacity: 0;
      }
      .cvvIcon {
        position: absolute;
        right: -12px;
        top: 21px;
        opacity: 0;
        transform: translate(-50%, 10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .cvvContainer.show .label-cvv-cards{
        opacity: 1;
        transition-delay: 0.3s;
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
        color: var(--tndr-black);
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
  const showCancelButton = get(data, FIELD_PATH_NAMES.cancelButton, false);

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
        <div class="ac-option-panel-container tndr-pm-item-container" id="acContainer${apm.pk}">
        <div class="tndr-hide-text">accordion</div>
              ${
                apm.payment_method.toUpperCase().includes("SAFETYPAY")
                  ? `<div class="safetypay-banks-container-placeholder" id="safetypay-banks-${apm.pk}">
                  <div class="safetypay-banks-loading">
                    Cargando bancos disponibles...
                  </div>
                </div>`
                  : ""
              }
              ${buttonAndMessagesTemplate({
                ...data,
                showPaymentButton,
                showCancelButton,
                classContainerButton: "container-pay-button",
                classPayButton: "pm-pay-button tndr-button pay-button",
                classCancelButton: "pm-pay-button tndr-button cancel-button",
                tonderPayButtonId: `${data.collectorIds.tonderPayButton}${apm.pk}`,
                tonderCancelButtonId: `${data.collectorIds.tonderCancelButton}${apm.pk}`,
                msgErrorId: `${data.collectorIds.msgError}${apm.pk}`,
                msgErrorTextId: `${data.collectorIds.msgErrorText}${apm.pk}`,
                msgNotificationId: `${data.collectorIds.msgNotification}${apm.pk}`,
                msgNotificationTextId: `${data.collectorIds.msgNotificationText}${apm.pk}`,
              })}
              
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
        border-top: 1px solid var(--tndr-border-light);
      }
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
      .ac-option-panel-container.show .pm-pay-button {
        opacity: 1;
        transform: translateY(0);
      }
      .ac-option-panel-container.tndr-pm-item-container{
        padding-top: 0;
      }

      .apm-item .apm-name {
        font-size: 14px;
        font-weight: 600;
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
    </style>
  `;
  return `
  <div class="accordion-container-apm">
    ${apmItemsHTML}
  </div>
  ${apmItemStyle}
  `;
};

const buttonAndMessagesTemplate = data => {
  return `
      ${
        data.showPaymentButton
          ? `
         <div class="${data.classContainerButton}">
          <button id="${data.tonderPayButtonId}" class="${data.classPayButton}">${data.customization?.paymentButton?.text}</button>
        </div>
        `
          : ``
      }
      ${
        data.showCancelButton
          ? `
             <div class="container-cancel-button">
              <button type="button" id="${data.tonderCancelButtonId}" class="${data.classCancelButton}">${data.customization?.cancelButton?.text}</button>
            </div>
            `
          : ``
      }
      ${
        data?.customization?.showMessages
          ? `
          <div id="${data.msgErrorId}" class="error-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="17" viewBox="0 0 28.25 27.828">
              <path id="Cancel_Icon" data-name="Cancel Icon" d="M89.04-859.129l5.085-5.009,5.085,5.009,1.978-1.948L96.1-866.086l5.085-5.009-1.978-1.948-5.085,5.009-5.085-5.009L87.063-871.1l5.085,5.009-5.085,5.009Zm5.085,6.957a13.935,13.935,0,0,1-5.509-1.1,14.276,14.276,0,0,1-4.485-2.974,14.04,14.04,0,0,1-3.019-4.418A13.375,13.375,0,0,1,80-866.086a13.374,13.374,0,0,1,1.112-5.426,14.041,14.041,0,0,1,3.019-4.418,14.277,14.277,0,0,1,4.485-2.974,13.932,13.932,0,0,1,5.509-1.1,13.933,13.933,0,0,1,5.509,1.1,14.278,14.278,0,0,1,4.485,2.974,14.041,14.041,0,0,1,3.019,4.418,13.374,13.374,0,0,1,1.112,5.426,13.375,13.375,0,0,1-1.112,5.426,14.04,14.04,0,0,1-3.019,4.418,14.276,14.276,0,0,1-4.485,2.974A13.935,13.935,0,0,1,94.125-852.172Z" transform="translate(-80 880)" fill="#832828"/>
            </svg>
            <p id="${data.msgErrorTextId}"></p>
          </div>
          <div id="${data.msgNotificationId}" class="message-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="17" viewBox="0 0 28.25 27.828">
              <path id="Check_Circle_Icon" data-name="Check Circle Icon" d="M92.147-859.686l9.958-9.809-1.977-1.948-7.981,7.861-4.026-3.965L86.144-865.6Zm1.978,7.513a13.935,13.935,0,0,1-5.509-1.1,14.278,14.278,0,0,1-4.485-2.974,14.041,14.041,0,0,1-3.019-4.418A13.374,13.374,0,0,1,80-866.086a13.374,13.374,0,0,1,1.112-5.426,14.041,14.041,0,0,1,3.019-4.418,14.278,14.278,0,0,1,4.485-2.974,13.935,13.935,0,0,1,5.509-1.1,13.935,13.935,0,0,1,5.509,1.1,14.278,14.278,0,0,1,4.485,2.974,14.041,14.041,0,0,1,3.019,4.418,13.374,13.374,0,0,1,1.112,5.426,13.374,13.374,0,0,1-1.112,5.426,14.041,14.041,0,0,1-3.019,4.418,14.278,14.278,0,0,1-4.485,2.974A13.935,13.935,0,0,1,94.125-852.172Z" transform="translate(-80 880)" fill="#28832c"/>
            </svg>
            <p id="${data.msgNotificationTextId}"></p>
          </div>
        `
          : ``
      }
      
  `;
};

const getFontFamily = data => {
  const base = data?.customStyles?.labelStyles?.base;
  return base?.fontFamily || '"Inter", sans-serif';
};

/**
 * Template for SafetyPay bank selection
 * @param {Object} data - Data object containing banks and configuration
 * @returns {string} HTML template for SafetyPay bank selection
 */
export const safetyPayBankTemplate = data => {
  const { banks, paymentType, title } = data;

  if (!banks || banks.length === 0) {
    return `
      <div class="safetypay-banks-container">
        <h4>${title}</h4>
        <p class="no-banks-message">No hay bancos disponibles para este método de pago.</p>
      </div>
    `;
  }

  const banksHTML = banks
    .map(bankData => {
      const bank = bankData.bank;
      return `
      <div class="safetypay-bank-item">
        <input 
          type="radio" 
          id="safetypay-bank-${bank.id}" 
          name="safetypay-bank-${paymentType}" 
          value="${bank.id}" 
          data-bank-code="${bank.bank_code}"
          data-bank-name="${bank.name}"
          class="safetypay-bank-radio"
        />
        <label for="safetypay-bank-${bank.id}" class="safetypay-bank-label">
          <div class="safetypay-bank-logo">
            ${
              bank.logo
                ? `<img src="${bank.logo}" alt="${bank.name}" class="bank-logo-img" />`
                : `<div class="bank-logo-placeholder">${bank.name.charAt(0)}</div>`
            }
          </div>
          <div class="safetypay-bank-name">${bank.name}</div>
        </label>
      </div>
    `;
    })
    .join("");

  return `
    <div class="safetypay-banks-container">
      <h4 class="safetypay-banks-title">${title}</h4>
      <div class="safetypay-banks-grid">
        ${banksHTML}
      </div>
    </div>
    <style>
      .safetypay-banks-container {
        padding: 20px 0;
      }
      
      .safetypay-banks-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
        color: var(--tndr-text-color);
        font-family: ${getFontFamily()};
      }
      
      .safetypay-banks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .safetypay-bank-item {
        position: relative;
      }
      
      .safetypay-bank-radio {
        position: absolute;
        opacity: 0;
        cursor: pointer;
      }
      
      .safetypay-bank-label {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border: 1px solid var(--tndr-border-light);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: var(--tndr-background);
        font-family: ${getFontFamily()};
      }
      
      .safetypay-bank-label:hover {
        border-color: var(--tndr-border-hover);
        background: var(--tndr-background-hover);
      }
      
      .safetypay-bank-radio:checked + .safetypay-bank-label {
        border-color: var(--tndr-primary-color);
        background: var(--tndr-primary-light);
      }
      
      .safetypay-bank-logo {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        overflow: hidden;
        background: var(--tndr-background-light);
      }
      
      .bank-logo-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .bank-logo-placeholder {
        font-size: 18px;
        font-weight: bold;
        color: var(--tndr-text-secondary);
      }
      
      .safetypay-bank-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--tndr-text-color);
        text-align: left; 
        flex: 1;
      }
      
      .no-banks-message {
        color: var(--tndr-text-secondary);
        font-style: italic;
        text-align: center;
        padding: 20px;
      }
      
      /* Loading state */
      .safetypay-banks-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--tndr-text-secondary);
      }
      
      .safetypay-banks-loading::after {
        content: '';
        width: 20px;
        height: 20px;
        margin-left: 10px;
        border: 2px solid var(--tndr-border-light);
        border-top: 2px solid var(--tndr-primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
};
