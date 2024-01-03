export const cardTemplate = `
<div class="container-tonder">
  <div id="collectCardholderName" class="empty-div"></div>
  <div id="collectCardNumber" class="empty-div"></div>
  <div class="collect-row">
    <div id="collectExpirationMonth" class="empty-div"></div>
    <div id="collectExpirationYear" class="expiration-year"></div>
    <div id="collectCvv" class="empty-div"></div>
  </div>
  <div id="msgError"></div>
  <button id="tonderPayButton" class="pay-button">Pagar</button>
</div>

<style>
.container-tonder {
  background-color: #F9F9F9;
  margin: 0 auto !important;
  padding: 30px 10px 30px 10px;
  overflow: hidden;
  transition: max-height 0.5s ease-out;
  max-width: 600px;
  border: solid 1px #e3e3e3;
  max-height: 100vh;
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
  padding-top: 25px !important;
}

.empty-div {
  height: 80px !important;
  margin-top: 2px;
  margin-bottom: 4px;
  margin-left: 10px !important;
  margin-right: 10px !important;
}

.error-container{
  color: red !important;
  background-color: #FFDBDB !important;
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
  margin-bottom: 10px;
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


@media screen and (max-width: 600px) {
  .payment_method_zplit {
    font-size: 16px !important;
    width: 100% !important;
  }

  .payment_method_zplit  label img {
    display: none !important;
  }
}

</style>
`
