/* =========================================================
   CUSTOMER LEVEL REPORT
   ========================================================= */

let currentReport = null;

let salesTrendChart = null;

let selectedCustomerFilter = "";

let selectedFormat = "YTD";
let selectedMonth = null;
let selectedQuarter = null;
let selectedPeriodYear = null;


/* =========================================================
   SORT STATE
   ========================================================= */

let currentSort = {
    column: "customer",
    direction: "asc",
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


function exportCustomerLevelExcel() {
    const table = tableWrap.querySelector("table");

    if (!table || typeof XLSX === "undefined") {
        return;
    }

    const workbook = XLSX.utils.table_to_book(table, {
        sheet: "Customer Level"
    });

    XLSX.writeFile(workbook, "customer-level.xlsx");
}


if (exportExcelBtn) {
    exportExcelBtn.addEventListener(
        "click",
        exportCustomerLevelExcel
    );
}


/* =========================================================
   MONTH NAMES
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


/* =========================================================
   QUARTERS
   ========================================================= */

const fiscalQuarters = {

    Q1: {
        startMonth: 3,
        startDay: 1,
        endMonth: 5,
        endDay: 30
    },

    Q2: {
        startMonth: 6,
        startDay: 1,
        endMonth: 8,
        endDay: 30
    },

    Q3: {
        startMonth: 9,
        startDay: 1,
        endMonth: 11,
        endDay: 31
    },

    Q4: {
        startMonth: 0,
        startDay: 1,
        endMonth: 2,
        endDay: 31
    }

};


/* =========================================================
   DATE HELPERS
   ========================================================= */

function dateToString(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   PARSE LOCAL DATE
   ========================================================= */

function parseLocalDate(value) {

    if (!value) {
        return null;
    }

    const [
        year,
        month,
        day
    ] = value.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


/* =========================================================
   TODAY
   ========================================================= */

function todayDate() {

    const today = new Date();

    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
}


/* =========================================================
   FISCAL YEAR START
   ========================================================= */

function getFiscalYearStart(date) {

    const year =
        date.getMonth() >= 3
            ? date.getFullYear()
            : date.getFullYear() - 1;

    return new Date(
        year,
        3,
        1
    );
}


/* =========================================================
   FISCAL YEAR DATES
   ========================================================= */

function fiscalYearDates(fiscalStartYear) {

    const today = todayDate();

    const currentFiscalStartYear =
        getFiscalYearStart(today).getFullYear();

    const year = Number.isInteger(fiscalStartYear)
        ? fiscalStartYear
        : currentFiscalStartYear;

    const start = new Date(year, 3, 1);

    const end = year === currentFiscalStartYear
        ? today
        : new Date(year + 1, 2, 31);

    return {
        from: dateToString(start),
        to: dateToString(end)
    };
}


/* =========================================================
   SHIFT DATE ONE YEAR
   ========================================================= */

function shiftDateOneYear(value) {

    const date = parseLocalDate(value);

    if (!date) {
        return "";
    }

    date.setFullYear(
        date.getFullYear() - 1
    );

    return dateToString(date);
}


/* =========================================================
   LAST DAY OF MONTH
   ========================================================= */

function lastDayOfMonth(year, month) {

    return new Date(
        year,
        month + 1,
        0
    );
}


/* =========================================================
   CALENDAR MONTH INDEX
   ========================================================= */

function getCalendarMonthIndex(monthName) {

    const months = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11
    };

    return months[monthName];
}


/* =========================================================
   GET MTD PERIOD
   ========================================================= */

function getMonthPeriod(monthName, fiscalYearStart) {

    const today = todayDate();

    const fiscalStartYear =
        Number.isInteger(fiscalYearStart)
            ? fiscalYearStart
            : getFiscalYearStart(today).getFullYear();

    const monthIndex =
        fiscalMonths.indexOf(monthName);

    if (monthIndex === -1) {
        return null;
    }

    let year;

    /*
       April-December belong to
       fiscalStartYear.

       January-March belong to
       fiscalStartYear + 1.
    */

    if (monthIndex <= 8) {

        year = fiscalStartYear;

    } else {

        year = fiscalStartYear + 1;

    }

    const calendarMonth =
        getCalendarMonthIndex(monthName);

    const start = new Date(
        year,
        calendarMonth,
        1
    );

    let end =
        lastDayOfMonth(
            year,
            calendarMonth
        );

    /*
       If selected month is current month,
       stop at today.
    */

    if (
        year === today.getFullYear() &&
        calendarMonth === today.getMonth()
    ) {

        end = todayDate();

    }

    return {
        from: dateToString(start),
        to: dateToString(end)
    };
}


/* =========================================================
   GET QTD PERIOD
   ========================================================= */

function getQuarterPeriod(quarter, fiscalYearStart) {

    const today = todayDate();

    const fiscalStartYear =
        Number.isInteger(fiscalYearStart)
            ? fiscalYearStart
            : getFiscalYearStart(today).getFullYear();

    const config =
        fiscalQuarters[quarter];

    if (!config) {
        return null;
    }

    let startYear = fiscalStartYear;
    let endYear = fiscalStartYear;

    /*
       Q4 is January-March of
       the following calendar year.
    */

    if (quarter === "Q4") {

        startYear =
            fiscalStartYear + 1;

        endYear =
            fiscalStartYear + 1;

    }

    const start = new Date(
        startYear,
        config.startMonth,
        config.startDay
    );

    let end = new Date(
        endYear,
        config.endMonth,
        config.endDay
    );

    /*
       Determine current fiscal quarter.
    */

    const currentMonth =
        today.getMonth();

    let currentQuarter;

    if (
        currentMonth >= 3 &&
        currentMonth <= 5
    ) {

        currentQuarter = "Q1";

    } else if (
        currentMonth >= 6 &&
        currentMonth <= 8
    ) {

        currentQuarter = "Q2";

    } else if (
        currentMonth >= 9 &&
        currentMonth <= 11
    ) {

        currentQuarter = "Q3";

    } else {

        currentQuarter = "Q4";

    }

    /*
       If selected quarter is current quarter,
       stop at today.
    */

    if (
        quarter === currentQuarter &&
        start <= today &&
        today <= end
    ) {

        end = todayDate();

    }

    return {
        from: dateToString(start),
        to: dateToString(end)
    };
}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function amount(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ).format(
        Math.round(
            Number(value) || 0
        )
    );
}


/* =========================================================
   FORMAT PERCENT
   ========================================================= */

function percent(value) {
    return `${(Number(value) || 0).toFixed(2)}%`;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(text) {

    const element =
        document.createElement("div");

    element.textContent =
        text ?? "";

    return element.innerHTML;
}


/* =========================================================
   GROWTH %
   ========================================================= */

function calculateGrowth(
    lastYear,
    currentYear
) {

    const previous =
        Number(lastYear) || 0;

    const current =
        Number(currentYear) || 0;

    if (previous === 0) {
        return null;
    }

    return (
        (
            (current - previous) /
            Math.abs(previous)
        ) * 100
    );
}


/* =========================================================
   FORMAT GROWTH
   ========================================================= */

function formatGrowth(
    lastYear,
    currentYear
) {

    const growth =
        calculateGrowth(
            lastYear,
            currentYear
        );

    if (growth === null) {

        return `
            <span class="growth-neutral">
                —
            </span>
        `;
    }

    const className =
        growth > 0
            ? "growth-positive"
            : growth < 0
                ? "growth-negative"
                : "growth-neutral";

    const sign =
        growth > 0
            ? "+"
            : "";

    return `
        <span class="${className}">
            ${sign}${growth.toFixed(2)}%
        </span>
    `;
}

/* =========================================================
   FORMAT MENU
   ========================================================= */

/*
   MTD and QTD are parent buttons.
   Their submenus are opened by CLICK.
*/

function closeFormatMenu() {

    if (!formatMenu) {
        return;
    }

    formatMenu.hidden = true;

    formatValue?.setAttribute(
        "aria-expanded",
        "false"
    );

    formatMenu
        .querySelectorAll(".format-submenu")
        .forEach(submenu => {

            submenu.classList.remove(
                "submenu-open"
            );

        });
}


function openFormatMenu() {

    if (!formatMenu) {
        return;
    }

    formatMenu.hidden = false;

    formatValue?.setAttribute(
        "aria-expanded",
        "true"
    );
}


function toggleFormatMenu() {

    if (!formatMenu) {
        return;
    }

    if (formatMenu.hidden) {

        openFormatMenu();

    } else {

        closeFormatMenu();

    }
}


/* =========================================================
   TOGGLE MTD / QTD SUBMENU
   ========================================================= */

function toggleSubmenu(parentButton) {

    if (!parentButton || !formatMenu) {
        return;
    }

    const parent =
        parentButton.dataset.parent;

    const submenu =
        formatMenu.querySelector(
            `.format-submenu[data-submenu="${parent}"]`
        );

    if (!submenu) {
        return;
    }

    openFormatMenu();

    /*
       Close the other submenu before opening
       the selected one.
    */

    formatMenu
        .querySelectorAll(".format-submenu")
        .forEach(item => {

            if (item !== submenu) {

                item.classList.remove(
                    "submenu-open"
                );

            }

        });

    submenu.classList.toggle(
        "submenu-open"
    );
}


/* =========================================================
   UPDATE FORMAT DISPLAY
   ========================================================= */

function updateFormatDisplay() {

    if (!formatValue) {
        return;
    }

    let label = selectedPeriodYear
        ? `YTD ${selectedPeriodYear}`
        : "YTD";

    if (
        selectedFormat === "MTD" &&
        selectedMonth
    ) {

        label = selectedPeriodYear
            ? `${selectedMonth} ${selectedPeriodYear}`
            : selectedMonth;

    } else if (
        selectedFormat === "QTD" &&
        selectedQuarter
    ) {

        label = selectedPeriodYear
            ? `${selectedQuarter} ${selectedPeriodYear}`
            : selectedQuarter;

    } else if (
        selectedFormat === "CUSTOM"
    ) {

        label = "Custom";

    }

    formatValue.innerHTML = `
        ${escapeHtml(label)}
        <i class="fa-solid fa-chevron-down"></i>
    `;
}


/* =========================================================
   FORMAT SELECTION
   ========================================================= */

function selectYTD(year) {

    if (Number.isInteger(year)) {
        selectedPeriodYear = year;
    }

    selectedFormat = "YTD";

    selectedMonth = null;

    selectedQuarter = null;

    const dates =
        fiscalYearDates(selectedPeriodYear);

    fromDate.value = dates.from;

    toDate.value = dates.to;

    updateFormatDisplay();

    closeFormatMenu();

    loadReport();
}


function selectMTD(monthName) {

    if (!monthName) {
        return;
    }

    const dates =
        getMonthPeriod(
            monthName,
            selectedPeriodYear
        );

    if (!dates) {

        console.error(
            "Invalid MTD month:",
            monthName
        );

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

    if (!quarter) {
        return;
    }

    const dates =
        getQuarterPeriod(
            quarter,
            selectedPeriodYear
        );

    if (!dates) {

        console.error(
            "Invalid QTD quarter:",
            quarter
        );

        return;
    }

    selectedFormat = "QTD";

    selectedQuarter = quarter;

    selectedMonth = null;

    fromDate.value = dates.from;

    toDate.value = dates.to;

    updateFormatDisplay();

    closeFormatMenu();

    loadReport();
}


function selectCustom() {

    selectedFormat = "CUSTOM";

    selectedMonth = null;

    selectedQuarter = null;

    updateFormatDisplay();

    closeFormatMenu();
}


/* =========================================================
   FORMAT MENU EVENTS
   ========================================================= */

if (formatValue && formatMenu) {

    const currentFiscalYear =
        getFiscalYearStart(todayDate()).getFullYear();

    selectedPeriodYear = currentFiscalYear;

    formatMenu
        .querySelectorAll(".period-year-select")
        .forEach(select => {

            for (
                let year = currentFiscalYear;
                year >= currentFiscalYear - 10;
                year -= 1
            ) {

                const option = document.createElement("option");

                option.value = year;
                option.textContent = year;

                select.appendChild(option);

            }

            select.value = selectedPeriodYear;

            select.addEventListener("change", () => {

                selectedPeriodYear = Number(select.value);

                formatMenu
                    .querySelectorAll(".period-year-select")
                    .forEach(otherSelect => {

                        otherSelect.value = selectedPeriodYear;

                    });

                if (select.classList.contains("ytd-year-select")) {
                    selectYTD(selectedPeriodYear);
                }

            });

        });

    /*
       Main Format button
    */

    formatValue.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            toggleFormatMenu();

        }
    );


    /*
       MTD / QTD parent buttons
    */

    formatMenu
        .querySelectorAll(".format-parent")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    toggleSubmenu(button);

                }
            );

        });
    /*
       CUSTOM
       ----------------
       From / To and Apply are inside the Custom submenu.
    */

    /* =====================================================
       CUSTOM DATE RANGE
       ===================================================== */

    const customApplyButton =
        document.getElementById(
            "applyCustomPeriodBtn"
        );


    customApplyButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const from =
                fromDate?.value;

            const to =
                toDate?.value;


            if (!from || !to) {

                reportStatus.hidden = false;

                reportStatus.className =
                    "report-status error";

                reportStatus.textContent =
                    "Please select both From and To dates.";

                return;
            }


            if (from > to) {

                reportStatus.hidden = false;

                reportStatus.className =
                    "report-status error";

                reportStatus.textContent =
                    "The start date must be before the end date.";

                return;
            }


            selectedFormat = "CUSTOM";

            selectedMonth = null;

            selectedQuarter = null;

            updateFormatDisplay();

            closeFormatMenu();

            loadReport();
        }
    );



    /*
       MTD MONTHS

       IMPORTANT:
       HTML uses:

       data-format="MTD"
       data-month="April"

       So we MUST read data-month,
       not data-format.
    */

    formatMenu
        .querySelectorAll(
            '.format-submenu[data-submenu="MTD"] button[data-month]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const month =
                        button.dataset.month;

                    selectMTD(month);

                }
            );

        });


    /*
       QTD QUARTERS

       IMPORTANT:
       HTML uses:

       data-format="QTD"
       data-quarter="Q1"

       So we MUST read data-quarter,
       not data-format.
    */

    formatMenu
        .querySelectorAll(
            '.format-submenu[data-submenu="QTD"] button[data-quarter]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const quarter =
                        button.dataset.quarter;

                    selectQTD(quarter);

                }
            );

        });


    /*
       Prevent clicks inside the menu
       from reaching document.
    */

    formatMenu.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );


    /*
       Close when clicking outside.
    */

    document.addEventListener(
        "click",
        event => {

            if (
                !formatMenu.contains(event.target) &&
                event.target !== formatValue
            ) {

                closeFormatMenu();

            }

        }
    );


    /*
       Escape closes the menu.
    */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeFormatMenu();

            }

        }
    );

}


