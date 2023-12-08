export async function addScripts() {
  try {
    const skyflowScript = document.createElement("script");
    skyflowScript.src = "https://js.skyflow.com/v1/index.js";
    await new Promise((resolve, reject) => {
      skyflowScript.onload = resolve;
      skyflowScript.onerror = reject;
      document.head.appendChild(skyflowScript);
    });

    const openPay1Script = document.createElement("script");
    openPay1Script.src = "https://openpay.s3.amazonaws.com/openpay.v1.min.js";
    await new Promise((resolve, reject) => {
      openPay1Script.onload = resolve;
      openPay1Script.onerror = reject;
      document.head.appendChild(openPay1Script);
    });

    const openPay2Script = document.createElement("script");
    openPay2Script.src = "https://openpay.s3.amazonaws.com/openpay-data.v1.min.js";
    await new Promise((resolve, reject) => {
      openPay2Script.onload = resolve;
      openPay2Script.onerror = reject;
      document.head.appendChild(openPay2Script);
    });

  } catch (error) {
    console.error("Error loading scripts", error);
  }
}

export function toCurrency(value) {
  if (isNaN(parseFloat(value))) {
    return value;
  }
  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  });
  return formatter.format(value);
}

export function showError(message) {
  var msgErrorDiv = document.getElementById("msgError");
  msgErrorDiv.classList.add("error-tonder-container-tonder");
  msgErrorDiv.innerHTML = message;
  setTimeout(function () {
    try {
      document.querySelector("#tonderPayButton").disabled = false;
    } catch (error) {}
    msgErrorDiv.classList.remove("error-tonder-container-tonder");
    msgErrorDiv.innerHTML = "";
  }, 3000);
}
