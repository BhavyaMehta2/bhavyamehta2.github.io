import { toSubscript, selectFilter } from "./utils.js";
import { getImageURL, submitFormData } from './db.js';

export function generateProductCards(products) {
    const container = document.querySelector('.bd-grid');

    products.forEach(([productNumber, product]) => {
        container.insertAdjacentHTML("beforeend", `
        <article class="card filter-${product.class}">
          <a href="product.html?pid=${productNumber}">
            <div class="card__img">
              <img src="${getImageURL(product.id)}" alt="${product.class}">
            </div>
            <div class="card__name">
              <p>${product.class}</p>
            </div>
            <div class="card__precis">
              <div>
                <span class="card__preci card__preci--before">${product.name}</span>
                <span class="card__preci card__preci--now">${toSubscript(product.formula)}</span>
              </div>
            </div>
          </a>
        </article>
      `);
    });

    initializeFilters();
}

export function initializeFilters() {
    const filterButtons = document.querySelectorAll(".product-filters li");
    const productCards = document.querySelectorAll(".bd-grid .card");

    filterButtons.forEach(button => {
        button.addEventListener("click", function () {
            document.querySelector(".product-filters .filter-active")?.classList.remove("filter-active");
            this.classList.add("filter-active");

            const filter = this.getAttribute("data-filter");

            productCards.forEach(card => {
                const matches = filter === "*" || card.classList.contains(filter.slice(1));

                if (matches) {
                    // Bring card back to flow first
                    card.classList.remove("hidden");

                    // Force reflow to restart transition
                    void card.offsetWidth;

                    // Start transition in next frame
                    requestAnimationFrame(() => {
                        card.classList.remove("hiding");
                    });

                } else {
                    if (!card.classList.contains("hiding")) {
                        // Start transition
                        card.classList.add("hiding");

                        // Wait for transition to finish, then remove from layout
                        const handler = (e) => {
                            if (e.propertyName === "opacity") {
                                card.classList.add("hidden");
                                card.removeEventListener("transitionend", handler);
                            }
                        };
                        card.addEventListener("transitionend", handler);
                    }
                }
            });
        });
    });
}

export function generateFilters(categories) {
    const filterContainer = document.querySelector(".product-filters");
    if (!filterContainer) return;

    filterContainer.innerHTML = `<li data-filter="*" class="filter-active filter-all">All</li>`;
    Object.entries(categories).forEach(([key, name]) => {
        const li = document.createElement("li");
        li.className = `filter-${key}`;
        li.setAttribute("data-filter", `.filter-${key}`);
        li.textContent = name;

        li.addEventListener("click", handleFilterClick);

        filterContainer.appendChild(li);
    });

    filterContainer.querySelector('[data-filter="*"]')?.addEventListener("click", handleFilterClick);
}
function handleFilterClick(event) {
    const filter = this.getAttribute("data-filter");
    const productCards = document.querySelectorAll(".bd-grid .card");

    document.querySelector(".product-filters .filter-active")?.classList.remove("filter-active");
    this.classList.add("filter-active");

    productCards.forEach(card => {
        if (filter === "*" || card.classList.contains(filter.slice(1))) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}


export function setSelectedFilter() {
    const selectedFilter = localStorage.getItem("selectedFilter");
    if (selectedFilter) {
        setTimeout(() => {
            const filterBtn = document.querySelector(`.product-filters [data-filter="${selectedFilter}"]`);
            filterBtn?.click();
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
            const { error } = submitFormData(formData)

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