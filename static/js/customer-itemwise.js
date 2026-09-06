/* =========================================================
   CUSTOMER-ITEMWISE REPORT
   ========================================================= */

let currentReport = null;

let currentSort = {
    column: "customer",
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
   FORMATTERS
   ========================================================= */

function formatNumber(value) {

    const number = Number(value) || 0;

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


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
   3-CLICK SORTING
   =========================================================

   1st click  = ASC
   2nd click  = DESC
   3rd click  = ORIGINAL
   4th click  = ASC
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


    if (!sameColumn) {

        currentSort = {
            column: column,
            monthIndex: monthIndex,
            metric: metric,
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


    renderReport(currentReport);
}


/* =========================================================
   SORT ROWS
   ========================================================= */

function sortRows(rows) {

    if (
        currentSort.direction === "none"
    ) {

        return [...rows];
    }


    const sorted = [...rows];


    sorted.sort((a, b) => {

        let valueA;
        let valueB;


        /* ---------------------------------------------
           CUSTOMER
        --------------------------------------------- */

        if (
            currentSort.column === "customer"
        ) {

            valueA =
                String(a.customer || "")
                    .toLowerCase();

            valueB =
                String(b.customer || "")
                    .toLowerCase();


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


        /* ---------------------------------------------
           ITEM
        --------------------------------------------- */

        if (
            currentSort.column === "item"
        ) {

            valueA =
                String(a.item || "")
                    .toLowerCase();

            valueB =
                String(b.item || "")
                    .toLowerCase();


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


        /* ---------------------------------------------
           TOTAL SALES
        --------------------------------------------- */

        if (
            currentSort.column === "total"
        ) {

            valueA =
                Number(a.total) || 0;

            valueB =
                Number(b.total) || 0;
        }


        /* ---------------------------------------------
           TOTAL %
        --------------------------------------------- */

        else if (
            currentSort.column === "total_percent"
        ) {

            valueA =
                Number(a.total_percent) || 0;

            valueB =
                Number(b.total_percent) || 0;
        }


        /* ---------------------------------------------
           MONTH VALUE
        --------------------------------------------- */

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


        /* ---------------------------------------------
           NUMERIC COMPARISON
        --------------------------------------------- */

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


        rows.forEach(row => {

            const month =
                row.months?.[monthIndex];

            monthTotal +=
                Number(month?.sales) || 0;
        });


        let runningSales = 0;


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
                    ? (runningSales / monthTotal) * 100
                    : 0;
        });
    }
}


/* =========================================================
   CUSTOMER DROPDOWN
   ========================================================= */

function populateCustomerDropdown(customers) {

    const customerSelect =
        document.getElementById(
            "customerSelect"
        );


    if (!customerSelect) {
        return;
    }


    /*
     * Remember currently selected customer.
     */
    const selectedCustomer =
        customerSelect.value || "";


    customerSelect.innerHTML = "";


    /*
     * All Customers
     */
    const allOption =
        document.createElement("option");

    allOption.value = "";

    allOption.textContent =
        "All Customers";

    customerSelect.appendChild(
        allOption
    );


    /*
     * Add customers
     */
    if (Array.isArray(customers)) {

        customers.forEach(customer => {

            const value =
                String(customer || "").trim();


            if (!value) {
                return;
            }


            const option =
                document.createElement("option");

            option.value = value;

            option.textContent = value;


            customerSelect.appendChild(
                option
            );
        });
    }


    /*
     * Restore selection if possible.
     */
    if (
        selectedCustomer &&
        Array.from(
            customerSelect.options
        ).some(
            option =>
                option.value === selectedCustomer
        )
    ) {

        customerSelect.value =
            selectedCustomer;

    } else {

        customerSelect.value = "";
    }
}


/* =========================================================
   LOAD CUSTOMERS
   ========================================================= */

async function loadCustomers() {

    const customerSelect =
        document.getElementById(
            "customerSelect"
        );


    if (!customerSelect) {
        return;
    }


    try {

        customerSelect.disabled = true;


        /*
         * Get customer list without applying
         * a customer filter.
         *
         * We use the selected report period.
         */
        const fromDate =
            document.getElementById(
                "fromDate"
            )?.value;


        const toDate =
            document.getElementById(
                "toDate"
            )?.value;


        const params =
            new URLSearchParams();


        if (fromDate) {

            params.set(
                "from",
                fromDate
            );
        }


        if (toDate) {

            params.set(
                "to",
                toDate
            );
        }


        const response =
            await fetch(
                `/api/customer-itemwise?${params.toString()}`,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load customers."
            );
        }


        populateCustomerDropdown(
            data.customers || []
        );


    } catch (error) {

        console.error(
            "CUSTOMER LIST ERROR:",
            error
        );

    } finally {

        customerSelect.disabled = false;
    }
}


/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport(
    fromDate,
    toDate,
    customer = ""
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
        "Loading customer-itemwise sales…";


    tableWrap.hidden = true;

    tableWrap.innerHTML = "";


    if (applyButton) {
        applyButton.disabled = true;
    }


    try {

        const params =
            new URLSearchParams();


        params.set(
            "from",
            fromDate
        );


        params.set(
            "to",
            toDate
        );


        /*
         * Only send customer when
         * a specific customer is selected.
         */
        if (customer) {

            params.set(
                "customer",
                customer
            );
        }


        const response =
            await fetch(
                `/api/customer-itemwise?${params.toString()}`,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "The server returned an invalid response."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load customer-itemwise report."
            );
        }


        /*
         * Save report.
         */
        currentReport = data;


        /*
         * Populate customer dropdown if
         * API returned the customer list.
         */
        if (
            Array.isArray(data.customers)
        ) {

            populateCustomerDropdown(
                data.customers
            );
        }


        /*
         * Keep selected customer.
         */
        const customerSelect =
            document.getElementById(
                "customerSelect"
            );


        if (customerSelect) {

            customerSelect.value =
                customer || "";
        }


        /*
         * Reset sorting whenever a new
         * period/customer is loaded.
         */
        currentSort = {

            column: "customer",

            monthIndex: null,

            metric: null,

            direction: "asc"
        };


        renderReport(data);

    }


    catch (error) {

        console.error(
            "CUSTOMER-ITEMWISE REPORT ERROR:",
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
            "No customer-itemwise sales found for the selected period.";


        tableWrap.innerHTML =
            `<div class="empty-state">
                No data available for the selected period.
             </div>`;


        tableWrap.hidden = false;

        return;
    }


    status.hidden = true;


    /*
     * Clone rows before sorting.
     */
    const rows =
        sortRows(report.rows);


    /*
     * Running % depends on row order.
     */
    recalculateRunningPercent(rows);


    const months =
        Array.isArray(report.months)
            ? report.months
            : [];


    /* =====================================================
       HEADER
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


    const subHeaders =
        months
            .map(
                (month, monthIndex) => {

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
                }
            )
            .join("");


    /* =====================================================
       TABLE HEADER
    ===================================================== */

    const tableHeader = `
        <thead>

            <tr>

                <th
                    rowspan="2"
                    class="customer-column sortable-header"
                    onclick="changeSort('customer')"
                >
                    Customer
                </th>

                <th
                    rowspan="2"
                    class="item-column sortable-header"
                    onclick="changeSort('item')"
                >
                    Item
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

    let previousCustomer = null;


    const bodyRows =
        rows
            .map(
                (row, rowIndex) => {

                    const customer =
                        String(
                            row.customer ||
                            "Unspecified customer"
                        ).trim();


                    const item =
                        String(
                            row.item ||
                            "Unspecified item"
                        ).trim();


                    const isNewCustomer =
                        previousCustomer !==
                        customer;


                    previousCustomer =
                        customer;


                    const monthCells =
                        months
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
                                }
                            )
                            .join("");


                    return `
                        <tr
                            class="${
                                isNewCustomer
                                    ? "customer-group-start"
                                    : ""
                            }"
                            data-row-index="${rowIndex}"
                        >

                            <td
                                class="customer-column"
                                title="${escapeHtml(customer)}"
                            >
                                ${escapeHtml(customer)}
                            </td>

                            <td
                                class="item-column"
                                title="${escapeHtml(item)}"
                            >
                                ${escapeHtml(item)}
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
                }
            )
            .join("");


    /* =====================================================
       GRAND TOTAL
    ===================================================== */

    const monthTotals =
        months
            .map(
                (month, monthIndex) => {

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
                            ${formatNumber(
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
        Number(report.grand_total) ||
        rows.reduce(
            (
                sum,
                row
            ) =>
                sum +
                (
                    Number(row.total) ||
                    0
                ),
            0
        );


    const grandTotalRow = `
        <tfoot>

            <tr>

                <td
                    class="customer-column"
                    colspan="2"
                >
                    Grand Total
                </td>

                ${monthTotals}

                <td>
                    ${formatNumber(
                        grandTotal
                    )}
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
        <table class="customer-itemwise-table">

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


        const customerSelect =
            document.getElementById(
                "customerSelect"
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
           Load initial report
        --------------------------------------------- */

        loadReport(
            defaultPeriod.from,
            defaultPeriod.to,
            ""
        );


        /* ---------------------------------------------
           Apply period + customer
        --------------------------------------------- */

        periodForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const from =
                    fromDate.value;


                const to =
                    toDate.value;


                const customer =
                    customerSelect
                        ? customerSelect.value
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
                    customer
                );
            }
        );


        /* ---------------------------------------------
           Customer selection
           
           We don't immediately reload.
           User selects customer and clicks
           Apply period.
        --------------------------------------------- */

        if (customerSelect) {

            customerSelect.addEventListener(
                "change",
                () => {

                    /*
                     * No automatic API call here.
                     * The user applies both filters
                     * together using Apply period.
                     */
                }
            );
        }

    }
);