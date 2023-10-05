export const cardTemplate = `
<div class="container-tonder">
<p class="p-card-tonder">Titular de la tarjeta</p>
<div id="collectCardholderNameTonder" class="empty-div-tonder"></div>
<p class="p-card-tonder"> Información de la tarjeta</p>
<div id="collectCardNumberTonder" class="empty-div-tonder"></div>
<div class="collect-row-tonder">
<div id="collectExpirationMonthTonder" class="empty-div-dates-tonder"></div>
<div id="collectExpirationYearTonder" class="empty-div-dates-tonder"></div>
<div id="collectCvvTonder" class="empty-div-cvc-tonder"></div>
</div>
<div id="msgError"></div>
<div>
<div class="container-politics-tonder">
<input type="checkbox" id="acceptTonder" name="scales" checked>
<label class="terms-label-tonder" for="scales">
  He leído y estoy de acuerdo con los
  <a class="link-terms-tonder" href="https://uploads-ssl.webflow.com/64064b12c34bf2edb2b35b4b/64340cb7f63339f5e75eaf51_Te%CC%81rminos-y-Condiciones.cefc632e785489045e68.pdf" target="_blank">términos y condiciones</a>
  de este sitio web.
</label>
</div>
</div>
<button id="tonderPayButton" class="payButton">Pagar</button>
</div>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap');
.container-tonder {
width: 90% !important;
font-family: 'Inter', sans-serif;
margin: 0 auto !important;
max-height: 0px;
overflow: hidden;
transition: max-height 0.5s ease-out;
max-width: 600px;
}

.container-selected {
max-height: 100vh;
}

.p-card-tonder {
font-weight: bold !important;
font-size: 13px !important;
text-align: left;
}

.payment_method_zplit {
font-size: 16px !important;
width: 100% !important;
}

.payment_method_zplit  label img {
width: 68px !important;
padding-left: 1px !important;
}

.container-politics-tonder {
display: flex !important;
align-items: center !important;
margin-bottom: 2rem;
}

.politics-p-tonder {
font-size: 13px !important;
margin: 0 !important;
}

.terms-label-tonder {
font-size: 14px !important;
margin: 0 0 0 10px !important;
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
height: 65px !important;
}

.empty-div-dates-tonder {
height: 90px !important;
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
.p-card-tonder {
  font-weight: bold !important;
  font-size: 13px !important;
  margin: 0 !important;
  padding: 0 !important;
}

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
