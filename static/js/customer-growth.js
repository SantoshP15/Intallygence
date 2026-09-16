/* =========================================================
   CUSTOMER GROWTH REPORT JAVASCRIPT
   ========================================================= */

let currentReport = null;
let selectedFormat = "YTD";
let selectedMonth = null;
let selectedQuarter = null;
let selectedPeriodYear = null;

let currentSort = {
    column: "customer",
    direction: "asc",
    monthIndex: null,
    metric: null
};

const periodForm = document.getElementById("periodForm");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const reportStatus = document.getElementById("reportStatus");
const tableWrap = document.getElementById("tableWrap");
const formatValue = document.getElementById("formatValue");
const formatMenu = document.getElementById("formatMenu");

const reportSource = document.querySelector("main")?.dataset.reportSource || "sales";
const sourceView = reportSource === "purchase"
    ? "view_Purchase"
    : "view_SalesInventory";

/* =========================================================
   EXPORT EXCEL LOGIC
   ========================================================= */

function exportCustomerGrowthExcel() {
    const table = tableWrap?.querySelector("table");
    if (!table) {
        alert("No table data available to export.");
        return;
    }

    if (typeof XLSX === "undefined") {
        alert("SheetJS library is not loaded.");
        return;
    }

    const workbook = XLSX.utils.table_to_book(table, {
        sheet: "Customer Growth",
        raw: true
    });
    XLSX.writeFile(workbook, "customer-growth.xlsx");
}

document.addEventListener("click", function (e) {
    const btn = e.target.closest("#exportExcelBtn");
    if (btn) {
        e.preventDefault();
        e.stopPropagation();

        const panel = document.querySelector(".export-menu-panel");
        const toggleBtn = document.querySelector(".export-menu-toggle");
        if (panel) panel.setAttribute("hidden", "");
        if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");

        exportCustomerGrowthExcel();
    }
});

/* =========================================================
   MONTH NAMES & QUARTERS
   ========================================================= */

const fiscalMonths = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
];

const fiscalQuarters = {
    Q1: { startMonth: 3, startDay: 1, endMonth: 5, endDay: 30 },
    Q2: { startMonth: 6, startDay: 1, endMonth: 8, endDay: 30 },
    Q3: { startMonth: 9, startDay: 1, endMonth: 11, endDay: 31 },
    Q4: { startMonth: 0, startDay: 1, endMonth: 2, endDay: 31 }
};

/* =========================================================
   DATE HELPERS
   ========================================================= */

function dateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function todayDate() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getFiscalYearStart(date) {
    const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return new Date(year, 3, 1);
}

function fiscalYearDates(fiscalStartYear) {
    const today = todayDate();
    const currentFiscalStartYear = getFiscalYearStart(today).getFullYear();
    const year = Number.isInteger(fiscalStartYear) ? fiscalStartYear : currentFiscalStartYear;
    const start = new Date(year, 3, 1);
    const end = year === currentFiscalStartYear ? today : new Date(year + 1, 2, 31);
    return {
        from: dateToString(start),
        to: dateToString(end)
    };
}

function getMonthPeriod(monthName, fiscalYearStart) {
    const today = todayDate();
    const fiscalStartYear = Number.isInteger(fiscalYearStart)
        ? fiscalYearStart
        : getFiscalYearStart(today).getFullYear();

    const monthIndex = fiscalMonths.indexOf(monthName);
    if (monthIndex === -1) return null;

    let year = monthIndex <= 8 ? fiscalStartYear : fiscalStartYear + 1;
    const calendarMonth = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    }[monthName];

    const start = new Date(year, calendarMonth, 1);
    let end = new Date(year, calendarMonth + 1, 0);

    if (year === today.getFullYear() && calendarMonth === today.getMonth()) {
        end = todayDate();
    }

    return {
        from: dateToString(start),
        to: dateToString(end)
    };
}

