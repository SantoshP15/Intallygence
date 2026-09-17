/* =========================================================
   ITEM LEVEL REPORT JAVASCRIPT
   ========================================================= */

let currentReport = null;
let selectedItemFilter = "";

let selectedFormat = "YTD";
let selectedMonth = null;
let selectedQuarter = null;
let selectedPeriodYear = null;

/* =========================================================
   SORT STATE (Default: Current Year / Total Sales DESC)
   ========================================================= */

let currentSort = {
    column: "current_year",
    direction: "desc",
    monthIndex: null,
    metric: null
};

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const periodForm = document.getElementById("periodForm");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const applyPeriodBtn = document.getElementById("applyPeriodBtn");
const reportStatus = document.getElementById("reportStatus");
const tableWrap = document.getElementById("tableWrap");
const formatValue = document.getElementById("formatValue");
const formatMenu = document.getElementById("formatMenu");
const exportExcelBtn = document.getElementById("exportExcelBtn");

const reportSource =
    document.querySelector("main")?.dataset.reportSource ||
    (window.location.pathname.includes("purchase") ? "purchase" : "sales");

const sourceView =
    reportSource === "purchase"
        ? "view_Purchase"
        : "view_SalesInventory";

function exportItemLevelExcel() {
    const table = tableWrap.querySelector("table");
    if (!table || typeof XLSX === "undefined") {
        return;
    }
    const workbook = XLSX.utils.table_to_book(table, {
        sheet: "Item Level",
        raw: true
    });
    XLSX.writeFile(workbook, "item-level.xlsx");
}

if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", exportItemLevelExcel);
}

/* =========================================================
   MONTH NAMES & QUARTERS
   ========================================================= */

const fiscalMonths = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March"
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

function shiftDateOneYear(value) {
    const date = parseLocalDate(value);
    if (!date) return "";
    date.setFullYear(date.getFullYear() - 1);
    return dateToString(date);
}

function lastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0);
}

function getCalendarMonthIndex(monthName) {
    const months = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    return months[monthName];
}

function getMonthsBetweenDates(fromDateStr, toDateStr) {
    const start = parseLocalDate(fromDateStr);
    const end = parseLocalDate(toDateStr);
    if (!start || !end) return ["April", "May"];

    const months = [];
    let curr = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    while (curr <= last) {
        months.push(monthNames[curr.getMonth()]);
        curr.setMonth(curr.getMonth() + 1);
    }
    return months;
}

