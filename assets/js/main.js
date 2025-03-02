(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    initScrollEffects();
    initMobileNav();
    initPreloader();
    initScrollToTop();
    initAOS();
    initGLightbox();
    initSwiper();
    handleHashNavigation();
    initNavMenuScrollspy();

    if (document.body.id === "index-page") {
      new PureCounter();
      const productsData = await getProductsData();

      const products = Object.entries(productsData.products);
      const categories = productsData.categories;

      generateProductCards(products);
      generateFilters(categories);
      generateDropdown(products.map(([_, product]) => product), categories);
      postData();

      const selectedFilter = localStorage.getItem("selectedFilter");
      if (selectedFilter) {
        setTimeout(() => {
          selectFilter(selectedFilter);
          localStorage.removeItem("selectedFilter");
        }, 200);
      }
    }
    else if (document.body.id === "product-page") {
      const productsData = await getProductsData();
      processProduct(productsData);

      const products = Object.entries(productsData.products);
      const categories = productsData.categories;
      generateDropdown(products.map(([_, product]) => product), categories);
    }
  });

  function processProduct(productsData) {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get("pid");

    console.log(productsData.products[pid]);
  }

  async function getProductsData() {
    try {
      let response = await fetch("/api/google-sheet", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      let apiData = await response.json();
      console.log("Loaded data from API:", apiData);
      return apiData.data;
    } catch (error) {
      console.error("Error fetching data from API, loading from local JSON:", error);

      try {
        let localResponse = await fetch("products.json");
        let localData = await localResponse.json();
        console.log("Loaded data from local JSON:", localData);
        return localData;
      } catch (jsonError) {
        console.error("Error loading products from local JSON:", jsonError);
        return null;
      }
    }
  }

  function generateProductCards(products) {
    const container = document.querySelector(".isotope-container");
    if (!container) return;

    products.forEach(([productNumber, product]) => {
      container.insertAdjacentHTML("beforeend", `
            <a href="product.html?pid=${productNumber}" class="col-lg-4 col-md-6 product-item isotope-item filter-${product.class}">
              <img src="${product.image}" class="img-fluid ${product.class}" alt="">
              <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.formula}</p>
              </div>
            </a>
        `);
    });

    initializeIsotope();
  }

  function generateDropdown(products, categoryNames) {
    const categories = {};

    for (const [productNumber, { class: category, name }] of Object.entries(products)) {
      (categories[category] ||= []).push({ name, productNumber });
    }

    const dropdownContainer = document.querySelector("#productDropdown");
    if (!dropdownContainer) return console.error("Error: #productDropdown element not found.");

    dropdownContainer.innerHTML = Object.entries(categoryNames)
      .filter(([category]) => categories[category])
      .map(([category, categoryName]) => `
            <li class="dropdown">
                <a href="#products" class="category-link" data-filter=".filter-${category}">
                    <span>${categoryName}</span> <i class="bi bi-chevron-down toggle-dropdown"></i>
                </a>
                <ul>
                    ${categories[category]
          .map(({ productNumber, name }) => `<li><a href="product.html?pid=${productNumber}">${name}</a></li>`)
          .join("")}
                </ul>
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
        let response = await fetch("/api/google-sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        let result = await response.json();

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

  function initScrollEffects() {
    const body = document.body;
    const header = document.querySelector("#header");

    function toggleScrolled() {
      if (!header.classList.contains("scroll-up-sticky") && !header.classList.contains("sticky-top") && !header.classList.contains("fixed-top")) return;
      body.classList.toggle("scrolled", window.scrollY > 100);
    }

    window.addEventListener("scroll", toggleScrolled);
    toggleScrolled();
  }

  function initMobileNav() {
    const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");
    if (!mobileNavToggleBtn) return;

    function toggleMobileNav() {
      document.body.classList.toggle("mobile-nav-active");
      mobileNavToggleBtn.classList.toggle("bi-list");
      mobileNavToggleBtn.classList.toggle("bi-x");
    }

    mobileNavToggleBtn.addEventListener("click", toggleMobileNav);
    document.querySelectorAll("#navmenu a").forEach(link => link.addEventListener("click", () => {
      if (document.body.classList.contains("mobile-nav-active")) toggleMobileNav();
    }));

    document.querySelectorAll(".navmenu .toggle-dropdown").forEach(toggle => {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        toggle.parentNode.classList.toggle("active");
        toggle.parentNode.nextElementSibling.classList.toggle("dropdown-active");
        e.stopImmediatePropagation();
      });
    });
  }

  function initPreloader() {
    const preloader = document.querySelector("#preloader");
    if (preloader) window.addEventListener("load", () => preloader.remove());
  }

  function initScrollToTop() {
    const scrollTop = document.querySelector(".scroll-top");
    if (!scrollTop) return;

    function toggleScrollTop() {
      scrollTop.classList.toggle("active", window.scrollY > 100);
    }

    scrollTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", toggleScrollTop);
    toggleScrollTop();
  }

  function initAOS() {
    AOS.init({ duration: 600, easing: "ease-in-out", once: true, mirror: false });
  }

  function initGLightbox() {
    GLightbox({ selector: ".glightbox" });
  }

  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(swiperElement => {
      let config = JSON.parse(swiperElement.querySelector(".swiper-config").textContent.trim());
      new Swiper(swiperElement, config);
    });
  }

  function handleHashNavigation() {
    if (window.location.hash && document.querySelector(window.location.hash)) {
      setTimeout(() => {
        let section = document.querySelector(window.location.hash);
        let scrollMarginTop = parseInt(getComputedStyle(section).scrollMarginTop);
        window.scrollTo({ top: section.offsetTop - scrollMarginTop, behavior: "smooth" });
      }, 100);
    }
  }

  function initNavMenuScrollspy() {
    const navMenuLinks = document.querySelectorAll(".navmenu a");
    function updateActiveLink() {
      navMenuLinks.forEach(link => {
        if (!link.hash) return;
        const section = document.querySelector(link.hash);
        if (!section) return;

        const position = window.scrollY + 200;
        const isActive = position >= section.offsetTop && position <= section.offsetTop + section.offsetHeight;
        link.classList.toggle("active", isActive);
      });
    }

    window.addEventListener("scroll", updateActiveLink);
    updateActiveLink();
  }
})();