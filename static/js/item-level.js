const periodForm = document.getElementById("periodForm");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const reportStatus = document.getElementById("reportStatus");
const tableWrap = document.getElementById("tableWrap");

let currentReport = null;

/*
 * Sort state
 *
 * column:
 *   item
 *   month
 *   total
 *   total_percent
 *
 * metric:
 *   sales
 *   percent
 *   running_percent
 */
let currentSort = {
    column: "total",
    monthIndex: null,
    metric: null,
    direction: "desc"
};


/* =========================================================
   FISCAL YEAR
   ========================================================= */

function fiscalYearDates() {
    const today = new Date();

    const startYear =
        today.getMonth() >= 3
            ? today.getFullYear()
            : today.getFullYear() - 1;

    return {
        from: `${startYear}-04-01`,
        to: `${startYear + 1}-03-31`
    };
}


/* =========================================================
   FORMATTERS
   ========================================================= */

function amount(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(value || 0);
}

function percent(value) {
    return `${(value || 0).toFixed(2)}%`;
}

function escapeHtml(text) {
    const element = document.createElement("div");
    element.textContent = text;
    return element.innerHTML;
}


/* =========================================================
   SORT ICON
   ========================================================= */

// function sortIcon(column, monthIndex = null, metric = null) {

//     const active =
//         currentSort.column === column &&
//         currentSort.monthIndex === monthIndex &&
//         currentSort.metric === metric;

//     if (!active) {
//         return `<span class="sort-icon">↕</span>`;
//     }

//     return currentSort.direction === "asc"
//         ? `<span class="sort-icon">↑</span>`
//         : `<span class="sort-icon">↓</span>`;
// }


/* =========================================================
   CHANGE SORT
   ========================================================= */

function changeSort(column, monthIndex = null, metric = null) {

    const sameColumn =
        currentSort.column === column &&
        currentSort.monthIndex === monthIndex &&
        currentSort.metric === metric;

    // New column → ASC
    if (!sameColumn) {
        currentSort = {
            column: column,
            monthIndex: monthIndex,
            metric: metric,
            direction: "asc"
        };
    }

    // Same column: ASC → DESC
    else if (currentSort.direction === "asc") {
        currentSort.direction = "desc";
    }

    // Same column: DESC → NONE
    else if (currentSort.direction === "desc") {
        currentSort.direction = "none";
    }

    // Same column: NONE → ASC
    else if (currentSort.direction === "none") {
        currentSort.direction = "asc";
    }

    renderReport(currentReport);
}

/* =========================================================
   SORT ROWS
   ========================================================= */

function sortRows(rows) {

    // No sorting - return original API order
    if (currentSort.direction === "none") {
        return [...rows];
    }

    const sorted = [...rows];

    sorted.sort((a, b) => {

        let valueA;
        let valueB;

        if (currentSort.column === "item") {

            valueA = String(a.item || "").toLowerCase();
            valueB = String(b.item || "").toLowerCase();

            const result = valueA.localeCompare(valueB);

            return currentSort.direction === "asc"
                ? result
                : -result;
        }

        if (currentSort.column === "month") {

            const monthA =
                a.months[currentSort.monthIndex] || {};

            const monthB =
                b.months[currentSort.monthIndex] || {};

            valueA =
                Number(monthA[currentSort.metric] || 0);

            valueB =
                Number(monthB[currentSort.metric] || 0);

        } else if (currentSort.column === "total") {

            valueA = Number(a.total || 0);
            valueB = Number(b.total || 0);

        } else if (currentSort.column === "total_percent") {

            valueA = Number(a.total_percent || 0);
            valueB = Number(b.total_percent || 0);
        }

        const result = valueA - valueB;

        return currentSort.direction === "asc"
            ? result
            : -result;
    });

    return sorted;
}


/* =========================================================
   RECALCULATE RUNNING %
   ========================================================= */

function calculateRunningPercent(rows, months) {

    const runningTotals =
        new Array(months.length).fill(0);

    return rows.map(row => {

        const updatedMonths =
            row.months.map((month, index) => {

                const sales =
                    Number(month.sales || 0);

                runningTotals[index] += sales;

                /*
                 * Total for this month
                 */
                const monthTotal =
                    currentReport.rows.reduce(
                        (total, originalRow) =>
                            total +
                            Number(
                                originalRow.months[index]?.sales || 0
                            ),
                        0
                    );

                return {
                    ...month,

                    running_percent:
                        monthTotal
                            ? (runningTotals[index] / monthTotal) * 100
                            : 0
                };
            });

        return {
            ...row,
            months: updatedMonths
        };
    });
}


