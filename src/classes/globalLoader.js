import { cardTemplateSkeleton } from "../helpers/template-skeleton.js";
import { HTML_IDS } from "../shared/constants/htmlTonderIds";

class GlobalLoader {
  constructor() {
    this.requestCount = 0;
  }

  show() {
    this.requestCount++;
    const checkoutContainer = document.querySelector(`#${HTML_IDS.globalLoader}`);
    if (checkoutContainer) {
      checkoutContainer.innerHTML = cardTemplateSkeleton;
      checkoutContainer.style.display = "block";
    }
  }

  remove() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      const loaders = document.querySelectorAll(`#${HTML_IDS.globalLoader}`);

      loaders.forEach(loader => {
        loader.style.display = "none";
      });
    }
  }
}

export const globalLoader = new GlobalLoader();
