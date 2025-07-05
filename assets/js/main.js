import { font } from '/assets/fonts/Figtree-normal.js';
import { font_bold } from '/assets/fonts/Figtree-bold.js';
import { font_italic } from '/assets/fonts/Figtree-italic.js';
import { font_bolditalic } from '/assets/fonts/Figtree-bolditalic.js';

import { preparePage } from "./utils.js";
import { getProducts, getCategories, getImageURL, getProductSpecifications } from './db.js';

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    preparePage();

    const productsData = await getProducts();
    const categoriesData = await getCategories();
    const products = Object.entries(productsData);
    const categories = Object.fromEntries(
      categoriesData.map(item => [item.class, item.name])
    );

    generateDropdown(products, categories);
    generateFooterList(categories);

    if (document.body.id === "index-page") {
      new PureCounter();
      generateProductCards(products);
      generateFilters(categories);
      setSelectedFilter();
      postData();
    }

    if (document.body.id === "product-page") {
      const productDetails = getProductDetails(products, categories)
      processProduct(productDetails);
      const productSpecifications = await getProductSpecifications(productDetails["_pid"])
      generatePDF(productDetails["Name"], productSpecifications);
    }
  });

  function generateDropdown(products, categoryNames) {
    const dropdownContainer = document.querySelector("#productDropdown");
    if (!dropdownContainer) return console.error("Error: #productDropdown element not found.");

    dropdownContainer.innerHTML = Object.entries(categoryNames)
      .map(([category, categoryName]) => `
        <li class="dropdown">
          <a href="index.html#products" class="category-link" data-filter=".filter-${category}">
            <span>${categoryName}</span> <i class="bi bi-chevron-down toggle-dropdown"></i>
          </a>
          <ul id="submenu-${category}"></ul>
        </li>
      `)
      .join("");

    products.forEach(([productID, { class: category, name }]) => {
      const submenu = document.querySelector(`#submenu-${category}`);
      if (submenu) {
        submenu.insertAdjacentHTML("beforeend", `<li><a href="product.html?pid=${productID}">${name}</a></li>`);
      }
    });

    document.querySelectorAll(".category-link").forEach(link => {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        const filterValue = this.getAttribute("data-filter");

        if (document.body.id === "index-page") {
          if (typeof selectFilter === "function") selectFilter(filterValue);
          document.querySelector("#products")?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          localStorage.setItem("selectedFilter", filterValue);
          window.location.href = `index.html#products`;
        }
      });
    });
  }

  function generateFooterList(categories) {
    const footerProducts = document.querySelector(".footer-products ul");

    if (!footerProducts) return;
    footerProducts.innerHTML = Object.entries(categories)
      .map(([key, name]) => `
      <li>
        <i class="bi bi-chevron-right"></i> 
        <a href="index.html#products" class="category-link" data-filter=".filter-${key}">${name}</a>
      </li>
    `)
      .join("");

    document.querySelectorAll(".category-link").forEach(link => {
      link.addEventListener("click", function (event) {
        event.preventDefault();

        if (document.body.id === "index-page") {
          selectFilter(this.getAttribute("data-filter"));
          const productsSection = document.querySelector("#products");
          if (productsSection) {
            productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } else {
          localStorage.setItem("selectedFilter", this.getAttribute("data-filter"));
          window.location.href = `index.html#products`;
        }
      });
    });
  }

  function generateProductCards(products) {
    const container = document.querySelector(".isotope-container");
    if (!container) return;

    products.forEach(([productNumber, product]) => {
      container.insertAdjacentHTML("beforeend", `
            <a href="product.html?pid=${productNumber}" class="col-lg-4 col-md-6 product-item isotope-item filter-${product.class}">
              <img src="${getImageURL(product.id)}" class="img-fluid ${product.class}" alt="">
              <div class="product-info">
                <h4>${product.name}</h4>
                <p>${toSubscript(product.formula)}</p>
              </div>
            </a>
        `);
    });

    initializeIsotope();
  }

  function initializeIsotope() {
    document.querySelectorAll(".isotope-layout").forEach(isotopeItem => {
      const layout = isotopeItem.getAttribute("data-layout") || "masonry";
      const filter = isotopeItem.getAttribute("data-default-filter") || "*";
      const sort = isotopeItem.getAttribute("data-sort") || "original-order";

      imagesLoaded(isotopeItem.querySelector(".isotope-container"), function () {
        const isotopeInstance = new Isotope(isotopeItem.querySelector(".isotope-container"), {
          itemSelector: ".isotope-item",
          layoutMode: layout,
          filter: filter,
          sortBy: sort
        });

        setTimeout(() => {
          isotopeInstance.reloadItems();
          isotopeInstance.arrange();
        }, 200);

        isotopeItem.querySelectorAll(".isotope-filters li").forEach(filterBtn => {
          filterBtn.addEventListener("click", function () {
            isotopeItem.querySelector(".isotope-filters .filter-active").classList.remove("filter-active");
            this.classList.add("filter-active");
            isotopeInstance.arrange({ filter: this.getAttribute("data-filter") });
          });
        });

        isotopeItem.querySelector(".isotope-container").isotope = isotopeInstance;
      });
    });
  }

  function toSubscript(str) {
    const subscriptMap = {
      '0': '₀',
      '1': '₁',
      '2': '₂',
      '3': '₃',
      '4': '₄',
      '5': '₅',
      '6': '₆',
      '7': '₇',
      '8': '₈',
      '9': '₉'
    };

    return str.replace(/\d/g, digit => subscriptMap[digit]);
  }

  function generateFilters(categories) {
    const filterContainer = document.querySelector(".product-filters");
    if (!filterContainer) return;

    filterContainer.innerHTML = `<li data-filter="*" class="filter-active filter-all">All</li>`;

    Object.entries(categories).forEach(([key, name]) => {
      filterContainer.insertAdjacentHTML("beforeend", `
            <li data-filter=".filter-${key}" class="filter-${key}">${name}</li>
        `);
    });
  }

  function setSelectedFilter() {
    const selectedFilter = localStorage.getItem("selectedFilter");
    if (selectedFilter) {
      setTimeout(() => {
        selectFilter(selectedFilter);
        localStorage.removeItem("selectedFilter");
      }, 200);
    }
  }

  async function postData() {
    document.getElementById("contactForm").addEventListener("submit", async function (e) {
      e.preventDefault();

      document.querySelector(".loading").style.display = "block";
      document.querySelector(".error-message").style.display = "none";
      document.querySelector(".sent-message").style.display = "none";

      const formData = {
        name: document.getElementById("name-field").value,
        email: document.getElementById("email-field").value,
        subject: document.getElementById("subject-field").value,
        message: document.getElementById("message-field").value
      };

      try {
        const { error } = await supabase
          .from('queries')
          .insert(formData)

        document.querySelector(".loading").style.display = "none";
        document.querySelector(".sent-message").style.display = "block";

        document.getElementById("contactForm").reset();
      } catch (error) {
        console.error("Error:", error);

        document.querySelector(".loading").style.display = "none";
        document.querySelector(".error-message").textContent = "Failed to submit. Please try again.";
        document.querySelector(".error-message").style.display = "block";
      }
    });
  }

  function getProductDetails(products, categories) {
    const urlParams = new URLSearchParams(window.location.search);
    const productID = urlParams.get("pid");

    if (!productID) {
      console.error("Error: Product ID not found in URL.");
      return;
    }

    const product = products[parseInt(productID)][1];

    if (!product) {
      console.error(`Error: Invalid product ID (${productID}).`);
      return;
    }

    const productDetails = {
      "_pid": productID,
      "_id": product.id,
      "Name": product.name,
      "Category": categories[product.class],
      "Formula": toSubscript(product.formula),
      "_image": getImageURL(product.id),
      "_description": product.description
    };

    return productDetails;
  }

  async function generatePDF(productName, productSpecifications) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.mjs';

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const marginY = 10;
    const accentWidth = 1.5;

    try {
      doc.addFileToVFS("Figtree-normal.ttf", font);
      doc.addFont("Figtree-normal.ttf", "Figtree", "normal");

      doc.addFileToVFS("Figtree-bold.ttf", font_bold);
      doc.addFont("Figtree-bold.ttf", "Figtree", "bold");

      doc.addFileToVFS("Figtree-italic.ttf", font_italic);
      doc.addFont("Figtree-italic.ttf", "Figtree", "italic");

      doc.addFileToVFS("Figtree-bolditalic.ttf", font_bolditalic);
      doc.addFont("Figtree-bolditalic.ttf", "Figtree", "bolditalic");

      doc.setFont("Figtree");

      doc.setFillColor(246, 15, 15);
      doc.rect(0, 0, accentWidth, pageHeight, "F");

      const img = new Image();
      img.src = "assets/img/logo_alt.png";

      img.onload = function () {
        const logoWidth = 60;
        const aspectRatio = img.width / img.height;
        const logoHeight = logoWidth / aspectRatio;

        doc.addImage(img, "PNG", marginX, marginY, logoWidth, logoHeight);

        doc.setFontSize(18);
        doc.setTextColor(246, 15, 15);
        doc.setFont("Figtree", "italic");
        doc.text("Sales Specification", pageWidth - marginX, marginY + 10, { align: "right" });

        doc.setFontSize(14);
        doc.setTextColor(60, 42, 152);
        doc.setFont("Figtree", "bolditalic");
        doc.text(productName, pageWidth / 2, marginY + 35, { align: "center" });

        doc.autoTable({
          startY: marginY + 45,
          margin: { left: marginX, right: marginX },
          head: [["Test Description", "Test Method", "Unit of Measure", "Specification"]],
          body: productSpecifications.map(spec => [
            spec.description, spec.method, spec.unit, spec.specification
          ]),
          styles: {
            fontSize: 10, cellPadding: 3, font: "Figtree"
          },
          headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: "bold", halign: "center" },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "center" },
            3: { halign: "center" }
          }
        });

        let footerY = doc.lastAutoTable.finalY + 10;

        doc.setFont("Figtree", "italic");
        doc.setFontSize(8);
        doc.text("Comments: Physical properties are not monitored constantly", marginX, footerY);

        formatDateTimeWithSuperscript(doc, marginX, footerY + 5);
        doc.text("Spec Version: 1", marginX, footerY + 10);


        doc.setFillColor(246, 15, 15);
        doc.rect(marginX, pageHeight - 1.5 * marginY, pageWidth - 2 * marginX, 0.2, "F");
        doc.text("410, CENTRUM, WAGLE ESTATE, S.G. BARVE ROAD, THANE WEST - 400604", pageWidth / 2, pageHeight - marginY, { align: "center" });

        const pdfBlob = doc.output("blob");

        renderPDFAsImage(pdfBlob);

        document.getElementById("downloadPDF").addEventListener("click", async function () {
          try {
            doc.save(productName.replace(" ", "_") + "_Specification.pdf");
          } catch (error) {
            console.error("Error fetching specifications:", error);
            alert("Failed to generate PDF. Please try again.");
          }
        });
      };
    } catch (error) {
      console.error("Error fetching specifications:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  }

  function formatDateTimeWithSuperscript(doc, x, y) {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "long" });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    function getOrdinalSuffix(day) {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    }

    const suffix = getOrdinalSuffix(day);

    doc.text(`Report auto-generated on: ${day}`, x, y);

    doc.setFontSize(7);
    doc.text(suffix, x + 38, y - 1);

    doc.setFontSize(8);
    doc.text(`${month} ${year}, ${hours}:${minutes}`, x + 41, y);
  }

  const renderPDFAsImage = async (pdfBlob) => {
    const pdfURL = URL.createObjectURL(pdfBlob);
    const pdf = await pdfjsLib.getDocument(pdfURL).promise;
    const page = await pdf.getPage(1);

    const scale = 4;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    document.getElementById("pdfSlide").innerHTML = `<img src="${canvas.toDataURL()}" width="100%">`;
  };

  function processProduct(product) {
    const swiperWrapper = document.querySelector(".swiper-wrapper");
    if (!swiperWrapper) {
      console.error("Error: Swiper wrapper not found.");
      return;
    }

    swiperWrapper.innerHTML = `
        <div class="swiper-slide"><img src="${product["_image"]}" alt="${product["Name"]}"></div>
        <div class="swiper-slide"><img src="https://media.istockphoto.com/id/163081410/photo/blue-barrels.jpg?s=612x612&w=0&k=20&c=NLXYaBb3onz96RA1sRKUF-CfDNIzHzkDkuGTL1NoFpU=" alt="${product["Name"]}"></div>
    `;

    initSwiper();

    const productInfoContainer = document.querySelector(".product-info ul");
    productInfoContainer.innerHTML = Object.entries(product)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => `<li><strong>${key}</strong>: ${value}</li>`)
      .join('');

    const productDescriptionContainer = document.querySelector(".product-description p");
    productDescriptionContainer.innerHTML = `${product["_description"]}`
  }

  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(swiperElement => {
      let config = JSON.parse(swiperElement.querySelector(".swiper-config").textContent.trim());
      new Swiper(swiperElement, config);
    });
  }

  function selectFilter(filterValue) {
    const filterContainer = document.querySelector(".isotope-filters");
    const filterBtn = filterContainer.querySelector(`[data-filter="${filterValue}"]`);

    if (!filterBtn) return;

    filterContainer.querySelector(".filter-active")?.classList.remove("filter-active");
    filterBtn.classList.add("filter-active");

    const isotopeLayout = document.querySelector(".isotope-layout");
    if (isotopeLayout) {
      const isotopeContainer = isotopeLayout.querySelector(".isotope-container");
      if (isotopeContainer && isotopeContainer.isotope) {
        isotopeContainer.isotope.arrange({ filter: filterValue });
      }
    }
  }
})();