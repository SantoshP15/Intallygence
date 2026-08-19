// =========================================================
// CREATE YOUR OWN REPORT
// =========================================================

function createOwnReport() {

    window.location.href =
        "/pivot";

}


// =========================================================
// REPORT TYPE
// =========================================================

function openReport(reportType) {

    console.log(
        "Selected report:",
        reportType
    );


    /*
       We will connect Sales,
       Purchase, Debit Note etc.
       to their respective table
       sources next.

       For now, these cards are
       placeholders.
    */

    if (reportType === "sales") {

        window.location.href =
            "/pivot";

    }

}

// Sub-report datasets matching your structure
const reportData = {
    sales: {
        title: "Sales Reports",
        icon: "fa-chart-line",
        items: ["Entity", "Customer type", "Customer Level", "Open Sales Order", "Pending Bills", "Inventory Level", "Register", "Register Margin"]
    },
    purchase: {
        title: "Purchase Reports",
        icon: "fa-cart-shopping",
        items: ["Entity", "Customer Type", "Customer Level", "Open Purchase Order", "Bill Pending", "Purchase Inventory Level", "Purchase Register"]
    },
    debtors: {
        title: "Debtors Reports",
        icon: "fa-file-invoice",
        items: ["Entity Level", "Business Type", "Customer Level", "Adverse Debtor", "Overdue Debtor", "Unadjusted Debtors", "Unadjusted fx Debtor", "Duplicate Pan", "Duplicate GSTIN", "Residual"]
    },
    creditors: {
        title: "Creditors Reports",
        icon: "fa-file-circle-minus",
        items: ["Entity Level", "Business Type", "Customer Level", "Creditor <10K", "Adverse Creditors", "Overdue Creditors", "unadjusted creditors", "Unadjusted FX Creditors", "Duplicate PAN", "Duplicate GSTIN", "Residual Creditor", "Creditor for ASS Purpose"]
    },
    inventory: {
        title: "Inventory Reports",
        icon: "fa-boxes-stacked",
        items: ["Negative Stock", "Stock in Service Items", "Items With NIL Quantity", "Items With NIL Value", "Variance in Purchase Rates", "Vendors"]
    },
    cash: {
        title: "Cash & Financial Reports",
        icon: "fa-book",
        items: ["Voucher >9999", "Negative Cash", "Cash Balance", "Cash in Decimals"]
    }
};

function openReportModal(categoryKey) {
    const data = reportData[categoryKey];
    if (!data) return;

    // Set modal title & icon
    document.getElementById("modalCategoryTitle").textContent = data.title;
    document.getElementById("modalCategoryIcon").innerHTML = `<i class="fa-solid ${data.icon}"></i>`;

    // Populate sub-reports
    const listContainer = document.getElementById("modalReportList");
    listContainer.innerHTML = data.items.map(item => `
        <a href="#" class="modal-report-item">
            <span>${item}</span>
            <i class="fa-solid fa-arrow-right"></i>
        </a>
    `).join("");

    // Show Overlay with class
    document.getElementById("reportModalOverlay").classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scroll
}

function closeReportModal(event) {
    // Closes if close button is clicked or clicked outside the box
    document.getElementById("reportModalOverlay").classList.remove("active");
    document.body.style.overflow = "auto";
}

// Close on Escape Key
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        closeReportModal();
    }
});