function getMonthPeriod(monthName, fiscalYearStart) {
    const today = todayDate();
    const fiscalStartYear = Number.isInteger(fiscalYearStart)
        ? fiscalYearStart
        : getFiscalYearStart(today).getFullYear();

    const monthIndex = fiscalMonths.indexOf(monthName);
    if (monthIndex === -1) return null;

    let year = monthIndex <= 8 ? fiscalStartYear : fiscalStartYear + 1;
    const calendarMonth = getCalendarMonthIndex(monthName);
    const start = new Date(year, calendarMonth, 1);
    let end = lastDayOfMonth(year, calendarMonth);

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

    const currentMonth = today.getMonth();
    let currentQuarter;

    if (currentMonth >= 3 && currentMonth <= 5) currentQuarter = "Q1";
    else if (currentMonth >= 6 && currentMonth <= 8) currentQuarter = "Q2";
    else if (currentMonth >= 9 && currentMonth <= 11) currentQuarter = "Q3";
    else currentQuarter = "Q4";

    if (quarter === currentQuarter && start <= today && today <= end) {
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

function amount(value) {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(Number(value) || 0));
}

function percent(value) {
    return `${(Number(value) || 0).toFixed(2)}%`;
}

function escapeHtml(text) {
    const element = document.createElement("div");
    element.textContent = text ?? "";
    return element.innerHTML;
}

function calculateGrowth(lastYear, currentYear) {
    const previous = Number(lastYear) || 0;
    const current = Number(currentYear) || 0;
    if (previous === 0) {
        return current > 0 ? 100.00 : 0.00;
    }
    return (((current - previous) / Math.abs(previous)) * 100);
}

function formatGrowth(lastYear, currentYear) {
    const growth = calculateGrowth(lastYear, currentYear);
    const sign = growth > 0 ? "+" : "";
    return `${sign}${growth.toFixed(2)}%`;
}

/* =========================================================
   FORMAT MENU & SUBMENUS
   ========================================================= */

function closeFormatMenu() {
    if (!formatMenu) return;
    formatMenu.hidden = true;
    formatValue?.setAttribute("aria-expanded", "false");
    formatMenu.querySelectorAll(".format-submenu").forEach(submenu => {
        submenu.classList.remove("submenu-open");
    });
}

function openFormatMenu() {
    if (!formatMenu) return;
    formatMenu.hidden = false;
    formatValue?.setAttribute("aria-expanded", "true");
}

function toggleFormatMenu() {
    if (!formatMenu) return;
    if (formatMenu.hidden) {
        openFormatMenu();
    } else {
        closeFormatMenu();
    }
}

function toggleSubmenu(parentButton) {
    if (!parentButton || !formatMenu) return;
    const parent = parentButton.dataset.parent;
    const submenu = formatMenu.querySelector(`.format-submenu[data-submenu="${parent}"]`);
    if (!submenu) return;

    openFormatMenu();
    formatMenu.querySelectorAll(".format-submenu").forEach(item => {
        if (item !== submenu) {
            item.classList.remove("submenu-open");
        }
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
    if (!dates) {
        console.error("Invalid MTD month:", monthName);
        return;
    }
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

    selectedFormat = "QTD";
    selectedQuarter = quarter;
    selectedMonth = null;

    const dates = getQuarterPeriod(
        selectedQuarter,
        selectedPeriodYear
    );

    if (!dates) {
        console.error("Invalid QTD quarter:", quarter);
        return;
    }

    fromDate.value = dates.from;
    toDate.value = dates.to;

    // Keep every year dropdown synchronized
    formatMenu?.querySelectorAll(".period-year-select").forEach(select => {
        select.value = String(selectedPeriodYear);
    });

    updateFormatDisplay();
    closeFormatMenu();
    loadReport();
}

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

        select.addEventListener("click", event => {
            event.stopPropagation();
        });

        select.addEventListener("change", event => {
            event.stopPropagation();

            const newYear = Number(event.target.value);

            if (!Number.isInteger(newYear)) {
                return;
            }

            // Update selected fiscal year
            selectedPeriodYear = newYear;

            // Keep all Year dropdowns synchronized
            formatMenu.querySelectorAll(".period-year-select").forEach(otherSelect => {
                otherSelect.value = String(newYear);
            });

            /*
            * The Year dropdown that was actually changed
            * decides which Format is active.
            *
            * YTD → Year → 2025 = YTD 2025
            * QTD → Q1 → Year → 2025 = Q1 2025
            * MTD → April → Year → 2025 = April 2025
            */

            // =====================================================
            // YTD YEAR
            // =====================================================
            if (select.classList.contains("ytd-year-select")) {

                selectedFormat = "YTD";
                selectedMonth = null;
                selectedQuarter = null;

                const dates = fiscalYearDates(selectedPeriodYear);

                fromDate.value = dates.from;
                toDate.value = dates.to;

                updateFormatDisplay();
                closeFormatMenu();
                loadReport();

                return;
            }

            // =====================================================
            // QTD YEAR
            // =====================================================
            if (select.classList.contains("qtd-year-select")) {

                if (!selectedQuarter) {
                    return;
                }

                selectedFormat = "QTD";
                selectedMonth = null;

                const dates = getQuarterPeriod(
                    selectedQuarter,
                    selectedPeriodYear
                );

                if (!dates) {
                    return;
                }

                fromDate.value = dates.from;
                toDate.value = dates.to;

                updateFormatDisplay();
                closeFormatMenu();
                loadReport();

                return;
            }

            // =====================================================
            // MTD YEAR
            // =====================================================
            if (select.classList.contains("mtd-year-select")) {

                if (!selectedMonth) {
                    return;
                }

                selectedFormat = "MTD";
                selectedQuarter = null;

                const dates = getMonthPeriod(
                    selectedMonth,
                    selectedPeriodYear
                );

                if (!dates) {
                    return;
                }

                fromDate.value = dates.from;
                toDate.value = dates.to;

                updateFormatDisplay();
                closeFormatMenu();
                loadReport();

                return;
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

    const customApplyButton = document.getElementById("applyCustomPeriodBtn") || document.getElementById("applyPeriodBtn");
    customApplyButton?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        const from = fromDate?.value;
        const to = toDate?.value;

        if (!from || !to) {
            reportStatus.hidden = false;
            reportStatus.className = "report-status error";
            reportStatus.textContent = "Please select both From and To dates.";
            return;
        }

        if (from > to) {
            reportStatus.hidden = false;
            reportStatus.className = "report-status error";
            reportStatus.textContent = "The start date must be before the end date.";
            return;
        }

        selectedFormat = "CUSTOM";
        selectedMonth = null;
        selectedQuarter = null;
        updateFormatDisplay();
        closeFormatMenu();
        loadReport();
    });

    formatMenu.querySelectorAll('.format-submenu[data-submenu="MTD"] button[data-month]').forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            selectMTD(button.dataset.month);
        });
    });

    formatMenu.querySelectorAll('.format-submenu[data-submenu="QTD"] button[data-quarter]').forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            selectQTD(button.dataset.quarter);
        });
    });

    formatMenu.addEventListener("click", event => {
        event.stopPropagation();
    });

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
   RESET SORT (Defaulted to Sales DESC)
   ========================================================= */

