/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MySDK": () => (/* binding */ MySDK)
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var MySDK = /*#__PURE__*/function () {
  function MySDK() {
    _classCallCheck(this, MySDK);
    this.url = "";
  }
  _createClass(MySDK, [{
    key: "openWindow",
    value: function openWindow(url) {
      var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
      var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
      var left = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var top = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
      var params = arguments.length > 5 ? arguments[5] : undefined;
      if (params) {
        this.url = url + "?" + new URLSearchParams(params).toString();
      }
      var newWindow = window.open(url, '_blank', "width=".concat(width, ",height=").concat(height, ",left=").concat(left, ",top=").concat(top));
      var checkoutInterval = setInterval(function () {
        if (newWindow.closed) {
          console.log("The tab was closed!");
          clearInterval(checkoutInterval);
        }
      }, 500);
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(event) {
      if (event.origin === this.url) {
        console.log('Received message: ' + event.data);
      }
    }
  }]);
  return MySDK;
}();

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _classes_tonder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);

var sdk = new _classes_tonder__WEBPACK_IMPORTED_MODULE_0__.MySDK();
var params = {
  "api_key": "670d64ccf469709a5a47deae2d8055620ae9f81a",
  "email": "123@gmail.com",
  "type": "payment",
  "product_name": "Playera",
  "product_price": "400",
  "product_image": "https://cdn.shopify.com/s/files/1/0532/1025/1461/products/IPLAYBANGblueberryraspberry.jpg?v=1657302782",
  "shipping_cost": "150"
};
var btn = document.createElement('button');
btn.innerHTML = "Open Checkout";
btn.onclick = function () {
  sdk.openWindow('http://checkout.tonder.io/', 800, 600, 100, 100, params);
};
document.getElementById("tonder-checkout").appendChild(btn);
})();

/******/ })()
;