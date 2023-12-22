export const cardTemplate = `
<div class="container-tonder form-tonder">
  <div id="collectCardholderNameTonder" class="empty-div"></div>
  <div id="collectCardNumberTonder" class="empty-div"></div>
  <div class="collect-row">
    <div id="collectExpirationMonthTonder" class="empty-div"></div>
    <div id="collectExpirationYearTonder" class="expiration-year"></div>
    <div id="collectCvvTonder" class="empty-div"></div>
  </div>
  <label for="saveCardCheckbox" class="checkbox-label">
    <input type="checkbox" id="saveCardCheckbox" class="checkbox-input"> 
    <strong>Guardar tarjeta para pagos futuros</strong>
  </label>
  <div id="msgError"></div>
  <button id="tonderPayButton" class="payButton">Pagar</button>
</div>

<style>
.form-tonder .container-tonder {
  background-color: #F9F9F9;
  margin: 0 auto;
  padding: 30px 10px 30px 10px;
  max-height: 0px;
  overflow: hidden;
  transition: max-height 0.5s ease-out;
  max-width: 600px;
  border: solid 1px #e3e3e3;
}

.form-tonder .container-tonder label {
  display: flex !important;
  align-items: center !important
  margin-bottom: 10px !important;
}

.form-tonder .container-selected {
  max-height: 100vh;
}

.form-tonder .collect-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.form-tonder .collect-row > :first-child {
  min-width: 120px;
}

.form-tonder .expiration-year {
  padding-top: 25px;
}

.form-tonder .empty-div {
  height: 80px;
  margin-top: 2px;
  margin-bottom: 4px;
  margin-left: 10px;
  margin-right: 10px;
}

.form-tonder .reveal-view {
  margin-top: 0px;
}

.form-tonder .error-container {
  color: red;
  background-color: #FFDBDB;
  margin-bottom: 13px;
  font-size: 80%;
  padding: 8px 10px;
  border-radius: 10px;
  text-align: left;
}

.form-tonder .payButton {
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

.form-tonder .lds-dual-ring {
  display: inline-block;
  width: 14px;
  height: 14px;
}
.form-tonder .lds-dual-ring:after {
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
</style>
`