function getQuarterPeriod(quarter, fiscalYearStart) {
    const today = todayDate();
    const fiscalStartYear = Number.isInteger(fiscalYearStart)
        ? fiscalYearStart
        : getFiscalYearStart(today).getFullYear();

    const config = fiscalQuarters[quarter];
    if (!config) return null;

    let startYear = fiscalStartYear;
    let endYear = fiscalStartYear;

    if (quarter === "Q4") {
        startYear = fiscalStartYear + 1;
        endYear = fiscalStartYear + 1;
    }

    const start = new Date(startYear, config.startMonth, config.startDay);
    let end = new Date(endYear, config.endMonth, config.endDay);

    if (start <= today && today <= end && quarter === "Q4") {
        end = todayDate();
    }

    return {
        from: dateToString(start),
        to: dateToString(end)
    };
}

/* =========================================================
   FORMATTERS
   ========================================================= */

function formatAmount(value) {
    const number = Number(value || 0);
    return number.toLocaleString("en-IN", {
        maximumFractionDigits: 0
    });
}

function formatPercent(value) {
    const number = Number(value || 0);
    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + "%";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getGrowthClass(value) {
    const number = Number(value || 0);
    if (number > 0) return "growth-positive";
    if (number < 0) return "growth-negative";
    return "growth-neutral";
}

function calculateGrowthPercent(previous, current) {
    const prev = Number(previous || 0);
    const curr = Number(current || 0);
    if (prev === 0) {
        return curr > 0 ? 100.00 : 0.00;
    }
    return ((curr - prev) / Math.abs(prev)) * 100;
}

function formatGrowth(value) {
    const number = Number(value || 0);
    if (number > 0) return "+" + formatAmount(number);
    return formatAmount(number);
}

function formatGrowthPercent(value) {
    const number = Number(value || 0);
    if (number > 0) return "+" + formatPercent(number);
    return formatPercent(number);
}

/* =========================================================
   FORMAT MENU & SUBMENUS
   ========================================================= */

function closeFormatMenu() {
    if (!formatMenu) return;
    formatMenu.hidden = true;
    formatMenu.style.zIndex = "";
    formatValue?.setAttribute("aria-expanded", "false");
    formatMenu.querySelectorAll(".format-submenu").forEach(submenu => {
        submenu.classList.remove("submenu-open");
    });
}

function openFormatMenu() {
    if (!formatMenu) return;
    formatMenu.hidden = false;
    formatMenu.style.zIndex = "999999 !important";
    formatValue?.setAttribute("aria-expanded", "true");
}

function toggleFormatMenu() {
    if (!formatMenu) return;
    if (formatMenu.hidden) openFormatMenu();
    else closeFormatMenu();
}

function toggleSubmenu(parentButton) {
    if (!parentButton || !formatMenu) return;
    const parent = parentButton.dataset.parent;
    const submenu = formatMenu.querySelector(`.format-submenu[data-submenu="${parent}"]`);
    if (!submenu) return;

    openFormatMenu();
    formatMenu.querySelectorAll(".format-submenu").forEach(item => {
        if (item !== submenu) item.classList.remove("submenu-open");
    });
    submenu.classList.toggle("submenu-open");
}

function updateFormatDisplay() {
    if (!formatValue) return;

    let label = selectedPeriodYear ? `YTD ${selectedPeriodYear}` : "YTD";

    if (selectedFormat === "MTD" && selectedMonth) {
        label = selectedPeriodYear ? `${selectedMonth} ${selectedPeriodYear}` : selectedMonth;
    } else if (selectedFormat === "QTD" && selectedQuarter) {
        label = selectedPeriodYear ? `${selectedQuarter} ${selectedPeriodYear}` : selectedQuarter;
    } else if (selectedFormat === "CUSTOM") {
        label = "Custom";
    }

    formatValue.innerHTML = `${escapeHtml(label)} <i class="fa-solid fa-chevron-down"></i>`;
}

function selectYTD(year) {
    if (Number.isInteger(year)) selectedPeriodYear = year;
    selectedFormat = "YTD";
    selectedMonth = null;
    selectedQuarter = null;

    const dates = fiscalYearDates(selectedPeriodYear);
    fromDate.value = dates.from;
    toDate.value = dates.to;

    updateFormatDisplay();
    closeFormatMenu();
    loadReport();
}

function selectMTD(monthName) {
    if (!monthName) return;
    const dates = getMonthPeriod(monthName, selectedPeriodYear);
    if (!dates) return;

    selectedFormat = "MTD";
    selectedMonth = monthName;
    selectedQuarter = null;
    fromDate.value = dates.from;
    toDate.value = dates.to;

    updateFormatDisplay();
    closeFormatMenu();
    loadReport();
}

function selectQTD(quarter) {
    if (!quarter) return;
    const dates = getQuarterPeriod(quarter, selectedPeriodYear);
    if (!dates) return;

    selectedFormat = "QTD";
    selectedQuarter = quarter;
    selectedMonth = null;
    fromDate.value = dates.from;
    toDate.value = dates.to;

    updateFormatDisplay();
    closeFormatMenu();
    loadReport();
}

/* Format Menu Event Listeners */
if (formatValue && formatMenu) {
    const currentFiscalYear = getFiscalYearStart(todayDate()).getFullYear();
    selectedPeriodYear = currentFiscalYear;

    formatMenu.querySelectorAll(".period-year-select").forEach(select => {
        select.innerHTML = "";
        for (let year = currentFiscalYear; year >= currentFiscalYear - 10; year -= 1) {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
        select.value = selectedPeriodYear;

        select.addEventListener("click", event => event.stopPropagation());

        select.addEventListener("change", () => {
            selectedPeriodYear = Number(select.value);
            formatMenu.querySelectorAll(".period-year-select").forEach(otherSelect => {
                otherSelect.value = selectedPeriodYear;
            });
            if (select.classList.contains("ytd-year-select")) {
                selectYTD(selectedPeriodYear);
            } else if (select.classList.contains("qtd-year-select") && selectedQuarter) {
                selectQTD(selectedQuarter);
            } else if (select.classList.contains("mtd-year-select") && selectedMonth) {
                selectMTD(selectedMonth);
            }
        });
    });

    formatValue.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleFormatMenu();
    });

    formatMenu.querySelectorAll(".format-parent").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            toggleSubmenu(button);
        });
    });

    document.addEventListener("click", function (e) {
        const applyBtn = e.target.closest("#applyPeriodBtn, #applyCustomPeriodBtn");
        if (applyBtn) {
            e.preventDefault();
            e.stopPropagation();

            const fromVal = fromDate?.value;
            const toVal = toDate?.value;

            if (!fromVal || !toVal) return;
            if (fromVal > toVal) return;

            selectedFormat = "CUSTOM";
            selectedMonth = null;
            selectedQuarter = null;

            updateFormatDisplay();
            closeFormatMenu();
            loadReport();
        }
    });

    const mtdSubmenu = formatMenu.querySelector('.format-submenu[data-submenu="MTD"]');
    if (mtdSubmenu) {
        mtdSubmenu.addEventListener("click", event => {
            const btn = event.target.closest("button[data-month]");
            if (btn) {
                event.preventDefault();
                event.stopPropagation();
                selectMTD(btn.dataset.month);
            }
        });
    }

    const qtdSubmenu = formatMenu.querySelector('.format-submenu[data-submenu="QTD"]');
    if (qtdSubmenu) {
        qtdSubmenu.addEventListener("click", event => {
            const btn = event.target.closest("button[data-quarter]");
            if (btn) {
                event.preventDefault();
                event.stopPropagation();
                selectQTD(btn.dataset.quarter);
            }
        });
    }

    formatMenu.addEventListener("click", event => event.stopPropagation());

    document.addEventListener("click", event => {
        if (!formatMenu.contains(event.target) && event.target !== formatValue) {
            closeFormatMenu();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeFormatMenu();
    });
}

