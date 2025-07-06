import { toSubscript, selectFilter } from "./utils.js";
import { getImageURL } from './db.js';

export function generateProductCards(products) {
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

    initializeFilters();
}

export function initializeFilters() {
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

export function generateFilters(categories) {
    const filterContainer = document.querySelector(".product-filters");
    if (!filterContainer) return;

    filterContainer.innerHTML = `<li data-filter="*" class="filter-active filter-all">All</li>`;

    Object.entries(categories).forEach(([key, name]) => {
        filterContainer.insertAdjacentHTML("beforeend", `
            <li data-filter=".filter-${key}" class="filter-${key}">${name}</li>
        `);
    });
}

export function setSelectedFilter() {
    const selectedFilter = localStorage.getItem("selectedFilter");
    if (selectedFilter) {
        setTimeout(() => {
            selectFilter(selectedFilter);
            localStorage.removeItem("selectedFilter");
        }, 200);
    }
}

export async function postQuery() {
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