function resetSort() {
    currentSort = {
        column: selectedFormat === "CUSTOM" ? "total" : "current_year",
        direction: "desc",
        monthIndex: null,
        metric: null
    };
}

function getSortClass(column, monthIndex = null, metric = null) {
    const isMatch = currentSort.column === column &&
                    currentSort.monthIndex === monthIndex &&
                    currentSort.metric === metric;
    if (!isMatch) return "sortable-header";
    return `sortable-header ${currentSort.direction}`;
}

/* =========================================================
   SORT COMPARISON ROWS
   ========================================================= */

function sortComparisonRows(rows) {
    if (!rows || !rows.length) return [];
    const sorted = [...rows];
    sorted.sort((a, b) => {
        let valueA;
        let valueB;

        if (currentSort.column === "item") {
            valueA = String(a.item || "").toLowerCase();
            valueB = String(b.item || "").toLowerCase();
            const comparison = valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" });
            return currentSort.direction === "asc" ? comparison : -comparison;
        }

        if (currentSort.column === "last_year") {
            valueA = Number(a.last_year) || 0;
            valueB = Number(b.last_year) || 0;
        } else if (currentSort.column === "last_year_percent") {
            valueA = Number(a.last_year_percent) || 0;
            valueB = Number(b.last_year_percent) || 0;
        } else if (currentSort.column === "last_year_running") {
            valueA = Number(a.last_year_running_percent) || 0;
            valueB = Number(b.last_year_running_percent) || 0;
        } else if (currentSort.column === "current_year") {
            valueA = Number(a.current_year) || 0;
            valueB = Number(b.current_year) || 0;
        } else if (currentSort.column === "current_year_percent") {
            valueA = Number(a.current_year_percent) || 0;
            valueB = Number(b.current_year_percent) || 0;
        } else if (currentSort.column === "current_year_running") {
            valueA = Number(a.current_year_running_percent) || 0;
            valueB = Number(b.current_year_running_percent) || 0;
        } else if (currentSort.column === "growth") {
            valueA = calculateGrowth(a.last_year, a.current_year);
            valueB = calculateGrowth(b.last_year, b.current_year);
            valueA = valueA === null ? -Infinity : valueA;
            valueB = valueB === null ? -Infinity : valueB;
        } else {
            return 0;
        }

        if (valueA < valueB) return currentSort.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === "asc" ? 1 : -1;
        return 0;
    });

    return sorted;
}

/* =========================================================
   SORT NORMAL / CUSTOM REPORT
   ========================================================= */

function sortNormalRows(rows) {
    if (!rows || !rows.length) return [];
    const sorted = [...rows];
    sorted.sort((a, b) => {
        let valueA;
        let valueB;

        if (currentSort.column === "item") {
            valueA = String(a.item || "").toLowerCase();
            valueB = String(b.item || "").toLowerCase();
            const comparison = valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" });
            return currentSort.direction === "asc" ? comparison : -comparison;
        }

        if (currentSort.column === "total") {
            valueA = Number(a.total) || 0;
            valueB = Number(b.total) || 0;
        } else if (currentSort.column === "total_percent") {
            valueA = Number(a.total_percent) || 0;
            valueB = Number(b.total_percent) || 0;
        } else if (currentSort.column === "month") {
            const monthA = a.months?.[currentSort.monthIndex] || {};
            const monthB = b.months?.[currentSort.monthIndex] || {};

            if (currentSort.metric === "sales") {
                valueA = Number(monthA.sales) || 0;
                valueB = Number(monthB.sales) || 0;
            } else if (currentSort.metric === "percent") {
                valueA = Number(monthA.percent) || 0;
                valueB = Number(monthB.percent) || 0;
            } else {
                valueA = Number(monthA.running_percent) || 0;
                valueB = Number(monthB.running_percent) || 0;
            }
        } else {
            return 0;
        }

        if (valueA < valueB) return currentSort.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === "asc" ? 1 : -1;
        return 0;
    });

    return sorted;
}