/* =========================================================
   SORTING HELPERS & VISUAL TRIANGLES
   ========================================================= */

function resetSort() {
    currentSort = {
        column: "customer",
        direction: "asc",
        monthIndex: null,
        metric: null
    };
}

function getSortClass(column) {
    const isMatch = currentSort.column === column;
    if (!isMatch) return "sortable-header";
    return `sortable-header ${currentSort.direction}`;
}

function cycleSort(column) {
    const sameColumn = currentSort.column === column;

    if (!sameColumn) {
        currentSort = { column: column, direction: "asc" };
    } else if (currentSort.direction === "asc") {
        currentSort.direction = "desc";
    } else if (currentSort.direction === "desc") {
        currentSort.direction = "none";
    } else {
        currentSort.direction = "asc";
    }

    renderTable();
}

function sortRows(rows) {
    const sortedRows = [...rows];
    if (currentSort.direction === "none" || !currentSort.column) {
        return sortedRows;
    }

    sortedRows.sort((a, b) => {
        let valueA, valueB;
        switch (currentSort.column) {
            case "customer":
                valueA = a.customer; valueB = b.customer; break;
            case "previous":
                valueA = a.previous; valueB = b.previous; break;
            case "current":
                valueA = a.current; valueB = b.current; break;
            case "growth":
                valueA = a.growth; valueB = b.growth; break;
            case "growth_percent":
                valueA = a.growth_percent; valueB = b.growth_percent; break;
            default:
                return 0;
        }

        const multiplier = currentSort.direction === "asc" ? 1 : -1;
        if (typeof valueA === "string" || typeof valueB === "string") {
            return String(valueA ?? "").toLowerCase().localeCompare(
                String(valueB ?? "").toLowerCase(),
                undefined,
                { numeric: true, sensitivity: "base" }
            ) * multiplier;
        }

        const numA = Number(valueA || 0);
        const numB = Number(valueB || 0);
        if (numA < numB) return -1 * multiplier;
        if (numA > numB) return 1 * multiplier;
        return 0;
    });

    return sortedRows;
}

