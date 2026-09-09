/* =========================================================
   SHARED SALES REPORT PERIOD FORMAT CONTROL
   ========================================================= */

function initSalesPeriodFormat(onPeriodSelected) {

    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const formatValue = document.getElementById("formatValue");
    const formatMenu = document.getElementById("formatMenu");

    if (!fromDate || !toDate || !formatValue || !formatMenu) {
        return;
    }

    const fiscalMonths = [
        "April", "May", "June", "July", "August", "September",
        "October", "November", "December", "January", "February", "March"
    ];

    const fiscalQuarters = {
        Q1: [3, 5],
        Q2: [6, 8],
        Q3: [9, 11],
        Q4: [0, 2]
    };

    const today = () => {
        const date = new Date();

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
    };

    const fiscalStartYear = date =>
        date.getMonth() >= 3
            ? date.getFullYear()
            : date.getFullYear() - 1;

    const dateToString = date => {

        const month =
            String(date.getMonth() + 1).padStart(2, "0");

        const day =
            String(date.getDate()).padStart(2, "0");

        return `${date.getFullYear()}-${month}-${day}`;
    };

    let selectedFormat = "YTD";
    let selectedYear = fiscalStartYear(today());
    let selectedMonth = null;
    let selectedQuarter = null;
    let updatingDates = false;


    /* =====================================================
       UPDATE PERIOD DISPLAY
       ===================================================== */

    const updateDisplay = () => {

        let label = `YTD ${selectedYear}`;

        if (
            selectedFormat === "MTD" &&
            selectedMonth
        ) {
            label = `${selectedMonth} ${selectedYear}`;

        } else if (
            selectedFormat === "QTD" &&
            selectedQuarter
        ) {
            label = `${selectedQuarter} ${selectedYear}`;

        } else if (
            selectedFormat === "CUSTOM"
        ) {
            label = "Custom";
        }

        formatValue.innerHTML =
            `${label} <i class="fa-solid fa-chevron-down"></i>`;

        window.salesPeriodFormatType =
            selectedFormat;
    };


    /* =====================================================
       CLOSE FORMAT MENU
       ===================================================== */

    const closeMenu = () => {

        formatMenu.hidden = true;

        formatValue.setAttribute(
            "aria-expanded",
            "false"
        );

        formatMenu
            .querySelectorAll(".format-submenu")
            .forEach(menu => {
                menu.classList.remove(
                    "submenu-open"
                );
            });
    };


    /* =====================================================
       APPLY PERIOD
       ===================================================== */

    const applyPeriod = (from, to) => {

        updatingDates = true;

        fromDate.value = from;
        toDate.value = to;

        updatingDates = false;

        updateDisplay();
        closeMenu();

        onPeriodSelected?.();
    };


    /* =====================================================
       SELECT YTD
       ===================================================== */

    const selectYTD = year => {

        if (Number.isInteger(year)) {
            selectedYear = year;
        }

        const currentDate = today();
        const currentFiscalYear = fiscalStartYear(currentDate);
        const end = selectedYear === currentFiscalYear
            ? currentDate
            : new Date(selectedYear + 1, 2, 31);

        selectedFormat = "YTD";
        selectedMonth = null;
        selectedQuarter = null;

        applyPeriod(
            `${selectedYear}-04-01`,
            dateToString(end)
        );
    };


    /* =====================================================
       SELECT MONTH
       ===================================================== */

    const selectMonth = monthName => {

        const monthIndex =
            fiscalMonths.indexOf(monthName);

        const calendarMonth =
            new Date(
                `${monthName} 1, 2000`
            ).getMonth();

        const year =
            monthIndex <= 8
                ? selectedYear
                : selectedYear + 1;

        const start =
            new Date(
                year,
                calendarMonth,
                1
            );

        let end =
            new Date(
                year,
                calendarMonth + 1,
                0
            );

        const currentDate = today();

        if (
            year === currentDate.getFullYear() &&
            calendarMonth === currentDate.getMonth()
        ) {
            end = currentDate;
        }

        selectedFormat = "MTD";
        selectedMonth = monthName;
        selectedQuarter = null;

        applyPeriod(
            dateToString(start),
            dateToString(end)
        );
    };


    /* =====================================================
       SELECT QUARTER
       ===================================================== */

    const selectQuarter = quarter => {

        const [
            startMonth,
            endMonth
        ] = fiscalQuarters[quarter];

        const year =
            quarter === "Q4"
                ? selectedYear + 1
                : selectedYear;

        const start =
            new Date(
                year,
                startMonth,
                1
            );

        let end =
            new Date(
                year,
                endMonth + 1,
                0
            );

        const currentDate = today();

        if (
            currentDate >= start &&
            currentDate <= end
        ) {
            end = currentDate;
        }

        selectedFormat = "QTD";
        selectedQuarter = quarter;
        selectedMonth = null;

        applyPeriod(
            dateToString(start),
            dateToString(end)
        );
    };


    /* =====================================================
       YEAR SELECT
       ===================================================== */

    const currentFiscalYear =
        fiscalStartYear(today());

    formatMenu
        .querySelectorAll(".period-year-select")
        .forEach(select => {

            for (
                let year = currentFiscalYear;
                year >= currentFiscalYear - 10;
                year -= 1
            ) {

                const option =
                    document.createElement("option");

                option.value = year;
                option.textContent = year;

                select.appendChild(option);
            }

            select.value = selectedYear;

            select.addEventListener(
                "change",
                () => {

                    selectedYear =
                        Number(select.value);

                    formatMenu
                        .querySelectorAll(
                            ".period-year-select"
                        )
                        .forEach(other => {

                            other.value =
                                selectedYear;
                        });

                    if (
                        select.classList.contains(
                            "ytd-year-select"
                        )
                    ) {
                        selectYTD(selectedYear);
                    }
                }
            );
        });


    /* =====================================================
       FORMAT DROPDOWN
       ===================================================== */

    formatValue.addEventListener(
        "click",
        event => {

            event.preventDefault();

            formatMenu.hidden =
                !formatMenu.hidden;

            formatValue.setAttribute(
                "aria-expanded",
                String(!formatMenu.hidden)
            );
        }
    );


    /* =====================================================
       FORMAT PARENT BUTTONS
       ===================================================== */

    formatMenu
        .querySelectorAll(".format-parent")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const submenu =
                        formatMenu.querySelector(
                            `.format-submenu[data-submenu="${button.dataset.parent}"]`
                        );

                    if (button.dataset.parent === "CUSTOM") {
                        selectedFormat = "CUSTOM";
                        updateDisplay();
                    }

                    formatMenu
                        .querySelectorAll(
                            ".format-submenu"
                        )
                        .forEach(menu => {

                            if (menu !== submenu) {
                                menu.classList.remove(
                                    "submenu-open"
                                );
                            }
                        });

                    submenu?.classList.toggle(
                        "submenu-open"
                    );
                }
            );
        });


    /* =====================================================
       CUSTOM
       ===================================================== */

    formatMenu
        .querySelector(
            '[data-format="CUSTOM"]'
        )
        ?.addEventListener(
            "click",
            () => {

                selectedFormat = "CUSTOM";

                updateDisplay();
                closeMenu();
            }
        );


    /* =====================================================
       MONTH BUTTONS
       ===================================================== */

    formatMenu
        .querySelectorAll(
            "button[data-month]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    selectMonth(
                        button.dataset.month
                    )
            );
        });


    /* =====================================================
       QUARTER BUTTONS
       ===================================================== */

    formatMenu
        .querySelectorAll(
            "button[data-quarter]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    selectQuarter(
                        button.dataset.quarter
                    )
            );
        });


    /* =====================================================
       CUSTOM DATE CHANGE
       ===================================================== */

    [fromDate, toDate].forEach(input => {

        input.addEventListener(
            "change",
            () => {

                if (!updatingDates) {

                    selectedFormat = "CUSTOM";

                    updateDisplay();
                }
            }
        );
    });


    /* =====================================================
       CLOSE ON OUTSIDE CLICK
       ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !formatMenu.contains(event.target) &&
                event.target !== formatValue
            ) {
                closeMenu();
            }
        }
    );


    updateDisplay();
}


/* =========================================================
   SHIFT SALES PERIOD ONE YEAR
   ========================================================= */

function shiftSalesPeriodOneYear(value) {

    const [
        year,
        month,
        day
    ] = value.split("-").map(Number);

    return `${year - 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}


/* =========================================================
   SALES COMPARISON SORT STATE
   ========================================================= */

let salesComparisonState = null;

let salesComparisonSort = {
    column: null,
    direction: "none"
};


/* =========================================================
   CHANGE SORT

   ASC -> DESC -> NONE -> ASC
   ========================================================= */

function changeSalesComparisonSort(column) {

    if (
        salesComparisonSort.column !== column
    ) {

        salesComparisonSort = {
            column: column,
            direction: "asc"
        };

    } else if (
        salesComparisonSort.direction === "asc"
    ) {

        salesComparisonSort.direction =
            "desc";

    } else if (
        salesComparisonSort.direction === "desc"
    ) {

        salesComparisonSort.direction =
            "none";

    } else {

        salesComparisonSort.direction =
            "asc";
    }

    renderSalesComparison();
}


/* =========================================================
   RENDER SALES COMPARISON
   ========================================================= */

function renderSalesComparison(
    previousReport,
    currentReport,
    config
) {

    /* =====================================================
       STORE NEW DATA
       ===================================================== */

    if (
        previousReport &&
        currentReport &&
        config
    ) {

        salesComparisonState = {
            previousReport,
            currentReport,
            config
        };

        salesComparisonSort = {
            column: null,
            direction: "none"
        };
    }


    if (!salesComparisonState) {
        return;
    }


    ({
        previousReport,
        currentReport,
        config
    } = salesComparisonState);


    /* =====================================================
       TABLE
       ===================================================== */

    const tableWrap =
        document.getElementById(
            "tableWrap"
        );

    const rowsByKey =
        new Map();

    const keys =
        config.keys;


    /* =====================================================
       ESCAPE
       ===================================================== */

    const escape = value =>
        String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );


    /* =====================================================
       NUMBER FORMAT

       DISPLAY ONLY
       ===================================================== */

    const formatNumber = value =>
        (Number(value) || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 0
            }
        );


    /* =====================================================
       PERCENT FORMAT

       IMPORTANT:
       The calculation remains full precision.
       Only the DISPLAY is rounded to 2 decimals.
       ===================================================== */

    const formatPercent = value =>
        `${(
            Number(value) || 0
        ).toFixed(2)}%`;


    /* =====================================================
       ADD REPORT ROWS
       ===================================================== */

    const addRows = (
        report,
        field
    ) => {

        (report.rows || [])
            .forEach(row => {

                const key =
                    keys
                        .map(
                            name =>
                                row[name] || ""
                        )
                        .join("\u0000");


                if (
                    !rowsByKey.has(key)
                ) {

                    rowsByKey.set(
                        key,
                        {
                            labels:
                                keys.map(
                                    name =>
                                        row[name] || ""
                                ),

                            lastYear: 0,

                            currentYear: 0
                        }
                    );
                }


                rowsByKey.get(key)[field] =
                    Number(row.total) || 0;
            });
    };


    /* =====================================================
       LOAD DATA
       ===================================================== */

    addRows(
        previousReport,
        "lastYear"
    );

    addRows(
        currentReport,
        "currentYear"
    );


    /* =====================================================
       DEFAULT ORDER
       ===================================================== */

    const rows =
        [
            ...rowsByKey.values()
        ].sort(
            (a, b) =>
                a.labels
                    .join("\u0000")
                    .localeCompare(
                        b.labels.join("\u0000"),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    )
        );


    /* =====================================================
       GRAND TOTALS
       ===================================================== */

    const grandLastYear =
        rows.reduce(
            (total, row) =>
                total + row.lastYear,
            0
        );

    const grandCurrentYear =
        rows.reduce(
            (total, row) =>
                total + row.currentYear,
            0
        );


    /* =====================================================
       CALCULATE PERCENTAGES

       NO ROUNDING HERE.

       Full precision is preserved for:
       - Sales %
       - Running Sales %
       - Growth %
       ===================================================== */

    let lastRunning = 0;

    let currentRunning = 0;


    rows.forEach(row => {

        lastRunning += row.lastYear;

        currentRunning += row.currentYear;


        /* -----------------------------------------------
           LAST YEAR SALES %
           ----------------------------------------------- */

        row._lastYearPercent =
            grandLastYear
                ? (
                    row.lastYear /
                    grandLastYear
                ) * 100
                : 0;


        /* -----------------------------------------------
           LAST YEAR RUNNING SALES %
           ----------------------------------------------- */

        row._lastYearRunningPercent =
            grandLastYear
                ? (
                    lastRunning /
                    grandLastYear
                ) * 100
                : 0;


        /* -----------------------------------------------
           CURRENT YEAR SALES %
           ----------------------------------------------- */

        row._currentYearPercent =
            grandCurrentYear
                ? (
                    row.currentYear /
                    grandCurrentYear
                ) * 100
                : 0;


        /* -----------------------------------------------
           CURRENT YEAR RUNNING SALES %
           ----------------------------------------------- */

        row._currentYearRunningPercent =
            grandCurrentYear
                ? (
                    currentRunning /
                    grandCurrentYear
                ) * 100
                : 0;


        /* -----------------------------------------------
           GROWTH %

           NO ROUNDING HERE
           ----------------------------------------------- */

        row._growth =
            row.lastYear
                ? (
                    (
                        row.currentYear -
                        row.lastYear
                    ) /
                    Math.abs(
                        row.lastYear
                    )
                ) * 100
                : Number.NEGATIVE_INFINITY;
    });


    /* =====================================================
       SORTING

       All percentage columns use their FULL-PRECISION
       calculated values.

       ASC -> DESC -> NONE
       ===================================================== */

    if (
        salesComparisonSort.direction !== "none"
    ) {

        rows.sort((a, b) => {

            let valueA;
            let valueB;


            /* =================================================
               CUSTOMER / ITEM
               ================================================= */

            if (
                salesComparisonSort.column
                    .startsWith("key:")
            ) {

                const key =
                    salesComparisonSort.column
                        .slice(4);

                const index =
                    keys.indexOf(key);

                valueA =
                    String(
                        a.labels[index] || ""
                    );

                valueB =
                    String(
                        b.labels[index] || ""
                    );

                const comparison =
                    valueA.localeCompare(
                        valueB,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                return
                    salesComparisonSort.direction ===
                    "asc"

                        ? comparison

                        : -comparison;
            }


            /* =================================================
               NUMERIC COLUMNS
               ================================================= */

            switch (
                salesComparisonSort.column
            ) {

                /* ---------------------------------------------
                   LAST YEAR SALES
                   --------------------------------------------- */

                case "lastYear":

                    valueA =
                        a.lastYear;

                    valueB =
                        b.lastYear;

                    break;


                /* ---------------------------------------------
                   LAST YEAR SALES %
                   --------------------------------------------- */

                case "lastYearPercent":

                    valueA =
                        a._lastYearPercent;

                    valueB =
                        b._lastYearPercent;

                    break;


                /* ---------------------------------------------
                   LAST YEAR RUNNING SALES %
                   --------------------------------------------- */

                case "lastYearRunningPercent":

                    valueA =
                        a._lastYearRunningPercent;

                    valueB =
                        b._lastYearRunningPercent;

                    break;


                /* ---------------------------------------------
                   CURRENT YEAR SALES
                   --------------------------------------------- */

                case "currentYear":

                    valueA =
                        a.currentYear;

                    valueB =
                        b.currentYear;

                    break;


                /* ---------------------------------------------
                   CURRENT YEAR SALES %
                   --------------------------------------------- */

                case "currentYearPercent":

                    valueA =
                        a._currentYearPercent;

                    valueB =
                        b._currentYearPercent;

                    break;


                /* ---------------------------------------------
                   CURRENT YEAR RUNNING SALES %
                   --------------------------------------------- */

                case "currentYearRunningPercent":

                    valueA =
                        a._currentYearRunningPercent;

                    valueB =
                        b._currentYearRunningPercent;

                    break;


                /* ---------------------------------------------
                   GROWTH %
                   --------------------------------------------- */

                case "growth":

                    valueA =
                        a._growth;

                    valueB =
                        b._growth;

                    break;


                default:

                    valueA = 0;
                    valueB = 0;
            }


            /* =================================================
               ASCENDING
               ================================================= */

            if (
                salesComparisonSort.direction === "asc"
            ) {

                return valueA - valueB;
            }


            /* =================================================
               DESCENDING
               ================================================= */

            return valueB - valueA;
        });
    }


    /* =====================================================
       CUSTOMER / ITEM HEADERS

       NO SORT ICONS
       ===================================================== */

    const headers =
        config.labels
            .map(
                (label, index) => {

                    return `
                        <th
                            rowspan="2"
                            class="sortable-header"
                            onclick="changeSalesComparisonSort('key:${keys[index]}')"
                        >
                            ${escape(label)}
                        </th>
                    `;
                }
            )
            .join("");


    /* =====================================================
       BODY

       DISPLAY PERCENTAGES TO 2 DECIMALS ONLY
       ===================================================== */

    const body =
        rows
            .map(row => {

                const growth =
                    row._growth ===
                    Number.NEGATIVE_INFINITY
                        ? null
                        : row._growth;


                const growthText =
                    growth === null
                        ? "—"
                        : `${
                            growth > 0
                                ? "+"
                                : ""
                          }${growth.toFixed(2)}%`;


                const growthClass =
                    growth > 0
                        ? "growth-positive"
                        : growth < 0
                            ? "growth-negative"
                            : "growth-neutral";


                return `
                    <tr>

                        ${row.labels
                            .map(
                                label =>
                                    `<td>${escape(label)}</td>`
                            )
                            .join("")}


                        <!-- LAST YEAR SALES -->

                        <td>
                            ${formatNumber(
                                row.lastYear
                            )}
                        </td>


                        <!-- LAST YEAR SALES % -->

                        <td>
                            ${formatPercent(
                                row._lastYearPercent
                            )}
                        </td>


                        <!-- LAST YEAR RUNNING SALES % -->

                        <td>
                            ${formatPercent(
                                row._lastYearRunningPercent
                            )}
                        </td>


                        <!-- CURRENT YEAR SALES -->

                        <td>
                            ${formatNumber(
                                row.currentYear
                            )}
                        </td>


                        <!-- CURRENT YEAR SALES % -->

                        <td>
                            ${formatPercent(
                                row._currentYearPercent
                            )}
                        </td>


                        <!-- CURRENT YEAR RUNNING SALES % -->

                        <td>
                            ${formatPercent(
                                row._currentYearRunningPercent
                            )}
                        </td>


                        <!-- GROWTH % -->

                        <td
                            class="${growthClass}"
                        >
                            ${growthText}
                        </td>

                    </tr>
                `;
            })
            .join("");


    /* =====================================================
       COMPLETE TABLE
       ===================================================== */

    tableWrap.innerHTML = `

        <table
            class="sales-comparison-table comparison-key-count-${keys.length}"
        >

            <thead>

                <tr>

                    ${headers}


                    <!-- LAST YEAR -->

                    <th colspan="3">
                        Last Year
                    </th>


                    <!-- CURRENT YEAR -->

                    <th colspan="3">
                        Current Year
                    </th>


                    <!-- GROWTH -->

                    <th
                        rowspan="2"
                        class="sortable-header"
                        onclick="changeSalesComparisonSort('growth')"
                    >
                        Growth %
                    </th>

                </tr>


                <tr>


                    <!-- LAST YEAR SALES -->

                    <th
                        class="sortable-header"
                        onclick="changeSalesComparisonSort('lastYear')"
                    >
                        Sales
                    </th>


                    <!-- LAST YEAR SALES % -->

                    <th
                        class="sortable-header"
                        onclick="changeSalesComparisonSort('lastYearPercent')"
                    >
                        Sales %
                    </th>


                    <!-- LAST YEAR RUNNING SALES % -->

                    <th
                        class="sortable-header"
                        onclick="changeSalesComparisonSort('lastYearRunningPercent')"
                    >
                        Running Sales %
                    </th>


                    <!-- CURRENT YEAR SALES -->

                    <th
                        class="sortable-header"
                        onclick="changeSalesComparisonSort('currentYear')"
                    >
                        Sales
                    </th>


                    <!-- CURRENT YEAR SALES % -->

                    <th
                        class="sortable-header"
                        onclick="changeSalesComparisonSort('currentYearPercent')"
                    >
                        Sales %
                    </th>


                    <!-- CURRENT YEAR RUNNING SALES % -->

                    <th
                        class="sortable-header"
                        onclick="changeSalesComparisonSort('currentYearRunningPercent')"
                    >
                        Running Sales %
                    </th>

                </tr>

            </thead>


            <tbody>

                ${body}

            </tbody>


            <tfoot>

                <tr>

                    <td colspan="${keys.length}">
                        Grand Total
                    </td>


                    <!-- LAST YEAR -->

                    <td>
                        ${formatNumber(
                            grandLastYear
                        )}
                    </td>

                    <td>
                        100.00%
                    </td>

                    <td>
                        100.00%
                    </td>


                    <!-- CURRENT YEAR -->

                    <td>
                        ${formatNumber(
                            grandCurrentYear
                        )}
                    </td>

                    <td>
                        100.00%
                    </td>

                    <td>
                        100.00%
                    </td>


                    <!-- GROWTH -->

                    <td>
                        —
                    </td>

                </tr>

            </tfoot>

        </table>
    `;


    tableWrap.hidden = false;
}