/* =========================================================
   CHANGE SORT
   ========================================================= */

function changeSort(column, monthIndex = null, metric = null) {
    const sameColumn =
        currentSort.column === column &&
        currentSort.monthIndex === monthIndex &&
        currentSort.metric === metric;

    if (!sameColumn) {
        currentSort = {
            column,
            monthIndex,
            metric,
            direction: column === "item" ? "asc" : "desc"
        };
    } else if (currentSort.direction === "desc") {
        currentSort.direction = "asc";
    } else {
        currentSort.direction = "desc";
    }

    if (currentReport?.type === "COMPARISON") {
        renderComparisonReport(currentReport);
    } else {
        renderReport(currentReport);
    }
}

/* =========================================================
   API REQUEST
   ========================================================= */

async function fetchItemReport(from, to) {
    const response = await fetch(`/api/item-level?${new URLSearchParams({
        from,
        to,
        source: sourceView
    })}`);
    const report = await response.json();
    if (!response.ok) {
        throw new Error(report.error || "Unable to load the report.");
    }
    return report;
}

/* =========================================================
   LOAD COMPARISON
   ========================================================= */

async function loadComparisonReport() {
    const currentFrom = fromDate.value;
    const currentTo = toDate.value;
    const previousFrom = shiftDateOneYear(currentFrom);
    const previousTo = shiftDateOneYear(currentTo);

    const [previousReport, currentReportData] = await Promise.all([
        fetchItemReport(previousFrom, previousTo),
        fetchItemReport(currentFrom, currentTo)
    ]);

    const merged = mergeComparisonReports(previousReport, currentReportData);

    currentReport = {
        type: "COMPARISON",
        format: selectedFormat,
        month: selectedMonth,
        quarter: selectedQuarter,
        rows: merged.rows,
        grand_last_year: merged.grand_last_year,
        grand_current_year: merged.grand_current_year,
        current_year_report: currentReportData,
        previous_year_report: previousReport
    };

    initItemFilter();
    resetSort();
    renderComparisonReport(currentReport);
}

/* =========================================================
   MERGE TWO REPORTS
   ========================================================= */

function mergeComparisonReports(previousReport, currentReportData) {
    const map = new Map();

    (previousReport?.rows || []).forEach(row => {
        const item = String(row.item || "Unspecified Item").trim();
        const key = item.toLowerCase();
        if (!map.has(key)) {
            map.set(key, {
                item,
                last_year: 0,
                current_year: 0,
                last_year_percent: 0,
                current_year_percent: 0,
                last_year_running_percent: 0,
                current_year_running_percent: 0
            });
        }
        map.get(key).last_year += Number(row.total) || 0;
    });

    (currentReportData?.rows || []).forEach(row => {
        const item = String(row.item || "Unspecified Item").trim();
        const key = item.toLowerCase();
        if (!map.has(key)) {
            map.set(key, {
                item,
                last_year: 0,
                current_year: 0,
                last_year_percent: 0,
                current_year_percent: 0,
                last_year_running_percent: 0,
                current_year_running_percent: 0
            });
        }
        map.get(key).current_year += Number(row.total) || 0;
    });

    const rows = Array.from(map.values());

    const grandLastYear = rows.reduce((total, row) => total + (Number(row.last_year) || 0), 0);
    const grandCurrentYear = rows.reduce((total, row) => total + (Number(row.current_year) || 0), 0);

    rows.forEach(row => {
        row.last_year_percent = grandLastYear ? (row.last_year / grandLastYear) * 100 : 0;
        row.current_year_percent = grandCurrentYear ? (row.current_year / grandCurrentYear) * 100 : 0;
    });

    return {
        rows,
        grand_last_year: grandLastYear,
        grand_current_year: grandCurrentYear
    };
}

/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport() {
    reportStatus.hidden = false;
    reportStatus.className = "report-status";
    reportStatus.textContent = "Loading item sales…";
    tableWrap.hidden = true;
    tableWrap.innerHTML = "";

    try {
        if (selectedFormat === "YTD" || selectedFormat === "MTD" || selectedFormat === "QTD") {
            await loadComparisonReport();
        } else {
            const report = await fetchItemReport(fromDate.value, toDate.value);
            
            const generatedMonths = (report.months && report.months.length > 0) 
                ? report.months 
                : getMonthsBetweenDates(fromDate.value, toDate.value);

            currentReport = {
                type: "CUSTOM",
                rows: (report.rows || []).map(r => {
                    let rowMonths = r.months;
                    if (!rowMonths || rowMonths.length === 0) {
                        rowMonths = generatedMonths.map((m, idx) => ({
                            sales: idx === 0 ? Number(r.current || r.total || r.sales || 0) : 0,
                            percent: 0,
                            running_percent: 0
                        }));
                    }
                    return {
                        item: r.item,
                        total: r.current || r.total || r.sales || 0,
                        total_percent: 0,
                        months: rowMonths
                    };
                }),
                months: generatedMonths,
                grand_total: report.current_total || report.grand_total || 0
            };

            initItemFilter();
            resetSort();
            renderReport(currentReport);
        }
        reportStatus.hidden = true;
    } catch (error) {
        console.error("ITEM LEVEL REPORT ERROR:", error);
        reportStatus.hidden = false;
        reportStatus.className = "report-status error";
        reportStatus.textContent = error.message || "Unable to load the report.";
    }
}

/* =========================================================
   RENDER COMPARISON REPORT (Rowspan & Exact Sticky Alignment)
   ========================================================= */

function renderComparisonReport(report) {
    if (!report || !Array.isArray(report.rows)) {
        reportStatus.hidden = false;
        reportStatus.className = "report-status error";
        reportStatus.textContent = "No comparison data available.";
        tableWrap.hidden = true;
        return;
    }

    if (!report.rows.length) {
        tableWrap.innerHTML = `<div class="empty-state">No ${reportSource  === 'purchase' ? 'purchases' : 'sales'} were found for this period.</div>`;
        tableWrap.hidden = false;
        return;
    }

    let displayRows = report.rows;
    if (selectedItemFilter) {
        displayRows = displayRows.filter(row => String(row.item || "").trim() === selectedItemFilter);
    }

    const rows = sortComparisonRows(displayRows);

    const grandLastYear = Number(report.grand_last_year) || 0;
    const grandCurrentYear = Number(report.grand_current_year) || 0;

    let lastRunningSales = 0;
    let currentRunningSales = 0;

    rows.forEach(row => {
        const lastYearSales = Number(row.last_year) || 0;
        const currentYearSales = Number(row.current_year) || 0;

        row.last_year_percent = grandLastYear ? (lastYearSales / grandLastYear) * 100 : 0;
        row.current_year_percent = grandCurrentYear ? (currentYearSales / grandCurrentYear) * 100 : 0;

        lastRunningSales += lastYearSales;
        currentRunningSales += currentYearSales;

        row.last_year_running_percent = grandLastYear ? (lastRunningSales / grandLastYear) * 100 : 0;
        row.current_year_running_percent = grandCurrentYear ? (currentRunningSales / grandCurrentYear) * 100 : 0;
    });

    let lastYearHeader = "Last Year";
    let currentYearHeader = "Current Year";

    if (report.format === "MTD" && report.month) {
        lastYearHeader = `Last Year ${report.month}`;
        currentYearHeader = `Current Year ${report.month}`;
    } else if (report.format === "QTD" && report.quarter) {
        lastYearHeader = `Last Year ${report.quarter}`;
        currentYearHeader = `Current Year ${report.quarter}`;
    }

    const tableHeader = `
        <thead>
            <tr>
                <th rowspan="2" class="${getSortClass('item')} frozen-item-header" onclick="changeSort('item')" title="Sort Item">
                    Item
                </th>
                <th colspan="3" class="comparison-year-header">
                    ${escapeHtml(lastYearHeader)}
                </th>
                <th colspan="3" class="comparison-year-header">
                    ${escapeHtml(currentYearHeader)}
                </th>
                <th rowspan="2" class="${getSortClass('growth')} comparison-growth-header" onclick="changeSort('growth')" title="Sort Growth %">
                    Growth %
                </th>
            </tr>
            <tr>
                <th class="${getSortClass('last_year')}" onclick="changeSort('last_year')" title="Sort Last Year Sales">Sales</th>
                <th class="${getSortClass('last_year_percent')}" onclick="changeSort('last_year_percent')" title="Last Year Sales %">Sales %</th>
                <th class="${getSortClass('last_year_running')}" onclick="changeSort('last_year_running')" title="Last Year Running Sales %">Running %</th>
                <th class="${getSortClass('current_year')}" onclick="changeSort('current_year')" title="Sort Current Year Sales">Sales</th>
                <th class="${getSortClass('current_year_percent')}" onclick="changeSort('current_year_percent')" title="Current Year Sales %">Sales %</th>
                <th class="${getSortClass('current_year_running')}" onclick="changeSort('current_year_running')" title="Current Year Running Sales %">Running %</th>
            </tr>
        </thead>
    `;

    const bodyRows = rows.map(row => {
        const item = String(row.item || "Unspecified Item").trim();
        return `
            <tr>
                <td title="${escapeHtml(item)}">${escapeHtml(item)}</td>
                <td>${amount(row.last_year)}</td>
                <td>${percent(row.last_year_percent)}</td>
                <td class="running">${percent(row.last_year_running_percent)}</td>
                <td>${amount(row.current_year)}</td>
                <td>${percent(row.current_year_percent)}</td>
                <td class="running">${percent(row.current_year_running_percent)}</td>
                <td>${formatGrowth(row.last_year, row.current_year)}</td>
            </tr>
        `;
    }).join("");

    const grandGrowth = formatGrowth(grandLastYear, grandCurrentYear);

    const grandTotalRow = `
        <tfoot>
            <tr>
                <td>Grand Total</td>
                <td>${amount(grandLastYear)}</td>
                <td>${percent(grandLastYear ? 100 : 0)}</td>
                <td class="running">${percent(grandLastYear ? 100 : 0)}</td>
                <td>${amount(grandCurrentYear)}</td>
                <td>${percent(grandCurrentYear ? 100 : 0)}</td>
                <td class="running">${percent(grandCurrentYear ? 100 : 0)}</td>
                <td>${grandGrowth}</td>
            </tr>
        </tfoot>
    `;

    tableWrap.innerHTML = `
        <table class="item-table comparison-table">
            ${tableHeader}
            <tbody>${bodyRows}</tbody>
            ${grandTotalRow}
        </table>
    `;

    tableWrap.hidden = false;
}