function createSortableHeader(label, column) {
    const th = document.createElement("th");
    th.className = getSortClass(column);
    th.textContent = label;
    th.addEventListener("click", () => cycleSort(column));
    return th;
}

/* =========================================================
   RENDER TABLE (Centered Headers for Last Year, Current Year, Growth, Growth %)
   ========================================================= */

function renderTable() {
    if (!currentReport) return;

    if (!currentReport.rows || currentReport.rows.length === 0) {
        tableWrap.innerHTML = `
            <div class="empty-report">
                No customer sales data found for the selected period.
            </div>
        `;
        tableWrap.hidden = false;
        return;
    }

    const rows = sortRows(currentReport.rows);

    const table = document.createElement("table");
    table.className = "customer-growth-table";

    /* THEAD */
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // 1. Customer header (Left-aligned)
    const customerTh = createSortableHeader("Customer", "customer");
    customerTh.style.textAlign = "left";
    headerRow.appendChild(customerTh);

    // 2. The next 4 headers (Center-aligned with fixed labels)
    const headersToCenter = [
        { label: "Last Year", column: "previous" },
        { label: "Current Year", column: "current" },
        { label: "Growth", column: "growth" },
        { label: "Growth %", column: "growth_percent" }
    ];

    headersToCenter.forEach(h => {
        const th = createSortableHeader(h.label, h.column);
        th.style.textAlign = "center";
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    /* TBODY */
    const tbody = document.createElement("tbody");

    rows.forEach(row => {
        const tr = document.createElement("tr");

        const customerTd = document.createElement("td");
        customerTd.textContent = row.customer || "Unspecified customer";
        tr.appendChild(customerTd);

        const previousTd = document.createElement("td");
        previousTd.className = "number-cell";
        previousTd.textContent = formatAmount(row.previous);
        tr.appendChild(previousTd);

        const currentTd = document.createElement("td");
        currentTd.className = "number-cell";
        currentTd.textContent = formatAmount(row.current);
        tr.appendChild(currentTd);

        const growthTd = document.createElement("td");
        growthTd.className = `number-cell ${getGrowthClass(row.growth)}`;
        growthTd.textContent = formatGrowth(row.growth);
        tr.appendChild(growthTd);

        const growthPercentTd = document.createElement("td");
        const actualGrowthPercent = calculateGrowthPercent(row.previous, row.current);
        growthPercentTd.className = `percent-cell ${getGrowthClass(actualGrowthPercent)}`;
        growthPercentTd.textContent = formatGrowthPercent(actualGrowthPercent);
        tr.appendChild(growthPercentTd);

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    /* TFOOT */
    const tfoot = document.createElement("tfoot");
    const totalRow = document.createElement("tr");

    const totalLabel = document.createElement("td");
    totalLabel.textContent = "Grand Total";
    totalRow.appendChild(totalLabel);

    const previousTotalTd = document.createElement("td");
    previousTotalTd.className = "number-cell";
    previousTotalTd.textContent = formatAmount(currentReport.previous_total);
    totalRow.appendChild(previousTotalTd);

    const currentTotalTd = document.createElement("td");
    currentTotalTd.className = "number-cell";
    currentTotalTd.textContent = formatAmount(currentReport.current_total);
    totalRow.appendChild(currentTotalTd);

    const totalGrowth = Number(currentReport.growth_total || 0);
    const growthTotalTd = document.createElement("td");
    growthTotalTd.className = `number-cell ${getGrowthClass(totalGrowth)}`;
    growthTotalTd.textContent = formatGrowth(totalGrowth);
    totalRow.appendChild(growthTotalTd);

    const totalGrowthPercent = calculateGrowthPercent(currentReport.previous_total, currentReport.current_total);
    const growthPercentTotalTd = document.createElement("td");
    growthPercentTotalTd.className = `percent-cell ${getGrowthClass(totalGrowthPercent)}`;
    growthPercentTotalTd.textContent = formatGrowthPercent(totalGrowthPercent);
    totalRow.appendChild(growthPercentTotalTd);

    tfoot.appendChild(totalRow);
    table.appendChild(tfoot);

    tableWrap.innerHTML = "";
    tableWrap.appendChild(table);
    tableWrap.hidden = false;
}

/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport() {
    tableWrap.hidden = false;

    tableWrap.innerHTML = `
        <div class="report-loading">
            Loading report…
        </div>
    `;

    const applyPeriodBtn = document.getElementById("applyPeriodBtn");
    if (applyPeriodBtn) applyPeriodBtn.disabled = true;

    try {
        const params = new URLSearchParams();

        if (fromDate.value) {
            params.set("from", fromDate.value);
        }
        if (toDate.value) {
            params.set("to", toDate.value);
        }
        params.set("source", reportSource);

        const response = await fetch(
            `/api/customer-growth?${params.toString()}`,
            {
                method: "GET",
                headers: { "Accept": "application/json" }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to load customer growth report.");
        }

        currentReport = data;

        if (data.period && data.period.from && !fromDate.value) {
            fromDate.value = data.period.from;
        }
        if (data.period && data.period.to && !toDate.value) {
            toDate.value = data.period.to;
        }

        resetSort();
        renderTable();

    } catch (error) {
        console.error("Customer Growth Error:", error);

        tableWrap.innerHTML = `
            <div class="report-error">
                ${escapeHtml(error.message)}
            </div>
        `;
        tableWrap.hidden = false;

    } finally {
        if (applyPeriodBtn) applyPeriodBtn.disabled = false;
    }
}

/* =========================================================
   INITIAL LOAD & EVENTS
   ========================================================= */

if (periodForm) {
    periodForm.addEventListener("submit", event => {
        event.preventDefault();
        loadReport();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const defaultPeriod = fiscalYearDates();
    if (fromDate && !fromDate.value) fromDate.value = defaultPeriod.from;
    if (toDate && !toDate.value) toDate.value = defaultPeriod.to;

    selectedFormat = "YTD";
    selectedMonth = null;
    selectedQuarter = null;
    selectedPeriodYear = getFiscalYearStart(todayDate()).getFullYear();

    updateFormatDisplay();
    loadReport();
});