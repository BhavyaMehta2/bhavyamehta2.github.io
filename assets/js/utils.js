import { getProducts, getCategories } from './db.js';

export function toSubscript(str) {
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

export function selectFilter(filterValue) {
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

export async function preparePage() {
    const productsData = await getProducts();
    const categoriesData = await getCategories();
    const products = Object.entries(productsData);
    const categories = Object.fromEntries(
        categoriesData.map(item => [item.class, item.name])
    );

    generateDropdown(products, categories);
    generateFooterList(categories);
    initScrollEffects();
    initMobileNav();
    initScrollToTop();
    initAOS();
    initGLightbox();
    handleHashNavigation();
    initNavMenuScrollspy();

    const header = document.querySelector(".header");
    document.body.style.paddingTop = `${header.offsetHeight}px`;

    return [products, categories]
}

function generateDropdown(products, categoryNames) {
    const dropdownContainer = document.querySelector("#productDropdown");
    if (!dropdownContainer) return console.error("Error: #productDropdown element not found.");

    dropdownContainer.innerHTML = Object.entries(categoryNames)
        .map(([category, categoryName]) => `
        <li class="dropdown">
          <a href="index.html#products" class="category-link" data-filter=".filter-${category}">
            <span>
            ${categoryName}
            </span> <i class="bi bi-chevron-down toggle-dropdown"></i>
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
                const filterBtn = document.querySelector(`.product-filters [data-filter="${filterValue}"]`);
                filterBtn?.click();
                document.querySelector("#products")?.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
                localStorage.setItem("selectedFilter", filterValue);
                window.location.href = `index.html#products`;
            }
        });
    });
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

    document.querySelectorAll(".toggle-dropdown").forEach(toggle => {
        toggle.addEventListener("click", (e) => {
            e.preventDefault();
            toggle.parentNode.classList.toggle("active");
            toggle.parentNode.nextElementSibling.classList.toggle("dropdown-active");
            e.stopImmediatePropagation();
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
                const filterBtn = document.querySelector(`.product-filters [data-filter="${this.getAttribute("data-filter")}"]`);
                filterBtn?.click();
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

export function initPreloader() {
    const preloader = document.querySelector("#preloader");
    preloader.remove();
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