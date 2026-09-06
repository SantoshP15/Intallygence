/* =========================================================
   CUSTOMER LEVEL REPORT
   ========================================================= */

let currentReport = null;

let currentSort = {
    column: "customer",
    monthIndex: null,
    metric: null,
    direction: "asc"
};


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const periodForm = document.getElementById("periodForm");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const reportStatus = document.getElementById("reportStatus");
const tableWrap = document.getElementById("tableWrap");


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
   FORMAT NUMBER
   ========================================================= */

function amount(value) {

    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(
        Number(value) || 0
    );
}


/* =========================================================
   FORMAT PERCENT
   ========================================================= */

function percent(value) {

    return `${(
        Number(value) || 0
    ).toFixed(2)}%`;
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
   3-CLICK SORTING
   =========================================================

   1st click = ASC
   2nd click = DESC
   3rd click = ORIGINAL
   4th click = ASC

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


    /* -----------------------------------------------------
       NEW COLUMN
       ----------------------------------------------------- */

    if (!sameColumn) {

        currentSort = {
            column: column,
            monthIndex: monthIndex,
            metric: metric,
            direction: "asc"
        };

    }


    /* -----------------------------------------------------
       ASC → DESC
       ----------------------------------------------------- */

    else if (
        currentSort.direction === "asc"
    ) {

        currentSort.direction = "desc";

    }


    /* -----------------------------------------------------
       DESC → ORIGINAL
       ----------------------------------------------------- */

    else if (
        currentSort.direction === "desc"
    ) {

        currentSort.direction = "none";

    }


    /* -----------------------------------------------------
       ORIGINAL → ASC
       ----------------------------------------------------- */

    else {

        currentSort.direction = "asc";

    }


    renderReport(currentReport);
}


/* =========================================================
   SORT ROWS
   ========================================================= */

function sortRows(rows) {

    if (
        !rows ||
        !rows.length
    ) {
        return [];
    }


    /* -----------------------------------------------------
       ORIGINAL ORDER
       ----------------------------------------------------- */

    if (
        currentSort.direction === "none"
    ) {

        return [...rows];

    }


    const sorted = [...rows];


    sorted.sort((a, b) => {

        let valueA;
        let valueB;


        /* =================================================
           CUSTOMER
           ================================================= */

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


        /* =================================================
           TOTAL SALES
           ================================================= */

        if (
            currentSort.column === "total"
        ) {

            valueA =
                Number(a.total) || 0;

            valueB =
                Number(b.total) || 0;
        }


        /* =================================================
           TOTAL %
           ================================================= */

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


        /* =================================================
           MONTH VALUES
           ================================================= */

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


            /* ---------------------------------------------
               MONTH SALES
               --------------------------------------------- */

            if (
                currentSort.metric === "sales"
            ) {

                valueA =
                    Number(
                        monthA.sales
                    ) || 0;

                valueB =
                    Number(
                        monthB.sales
                    ) || 0;
            }


            /* ---------------------------------------------
               MONTH SALES %
               --------------------------------------------- */

            else if (
                currentSort.metric === "percent"
            ) {

                valueA =
                    Number(
                        monthA.percent
                    ) || 0;

                valueB =
                    Number(
                        monthB.percent
                    ) || 0;
            }


            /* ---------------------------------------------
               MONTH RUNNING %
               --------------------------------------------- */

            else if (
                currentSort.metric === "running_percent"
            ) {

                valueA =
                    Number(
                        monthA.running_percent
                    ) || 0;

                valueB =
                    Number(
                        monthB.running_percent
                    ) || 0;
            }


            else {

                valueA = 0;
                valueB = 0;

            }
        }


        else {

            return 0;

        }


        /* =================================================
           NUMERIC COMPARISON
           ================================================= */

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
    });


    return sorted;
}


/* =========================================================
   RECALCULATE RUNNING %
   ========================================================= */

