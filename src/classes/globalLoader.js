import { cardTemplateSkeleton } from "../helpers/template-skeleton.js";

class GlobalLoader {
  constructor() {
    this.requestCount = 0;
  }

  show() {
    this.requestCount++;
    const checkoutContainer = document.querySelector("#global-loader");
    if (checkoutContainer) {
      checkoutContainer.innerHTML = cardTemplateSkeleton;
      checkoutContainer.style.display = "block";
    }
  }

  remove() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      const loader = document.querySelector("#global-loader");
      if (loader) {
        loader.style.display = "none";
      }
    }
  }
}

export const globalLoader = new GlobalLoader();
