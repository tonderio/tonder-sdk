export const cardTemplate = `
<div class="container-tonder">
  <div id="collectCardholderNameTonder" class="empty-div-tonder"></div>
  <div id="collectCardNumberTonder" class="empty-div-tonder"></div>
  <div class="collect-row-tonder">
    <div id="collectExpirationMonthTonder" class="empty-div-dates-tonder"></div>
    <div id="collectExpirationYearTonder" class="empty-div-dates-tonder"></div>
    <div id="collectCvvTonder" class="empty-div-cvc-tonder"></div>
  </div>
  <div id="msgError"></div>
  <button id="tonderPayButton" class="payButton">Pagar</button>
</div>

<style>
.container-tonder {
  background-color: #F9F9F9;
  margin: 0 auto !important;
  padding: 30px;
  max-height: 0px;
  overflow: hidden;
  transition: max-height 0.5s ease-out;
  max-width: 600px;
  border: solid 1px #e3e3e3;
}

.container-selected {
  max-height: 100vh;
}

.collect-row-tonder {
  display: flex !important;
  justify-content: space-between !important;
  width: 100% !important;
}

.collect-row-tonder > div {
  width: calc(25% - 10px) !important;
}

.collect-row-tonder > div:last-child {
  width: 50% !important;
}

.empty-div-tonder {
  height: 80px !important;
  margin-top: 2px;
  margin-bottom: 4px;
}

.empty-div-dates-tonder {
  height: 120px !important;
}

.empty-div-cvc-tonder {
  height: 90px !important;
}

.reveal-view {
  margin-top: 0px !important;
}

.error-tonder-container-tonder{
  color: red !important;
  background-color: #FFDBDB !important;
  margin-bottom: 13px !important;
  font-size: 80% !important;
  padding: 8px 10px !important;
  border-radius: 10px !important;
  text-align: left !important;
}

.image-error-tonder {
  width: 14px !important;
  margin: -2px 5px !important;
}

.link-terms-tonder {
  color: black !important;
}

.link-terms-tonder:hover {
  text-decoration: None !important;
  color: black !important;
}
.payButton {
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
  margin-bottom: 10px;
  display: none;
}

.error-custom-inputs-tonder{
  margin-left: 4px !important;
  margin-top: -22px !important;
  font-size: 11px !important;
  color: red !important;
  text-align: left;
}

.error-custom-inputs-little-tonder{
  margin-left: 4px !important;
  margin-top: -46px !important;
  font-size: 11px !important;
  color: red !important;
  text-align: left;
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


@media screen and (max-width: 600px) {
.payment_method_zplit {
  font-size: 16px !important;
  width: 100% !important;
}

.payment_method_zplit  label img {
  display: none !important;
}

.empty-div-dates-tonder {
  height: 90px !important;
  width: 60px !important;
}

.empty-div-cvc-tonder {
  height: 90px !important;
  width: 130px !important;
}
}

</style>
`
