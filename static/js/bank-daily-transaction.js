/* =========================================================
   BANK DAILY TRANSACTION
   Excel / Tally style daily report
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
    ====================================================== */

    let reportData = null;


    const state = {

        expandedRows:
            new Set()

    };


    /* =====================================================
       DOM
    ====================================================== */

    const periodForm =
        document.getElementById(
            "periodForm"
        );


    const groupSelect =
        document.getElementById(
            "groupSelect"
        );


    const monthSelect =
        document.getElementById(
            "monthSelect"
        );


    const partyGroupSelect =
        document.getElementById(
            "partyGroupSelect"
        );


    const applyBtn =
        document.getElementById(
            "applyBtn"
        );


    const reportStatus =
        document.getElementById(
            "reportStatus"
        );


    const tableWrap =
        document.getElementById(
            "tableWrap"
        );


    const summaryToolbar =
        document.getElementById(
            "summaryToolbar"
        );


    const expandAllBtn =
        document.getElementById(
            "expandAllBtn"
        );


    const collapseAllBtn =
        document.getElementById(
            "collapseAllBtn"
        );


    const periodLabel =
        document.getElementById(
            "periodLabel"
        );


    /* =====================================================
       INIT
    ====================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {

        populateMonthSelect();

        setCurrentMonth();

        await loadReport();

    }


    /* =====================================================
       MONTH SELECT
    ====================================================== */

    function populateMonthSelect() {

        if (!monthSelect) {
            return;
        }


        monthSelect.innerHTML = "";


        const months = [

            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"

        ];


        const now =
            new Date();


        const currentYear =
            now.getFullYear();


        /*
         * Financial year order:
         *
         * Apr → Mar
         */

        const financialMonths = [

            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            0,
            1,
            2

        ];


        financialMonths.forEach(
            monthIndex => {

                const year =
                    monthIndex >= 3
                        ? currentYear
                        : currentYear + 1;


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    `${year}-${String(
                        monthIndex + 1
                    ).padStart(2, "0")}`;


                option.textContent =
                    `${months[monthIndex]}-${String(
                        year
                    ).slice(-2)}`;


                monthSelect.appendChild(
                    option
                );

            }
        );

    }


    /* =====================================================
       CURRENT MONTH
    ====================================================== */

    function setCurrentMonth() {

        if (!monthSelect) {
            return;
        }


        const now =
            new Date();


        const currentMonth =
            now.getMonth();


        const currentYear =
            now.getFullYear();


        const value =
            `${currentYear}-${String(
                currentMonth + 1
            ).padStart(2, "0")}`;


        /*
         * If current month is Jan-Mar,
         * it still exists in financial list.
         */

        const option =
            [...monthSelect.options]
                .find(
                    item =>
                        item.value === value
                );


        if (option) {

            monthSelect.value =
                value;

        } else {

            /*
             * Default to April of current
             * financial year.
             */

            monthSelect.selectedIndex =
                0;
        }

    }


    /* =====================================================
       FORM SUBMIT
    ====================================================== */

    periodForm?.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            state.expandedRows.clear();

            loadReport();

        }
    );


    /* =====================================================
       LOAD REPORT
    ====================================================== */

    async function loadReport() {

        setLoading(
            true
        );


        const params =
            new URLSearchParams();


        if (
            groupSelect &&
            groupSelect.value
        ) {

            params.set(
                "group",
                groupSelect.value
            );

        }


        if (
            monthSelect &&
            monthSelect.value
        ) {

            params.set(
                "month",
                monthSelect.value
            );

        }


        if (
            partyGroupSelect &&
            partyGroupSelect.value
        ) {

            params.set(
                "party_group",
                partyGroupSelect.value
            );

        }


        try {

            const response =
                await fetch(
                    `/api/bank-daily-transaction?${params.toString()}`,
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const text =
                await response.text();


            let data;


            try {

                data =
                    JSON.parse(text);

            } catch (error) {

                console.error(
                    "Invalid API response:",
                    text
                );

                throw new Error(
                    "Server returned an invalid response."
                );

            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to load Bank Daily Transaction."
                );

            }


            reportData =
                normalizeData(
                    data
                );


            console.log(
                "BANK DAILY TRANSACTION:",
                reportData
            );


            renderReport(
                reportData
            );


        } catch (error) {

            console.error(
                "Bank Daily Transaction:",
                error
            );


            reportData = null;


            if (tableWrap) {

                tableWrap.innerHTML =
                    "";

                tableWrap.hidden =
                    true;
            }


            if (summaryToolbar) {

                summaryToolbar.hidden =
                    true;
            }


            showStatus(
                error.message ||
                "Unable to load report.",
                true
            );


        } finally {

            setLoading(
                false
            );

        }

    }


    /* =====================================================
       NORMALIZE DATA
    ====================================================== */

    function normalizeData(data) {

        let days =
            Array.isArray(
                data.days
            )
                ? data.days
                : [];


        let voucherTypes =
            Array.isArray(
                data.voucher_types
            )
                ? data.voucher_types
                : [];


        let rows =
            Array.isArray(
                data.rows
            )
                ? data.rows
                : [];


        /*
         * Support camelCase too.
         */

        if (
            !voucherTypes.length &&
            Array.isArray(
                data.voucherTypes
            )
        ) {

            voucherTypes =
                data.voucherTypes;
        }


        return {

            days,

            voucher_types:
                voucherTypes,

            rows,

            grand_total:
                toNumber(
                    data.grand_total
                ),

            period:
                data.period || {
                    month:
                        monthSelect?.value ||
                        ""
                }

        };

    }


    /* =====================================================
       RENDER
    ====================================================== */

    function renderReport(
        data
    ) {

        if (!tableWrap) {
            return;
        }


        tableWrap.innerHTML =
            "";


        if (
            !data.rows.length
        ) {

            tableWrap.innerHTML = `
                <div class="bank-daily-empty">
                    No transactions found for the selected month.
                </div>
            `;


            tableWrap.hidden =
                false;


            if (summaryToolbar) {

                summaryToolbar.hidden =
                    true;
            }


            showStatus(
                "No transactions found."
            );


            return;
        }


        const table =
            buildTable(
                data
            );


        tableWrap.appendChild(
            table
        );


        tableWrap.hidden =
            false;


        if (summaryToolbar) {

            summaryToolbar.hidden =
                false;
        }


        if (periodLabel) {

            periodLabel.textContent =
                formatMonthPeriod(
                    data.period
                );
        }


        showStatus(
            `${data.rows.length} voucher type${
                data.rows.length === 1
                    ? ""
                    : "s"
            }`
        );

    }


    /* =====================================================
       BUILD TABLE
    ====================================================== */

    function buildTable(
        data
    ) {

        const table =
            document.createElement(
                "table"
            );


        table.className =
            "bank-daily-table";


        const thead =
            document.createElement(
                "thead"
            );


        const tbody =
            document.createElement(
                "tbody"
            );


        /* =================================================
           HEADER ROW 1
        ================================================= */

        const row1 =
            document.createElement(
                "tr"
            );


        const labelHeader =
            document.createElement(
                "th"
            );


        labelHeader.className =
            "row-label-column";


        labelHeader.rowSpan =
            2;


        labelHeader.textContent =
            "Row Labels";


        row1.appendChild(
            labelHeader
        );


        /*
         * Excel "Column Labels"
         */

        data.days.forEach(
            day => {

                const th =
                    document.createElement(
                        "th"
                    );


                th.className =
                    "day-column";


                th.textContent =
                    formatDayNumber(
                        day
                    );


                row1.appendChild(
                    th
                );

            }
        );


        const totalHeader =
            document.createElement(
                "th"
            );


        totalHeader.rowSpan =
            2;


        totalHeader.className =
            "day-column";


        totalHeader.textContent =
            "Grand Total";


        row1.appendChild(
            totalHeader
        );


        /* =================================================
           HEADER ROW 2
        ================================================= */

        const row2 =
            document.createElement(
                "tr"
            );


        data.days.forEach(
            day => {

                const th =
                    document.createElement(
                        "th"
                    );


                th.className =
                    "day-column";


                th.textContent =
                    getWeekday(
                        day
                    );


                row2.appendChild(
                    th
                );

            }
        );


        thead.appendChild(
            row1
        );


        thead.appendChild(
            row2
        );


        /* =================================================
           BODY
        ================================================= */

        data.rows.forEach(
            row => {

                appendVoucherRow(
                    tbody,
                    row,
                    data
                );

            }
        );


        /* =================================================
           GRAND TOTAL
        ================================================= */

        appendGrandTotal(
            tbody,
            data
        );


        table.appendChild(
            thead
        );


        table.appendChild(
            tbody
        );


        return table;

    }


    /* =====================================================
       VOUCHER ROW
    ====================================================== */

    function appendVoucherRow(
        tbody,
        row,
        data
    ) {

        const voucher =
            String(
                row.voucher_type ||
                row.voucher ||
                row.name ||
                "Unknown"
            );


        const tr =
            document.createElement(
                "tr"
            );


        tr.className =
            "voucher-row";


        /* =================================================
           LABEL
        ================================================= */

        const labelCell =
            document.createElement(
                "td"
            );


        labelCell.className =
            "row-label";


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "row-toggle";


        /*
         * Currently voucher rows are leaf
         * rows. Keep the button so the
         * report visually follows the
         * Excel/Tally hierarchy.
         */

        button.innerHTML =
            '<i class="fa-solid fa-plus"></i>';


        button.setAttribute(
            "aria-label",
            `Expand ${voucher}`
        );


        labelCell.appendChild(
            button
        );


        const text =
            document.createElement(
                "span"
            );


        text.textContent =
            voucher;


        labelCell.appendChild(
            text
        );


        tr.appendChild(
            labelCell
        );


        /* =================================================
           DAILY VALUES
        ================================================= */

        data.days.forEach(
            day => {

                const value =
                    getDayValue(
                        row,
                        day
                    );


                tr.appendChild(
                    createAmountCell(
                        value
                    )
                );

            }
        );


        /* =================================================
           TOTAL
        ================================================= */

        tr.appendChild(
            createAmountCell(
                getRowTotal(
                    row,
                    data
                )
            )
        );


        tbody.appendChild(
            tr
        );

    }


    /* =====================================================
       DAY VALUE
    ====================================================== */

    function getDayValue(
        row,
        day
    ) {

        const values =
            row.values ||
            row.daily ||
            row.data ||
            {};


        /*
         * Try direct key.
         */

        if (
            values[day] !== undefined
        ) {

            return toNumber(
                values[day]
            );
        }


        /*
         * Try string version.
         */

        const key =
            String(day);


        if (
            values[key] !== undefined
        ) {

            return toNumber(
                values[key]
            );
        }


        /*
         * Try zero-padded day.
         */

        const padded =
            String(day)
                .padStart(
                    2,
                    "0"
                );


        if (
            values[padded] !== undefined
        ) {

            return toNumber(
                values[padded]
            );
        }


        return 0;

    }


    /* =====================================================
       ROW TOTAL
    ====================================================== */

    function getRowTotal(
        row,
        data
    ) {

        if (
            row.total !== undefined
        ) {

            return toNumber(
                row.total
            );
        }


        return data.days.reduce(
            (
                total,
                day
            ) =>
                total +
                getDayValue(
                    row,
                    day
                ),
            0
        );

    }


    /* =====================================================
       GRAND TOTAL
    ====================================================== */

    function appendGrandTotal(
        tbody,
        data
    ) {

        const tr =
            document.createElement(
                "tr"
            );


        tr.className =
            "grand-total-row";


        const label =
            document.createElement(
                "td"
            );


        label.className =
            "row-label";


        label.textContent =
            "Grand Total";


        tr.appendChild(
            label
        );


        data.days.forEach(
            day => {

                let total =
                    0;


                data.rows.forEach(
                    row => {

                        total +=
                            getDayValue(
                                row,
                                day
                            );

                    }
                );


                tr.appendChild(
                    createAmountCell(
                        total
                    )
                );

            }
        );


        const grandTotal =
            data.grand_total ||
            data.rows.reduce(
                (
                    total,
                    row
                ) =>
                    total +
                    getRowTotal(
                        row,
                        data
                    ),
                0
            );


        tr.appendChild(
            createAmountCell(
                grandTotal
            )
        );


        tbody.appendChild(
            tr
        );

    }


    /* =====================================================
       AMOUNT CELL
    ====================================================== */

    function createAmountCell(
        value
    ) {

        const td =
            document.createElement(
                "td"
            );


        td.className =
            "amount";


        const number =
            toNumber(
                value
            );


        /*
         * Excel-style:
         * zero = "-"
         */

        if (
            Math.abs(number) <
            0.000001
        ) {

            td.textContent =
                "-";

            td.classList.add(
                "zero-value"
            );

            return td;
        }


        td.textContent =
            formatAmount(
                number
            );


        if (
            number < 0
        ) {

            td.classList.add(
                "negative"
            );
        }


        return td;

    }


    /* =====================================================
       FORMAT NUMBER
    ====================================================== */

    function formatAmount(
        value
    ) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        ).format(
            Number.isFinite(value)
                ? value
                : 0
        );

    }


    /* =====================================================
       DAY NUMBER
    ====================================================== */

    function formatDayNumber(
        value
    ) {

        /*
         * Backend may send:
         *
         * 01
         * 02
         *
         * or:
         *
         * 2026-04-01
         */

        const text =
            String(value);


        if (
            /^\d{1,2}$/.test(
                text
            )
        ) {

            return text.padStart(
                2,
                "0"
            );
        }


        const match =
            text.match(
                /-(\d{2})$/
            );


        if (match) {

            return match[1];
        }


        return text;

    }


    /* =====================================================
       WEEKDAY
    ====================================================== */

    function getWeekday(
        value
    ) {

        let date;


        /*
         * YYYY-MM-DD
         */

        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                String(value)
            )
        ) {

            const parts =
                String(value)
                    .split("-");


            date =
                new Date(
                    Number(parts[0]),
                    Number(parts[1]) - 1,
                    Number(parts[2])
                );

        } else {

            /*
             * If only day number was
             * returned, calculate it
             * using selected month.
             */

            const selected =
                monthSelect?.value;


            if (
                selected &&
                /^\d{4}-\d{2}$/.test(
                    selected
                )
            ) {

                const parts =
                    selected.split("-");


                const day =
                    Number(
                        String(value)
                            .replace(
                                /^0/,
                                ""
                            )
                    );


                date =
                    new Date(
                        Number(parts[0]),
                        Number(parts[1]) - 1,
                        day
                    );

            }

        }


        if (
            !date ||
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                weekday:
                    "short"
            }
        );

    }


    /* =====================================================
       MONTH LABEL
    ====================================================== */

    function formatMonthPeriod(
        period
    ) {

        const value =
            period?.month ||
            monthSelect?.value ||
            "";


        if (
            /^\d{4}-\d{2}$/.test(
                value
            )
        ) {

            const parts =
                value.split("-");


            const date =
                new Date(
                    Number(parts[0]),
                    Number(parts[1]) - 1,
                    1
                );


            return date.toLocaleDateString(
                "en-IN",
                {
                    month:
                        "short",

                    year:
                        "numeric"
                }
            );

        }


        return value;

    }


    /* =====================================================
       EXPAND ALL
    ====================================================== */

    expandAllBtn?.addEventListener(
        "click",
        function () {

            if (!reportData) {
                return;
            }


            /*
             * Reserved for hierarchical
             * expansion if transaction
             * details are added.
             */

            reportData.rows.forEach(
                row => {

                    state.expandedRows.add(
                        row.voucher_type ||
                        row.voucher ||
                        row.name
                    );

                }
            );


            renderReport(
                reportData
            );

        }
    );


    /* =====================================================
       COLLAPSE ALL
    ====================================================== */

    collapseAllBtn?.addEventListener(
        "click",
        function () {

            state.expandedRows.clear();


            if (reportData) {

                renderReport(
                    reportData
                );

            }

        }
    );


    /* =====================================================
       STATUS
    ====================================================== */

    function showStatus(
        message,
        isError = false
    ) {

        if (!reportStatus) {
            return;
        }


        reportStatus.textContent =
            message;


        reportStatus.classList.toggle(
            "error",
            isError
        );

    }


    /* =====================================================
       LOADING
    ====================================================== */

    function setLoading(
        loading
    ) {

        if (loading) {

            if (reportStatus) {

                reportStatus.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Loading bank transactions…';
            }


            if (tableWrap) {

                tableWrap.hidden =
                    true;
            }


            if (summaryToolbar) {

                summaryToolbar.hidden =
                    true;
            }


            if (applyBtn) {

                applyBtn.disabled =
                    true;
            }

        } else {

            if (applyBtn) {

                applyBtn.disabled =
                    false;
            }

        }

    }


    /* =====================================================
       NUMBER
    ====================================================== */

    function toNumber(
        value
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return 0;
        }


        if (
            typeof value === "number"
        ) {

            return Number.isFinite(
                value
            )
                ? value
                : 0;
        }


        const number =
            Number(
                String(value)
                    .replace(
                        /,/g,
                        ""
                    )
                    .replace(
                        /₹/g,
                        ""
                    )
                    .trim()
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }

})();