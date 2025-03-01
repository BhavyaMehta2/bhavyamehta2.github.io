(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initScrollEffects();
    initMobileNav();
    initPreloader();
    initScrollToTop();
    initAOS();
    initGLightbox();
    initSwiper();
    loadProducts();
    handleHashNavigation();
    initNavMenuScrollspy();
    new PureCounter();
    getData();
  });

  async function getData() {
    try {
      let response = await fetch("/api/google-sheets", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      let data = await response.json();
      console.log("Fetched Data:", data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
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

  function loadProducts() {
    fetch("products.json")
      .then(response => response.json())
      .then(data => {
        generateDropdown(data.products, data.categories);

        const container = document.querySelector(".isotope-container");
        if (!container) return;

        data.products.forEach(product => {
          container.insertAdjacentHTML("beforeend", `
            <a href="product.html?id=${product.id}" class="col-lg-4 col-md-6 product-item isotope-item filter-${product.class}">
              <img src="${product.image}" class="img-fluid ${product.class}" alt="">
              <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.formula}</p>
              </div>
            </a>
          `);
        });

        initializeIsotope();
      })
      .catch(error => console.error("Error loading products:", error));
  }

  function generateDropdown(products, categoryNames) {

    const categories = {};
    products.forEach(({ class: category, ...product }) => {
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(product);
    });

    const dropdownContainer = document.querySelector("#productDropdown");
    if (!dropdownContainer) {
      console.error("Error: #productDropdown element not found.");
      return;
    }

    Object.entries(categories).forEach(([category, products]) => {
      const categoryElement = document.createElement("li");
      categoryElement.classList.add("dropdown");
      categoryElement.innerHTML = `
      <a href="index.html#products"><span>${categoryNames[category] || category}</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
      <ul>${products.map(({ id, name }) => `<li><a href="product.html?id=${id}">${name}</a></li>`).join('')}</ul>
    `;
      dropdownContainer.appendChild(categoryElement);
    });
  }

  function initializeIsotope() {
    document.querySelectorAll(".isotope-layout").forEach(isotopeItem => {
      let layout = isotopeItem.getAttribute("data-layout") || "masonry";
      let filter = isotopeItem.getAttribute("data-default-filter") || "*";
      let sort = isotopeItem.getAttribute("data-sort") || "original-order";

      imagesLoaded(isotopeItem.querySelector(".isotope-container"), function () {
        let initIsotope = new Isotope(isotopeItem.querySelector(".isotope-container"), {
          itemSelector: ".isotope-item",
          layoutMode: layout,
          filter: filter,
          sortBy: sort
        });

        setTimeout(() => {
          initIsotope.reloadItems();
          initIsotope.arrange();
        }, 200);

        isotopeItem.querySelectorAll(".isotope-filters li").forEach(filterBtn => {
          filterBtn.addEventListener("click", function () {
            isotopeItem.querySelector(".isotope-filters .filter-active").classList.remove("filter-active");
            this.classList.add("filter-active");
            initIsotope.arrange({ filter: this.getAttribute("data-filter") });
          });
        });
      });
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