function recalculateRunningPercent(rows) {

    if (
        !rows ||
        !rows.length
    ) {
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


        /* -------------------------------------------------
           MONTH TOTAL
           ------------------------------------------------- */

        rows.forEach(row => {

            monthTotal +=
                Number(
                    row.months?.[
                        monthIndex
                    ]?.sales
                ) || 0;

        });


        let runningSales = 0;


        /* -------------------------------------------------
           RUNNING %
           FOLLOWS DISPLAYED ORDER
           ------------------------------------------------- */

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

        const response =
            await fetch(
                `/api/customer-level?${new URLSearchParams({
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


        currentReport = report;


        /* -------------------------------------------------
           DEFAULT SORT
           CUSTOMER A → Z
           ------------------------------------------------- */

        currentSort = {
            column: "customer",
            monthIndex: null,
            metric: null,
            direction: "asc"
        };


        renderReport(report);

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
   RENDER REPORT
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

        tableWrap.innerHTML =
            '<div class="empty-state">' +
            'No sales were found for this period.' +
            '</div>';

        tableWrap.hidden = false;

        return;
    }


    /* =====================================================
       SORT ROWS
       ===================================================== */

    const rows =
        sortRows(report.rows);


    /* =====================================================
       RECALCULATE RUNNING %
       ===================================================== */

    recalculateRunningPercent(rows);


    /* =====================================================
       MONTH HEADERS
       ===================================================== */

    const monthHeaders =
        report.months
            .map((month, monthIndex) => {

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


    /* =====================================================
       SUB HEADERS
       ===================================================== */

    const subHeaders =
        report.months
            .map((month, monthIndex) => {

                return `
                    <th
                        class="sortable-header"
                        onclick="changeSort(
                            'month',
                            ${monthIndex},
                            'sales'
                        )"
                        title="Sort ${escapeHtml(month)} Sales"
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
                        title="Sort ${escapeHtml(month)} Sales %"
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
                        title="Sort ${escapeHtml(month)} Running %"
                    >
                        Running %
                    </th>
                `;

            })
            .join("");


    /* =====================================================
       TABLE HEADER
       ===================================================== */

    const tableHeader = `

        <thead>

            <tr>

                <th
                    rowspan="2"
                    class="sortable-header"
                    onclick="changeSort('customer')"
                    title="Sort Customer"
                >
                    Customer
                </th>

                ${monthHeaders}

                <th
                    colspan="2"
                >
                    Total Sales
                </th>

            </tr>


            <tr>

                ${subHeaders}

                <th
                    class="sortable-header"
                    onclick="changeSort('total')"
                    title="Sort Total Sales"
                >
                    Sales
                </th>

                <th
                    class="sortable-header"
                    onclick="changeSort('total_percent')"
                    title="Sort Total %"
                >
                    Sales %
                </th>

            </tr>

        </thead>
    `;


    /* =====================================================
       TABLE BODY
       ===================================================== */

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
                            (month, monthIndex) => {

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

                        ${monthCells}

                        <td class="total">
                            ${amount(row.total)}
                        </td>

                        <td class="total">
                            ${percent(
                                row.total_percent
                            )}
                        </td>

                    </tr>

                `;

            })
            .join("");


    /* =====================================================
       GRAND TOTAL
       ===================================================== */

    const totals =
        report.months
            .map((month, monthIndex) => {

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
                        ${amount(totalSales)}
                    </td>

                    <td>
                        100.00%
                    </td>

                    <td class="running">
                        100.00%
                    </td>

                `;

            })
            .join("");


    /* =====================================================
       GRAND TOTAL VALUE
       ===================================================== */

    const grandTotal =
        Number(report.grand_total) ||
        rows.reduce(
            (
                total,
                row
            ) => {

                return total +
                    (
                        Number(row.total) || 0
                    );

            },
            0
        );


    /* =====================================================
       GRAND TOTAL ROW
       ===================================================== */

    const grandTotalRow = `

        <tfoot>

            <tr>

                <td>
                    Grand Total
                </td>

                ${totals}

                <td>
                    ${amount(grandTotal)}
                </td>

                <td>
                    100.00%
                </td>

            </tr>

        </tfoot>

    `;


    /* =====================================================
       FINAL TABLE
       ===================================================== */

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
}


/* =========================================================
   INITIALIZE
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


        const from =
            fromDate.value;

        const to =
            toDate.value;


        if (!from || !to) {
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


        loadReport();

    }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadReport();