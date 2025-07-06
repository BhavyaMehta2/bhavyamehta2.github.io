import { font } from '/assets/fonts/Figtree-normal.js';
import { font_bold } from '/assets/fonts/Figtree-bold.js';
import { font_italic } from '/assets/fonts/Figtree-italic.js';
import { font_bolditalic } from '/assets/fonts/Figtree-bolditalic.js';

import { toSubscript } from './utils.js'
import { getImageURL, getProductSpecifications } from './db.js';

export function getProductDetails(products, categories) {
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

export function processProduct(product) {
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

export async function generatePDF(productDetails) {
    const productSpecifications = await getProductSpecifications(productDetails["_pid"])

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
            doc.text(productDetails["Name"], pageWidth / 2, marginY + 35, { align: "center" });

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
                    doc.save(productDetails["Name"].replace(" ", "_") + "_Specification.pdf");
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