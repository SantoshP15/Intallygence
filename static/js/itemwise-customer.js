/* =========================================================
   ITEMWISE-CUSTOMER REPORT
   ========================================================= */

let currentReport = null;

let currentSort = {
    column: "item",
    monthIndex: null,
    metric: null,
    direction: "asc"
};


/* =========================================================
   DATE HELPERS
   ========================================================= */

function getDefaultPeriod() {

    const today = new Date();

    const fiscalStartYear =
        today.getMonth() >= 3
            ? today.getFullYear()
            : today.getFullYear() - 1;

    return {
        from: `${fiscalStartYear}-04-01`,
        to: `${fiscalStartYear + 1}-03-31`
    };
}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(value) {

    const number = Number(value) || 0;

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* =========================================================
   FORMAT PERCENTAGE
   ========================================================= */

function formatPercent(value) {

    const number = Number(value) || 0;

    return `${number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}%`;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/* =========================================================
   POPULATE ITEM DROPDOWN
   ========================================================= */

function populateItemDropdown(items, selectedItem = "") {

    const fromDate =
    document.getElementById(
        "fromDate"
    );


    const toDate =
    document.getElementById(
        "toDate"
    );


    const itemSelect =
    document.getElementById(
        "itemSelect"
    );

    if (!itemSelect) {
        return;
    }

    itemSelect.innerHTML = `
        <option value="">All Items</option>
    `;

    if (!Array.isArray(items)) {
        return;
    }

    items.forEach(item => {

        const value = String(item || "").trim();

        if (!value) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = value;

        itemSelect.appendChild(option);
    });

    itemSelect.value = selectedItem || "";
}

/* =========================================================
   3-CLICK SORTING
   =========================================================

   1st click = ASC
   2nd click = DESC
   3rd click = ORIGINAL
   4th click = ASC
   */

function changeSort(
    column,
    monthIndex = null,
    metric = null
) {

    const sameColumn =
        currentSort.column === column &&
        currentSort.monthIndex === monthIndex &&
        currentSort.metric === metric;


    /*
     * New column
     * First click = ASC
     */
    if (!sameColumn) {

        currentSort = {
            column: column,
            monthIndex: monthIndex,
            metric: metric,
            direction: "asc"
        };
    }


    /*
     * ASC → DESC
     */
    else if (currentSort.direction === "asc") {

        currentSort.direction = "desc";
    }


    /*
     * DESC → ORIGINAL
     */
    else if (currentSort.direction === "desc") {

        currentSort.direction = "none";
    }


    /*
     * ORIGINAL → ASC
     */
    else if (currentSort.direction === "none") {

        currentSort.direction = "asc";
    }


    renderReport(currentReport);
}


/* =========================================================
   SORT ROWS
   ========================================================= */

function sortRows(rows) {

    /*
     * No sorting.
     * Restore original API order.
     */
    if (currentSort.direction === "none") {

        return [...rows];
    }


    const sorted = [...rows];


    sorted.sort((a, b) => {

        let valueA;
        let valueB;


        /* =================================================
           ITEM
           ================================================= */

        if (currentSort.column === "item") {

            valueA =
                String(a.item || "").toLowerCase();

            valueB =
                String(b.item || "").toLowerCase();


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
           CUSTOMER
           ================================================= */

        if (currentSort.column === "customer") {

            valueA =
                String(a.customer || "").toLowerCase();

            valueB =
                String(b.customer || "").toLowerCase();


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

        if (currentSort.column === "total") {

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
                Number(a.total_percent) || 0;

            valueB =
                Number(b.total_percent) || 0;
        }


        /* =================================================
           MONTH VALUES
           ================================================= */

        else if (currentSort.column === "month") {

            const monthA =
                a.months?.[currentSort.monthIndex] || {};

            const monthB =
                b.months?.[currentSort.monthIndex] || {};


            if (currentSort.metric === "sales") {

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

            else if (
                currentSort.metric === "running_percent"
            ) {

                valueA =
                    Number(monthA.running_percent) || 0;

                valueB =
                    Number(monthB.running_percent) || 0;
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


        /*
         * Calculate total sales for this month
         */
        rows.forEach(row => {

            monthTotal +=
                Number(
                    row.months?.[monthIndex]?.sales
                ) || 0;
        });


        let runningSales = 0;


        /*
         * Running percentage follows
         * the currently displayed order.
         */
        rows.forEach(row => {

            const month =
                row.months?.[monthIndex];


            if (!month) {
                return;
            }


            runningSales +=
                Number(month.sales) || 0;


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

/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport(
    fromDate,
    toDate,
    selectedItem = ""
) {

    const status =
        document.getElementById(
            "reportStatus"
        );

    const tableWrap =
        document.getElementById(
            "tableWrap"
        );

    const applyButton =
        document.getElementById(
            "applyPeriodBtn"
        );


    status.hidden = false;

    status.className =
        "report-status";

    status.textContent =
        "Loading itemwise-customer sales…";


    tableWrap.hidden = true;

    tableWrap.innerHTML = "";


    if (applyButton) {
        applyButton.disabled = true;
    }


    try {

        /* -------------------------------------------------
           BUILD API URL
           ------------------------------------------------- */

        const params = new URLSearchParams();

        params.set("from", fromDate);
        params.set("to", toDate);

        if (selectedItem) {
            params.set(
                "item",
                selectedItem
            );
        }


        const response = await fetch(
            `/api/itemwise-customer?${params.toString()}`,
            {
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        let data;


        try {

            data = await response.json();

        }
        catch {

            throw new Error(
                "The server returned an invalid response."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load itemwise-customer report."
            );
        }


        /* -------------------------------------------------
           POPULATE ITEM DROPDOWN
           ------------------------------------------------- */

        populateItemDropdown(
            data.items || [],
            selectedItem
        );


        /* -------------------------------------------------
           STORE REPORT
           ------------------------------------------------- */

        currentReport = data;


        /* -------------------------------------------------
           INITIAL SORT
           Item A → Z
           ------------------------------------------------- */

        currentSort = {
            column: "item",
            monthIndex: null,
            metric: null,
            direction: "asc"
        };


        renderReport(data);

    }
    catch (error) {

        console.error(
            "ITEMWISE-CUSTOMER REPORT ERROR:",
            error
        );


        status.hidden = false;

        status.className =
            "report-status error";


        status.textContent =
            error.message ||
            "Unable to load the report.";


        tableWrap.hidden = true;

    }
    finally {

        if (applyButton) {
            applyButton.disabled = false;
        }

    }
}


/* =========================================================
   RENDER REPORT
   ========================================================= */

function renderReport(report) {

    const status =
        document.getElementById(
            "reportStatus"
        );


    const tableWrap =
        document.getElementById(
            "tableWrap"
        );


    if (
        !report ||
        !Array.isArray(report.rows)
    ) {

        status.hidden = false;

        status.className =
            "report-status error";

        status.textContent =
            "No report data available.";

        tableWrap.hidden = true;

        return;
    }


    if (!report.rows.length) {

        status.hidden = false;

        status.className =
            "report-status";


        status.textContent =
            "No itemwise-customer sales found for the selected period.";


        tableWrap.innerHTML = `
            <div class="empty-state">
                No data available for the selected period.
            </div>
        `;


        tableWrap.hidden = false;

        return;
    }


    status.hidden = true;


    /*
     * Never modify currentReport.rows directly.
     */
    const rows =
        sortRows(report.rows);


    /*
     * Running percentage must follow
     * the displayed order.
     */
    recalculateRunningPercent(rows);


    const months =
        Array.isArray(report.months)
            ? report.months
            : [];


    /* =====================================================
       MONTH HEADER
       ===================================================== */

    const monthHeaders =
        months
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


    /* =====================================================
       SUB HEADERS
       ===================================================== */

    const subHeaders =
        months
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
                    class="item-column sortable-header"
                    onclick="changeSort('item')"
                >
                    Item
                </th>


                <th
                    rowspan="2"
                    class="customer-column sortable-header"
                    onclick="changeSort('customer')"
                >
                    Customer
                </th>


                ${monthHeaders}


                <th
                    rowspan="2"
                    class="sortable-header"
                    onclick="changeSort('total')"
                >
                    Total Sales
                </th>


                <th
                    rowspan="2"
                    class="sortable-header"
                    onclick="changeSort('total_percent')"
                >
                    Total %
                </th>

            </tr>


            <tr>

                ${subHeaders}

            </tr>

        </thead>
    `;


    /* =====================================================
       TABLE BODY
       ===================================================== */

    let previousItem = null;


    const bodyRows =
        rows
            .map((row, rowIndex) => {

                const item =
                    String(
                        row.item ||
                        "Unspecified item"
                    ).trim();


                const customer =
                    String(
                        row.customer ||
                        "Unspecified customer"
                    ).trim();


                const isNewItem =
                    previousItem !== item;


                previousItem = item;


                /* -----------------------------------------
                   MONTH CELLS
                   ----------------------------------------- */

                const monthCells =
                    months
                        .map((month, monthIndex) => {

                            const monthData =
                                row.months?.[
                                    monthIndex
                                ] || {};


                            return `

                                <td>
                                    ${formatNumber(
                                        monthData.sales
                                    )}
                                </td>


                                <td>
                                    ${formatPercent(
                                        monthData.percent
                                    )}
                                </td>


                                <td class="running">
                                    ${formatPercent(
                                        monthData.running_percent
                                    )}
                                </td>

                            `;
                        })
                        .join("");


                return `

                    <tr
                        class="${
                            isNewItem
                                ? "item-group-start"
                                : ""
                        }"
                        data-row-index="${rowIndex}"
                    >

                        <td
                            class="item-column"
                            title="${escapeHtml(item)}"
                        >
                            ${escapeHtml(item)}
                        </td>


                        <td
                            class="customer-column"
                            title="${escapeHtml(customer)}"
                        >
                            ${escapeHtml(customer)}
                        </td>


                        ${monthCells}


                        <td class="total">
                            ${formatNumber(row.total)}
                        </td>


                        <td class="total">
                            ${formatPercent(
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

    const monthTotals =
        months
            .map((month, monthIndex) => {

                let totalSales = 0;


                rows.forEach(row => {

                    totalSales +=
                        Number(
                            row.months?.[
                                monthIndex
                            ]?.sales
                        ) || 0;
                });


                return `

                    <td>
                        ${formatNumber(totalSales)}
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


    const grandTotal =
        Number(report.grand_total) ||
        rows.reduce(
            (sum, row) =>
                sum +
                (Number(row.total) || 0),
            0
        );


    const grandTotalRow = `

        <tfoot>

            <tr>

                <td
                    class="item-column"
                    colspan="2"
                >
                    Grand Total
                </td>


                ${monthTotals}


                <td>
                    ${formatNumber(grandTotal)}
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

        <table class="itemwise-customer-table">

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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const periodForm =
            document.getElementById(
                "periodForm"
            );


        const fromDate =
            document.getElementById(
                "fromDate"
            );


        const toDate =
            document.getElementById(
                "toDate"
            );


        /* ---------------------------------------------
           Default financial year
           --------------------------------------------- */

        const defaultPeriod =
            getDefaultPeriod();


        fromDate.value =
            defaultPeriod.from;


        toDate.value =
            defaultPeriod.to;


        /* ---------------------------------------------
           Initial report
           --------------------------------------------- */

        loadReport(
            defaultPeriod.from,
            defaultPeriod.to,
            ""
        );


        /* ---------------------------------------------
           Apply period
           --------------------------------------------- */

        periodForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const from =
                    fromDate.value;


                const to =
                    toDate.value;

                const selectedItem =
                    itemSelect
                        ? itemSelect.value
                        : "";


                if (!from || !to) {
                    return;
                }


                if (from > to) {

                    const status =
                        document.getElementById(
                            "reportStatus"
                        );


                    status.hidden = false;

                    status.className =
                        "report-status error";


                    status.textContent =
                        "The start date must be before the end date.";


                    return;
                }


                loadReport(
                    from,
                    to,
                    selectedItem
                );
            }
        );

    }
);