/* =========================================================
   RECALCULATE RUNNING % (CUSTOM REPORT)
   ========================================================= */

function recalculateRunningPercent(rows) {
    if (!rows || !rows.length) return;
    const monthCount = rows[0]?.months?.length || 0;

    for (let monthIndex = 0; monthIndex < monthCount; monthIndex++) {
        let monthTotal = 0;
        rows.forEach(row => {
            monthTotal += Number(row.months?.[monthIndex]?.sales) || 0;
        });

        let runningSales = 0;
        rows.forEach(row => {
            const month = row.months?.[monthIndex];
            if (!month) return;
            runningSales += Number(month.sales) || 0;
            month.running_percent = monthTotal ? (runningSales / monthTotal) * 100 : 0;
        });
    }
}

/* =========================================================
   RENDER NORMAL / CUSTOM REPORT (Rowspan="2" Applied)
   ========================================================= */

function renderReport(report) {
    if (!report || !Array.isArray(report.rows)) {
        reportStatus.hidden = false;
        reportStatus.className = "report-status error";
        reportStatus.textContent = "No report data available.";
        tableWrap.hidden = true;
        return;
    }

    if (!report.rows.length) {
        tableWrap.innerHTML = `<div class="empty-state">No ${reportSource  === 'purchase' ? 'purchases' : 'sales'} were found for this period.</div>`;
        tableWrap.hidden = false;
        return;
    }

    let displayRows = report.rows;
    if (selectedItemFilter) {
        displayRows = displayRows.filter(row => String(row.item || "").trim() === selectedItemFilter);
    }

    const rows = sortNormalRows(displayRows);
    recalculateRunningPercent(rows);

    const monthHeaders = (report.months || []).map(month => `
        <th colspan="3" class="month-header">${escapeHtml(month)}</th>
    `).join("");

    const subHeaders = (report.months || []).map((month, monthIndex) => `
        <th class="${getSortClass('month', monthIndex, 'sales')}" onclick="changeSort('month', ${monthIndex}, 'sales')">Sales</th>
        <th class="${getSortClass('month', monthIndex, 'percent')}" onclick="changeSort('month', ${monthIndex}, 'percent')">Sales %</th>
        <th class="${getSortClass('month', monthIndex, 'running_percent')}" onclick="changeSort('month', ${monthIndex}, 'running_percent')">Running %</th>
    `).join("");

    const tableHeader = `
        <thead>
            <tr>
                <th rowspan="2" class="${getSortClass('item')} frozen-item-header" onclick="changeSort('item')">Item</th>
                <th colspan="2">Total Sales</th>
                ${monthHeaders}
            </tr>
            <tr>
                <th class="${getSortClass('total')}" onclick="changeSort('total')">Sales</th>
                <th class="${getSortClass('total_percent')}" onclick="changeSort('total_percent')">Sales %</th>
                ${subHeaders}
            </tr>
        </thead>
    `;

    const bodyRows = rows.map(row => {
        const item = String(row.item || "Unspecified Item").trim();
        const monthCells = (report.months || []).map((month, monthIndex) => {
            const monthData = row.months?.[monthIndex] || {};
            return `
                <td>${amount(monthData.sales)}</td>
                <td>${percent(monthData.percent)}</td>
                <td class="running">${percent(monthData.running_percent)}</td>
            `;
        }).join("");

        return `
            <tr>
                <td title="${escapeHtml(item)}">${escapeHtml(item)}</td>
                <td class="total" style="font-weight:700;">${amount(row.total)}</td>
                <td class="total" style="font-weight:700;">${percent(row.total_percent)}</td>
                ${monthCells}
            </tr>
        `;
    }).join("");

    const totals = (report.months || []).map((month, monthIndex) => {
        const totalSales = rows.reduce((total, row) => total + (Number(row.months?.[monthIndex]?.sales) || 0), 0);
        return `
            <td>${amount(totalSales)}</td>
            <td>100.00%</td>
            <td class="running">100.00%</td>
        `;
    }).join("");

    const grandTotal = Number(report.grand_total) || rows.reduce((total, row) => total + (Number(row.total) || 0), 0);

    const grandTotalRow = `
        <tfoot>
            <tr>
                <td>Grand Total</td>
                <td>${amount(grandTotal)}</td>
                <td>100.00%</td>
                ${totals}
            </tr>
        </tfoot>
    `;

    tableWrap.innerHTML = `
        <table class="item-table">
            ${tableHeader}
            <tbody>${bodyRows}</tbody>
            ${grandTotalRow}
        </table>
    `;

    tableWrap.hidden = false;
}