/* =========================================================
   CUSTOM DATE INPUTS
   ========================================================= */

/*
   From/To now belong to the Custom submenu.
   They are applied only after clicking Apply.
*/


/* =========================================================
   RESET SORT
   ========================================================= */

function resetSort() {

    currentSort = {
        column: "customer",
        direction: "asc",
        monthIndex: null,
        metric: null
    };

}


/* =========================================================
   SORT COMPARISON ROWS
   ========================================================= */

function sortComparisonRows(rows) {

    if (!rows || !rows.length) {
        return [];
    }

    if (
        currentSort.direction === "none"
    ) {

        return [...rows];

    }

    const sorted = [...rows];

    sorted.sort(
        (a, b) => {

            let valueA;
            let valueB;

            if (
                currentSort.column === "customer"
            ) {

                valueA =
                    String(
                        a.customer || ""
                    ).toLowerCase();

                valueB =
                    String(
                        b.customer || ""
                    ).toLowerCase();

                const comparison =
                    valueA.localeCompare(
                        valueB,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                return currentSort.direction === "asc"
                    ? comparison
                    : -comparison;
            }


            if (
                currentSort.column === "last_year"
            ) {

                valueA =
                    Number(a.last_year) || 0;

                valueB =
                    Number(b.last_year) || 0;

            }

            else if (
                currentSort.column === "current_year"
            ) {

                valueA =
                    Number(a.current_year) || 0;

                valueB =
                    Number(b.current_year) || 0;

            }

            else if (
                currentSort.column === "growth"
            ) {

                valueA =
                    calculateGrowth(
                        a.last_year,
                        a.current_year
                    );

                valueB =
                    calculateGrowth(
                        b.last_year,
                        b.current_year
                    );

                valueA =
                    valueA === null
                        ? -Infinity
                        : valueA;

                valueB =
                    valueB === null
                        ? -Infinity
                        : valueB;

            }

            else {

                return 0;

            }


            if (valueA < valueB) {

                return currentSort.direction === "asc"
                    ? -1
                    : 1;

            }

            if (valueA > valueB) {

                return currentSort.direction === "asc"
                    ? 1
                    : -1;

            }

            return 0;

        }
    );

    return sorted;
}


/* =========================================================
   SORT NORMAL REPORT
   ========================================================= */

function sortNormalRows(rows) {

    if (!rows || !rows.length) {
        return [];
    }

    if (
        currentSort.direction === "none"
    ) {

        return [...rows];

    }

    const sorted = [...rows];

    sorted.sort(
        (a, b) => {

            let valueA;
            let valueB;

            if (
                currentSort.column === "customer"
            ) {

                valueA =
                    String(
                        a.customer || ""
                    ).toLowerCase();

                valueB =
                    String(
                        b.customer || ""
                    ).toLowerCase();

                const comparison =
                    valueA.localeCompare(
                        valueB,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                return currentSort.direction === "asc"
                    ? comparison
                    : -comparison;
            }


            if (
                currentSort.column === "total"
            ) {

                valueA =
                    Number(a.total) || 0;

                valueB =
                    Number(b.total) || 0;

            }

            else if (
                currentSort.column === "total_percent"
            ) {

                valueA =
                    Number(
                        a.total_percent
                    ) || 0;

                valueB =
                    Number(
                        b.total_percent
                    ) || 0;

            }

            else if (
                currentSort.column === "month"
            ) {

                const monthA =
                    a.months?.[
                        currentSort.monthIndex
                    ] || {};

                const monthB =
                    b.months?.[
                        currentSort.monthIndex
                    ] || {};

                if (
                    currentSort.metric === "sales"
                ) {

                    valueA =
                        Number(monthA.sales) || 0;

                    valueB =
                        Number(monthB.sales) || 0;

                }

                else if (
                    currentSort.metric === "percent"
                ) {

                    valueA =
                        Number(monthA.percent) || 0;

                    valueB =
                        Number(monthB.percent) || 0;

                }

                else {

                    valueA =
                        Number(
                            monthA.running_percent
                        ) || 0;

                    valueB =
                        Number(
                            monthB.running_percent
                        ) || 0;

                }

            }

            else {

                return 0;

            }


            if (valueA < valueB) {

                return currentSort.direction === "asc"
                    ? -1
                    : 1;

            }

            if (valueA > valueB) {

                return currentSort.direction === "asc"
                    ? 1
                    : -1;

            }

            return 0;

        }
    );

    return sorted;
}


/* =========================================================
   CHANGE SORT
   ========================================================= */

function changeSort(
    column,
    monthIndex = null,
    metric = null
) {

    const sameColumn =
        currentSort.column === column &&
        currentSort.monthIndex === monthIndex &&
        currentSort.metric === metric;

    if (!sameColumn) {

        currentSort = {
            column,
            monthIndex,
            metric,
            direction: "asc"
        };

    }

    else if (
        currentSort.direction === "asc"
    ) {

        currentSort.direction = "desc";

    }

    else if (
        currentSort.direction === "desc"
    ) {

        currentSort.direction = "none";

    }

    else {

        currentSort.direction = "asc";

    }


    if (
        currentReport?.type === "COMPARISON"
    ) {

        renderComparisonReport(
            currentReport
        );

    }

    else {

        renderReport(
            currentReport
        );

    }

}


/* =========================================================
   API REQUEST
   ========================================================= */

async function fetchCustomerReport(
    from,
    to
) {

    const response =
        await fetch(
            `/api/customer-level?${new URLSearchParams({
                from,
                to
            })}`
        );

    const report =
        await response.json();

    if (!response.ok) {

        throw new Error(
            report.error ||
            "Unable to load the report."
        );

    }

    return report;
}


/* =========================================================
   SALES TREND KPI - CURRENT YEAR MONTH WISE
   ========================================================= */

function getMonthlyCurrentYearSales(report) {

    const months =
        Array.isArray(report?.months)
            ? report.months
            : fiscalMonths;

    const values =
        months.map((_, monthIndex) => {

            return (report?.rows || [])
                .reduce(
                    (total, row) => {

                        return total +
                            (
                                Number(
                                    row.months?.[
                                        monthIndex
                                    ]?.sales
                                ) || 0
                            );

                    },
                    0
                );

        });

    return {
        months,
        values
    };
}


function updateSalesKPI(
    currentYearReport,
    previousYearReport = null
) {

    const canvas =
        document.getElementById(
            "salesTrendChart"
        );

    const valueElement =
        document.getElementById(
            "salesKpiValue"
        );

    const growthElement =
        document.getElementById(
            "salesKpiGrowth"
        );

    if (!canvas || !currentYearReport) {
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }


    const {
        months,
        values
    } =
        getMonthlyCurrentYearSales(
            currentYearReport
        );


    /*
       YTD = April through the selected "To" month.
       MTD = selected month.
       QTD = the three months in the selected quarter.
       Custom = months returned by the API.
    */

    let displayMonths = [...months];
    let displayValues = [...values];


    if (selectedFormat === "YTD") {

        const selectedTo =
            parseLocalDate(toDate.value);

        const fiscalMonthIndex =
            selectedTo
                ? (
                    selectedTo.getMonth() >= 3
                        ? selectedTo.getMonth() - 3
                        : selectedTo.getMonth() + 9
                )
                : 11;

        const endIndex =
            Math.max(
                0,
                Math.min(
                    11,
                    fiscalMonthIndex
                )
            );

        displayMonths =
            months.slice(0, endIndex + 1);

        displayValues =
            values.slice(0, endIndex + 1);

    } else if (
        selectedFormat === "MTD" &&
        selectedMonth
    ) {

        const monthIndex =
            fiscalMonths.indexOf(selectedMonth);

        if (monthIndex >= 0) {
            displayMonths =
                [months[monthIndex] || selectedMonth];

            displayValues =
                [values[monthIndex] || 0];
        }

    } else if (
        selectedFormat === "QTD" &&
        selectedQuarter
    ) {

        const quarterStart = {
            Q1: 0,
            Q2: 3,
            Q3: 6,
            Q4: 9
        }[selectedQuarter];

        displayMonths =
            months.slice(
                quarterStart,
                quarterStart + 3
            );

        displayValues =
            values.slice(
                quarterStart,
                quarterStart + 3
            );
    }


    const currentTotal =
        displayValues.reduce(
            (total, value) =>
                total + (Number(value) || 0),
            0
        );


    if (valueElement) {
        valueElement.textContent =
            amount(currentTotal);
    }


    /*
       Growth is calculated against the same
       selected period in the previous year.
    */

    if (growthElement) {

        let previousTotal = 0;

        if (previousYearReport) {

            const previousTrend =
                getMonthlyCurrentYearSales(
                    previousYearReport
                );

            previousTotal =
                previousTrend.values
                    .slice(
                        0,
                        displayValues.length
                    )
                    .reduce(
                        (total, value) =>
                            total + (Number(value) || 0),
                        0
                    );
        }


        const growth =
            calculateGrowth(
                previousTotal,
                currentTotal
            );


        if (growth === null) {
            growthElement.textContent = "—";
        } else {
            growthElement.textContent =
                `${
                    growth > 0 ? "+" : ""
                }${growth.toFixed(2)}%`;
        }
    }


    if (salesTrendChart) {
        salesTrendChart.destroy();
        salesTrendChart = null;
    }


    salesTrendChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "line",

                data: {

                    labels: displayMonths,

                    datasets: [
                        {
                            data: displayValues,

                            borderWidth: 2,

                            pointRadius:
                                displayValues.length <= 1
                                    ? 3
                                    : 2,

                            pointHoverRadius: 4,

                            tension: 0.35,

                            fill:
                                displayValues.length > 1,

                            borderColor: "#2585d8",

                            backgroundColor:
                                "rgba(37, 133, 216, 0.12)",

                            pointBackgroundColor:
                                "#2585d8",

                            pointBorderColor:
                                "#ffffff",

                            pointBorderWidth: 1.5
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    animation: {
                        duration: 250
                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            displayColors: false,

                            callbacks: {

                                label:
                                    tooltipContext =>
                                        amount(
                                            tooltipContext.raw
                                        )
                            }
                        }
                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {
                                color: "#64748b",
                                font: {
                                    size: 9
                                },
                                maxRotation: 0,
                                autoSkip: false
                            }
                        },

                        y: {

                            display: false,

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   LOAD COMPARISON
   ========================================================= */



async function loadComparisonReport() {

    const currentFrom =
        fromDate.value;

    const currentTo =
        toDate.value;

    const previousFrom =
        shiftDateOneYear(
            currentFrom
        );

    const previousTo =
        shiftDateOneYear(
            currentTo
        );

    const [
        previousReport,
        currentReportData
    ] =
        await Promise.all([

            fetchCustomerReport(
                previousFrom,
                previousTo
            ),

            fetchCustomerReport(
                currentFrom,
                currentTo
            )

        ]);


    const merged =
        mergeComparisonReports(
            previousReport,
            currentReportData
        );


    currentReport = {

        type: "COMPARISON",

        format: selectedFormat,

        month: selectedMonth,

        quarter: selectedQuarter,

        rows: merged.rows,

        grand_last_year:
            merged.grand_last_year,

        grand_current_year:
            merged.grand_current_year,

        current_year_report:
            currentReportData,

        previous_year_report:
            previousReport

    };

    initCustomerFilter();

    resetSort();

    renderComparisonReport(
        currentReport
    );

}


/* =========================================================
   MERGE TWO REPORTS
   ========================================================= */

/* =========================================================
   MERGE TWO REPORTS
   ========================================================= */

function mergeComparisonReports(
    previousReport,
    currentReportData
) {

    const map = new Map();


    /*
       Previous year
    */

    (
        previousReport?.rows || []
    ).forEach(row => {

        const customer =
            String(
                row.customer ||
                "Unspecified customer"
            ).trim();

        const key =
            customer.toLowerCase();

        if (!map.has(key)) {

            map.set(
                key,
                {
                    customer,

                    last_year: 0,
                    current_year: 0,

                    last_year_percent: 0,
                    current_year_percent: 0,

                    last_year_running_percent: 0,
                    current_year_running_percent: 0
                }
            );

        }

        map.get(key).last_year +=
            Number(row.total) || 0;

    });


    /*
       Current year
    */

    (
        currentReportData?.rows || []
    ).forEach(row => {

        const customer =
            String(
                row.customer ||
                "Unspecified customer"
            ).trim();

        const key =
            customer.toLowerCase();

        if (!map.has(key)) {

            map.set(
                key,
                {
                    customer,

                    last_year: 0,
                    current_year: 0,

                    last_year_percent: 0,
                    current_year_percent: 0,

                    last_year_running_percent: 0,
                    current_year_running_percent: 0
                }
            );

        }

        map.get(key).current_year +=
            Number(row.total) || 0;

    });


    const rows =
        Array.from(
            map.values()
        );


    /*
       Grand totals
    */

    const grandLastYear =
        rows.reduce(
            (total, row) => {

                return total +
                    (
                        Number(
                            row.last_year
                        ) || 0
                    );

            },
            0
        );


    const grandCurrentYear =
        rows.reduce(
            (total, row) => {

                return total +
                    (
                        Number(
                            row.current_year
                        ) || 0
                    );

            },
            0
        );


    /*
       Calculate Sales %
    */

    rows.forEach(row => {

        row.last_year_percent =
            grandLastYear
                ? (
                    row.last_year /
                    grandLastYear
                ) * 100
                : 0;


        row.current_year_percent =
            grandCurrentYear
                ? (
                    row.current_year /
                    grandCurrentYear
                ) * 100
                : 0;

    });


    /*
       Calculate Running Sales %
       using the current row order.
    */

    let lastRunningSales = 0;

    let currentRunningSales = 0;


    rows.forEach(row => {

        lastRunningSales +=
            Number(row.last_year) || 0;

        currentRunningSales +=
            Number(row.current_year) || 0;


        row.last_year_running_percent =
            grandLastYear
                ? (
                    lastRunningSales /
                    grandLastYear
                ) * 100
                : 0;


        row.current_year_running_percent =
            grandCurrentYear
                ? (
                    currentRunningSales /
                    grandCurrentYear
                ) * 100
                : 0;

    });


    return {

        rows,

        grand_last_year:
            grandLastYear,

        grand_current_year:
            grandCurrentYear

    };

}


/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport() {

    reportStatus.hidden = false;

    reportStatus.className =
        "report-status";

    reportStatus.textContent =
        "Loading customer sales…";

    tableWrap.hidden = true;

    tableWrap.innerHTML = "";


    try {

        /*
           YTD / MTD / QTD
           ----------------
           Always compare two years.
        */

        if (
            selectedFormat === "YTD" ||
            selectedFormat === "MTD" ||
            selectedFormat === "QTD"
        ) {

            await loadComparisonReport();

        }

        /*
           CUSTOM
           ----------------
           Existing detailed report.
        */

        else {

            const report =
                await fetchCustomerReport(
                    fromDate.value,
                    toDate.value
                );

            currentReport = report;
                initCustomerFilter();
            resetSort();

            renderReport(report);

        }


        reportStatus.hidden = true;

    }

    catch (error) {

        console.error(
            "CUSTOMER LEVEL REPORT ERROR:",
            error
        );

        reportStatus.hidden = false;

        reportStatus.className =
            "report-status error";

        reportStatus.textContent =
            error.message ||
            "Unable to load the report.";

    }

}


/* =========================================================
   RENDER COMPARISON REPORT
   ========================================================= */

/* =========================================================
   RENDER COMPARISON REPORT
   ========================================================= */

function renderComparisonReport(report) {

    if (
        !report ||
        !Array.isArray(report.rows)
    ) {

        reportStatus.hidden = false;

        reportStatus.className =
            "report-status error";

        reportStatus.textContent =
            "No comparison data available.";

        tableWrap.hidden = true;

        return;
    }


    if (!report.rows.length) {

        tableWrap.innerHTML = `
            <div class="empty-state">
                No sales were found for this period.
            </div>
        `;

        tableWrap.hidden = false;

        return;
    }


    /*
       Sort rows first.
    */

    const rows =
        sortComparisonRows(
            report.rows
        );


    /*
       Recalculate Running Sales %
       after sorting.
    */

    const grandLastYear =
        Number(
            report.grand_last_year
        ) || 0;

    const grandCurrentYear =
        Number(
            report.grand_current_year
        ) || 0;


    let lastRunningSales = 0;

    let currentRunningSales = 0;


    rows.forEach(row => {

        const lastYearSales =
            Number(
                row.last_year
            ) || 0;

        const currentYearSales =
            Number(
                row.current_year
            ) || 0;


        row.last_year_percent =
            grandLastYear
                ? (
                    lastYearSales /
                    grandLastYear
                ) * 100
                : 0;


        row.current_year_percent =
            grandCurrentYear
                ? (
                    currentYearSales /
                    grandCurrentYear
                ) * 100
                : 0;


        lastRunningSales +=
            lastYearSales;

        currentRunningSales +=
            currentYearSales;


        row.last_year_running_percent =
            grandLastYear
                ? (
                    lastRunningSales /
                    grandLastYear
                ) * 100
                : 0;


        row.current_year_running_percent =
            grandCurrentYear
                ? (
                    currentRunningSales /
                    grandCurrentYear
                ) * 100
                : 0;

    });


    /*
       Period heading
    */

    let periodLabel = "YTD";


    if (
        report.format === "MTD"
    ) {

        periodLabel =
            report.month || "MTD";

    }

    else if (
        report.format === "QTD"
    ) {

        periodLabel =
            report.quarter || "QTD";

    }


    /*
       Dynamic year headers
    */

    let lastYearHeader =
        "Last Year";

    let currentYearHeader =
        "Current Year";


    if (
        report.format === "MTD" &&
        report.month
    ) {

        lastYearHeader =
            `Last Year ${report.month}`;

        currentYearHeader =
            `Current Year ${report.month}`;

    }

    else if (
        report.format === "QTD" &&
        report.quarter
    ) {

        lastYearHeader =
            `Last Year ${report.quarter}`;

        currentYearHeader =
            `Current Year ${report.quarter}`;

    }


    /*
       TABLE HEADER
    */

    const tableHeader = `

        <thead>

            <!-- Main headers -->

            <tr>

                <th
                    rowspan="2"
                    class="sortable-header comparison-customer-header"
                    onclick="changeSort('customer')"
                    title="Sort Customer"
                >
                    Customer
                </th>


                <th
                    colspan="3"
                    class="comparison-year-header"
                >
                    ${escapeHtml(
                        lastYearHeader
                    )}
                </th>


                <th
                    colspan="3"
                    class="comparison-year-header"
                >
                    ${escapeHtml(
                        currentYearHeader
                    )}
                </th>


                <th
                    rowspan="2"
                    class="sortable-header comparison-growth-header"
                    onclick="changeSort('growth')"
                    title="Sort Growth %"
                >
                    Growth %
                </th>

            </tr>


            <!-- Sub headers -->

            <tr>

                <th
                    class="sortable-header"
                    onclick="changeSort('last_year')"
                    title="Sort Last Year Sales"
                >
                    Sales
                </th>


                <th
                    class="sortable-header"
                    title="Last Year Sales %"
                >
                    Sales %
                </th>


                <th
                    class="sortable-header"
                    title="Last Year Running Sales %"
                >
                    Running Sales %
                </th>


                <th
                    class="sortable-header"
                    onclick="changeSort('current_year')"
                    title="Sort Current Year Sales"
                >
                    Sales
                </th>


                <th
                    class="sortable-header"
                    title="Current Year Sales %"
                >
                    Sales %
                </th>


                <th
                    class="sortable-header"
                    title="Current Year Running Sales %"
                >
                    Running Sales %
                </th>

            </tr>

        </thead>

    `;


    /*
       BODY
    */

    const bodyRows =
        rows
            .map(row => {

                const customer =
                    String(
                        row.customer ||
                        "Unspecified customer"
                    ).trim();


                return `

                    <tr>

                        <td
                            title="${escapeHtml(
                                customer
                            )}"
                        >
                            ${escapeHtml(
                                customer
                            )}
                        </td>


                        <!-- LAST YEAR SALES -->

                        <td>
                            ${amount(
                                row.last_year
                            )}
                        </td>


                        <!-- LAST YEAR SALES % -->

                        <td>
                            ${percent(
                                row.last_year_percent
                            )}
                        </td>


                        <!-- LAST YEAR RUNNING SALES % -->

                        <td class="running">
                            ${percent(
                                row.last_year_running_percent
                            )}
                        </td>


                        <!-- CURRENT YEAR SALES -->

                        <td>
                            ${amount(
                                row.current_year
                            )}
                        </td>


                        <!-- CURRENT YEAR SALES % -->

                        <td>
                            ${percent(
                                row.current_year_percent
                            )}
                        </td>


                        <!-- CURRENT YEAR RUNNING SALES % -->

                        <td class="running">
                            ${percent(
                                row.current_year_running_percent
                            )}
                        </td>


                        <!-- GROWTH -->

                        <td>
                            ${formatGrowth(
                                row.last_year,
                                row.current_year
                            )}
                        </td>

                    </tr>

                `;

            })
            .join("");


    /*
       GRAND TOTAL
    */

    const grandGrowth =
        formatGrowth(
            grandLastYear,
            grandCurrentYear
        );


    const grandTotalRow = `

        <tfoot>

            <tr>

                <td>
                    Grand Total
                </td>


                <!-- LAST YEAR -->

                <td>
                    ${amount(
                        grandLastYear
                    )}
                </td>


                <td>
                    ${percent(
                        grandLastYear
                            ? 100
                            : 0
                    )}
                </td>


                <td class="running">
                    ${percent(
                        grandLastYear
                            ? 100
                            : 0
                    )}
                </td>


                <!-- CURRENT YEAR -->

                <td>
                    ${amount(
                        grandCurrentYear
                    )}
                </td>


                <td>
                    ${percent(
                        grandCurrentYear
                            ? 100
                            : 0
                    )}
                </td>


                <td class="running">
                    ${percent(
                        grandCurrentYear
                            ? 100
                            : 0
                    )}
                </td>


                <!-- GROWTH -->

                <td>
                    ${grandGrowth}
                </td>

            </tr>

        </tfoot>

    `;


    /*
       FINAL TABLE
    */

    tableWrap.innerHTML = `

        <table class="customer-table comparison-table">

            ${tableHeader}

            <tbody>

                ${bodyRows}

            </tbody>

            ${grandTotalRow}

        </table>

    `;


    tableWrap.hidden = false;

    updateSalesKPI(
        report.current_year_report,
        report.previous_year_report
    );

}


/* =========================================================
   RECALCULATE RUNNING %
   ========================================================= */

function recalculateRunningPercent(rows) {

    if (!rows || !rows.length) {
        return;
    }

    const monthCount =
        rows[0]?.months?.length || 0;

    for (
        let monthIndex = 0;
        monthIndex < monthCount;
        monthIndex++
    ) {

        let monthTotal = 0;

        rows.forEach(row => {

            monthTotal +=
                Number(
                    row.months?.[
                        monthIndex
                    ]?.sales
                ) || 0;

        });


        let runningSales = 0;

        rows.forEach(row => {

            const month =
                row.months?.[
                    monthIndex
                ];

            if (!month) {
                return;
            }

            runningSales +=
                Number(
                    month.sales
                ) || 0;

            month.running_percent =
                monthTotal
                    ? (
                        runningSales /
                        monthTotal
                    ) * 100
                    : 0;

        });

    }

}


/* =========================================================
   RENDER NORMAL REPORT
   ========================================================= */

function renderReport(report) {

    if (
        !report ||
        !Array.isArray(report.rows)
    ) {

        reportStatus.hidden = false;

        reportStatus.className =
            "report-status error";

        reportStatus.textContent =
            "No report data available.";

        tableWrap.hidden = true;

        return;
    }


    if (!report.rows.length) {

        tableWrap.innerHTML = `
            <div class="empty-state">
                No sales were found for this period.
            </div>
        `;

        tableWrap.hidden = false;

        return;
    }


    const rows =
        sortNormalRows(
            report.rows
        );


    recalculateRunningPercent(rows);


    /*
       MONTH HEADERS
    */

    const monthHeaders =
        report.months
            .map(month => {

                return `

                    <th
                        colspan="3"
                        class="month-header"
                    >
                        ${escapeHtml(month)}
                    </th>

                `;

            })
            .join("");


    /*
       SUB HEADERS
    */

    const subHeaders =
        report.months
            .map(
                (
                    month,
                    monthIndex
                ) => {

                    return `

                        <th
                            class="sortable-header"
                            onclick="changeSort(
                                'month',
                                ${monthIndex},
                                'sales'
                            )"
                        >
                            Sales
                        </th>

                        <th
                            class="sortable-header"
                            onclick="changeSort(
                                'month',
                                ${monthIndex},
                                'percent'
                            )"
                        >
                            Sales %
                        </th>

                        <th
                            class="sortable-header"
                            onclick="changeSort(
                                'month',
                                ${monthIndex},
                                'running_percent'
                            )"
                        >
                            Running %
                        </th>

                    `;

                }
            )
            .join("");


    /*
       HEADER
    */

    const tableHeader = `

        <thead>

            <tr>

                <th
                    rowspan="2"
                    class="sortable-header"
                    onclick="changeSort('customer')"
                >
                    Customer
                </th>

                <th colspan="2">
                    Total Sales
                </th>

                ${monthHeaders}

            </tr>

            <tr>

                <th
                    class="sortable-header"
                    onclick="changeSort('total')"
                >
                    Sales
                </th>

                <th
                    class="sortable-header"
                    onclick="changeSort('total_percent')"
                >
                    Sales %
                </th>

                ${subHeaders}

            </tr>

        </thead>

    `;


    /*
       BODY
    */

    const bodyRows =
        rows
            .map(row => {

                const customer =
                    String(
                        row.customer ||
                        "Unspecified customer"
                    ).trim();


                const monthCells =
                    report.months
                        .map(
                            (
                                month,
                                monthIndex
                            ) => {

                                const monthData =
                                    row.months?.[
                                        monthIndex
                                    ] || {};


                                return `

                                    <td>
                                        ${amount(
                                            monthData.sales
                                        )}
                                    </td>

                                    <td>
                                        ${percent(
                                            monthData.percent
                                        )}
                                    </td>

                                    <td class="running">
                                        ${percent(
                                            monthData.running_percent
                                        )}
                                    </td>

                                `;

                            }
                        )
                        .join("");


                return `

                    <tr>

                        <td
                            title="${escapeHtml(customer)}"
                        >
                            ${escapeHtml(customer)}
                        </td>

                        <td class="total">
                            ${amount(row.total)}
                        </td>

                        <td class="total">
                            ${percent(
                                row.total_percent
                            )}
                        </td>

                        ${monthCells}

                    </tr>

                `;

            })
            .join("");


    /*
       GRAND TOTAL
    */

    const totals =
        report.months
            .map(
                (
                    month,
                    monthIndex
                ) => {

                    const totalSales =
                        rows.reduce(
                            (
                                total,
                                row
                            ) => {

                                return total +
                                    (
                                        Number(
                                            row.months?.[
                                                monthIndex
                                            ]?.sales
                                        ) || 0
                                    );

                            },
                            0
                        );


                    return `

                        <td>
                            ${amount(
                                totalSales
                            )}
                        </td>

                        <td>
                            100.00%
                        </td>

                        <td class="running">
                            100.00%
                        </td>

                    `;

                }
            )
            .join("");


    const grandTotal =
        Number(
            report.grand_total
        ) ||
        rows.reduce(
            (
                total,
                row
            ) => {

                return total +
                    (
                        Number(
                            row.total
                        ) || 0
                    );

            },
            0
        );


    const grandTotalRow = `

        <tfoot>

            <tr>

                <td>
                    Grand Total
                </td>

                <td>
                    ${amount(
                        grandTotal
                    )}
                </td>

                <td>
                    100.00%
                </td>

                ${totals}

            </tr>

        </tfoot>

    `;


    /*
       FINAL TABLE
    */

    tableWrap.innerHTML = `

        <table class="customer-table">

            ${tableHeader}

            <tbody>

                ${bodyRows}

            </tbody>

            ${grandTotalRow}

        </table>

    `;


    tableWrap.hidden = false;

    updateSalesKPI(
        report,
        null
    );

}


/* =========================================================
   APPLY PERIOD
   ========================================================= */

/*
   Periods are now applied directly from:
   - YTD
   - MTD
   - QTD
   - Custom submenu
*/


/* =========================================================
   INITIALIZE
   ========================================================= */

const initialDates =
    fiscalYearDates();


fromDate.value =
    initialDates.from;

toDate.value =
    initialDates.to;


selectedFormat = "YTD";

selectedMonth = null;

selectedQuarter = null;

selectedPeriodYear =
    getFiscalYearStart(todayDate()).getFullYear();


updateFormatDisplay();


/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadReport();

/* =========================================================
   CUSTOMER FILTER
   ========================================================= */

function initCustomerFilter() {

    const customerFilter =
        document.getElementById("customerFilter");

    if (!customerFilter) {
        console.warn("Customer filter element not found.");
        return;
    }

    /*
       Get customers from the currently loaded report.
    */
    const customers = new Set();

    if (currentReport?.rows && Array.isArray(currentReport.rows)) {

        currentReport.rows.forEach(row => {

            const customer =
                String(
                    row.customer || ""
                ).trim();

            if (customer) {
                customers.add(customer);
            }

        });

    }

    /*
       Sort customers alphabetically.
    */
    const sortedCustomers =
        Array.from(customers).sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                )
        );

    /*
       Keep current selection if possible.
    */
    const currentValue =
        selectedCustomerFilter || "";

    customerFilter.innerHTML = `
        <option value="">All Customers</option>
    `;

    sortedCustomers.forEach(customer => {

        const option =
            document.createElement("option");

        option.value = customer;
        option.textContent = customer;

        customerFilter.appendChild(option);

    });

    /*
       Restore selected customer.
    */
    if (
        currentValue &&
        sortedCustomers.includes(currentValue)
    ) {
        customerFilter.value =
            currentValue;
    } else {
        customerFilter.value = "";
        selectedCustomerFilter = "";
    }

    /*
       Change customer immediately.
    */
    customerFilter.onchange = function () {

        selectedCustomerFilter =
            this.value || "";

        applyCustomerFilter();
    };
}


/* =========================================================
   APPLY CUSTOMER FILTER
   ========================================================= */

function applyCustomerFilter() {

    if (!currentReport) {
        return;
    }

    /*
       No customer selected:
       show complete report.
    */
    if (!selectedCustomerFilter) {

        if (
            currentReport.type === "COMPARISON"
        ) {
            renderComparisonReport(
                currentReport
            );
        } else {
            renderReport(
                currentReport
            );
        }

        return;
    }

    /*
       Filter the rows.
    */
    const filteredRows =
        (currentReport.rows || [])
            .filter(row => {

                const customer =
                    String(
                        row.customer || ""
                    ).trim();

                return customer ===
                    selectedCustomerFilter;
            });

    /*
       Don't modify original report.
       Create a copy.
    */
    const filteredReport = {
        ...currentReport,
        rows: filteredRows
    };

    if (
        currentReport.type === "COMPARISON"
    ) {

        renderComparisonReport(
            filteredReport
        );

    } else {

        renderReport(
            filteredReport
        );
    }
}

/* =========================================================
   INITIALIZE CUSTOMER FILTER
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initCustomerFilter();
    }
);
