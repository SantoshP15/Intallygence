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


// =========================================================
// SUB-REPORT DATA
// =========================================================

const reportData = {

    sales: {
        title: "Sales Reports",
        icon: "fa-chart-line",

        items: [
            "Entity",
            "Customer type",
            "Customer Level",
            "Open Sales Order",
            "Pending Bills",
            "Inventory Level",
            "Register",
            "Register Margin"
        ]
    },


    purchase: {
        title: "Purchase Reports",
        icon: "fa-cart-shopping",

        items: [
            "Entity",
            "Customer Type",
            "Customer Level",
            "Open Purchase Order",
            "Bill Pending",
            "Purchase Inventory Level",
            "Purchase Register"
        ]
    },


    debtors: {
        title: "Debtors Reports",
        icon: "fa-file-invoice",

        items: [
            "Entity Level",
            "Business Type",
            "Customer Level",
            "Adverse Debtor",
            "Overdue Debtor",
            "Unadjusted Debtors",
            "Unadjusted fx Debtor",
            "Duplicate Pan",
            "Duplicate GSTIN",
            "Residual"
        ]
    },


    creditors: {
        title: "Creditors Reports",
        icon: "fa-file-circle-minus",

        items: [
            "Entity Level",
            "Business Type",
            "Customer Level",
            "Creditor <10K",
            "Adverse Creditors",
            "Overdue Creditors",
            "unadjusted creditors",
            "Unadjusted FX Creditors",
            "Duplicate PAN",
            "Duplicate GSTIN",
            "Residual Creditor",
            "Creditor for ASS Purpose"
        ]
    },


    inventory: {
        title: "Inventory Reports",
        icon: "fa-boxes-stacked",

        items: [
            "Negative Stock",
            "Stock in Service Items",
            "Items With NIL Quantity",
            "Items With NIL Value",
            "Variance in Purchase Rates",
            "Vendors"
        ]
    },


    cash: {
        title: "Cash & Financial Reports",
        icon: "fa-book",

        items: [
            "Voucher >9999",
            "Negative Cash",
            "Cash Balance",
            "Cash in Decimals"
        ]
    }

};


// =========================================================
// OPEN REPORT MODAL
// =========================================================

function openReportModal(categoryKey) {

    const data =
        reportData[categoryKey];

    if (!data) return;


    // Set modal title
    document.getElementById(
        "modalCategoryTitle"
    ).textContent = data.title;


    // Set modal icon
    document.getElementById(
        "modalCategoryIcon"
    ).innerHTML =
        `<i class="fa-solid ${data.icon}"></i>`;


    // Populate sub-reports
    const listContainer =
        document.getElementById(
            "modalReportList"
        );


    listContainer.innerHTML =
        data.items.map(item => `

            <a
                href="#"
                class="modal-report-item"
            >

                <span>
                    ${item}
                </span>

                <i class="fa-solid fa-arrow-right"></i>

            </a>

        `).join("");


    // Show modal
    document
        .getElementById(
            "reportModalOverlay"
        )
        .classList.add("active");


    // Prevent background scrolling
    document.body.style.overflow =
        "hidden";
}


// =========================================================
// CLOSE REPORT MODAL
// =========================================================

function closeReportModal(event) {

    document
        .getElementById(
            "reportModalOverlay"
        )
        .classList.remove("active");


    document.body.style.overflow = "";
}

function openAiModeModal() {
    document.getElementById("aiModeModal").classList.add("active");
}

function closeAiModeModal() {
    document.getElementById("aiModeModal").classList.remove("active");
}

document.querySelector(".ai-mode-btn").addEventListener("click", openAiModeModal);


// =========================================================
// CLOSE MODAL WITH ESC
// =========================================================

document.addEventListener(
    "keydown",
    function (e) {

        if (e.key === "Escape") {

            closeReportModal();
            closeAiModeModal();

        }

    }
);
function updateLastRefreshed() {
    const now = new Date();

    const formattedDateTime = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    document.getElementById('lastRefreshed').textContent = formattedDateTime;
}

updateLastRefreshed();

// =========================================================
// P&L PERIOD VIEW
// =========================================================

const pnlTable = document.getElementById("pnlTable");
const currentYearPnlMarkup = pnlTable ? pnlTable.innerHTML : "";
let selectedAmountFormat = "crores";

function parseDashboardAmount(value) {
    const text = String(value).trim();
    const match = text.match(/^₹?\s*(-?[\d,]+(?:\.\d+)?)\s*(Cr|Lakhs?)?$/i);

    if (!match) return null;

    const number = Number(match[1].replace(/,/g, ""));
    const unit = (match[2] || "").toLowerCase();

    if (unit === "cr") return number * 10000000;
    if (unit.startsWith("lakh")) return number * 100000;
    return number;
}

function formatDashboardAmount(amount, format, includeUnit = true) {
    const divisors = {
        lakhs: 100000,
        crores: 10000000
    };
    const suffixes = {
        lakhs: " L",
        crores: " Cr"
    };
    const value = amount / divisors[format];
    const formatted = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);

    return `₹${formatted}${includeUnit ? suffixes[format] : ""}`;
}

