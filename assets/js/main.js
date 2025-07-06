import { preparePage, initPreloader, selectFilter } from "./utils.js";

import { generateProductCards, generateFilters, setSelectedFilter, postQuery } from './index.js';
import { getProductDetails, processProduct, generatePDF } from "./product.js";

(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", async () => {
    const [products, categories] = await preparePage();

    if (document.body.id === "index-page") {
      new PureCounter();
      generateProductCards(products);
      generateFilters(categories);
      setSelectedFilter();
      postQuery();
    }

    if (document.body.id === "product-page") {
      const productDetails = getProductDetails(products, categories)
      processProduct(productDetails);
      generatePDF(productDetails);
    }

    initPreloader();
  });
})();