/* =========================================================
   ITEM FILTER HANDLERS
   ========================================================= */

function initItemFilter() {
    const itemFilter = document.getElementById("itemFilter") || document.getElementById("itemSelect");
    if (!itemFilter) return;

    const items = new Set();
    if (currentReport?.rows && Array.isArray(currentReport.rows)) {
        currentReport.rows.forEach(row => {
            const item = String(row.item || "").trim();
            if (item) items.add(item);
        });
    }

    const sortedItems = Array.from(items).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const currentValue = selectedItemFilter || "";
    itemFilter.innerHTML = `<option value="">All Items</option>`;

    sortedItems.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        itemFilter.appendChild(option);
    });

    if (currentValue && sortedItems.includes(currentValue)) {
        itemFilter.value = currentValue;
    } else {
        itemFilter.value = "";
        selectedItemFilter = "";
    }

    itemFilter.onchange = function () {
        selectedItemFilter = this.value || "";
        applyItemFilter();
    };
}

function applyItemFilter() {
    if (!currentReport) return;

    if (currentReport.type === "COMPARISON") {
        renderComparisonReport(currentReport);
    } else {
        renderReport(currentReport);
    }
}

/* =========================================================
   INITIALIZE & LOAD
   ========================================================= */

const initialDates = fiscalYearDates();
fromDate.value = initialDates.from;
toDate.value = initialDates.to;

selectedFormat = "YTD";
selectedMonth = null;
selectedQuarter = null;
selectedPeriodYear = getFiscalYearStart(todayDate()).getFullYear();

updateFormatDisplay();
loadReport();