function updateDashboardAmounts(format = selectedAmountFormat) {
    selectedAmountFormat = format;

    document.querySelectorAll(".kpi-value, #pnlTable tbody td:not(:first-child)").forEach(cell => {
        // Percentages and growth rates are not currency amounts.
        if (cell.textContent.includes("%")) return;

        const originalAmount = cell.dataset.amountInr
            ? Number(cell.dataset.amountInr)
            : parseDashboardAmount(cell.textContent);

        if (originalAmount === null || Number.isNaN(originalAmount)) return;

        cell.dataset.amountInr = String(originalAmount);
        const isPnlValue = Boolean(cell.closest("#pnlTable"));
        cell.textContent = formatDashboardAmount(originalAmount, format, !isPnlValue);
    });

    const footer = document.querySelector(".pnl-footer");
    if (footer) {
        const unit = format === "crores" ? "Crores" : "Lakhs";
        footer.childNodes[0].nodeValue = `All values are in ${unit} `;
    }
}

// YTD figures are based on the current-year totals shown in the P&L statement.
// Keep this data here until these values are supplied by the reporting API.
const ytdPnlRows = [
    ["Sales", "88.40 Cr", "96.20 Cr", "8.8%", ""],
    ["Less: Cost of Goods Sold", "55.90 Cr", "59.80 Cr", "7.0%", ""],
    ["Gross Profit", "32.50 Cr", "36.40 Cr", "12.0%", "highlight"],
    ["Gross Profit %", "36.8%", "37.8%", "1.0%", "percent"],
    ["Less: Operating Expenses", "23.30 Cr", "24.50 Cr", "5.2%", ""],
    ["Operating Profit", "9.20 Cr", "11.90 Cr", "29.3%", "highlight"],
    ["Operating Profit %", "10.4%", "12.4%", "2.0%", "percent"],
    ["Other Income", "1.30 Cr", "1.60 Cr", "23.1%", ""],
    ["Net Profit", "7.90 Cr", "10.10 Cr", "27.8%", "highlight"],
    ["Net Profit %", "8.9%", "10.5%", "1.6%", "percent"]
];

function showYtdPnl() {
    if (!pnlTable) return;

    pnlTable.innerHTML = `
        <thead>
            <tr>
                <th>Particulars</th>
                <th>Last Year</th>
                <th>Current Year</th>
                <th>Growth Rate</th>
            </tr>
        </thead>
        <tbody>
            ${ytdPnlRows.map(([particulars, lastYear, currentYear, growth, rowClass]) => `
                <tr class="${rowClass}">
                    <td>${particulars}</td>
                    <td>${lastYear}</td>
                    <td>${currentYear}</td>
                    <td class="growth-positive">${growth}</td>
                </tr>
            `).join("")}
        </tbody>`;

    updateDashboardAmounts();
}

function showCurrentYearPnl() {
    if (pnlTable) {
        pnlTable.innerHTML = currentYearPnlMarkup;
        updateDashboardAmounts();
    }
}

document.querySelectorAll(".period-toggle-btn").forEach(button => {

    button.addEventListener("click", function () {

        document
            .querySelectorAll(".period-toggle-btn")
            .forEach(btn => btn.classList.remove("active"));

        this.classList.add("active");

        const selectedPeriod = this.dataset.period;

        console.log("Selected Period:", selectedPeriod);

        if (selectedPeriod === "current-year") {
            console.log("Showing Current Financial Year");
            showCurrentYearPnl();
        }

        if (selectedPeriod === "ytd") {
            console.log("Showing Year To Date");
            showYtdPnl();
        }
    });

});
const settingsBtn = document.getElementById("settingsBtn");
const settingsPopup = document.getElementById("settingsPopup");

settingsBtn.addEventListener("click", function (event) {

    event.stopPropagation();

    settingsPopup.classList.toggle("show");

});


// Close popup when clicking outside

document.addEventListener("click", function (event) {

    if (
        !settingsPopup.contains(event.target) &&
        !settingsBtn.contains(event.target)
    ) {
        settingsPopup.classList.remove("show");
    }

});


// Period Selector

document.querySelectorAll("[data-period]").forEach(button => {

    button.addEventListener("click", function () {

        document
            .querySelectorAll("[data-period]")
            .forEach(btn => {
                btn.classList.remove("active");
            });

        this.classList.add("active");

        const selectedPeriod = this.dataset.period;

        console.log("Period:", selectedPeriod);

    });

});


// Amount Selector

document.querySelectorAll("[data-amount]").forEach(button => {

    button.addEventListener("click", function () {

        document
            .querySelectorAll("[data-amount]")
            .forEach(btn => {
                btn.classList.remove("active");
            });

        this.classList.add("active");

        const selectedAmount = this.dataset.amount;

        console.log("Amount:", selectedAmount);
        updateDashboardAmounts(selectedAmount);

    });

});

// The markup starts with Crore values, so retain that format until the user
// chooses another amount unit.
updateDashboardAmounts(selectedAmountFormat);
