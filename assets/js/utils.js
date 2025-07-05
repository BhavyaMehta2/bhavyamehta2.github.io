export function preparePage() {
    initScrollEffects();
    initMobileNav();
    initPreloader();
    initScrollToTop();
    initAOS();
    initGLightbox();
    handleHashNavigation();
    initNavMenuScrollspy();

    const header = document.querySelector(".header");
    document.body.style.paddingTop = `${header.offsetHeight}px`;
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