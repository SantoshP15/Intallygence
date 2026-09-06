document.addEventListener("DOMContentLoaded", () => {

    const periodForm = document.getElementById("periodForm");
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const applyPeriodBtn = document.getElementById("applyPeriodBtn");
    const reportStatus = document.getElementById("reportStatus");
    const tableWrap = document.getElementById("tableWrap");

    let reportData = null;

    /*
     * Default order:
     * Customer A → Z
     *
     * Sort cycle:
     * ASC → DESC → ORIGINAL → ASC
     */
    let currentSort = {
        column: "customer",
        direction: "asc"
    };


    /* =========================================
       HELPERS
    ========================================== */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatAmount(value) {

        const number = Number(value || 0);

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }


    function formatPercent(value) {

        const number = Number(value || 0);

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + "%";
    }


    function normalizeText(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase();
    }


    function compareValues(a, b, direction) {

        const multiplier =
            direction === "asc" ? 1 : -1;

        if (
            typeof a === "string" ||
            typeof b === "string"
        ) {

            return (
                normalizeText(a).localeCompare(
                    normalizeText(b),
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                )
            ) * multiplier;
        }


        const numberA = Number(a || 0);
        const numberB = Number(b || 0);

        if (numberA < numberB) {
            return -1 * multiplier;
        }

        if (numberA > numberB) {
            return 1 * multiplier;
        }

        return 0;
    }


    /* =========================================
       SORT CYCLE
    ========================================== */

    function cycleSort(column) {

        const sameColumn =
            currentSort.column === column;


        if (!sameColumn) {

            currentSort = {
                column: column,
                direction: "asc"
            };

        } else if (
            currentSort.direction === "asc"
        ) {

            currentSort.direction = "desc";

        } else if (
            currentSort.direction === "desc"
        ) {

            currentSort.direction = "none";

        } else {

            currentSort.direction = "asc";
        }


        renderTable();
    }


    /* =========================================
       SORT ROWS
    ========================================== */

    function sortRows(rows) {

        const sortedRows = [...rows];


        /*
         * "none" means restore the original
         * order supplied by the API.
         */
        if (
            currentSort.direction === "none" ||
            !currentSort.column
        ) {
            return sortedRows;
        }


        sortedRows.sort((a, b) => {

            let valueA;
            let valueB;


            switch (currentSort.column) {

                case "customer":

                    valueA = a.customer;
                    valueB = b.customer;

                    break;


                case "previous":

                    valueA = a.previous;
                    valueB = b.previous;

                    break;


                case "current":

                    valueA = a.current;
                    valueB = b.current;

                    break;


                case "growth":

                    valueA = a.growth;
                    valueB = b.growth;

                    break;


                case "growth_percent":

                    valueA = a.growth_percent;
                    valueB = b.growth_percent;

                    break;


                default:

                    return 0;
            }


            return compareValues(
                valueA,
                valueB,
                currentSort.direction
            );
        });


        return sortedRows;
    }


    /* =========================================
       SORTABLE HEADER
    ========================================== */

    function createSortableHeader(
        label,
        column
    ) {

        const th =
            document.createElement("th");

        th.className =
            "sortable-header";

        th.textContent = label;


        th.addEventListener(
            "click",
            () => {

                cycleSort(column);
            }
        );


        return th;
    }


    /* =========================================
       GROWTH CLASS
    ========================================== */

    function getGrowthClass(value) {

        const number = Number(value || 0);

        if (number > 0) {
            return "growth-positive";
        }

        if (number < 0) {
            return "growth-negative";
        }

        return "growth-neutral";
    }


    /* =========================================
       GROWTH DISPLAY
    ========================================== */

    function formatGrowth(value) {

        const number = Number(value || 0);

        if (number > 0) {
            return "+" + formatAmount(number);
        }

        return formatAmount(number);
    }


    function formatGrowthPercent(value) {

        const number = Number(value || 0);

        if (number > 0) {
            return "+" + formatPercent(number);
        }

        return formatPercent(number);
    }


    /* =========================================
       RENDER TABLE
    ========================================== */

    function renderTable() {

        if (!reportData) {
            return;
        }


        /*
         * No data
         */
        if (
            !reportData.rows ||
            reportData.rows.length === 0
        ) {

            tableWrap.innerHTML = `
                <div class="empty-report">
                    No customer sales data found
                    for the selected period.
                </div>
            `;

            /*
             * IMPORTANT:
             * Show the table wrapper.
             */
            tableWrap.hidden = false;

            return;
        }


        const rows =
            sortRows(reportData.rows);


        const table =
            document.createElement("table");

        table.className =
            "customer-growth-table";


        /* =====================================
           THEAD
        ===================================== */

        const thead =
            document.createElement("thead");

        const headerRow =
            document.createElement("tr");


        headerRow.appendChild(
            createSortableHeader(
                "Customer",
                "customer"
            )
        );


        headerRow.appendChild(
            createSortableHeader(
                reportData.previous_label ||
                "Previous Year",
                "previous"
            )
        );


        headerRow.appendChild(
            createSortableHeader(
                reportData.current_label ||
                "Current Year",
                "current"
            )
        );


        headerRow.appendChild(
            createSortableHeader(
                "Growth",
                "growth"
            )
        );


        headerRow.appendChild(
            createSortableHeader(
                "Growth %",
                "growth_percent"
            )
        );


        thead.appendChild(headerRow);

        table.appendChild(thead);


        /* =====================================
           TBODY
        ===================================== */

        const tbody =
            document.createElement("tbody");


        rows.forEach(row => {

            const tr =
                document.createElement("tr");


            /* Customer */

            const customerTd =
                document.createElement("td");

            customerTd.textContent =
                row.customer ||
                "Unspecified customer";

            tr.appendChild(customerTd);


            /* Previous Year */

            const previousTd =
                document.createElement("td");

            previousTd.className =
                "number-cell";

            previousTd.textContent =
                formatAmount(row.previous);

            tr.appendChild(previousTd);


            /* Current Year */

            const currentTd =
                document.createElement("td");

            currentTd.className =
                "number-cell";

            currentTd.textContent =
                formatAmount(row.current);

            tr.appendChild(currentTd);


            /* Growth */

            const growthTd =
                document.createElement("td");

            growthTd.className =
                `number-cell ${getGrowthClass(row.growth)}`;

            growthTd.textContent =
                formatGrowth(row.growth);

            tr.appendChild(growthTd);


            /* Growth % */

            const growthPercentTd =
                document.createElement("td");

            growthPercentTd.className =
                `percent-cell ${getGrowthClass(row.growth_percent)}`;


            /*
             * If previous year sales = 0
             * and current year > 0,
             * backend can return "New".
             */
            if (
                row.status === "new"
            ) {

                growthPercentTd.textContent =
                    "New";

                growthPercentTd.classList.add(
                    "new-customer"
                );

            } else {

                growthPercentTd.textContent =
                    formatGrowthPercent(
                        row.growth_percent
                    );
            }


            tr.appendChild(growthPercentTd);


            tbody.appendChild(tr);
        });


        table.appendChild(tbody);


        /* =====================================
           TFOOT
        ===================================== */

        const tfoot =
            document.createElement("tfoot");

        const totalRow =
            document.createElement("tr");


        /* Label */

        const totalLabel =
            document.createElement("td");

        totalLabel.textContent =
            "Grand Total";

        totalRow.appendChild(
            totalLabel
        );


        /* Previous Total */

        const previousTotalTd =
            document.createElement("td");

        previousTotalTd.className =
            "number-cell";

        previousTotalTd.textContent =
            formatAmount(
                reportData.previous_total
            );

        totalRow.appendChild(
            previousTotalTd
        );


        /* Current Total */

        const currentTotalTd =
            document.createElement("td");

        currentTotalTd.className =
            "number-cell";

        currentTotalTd.textContent =
            formatAmount(
                reportData.current_total
            );

        totalRow.appendChild(
            currentTotalTd
        );


        /* Growth Total */

        const totalGrowth =
            Number(
                reportData.growth_total || 0
            );


        const growthTotalTd =
            document.createElement("td");

        growthTotalTd.className =
            `number-cell ${getGrowthClass(totalGrowth)}`;

        growthTotalTd.textContent =
            formatGrowth(totalGrowth);

        totalRow.appendChild(
            growthTotalTd
        );


        /* Growth % Total */

        const totalGrowthPercent =
            Number(
                reportData.growth_percent_total || 0
            );


        const growthPercentTotalTd =
            document.createElement("td");

        growthPercentTotalTd.className =
            `percent-cell ${getGrowthClass(totalGrowthPercent)}`;


        if (
            Number(reportData.previous_total || 0) === 0 &&
            Number(reportData.current_total || 0) > 0
        ) {

            growthPercentTotalTd.textContent =
                "New";

        } else {

            growthPercentTotalTd.textContent =
                formatGrowthPercent(
                    totalGrowthPercent
                );
        }


        totalRow.appendChild(
            growthPercentTotalTd
        );


        tfoot.appendChild(totalRow);

        table.appendChild(tfoot);


        /* =====================================
           DISPLAY
        ===================================== */

        tableWrap.innerHTML = "";

        tableWrap.appendChild(table);

        /*
         * IMPORTANT:
         * The HTML starts tableWrap with
         * the "hidden" attribute.
         * Remove it after the table is ready.
         */
        tableWrap.hidden = false;
    }


    /* =========================================
       LOAD REPORT
    ========================================== */

    async function loadReport() {

        reportStatus.hidden = false;

        reportStatus.textContent =
            "Loading customer growth…";


        /*
         * Hide the previous table while
         * loading a new report.
         */
        tableWrap.hidden = false;

        tableWrap.innerHTML = `
            <div class="report-loading">
                Loading report…
            </div>
        `;


        applyPeriodBtn.disabled = true;


        /*
         * Reset sorting whenever the period
         * is changed.
         */
        currentSort = {
            column: "customer",
            direction: "asc"
        };


        try {

            const params =
                new URLSearchParams();


            if (fromDate.value) {

                params.set(
                    "from",
                    fromDate.value
                );
            }


            if (toDate.value) {

                params.set(
                    "to",
                    toDate.value
                );
            }


            const response =
                await fetch(
                    `/api/customer-growth?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to load customer growth report."
                );
            }


            reportData = data;


            /*
             * Use dates returned by backend
             * when the page has no dates yet.
             */
            if (
                data.period &&
                data.period.from &&
                !fromDate.value
            ) {

                fromDate.value =
                    data.period.from;
            }


            if (
                data.period &&
                data.period.to &&
                !toDate.value
            ) {

                toDate.value =
                    data.period.to;
            }


            reportStatus.textContent =
                `${data.rows?.length || 0} customers found`;


            renderTable();


        } catch (error) {

            console.error(
                "Customer Growth Error:",
                error
            );


            reportStatus.textContent =
                "Unable to load customer growth report.";


            tableWrap.innerHTML = `
                <div class="report-error">
                    ${escapeHtml(error.message)}
                </div>
            `;

            /*
             * IMPORTANT:
             * Show the error container.
             */
            tableWrap.hidden = false;

        } finally {

            applyPeriodBtn.disabled = false;
        }
    }


    /* =========================================
       PERIOD FORM
    ========================================== */

    periodForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            loadReport();
        }
    );


    /* =========================================
       INITIAL LOAD
    ========================================== */

    loadReport();

});