/* =========================================================
   RENDER REPORT
   ========================================================= */

function renderReport(report) {

    currentReport = report;

    if (!report.rows.length) {

        tableWrap.innerHTML =
            '<div class="empty-state">No sales were found for this period.</div>';

        tableWrap.hidden = false;

        return;
    }


    /* ---------------------------------------------------------
       SORT ROWS
       --------------------------------------------------------- */

    let sortedRows =
        sortRows(report.rows);


    /*
     * Running % depends on row order.
     * Recalculate it after sorting.
     */
    sortedRows =
        calculateRunningPercent(
            sortedRows,
            report.months
        );


    /* ---------------------------------------------------------
       MONTH HEADERS
       --------------------------------------------------------- */

    const monthHeaders =
        report.months
            .map(month =>
                `<th colspan="3">${month}</th>`
            )
            .join("");


    /* ---------------------------------------------------------
       MONTH SUB HEADERS
       --------------------------------------------------------- */

    const subHeaders =
        report.months
            .map((month, index) => {

                return `
                    <th
                        class="sortable-header"
                        onclick="changeSort('month', ${index}, 'sales')"
                    >
                        Sales
                    </th>

                    <th
                        class="sortable-header"
                        onclick="changeSort('month', ${index}, 'percent')"
                    >
                        Sales %
    
                    </th>

                    <th
                        class="sortable-header"
                        onclick="changeSort('month', ${index}, 'running_percent')"
                    >
                        Running %
                
                    </th>
                `;
            })
            .join("");


    /* ---------------------------------------------------------
       DATA ROWS
       --------------------------------------------------------- */

    const rows =
        sortedRows
            .map(row => {

                return `
                    <tr>

                        <td>
                            ${escapeHtml(row.item)}
                        </td>

                        ${
                            row.months
                                .map(month => `
                                    <td>
                                        ${amount(month.sales)}
                                    </td>

                                    <td>
                                        ${percent(month.percent)}
                                    </td>

                                    <td class="running">
                                        ${percent(
                                            month.running_percent
                                        )}
                                    </td>
                                `)
                                .join("")
                        }

                        <td class="total">
                            ${amount(row.total)}
                        </td>

                        <td class="total">
                            ${percent(row.total_percent)}
                        </td>

                    </tr>
                `;
            })
            .join("");


    /* ---------------------------------------------------------
       GRAND TOTAL
       --------------------------------------------------------- */

    const totals =
        report.months
            .map((month, index) => {

                const monthTotal =
                    report.rows.reduce(
                        (total, row) =>
                            total +
                            Number(
                                row.months[index]?.sales || 0
                            ),
                        0
                    );

                return `
                    <td>
                        ${amount(monthTotal)}
                    </td>

                    <td>
                        100.00%
                    </td>

                    <td>
                        100.00%
                    </td>
                `;
            })
            .join("");


    /* ---------------------------------------------------------
       TABLE
       --------------------------------------------------------- */

    tableWrap.innerHTML = `

        <table class="item-table">

            <thead>

                <tr>

                    <th
                        rowspan="2"
                        class="sortable-header"
                        onclick="changeSort('item')"
                    >
                        Item
                    
                    </th>

                    ${monthHeaders}

                    <th colspan="2">
                        Total Sales
                    </th>

                </tr>

                <tr>

                    ${subHeaders}

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

                </tr>

            </thead>

            <tbody>

                ${rows}

            </tbody>

            <tfoot>

                <tr>

                    <td>
                        Grand Total
                    </td>

                    ${totals}

                    <td>
                        ${amount(report.grand_total)}
                    </td>

                    <td>
                        100.00%
                    </td>

                </tr>

            </tfoot>

        </table>
    `;

    tableWrap.hidden = false;
}


/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport() {

    reportStatus.hidden = false;
    reportStatus.textContent =
        "Loading item sales…";

    tableWrap.hidden = true;

    try {

        const response =
            await fetch(
                `/api/item-level?${new URLSearchParams({
                    from: fromDate.value,
                    to: toDate.value
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


        /* Default: highest total sales first */

        currentSort = {
            column: "total",
            monthIndex: null,
            metric: null,
            direction: "desc"
        };


        renderReport(report);

        reportStatus.hidden = true;

    } catch (error) {

        reportStatus.textContent =
            error.message;
    }
}


/* =========================================================
   PERIOD
   ========================================================= */

const fiscalDates =
    fiscalYearDates();

fromDate.value =
    fiscalDates.from;

toDate.value =
    fiscalDates.to;


/* =========================================================
   APPLY PERIOD
   ========================================================= */

periodForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        loadReport();
    }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadReport();