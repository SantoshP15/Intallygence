/* =========================================================
   BANK SUMMARY REPORT
   Cash & Bank → Bank Summary
========================================================= */

(function () {
    "use strict";

    /* =====================================================
       STATE
    ====================================================== */

    let reportData = null;

    const state = {
        expandedLedgers: new Set(),
        expandedParties: new Set()
    };


    /* =====================================================
       DOM
    ====================================================== */

    const periodForm =
        document.getElementById("periodForm");

    const partyGroupSelect =
        document.getElementById("partyGroupSelect");

    const groupSelect =
        document.getElementById("groupSelect");

    const fromDate =
        document.getElementById("fromDate");

    const toDate =
        document.getElementById("toDate");

    const applyPeriodBtn =
        document.getElementById("applyPeriodBtn");

    const reportStatus =
        document.getElementById("reportStatus");

    const tableWrap =
        document.getElementById("tableWrap");

    const summaryToolbar =
        document.getElementById("summaryToolbar");

    const expandAllBtn =
        document.getElementById("expandAllBtn");

    const collapseAllBtn =
        document.getElementById("collapseAllBtn");

    const periodLabel =
        document.getElementById("periodLabel");


    /* =====================================================
       INITIALIZE
    ====================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {

        setDefaultDates();

        await loadFilterOptions();

        await loadReport();
    }


    /* =====================================================
       DEFAULT DATES
    ====================================================== */

    function setDefaultDates() {

        if (!fromDate || !toDate) {
            return;
        }

        const now = new Date();

        const currentYear =
            now.getFullYear();

        /*
         * Financial year starts on 1 April.
         */

        const financialYearStart =
            now.getMonth() >= 3
                ? currentYear
                : currentYear - 1;

        if (!fromDate.value) {

            fromDate.value =
                `${financialYearStart}-04-01`;
        }

        if (!toDate.value) {

            const year =
                now.getFullYear();

            const month =
                String(
                    now.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    now.getDate()
                ).padStart(2, "0");

            toDate.value =
                `${year}-${month}-${day}`;
        }
    }


    /* =====================================================
       FILTER OPTIONS
    ====================================================== */

    async function loadFilterOptions() {

        /*
         * Your current backend may not have this endpoint.
         * Failure here must NOT stop the report.
         */

        try {

            const response =
                await fetch(
                    "/api/bank-summary/filters",
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            populateSelect(
                partyGroupSelect,
                data.party_groups ||
                data.partyGroups ||
                []
            );

            populateSelect(
                groupSelect,
                data.groups ||
                []
            );

        } catch (error) {

            console.warn(
                "Bank Summary filters unavailable:",
                error
            );
        }
    }


    /* =====================================================
       POPULATE SELECT
    ====================================================== */

    function populateSelect(
        select,
        values
    ) {

        if (
            !select ||
            !Array.isArray(values)
        ) {
            return;
        }

        const currentValue =
            select.value;

        const firstOption =
            select.options.length
                ? select.options[0].outerHTML
                : '<option value="">All</option>';

        select.innerHTML =
            firstOption;

        values.forEach(value => {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(value);

            option.textContent =
                String(value);

            select.appendChild(option);
        });

        if (
            currentValue &&
            [...select.options].some(
                option =>
                    option.value ===
                    currentValue
            )
        ) {

            select.value =
                currentValue;
        }
    }


    /* =====================================================
       FORM SUBMIT
    ====================================================== */

    periodForm?.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            if (!validateDates()) {
                return;
            }

            state.expandedLedgers.clear();

            state.expandedParties.clear();

            loadReport();
        }
    );


    /* =====================================================
       DATE VALIDATION
    ====================================================== */

    function validateDates() {

        if (!fromDate?.value) {

            showStatus(
                "Please select a From date.",
                true
            );

            fromDate?.focus();

            return false;
        }

        if (!toDate?.value) {

            showStatus(
                "Please select a To date.",
                true
            );

            toDate?.focus();

            return false;
        }

        if (
            fromDate.value >
            toDate.value
        ) {

            showStatus(
                "From date cannot be later than To date.",
                true
            );

            return false;
        }

        return true;
    }


    /* =====================================================
       LOAD REPORT
    ====================================================== */

    async function loadReport() {

        if (!validateDates()) {
            return;
        }

        setLoading(true);

        const params =
            new URLSearchParams();

        /*
         * IMPORTANT:
         * These names must match app.py.
         */

        params.set(
            "from",
            fromDate.value
        );

        params.set(
            "to",
            toDate.value
        );

        if (
            partyGroupSelect &&
            partyGroupSelect.value
        ) {

            params.set(
                "party_group",
                partyGroupSelect.value
            );
        }

        if (
            groupSelect &&
            groupSelect.value
        ) {

            params.set(
                "group",
                groupSelect.value
            );
        }

        try {

            const response =
                await fetch(
                    `/api/bank-summary?${params.toString()}`,
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
                    "Unable to load Bank Summary."
                );
            }

            reportData =
                normalizeReportData(data);

            console.log(
                "BANK SUMMARY API DATA:",
                reportData
            );

            renderReport(
                reportData
            );

        } catch (error) {

            console.error(
                "Bank Summary error:",
                error
            );

            reportData = null;

            if (tableWrap) {

                tableWrap.innerHTML = "";

                tableWrap.hidden = true;
            }

            if (summaryToolbar) {

                summaryToolbar.hidden = true;
            }

            showStatus(
                error.message ||
                "Unable to load Bank Summary.",
                true
            );

        } finally {

            setLoading(false);
        }
    }


    /* =====================================================
       NORMALIZE BACKEND RESPONSE
    ====================================================== */

    function normalizeReportData(data) {

        return {

            months:
                Array.isArray(data.months)
                    ? data.months
                    : [],

            voucher_types:
                Array.isArray(
                    data.voucher_types
                )
                    ? data.voucher_types
                    : [],

            rows:
                Array.isArray(data.rows)
                    ? data.rows
                    : [],

            month_totals:
                data.month_totals ||
                {},

            grand_total:
                toNumber(
                    data.grand_total
                ),

            selected_group:
                data.selected_group ||
                "",

            selected_party_group:
                data.selected_party_group ||
                "",

            period:
                data.period || {
                    from:
                        fromDate?.value || "",
                    to:
                        toDate?.value || ""
                }
        };
    }


    /* =====================================================
       RENDER REPORT
    ====================================================== */

    function renderReport(data) {

        if (!tableWrap) {
            return;
        }

        tableWrap.innerHTML = "";

        if (
            !data.rows.length
        ) {

            tableWrap.innerHTML = `
                <div class="bank-summary-empty">
                    No transactions found for the selected period.
                </div>
            `;

            tableWrap.hidden = false;

            if (summaryToolbar) {
                summaryToolbar.hidden = true;
            }

            showStatus(
                "No transactions found."
            );

            return;
        }

        const table =
            buildTable(data);

        tableWrap.appendChild(
            table
        );

        tableWrap.hidden = false;

        if (summaryToolbar) {
            summaryToolbar.hidden = false;
        }

        if (periodLabel) {

            periodLabel.textContent =
                formatPeriod(
                    data.period.from,
                    data.period.to
                );
        }

        showStatus(
            `${data.rows.length} ledger record${
                data.rows.length === 1
                    ? ""
                    : "s"
            }`
        );
    }


    /* =====================================================
       BUILD TABLE
    ====================================================== */

    function buildTable(data) {

        const table =
            document.createElement(
                "table"
            );

        table.className =
            "bank-summary-table";

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

        const headerRow1 =
            document.createElement(
                "tr"
            );


        /* Ledger */

        const ledgerHeader =
            document.createElement(
                "th"
            );

        ledgerHeader.className =
            "ledger-column";

        ledgerHeader.rowSpan = 2;

        ledgerHeader.textContent =
            "Ledger Name";

        headerRow1.appendChild(
            ledgerHeader
        );


        /* Party */

        const partyHeader =
            document.createElement(
                "th"
            );

        partyHeader.className =
            "party-column";

        partyHeader.rowSpan = 2;

        partyHeader.textContent =
            "Party Name";

        headerRow1.appendChild(
            partyHeader
        );


        /*
         * MONTH HEADERS
         */

        data.months.forEach(
            month => {

                const th =
                    document.createElement(
                        "th"
                    );

                th.colSpan =
                    Math.max(
                        data.voucher_types.length,
                        1
                    );

                th.textContent =
                    formatMonthHeader(
                        month
                    );

                headerRow1.appendChild(
                    th
                );
            }
        );


        /* Total */

        const totalHeader =
            document.createElement(
                "th"
            );

        totalHeader.rowSpan = 2;

        totalHeader.className =
            "amount";

        totalHeader.textContent =
            "Total";

        headerRow1.appendChild(
            totalHeader
        );


        /* =================================================
           HEADER ROW 2
        ================================================= */

        const headerRow2 =
            document.createElement(
                "tr"
            );

        data.months.forEach(
            () => {

                if (
                    data.voucher_types.length
                ) {

                    data.voucher_types.forEach(
                        voucher => {

                            const th =
                                document.createElement(
                                    "th"
                                );

                            th.textContent =
                                voucher;

                            headerRow2.appendChild(
                                th
                            );
                        }
                    );

                } else {

                    const th =
                        document.createElement(
                            "th"
                        );

                    th.textContent =
                        "Amount";

                    headerRow2.appendChild(
                        th
                    );
                }
            }
        );


        thead.appendChild(
            headerRow1
        );

        thead.appendChild(
            headerRow2
        );


        /* =================================================
           LEDGERS
        ================================================= */

        data.rows.forEach(
            ledger => {

                appendLedgerRow(
                    tbody,
                    ledger,
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
       LEDGER ROW
    ====================================================== */

    function appendLedgerRow(
        tbody,
        ledger,
        data
    ) {

        const ledgerName =
            String(
                ledger.ledger_name ||
                "Unknown Ledger"
            ).trim();

        const ledgerKey =
            `ledger::${ledgerName}`;


        const tr =
            document.createElement(
                "tr"
            );

        tr.className =
            "ledger-row";


        /* =================================================
           LEDGER NAME
        ================================================= */

        const ledgerCell =
            document.createElement(
                "td"
            );

        ledgerCell.className =
            "ledger-cell";


        const ledgerLabel =
            document.createElement(
                "span"
            );

        ledgerLabel.className =
            "ledger-label";


        const toggle =
            createToggleButton(
                state.expandedLedgers.has(
                    ledgerKey
                )
            );


        toggle.addEventListener(
            "click",
            function () {

                if (
                    state.expandedLedgers.has(
                        ledgerKey
                    )
                ) {

                    state.expandedLedgers.delete(
                        ledgerKey
                    );

                } else {

                    state.expandedLedgers.add(
                        ledgerKey
                    );
                }

                rerender();
            }
        );


        ledgerLabel.appendChild(
            toggle
        );


        const text =
            document.createElement(
                "span"
            );

        text.textContent =
            ledgerName;

        ledgerLabel.appendChild(
            text
        );

        ledgerCell.appendChild(
            ledgerLabel
        );

        tr.appendChild(
            ledgerCell
        );


        /* =================================================
           PARTY COUNT
        ================================================= */

        const partyCell =
            document.createElement(
                "td"
            );

        partyCell.className =
            "party-column";


        const parties =
            Array.isArray(
                ledger.parties
            )
                ? ledger.parties
                : [];


        partyCell.textContent =
            `${parties.length} ${
                parties.length === 1
                    ? "party"
                    : "parties"
            }`;


        tr.appendChild(
            partyCell
        );


        /* =================================================
           LEDGER MONTH VALUES
        ================================================= */

        data.months.forEach(
            month => {

                const monthData =
                    ledger.months?.[month] ||
                    {};

                data.voucher_types.forEach(
                    voucher => {

                        const amount =
                            toNumber(
                                monthData[
                                    voucher
                                ]
                            );

                        tr.appendChild(
                            createAmountCell(
                                amount
                            )
                        );
                    }
                );
            }
        );


        /* =================================================
           LEDGER TOTAL
        ================================================= */

        tr.appendChild(
            createAmountCell(
                ledger.total !== undefined
                    ? ledger.total
                    : calculateLedgerTotal(
                        ledger
                    )
            )
        );


        tbody.appendChild(
            tr
        );


        /* =================================================
           PARTY ROWS
        ================================================= */

        if (
            state.expandedLedgers.has(
                ledgerKey
            )
        ) {

            parties.forEach(
                party => {

                    appendPartyRow(
                        tbody,
                        ledger,
                        party,
                        data
                    );
                }
            );
        }
    }


    /* =====================================================
       PARTY ROW
    ====================================================== */

    function appendPartyRow(
        tbody,
        ledger,
        party,
        data
    ) {

        const ledgerName =
            String(
                ledger.ledger_name ||
                ""
            ).trim();

        const partyName =
            String(
                party.party_name ||
                "Unknown Party"
            ).trim();


        const partyKey =
            `party::${ledgerName}::${partyName}`;


        const tr =
            document.createElement(
                "tr"
            );

        tr.className =
            "party-row";


        /* Ledger */

        const ledgerCell =
            document.createElement(
                "td"
            );

        ledgerCell.className =
            "ledger-cell";

        ledgerCell.textContent =
            ledgerName;

        tr.appendChild(
            ledgerCell
        );


        /* Party */

        const partyCell =
            document.createElement(
                "td"
            );

        partyCell.className =
            "party-cell";


        const label =
            document.createElement(
                "span"
            );

        label.className =
            "party-label";


        const toggle =
            createToggleButton(
                state.expandedParties.has(
                    partyKey
                )
            );


        toggle.addEventListener(
            "click",
            function () {

                if (
                    state.expandedParties.has(
                        partyKey
                    )
                ) {

                    state.expandedParties.delete(
                        partyKey
                    );

                } else {

                    state.expandedParties.add(
                        partyKey
                    );
                }

                rerender();
            }
        );


        label.appendChild(
            toggle
        );


        const partyText =
            document.createElement(
                "span"
            );

        partyText.textContent =
            partyName;


        label.appendChild(
            partyText
        );

        partyCell.appendChild(
            label
        );

        tr.appendChild(
            partyCell
        );


        /* =================================================
           PARTY MONTH VALUES
        ================================================= */

        data.months.forEach(
            month => {

                const monthData =
                    party.months?.[month] ||
                    {};

                data.voucher_types.forEach(
                    voucher => {

                        const amount =
                            toNumber(
                                monthData[
                                    voucher
                                ]
                            );

                        tr.appendChild(
                            createAmountCell(
                                amount
                            )
                        );
                    }
                );
            }
        );


        /* Party total */

        tr.appendChild(
            createAmountCell(
                party.total !== undefined
                    ? party.total
                    : calculatePartyTotal(
                        party
                    )
            )
        );


        tbody.appendChild(
            tr
        );


        /* =================================================
           MONTH BREAKDOWN
        ================================================= */

        if (
            state.expandedParties.has(
                partyKey
            )
        ) {

            appendPartyBreakdown(
                tbody,
                ledger,
                party,
                data
            );
        }
    }


    /* =====================================================
       PARTY MONTH BREAKDOWN
    ====================================================== */

    function appendPartyBreakdown(
        tbody,
        ledger,
        party,
        data
    ) {

        data.months.forEach(
            month => {

                const monthData =
                    party.months?.[month] ||
                    {};


                const hasValue =
                    data.voucher_types.some(
                        voucher =>
                            Math.abs(
                                toNumber(
                                    monthData[
                                        voucher
                                    ]
                                )
                            ) > 0
                    );


                if (!hasValue) {
                    return;
                }


                const tr =
                    document.createElement(
                        "tr"
                    );

                tr.className =
                    "month-row";


                const ledgerCell =
                    document.createElement(
                        "td"
                    );

                ledgerCell.className =
                    "ledger-cell";

                ledgerCell.textContent =
                    String(
                        ledger.ledger_name ||
                        ""
                    );

                tr.appendChild(
                    ledgerCell
                );


                const monthCell =
                    document.createElement(
                        "td"
                    );

                monthCell.className =
                    "party-cell";

                monthCell.textContent =
                    formatMonthHeader(
                        month
                    );

                tr.appendChild(
                    monthCell
                );


                data.months.forEach(
                    currentMonth => {

                        data.voucher_types.forEach(
                            voucher => {

                                const value =
                                    currentMonth ===
                                    month
                                        ? monthData[
                                            voucher
                                        ] || 0
                                        : 0;

                                tr.appendChild(
                                    createAmountCell(
                                        value
                                    )
                                );
                            }
                        );
                    }
                );


                tr.appendChild(
                    createAmountCell(
                        monthData.total || 0
                    )
                );


                tbody.appendChild(
                    tr
                );
            }
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

        label.colSpan = 2;

        label.className =
            "ledger-cell";

        label.textContent =
            "Grand Total";

        tr.appendChild(
            label
        );


        data.months.forEach(
            month => {

                data.voucher_types.forEach(
                    voucher => {

                        const amount =
                            calculateGlobalVoucherTotal(
                                data.rows,
                                month,
                                voucher
                            );

                        tr.appendChild(
                            createAmountCell(
                                amount
                            )
                        );
                    }
                );
            }
        );


        tr.appendChild(
            createAmountCell(
                data.grand_total ||
                calculateGrandTotal(
                    data.rows
                )
            )
        );


        tbody.appendChild(
            tr
        );
    }


    /* =====================================================
       GLOBAL VOUCHER TOTAL
    ====================================================== */

    function calculateGlobalVoucherTotal(
        ledgers,
        month,
        voucher
    ) {

        let total = 0;


        ledgers.forEach(
            ledger => {

                const monthData =
                    ledger.months?.[month] ||
                    {};

                total +=
                    toNumber(
                        monthData[
                            voucher
                        ]
                    );
            }
        );


        return total;
    }


    /* =====================================================
       GRAND TOTAL CALCULATION
    ====================================================== */

    function calculateGrandTotal(
        ledgers
    ) {

        return ledgers.reduce(
            (sum, ledger) =>
                sum +
                calculateLedgerTotal(
                    ledger
                ),
            0
        );
    }


    /* =====================================================
       LEDGER TOTAL
    ====================================================== */

    function calculateLedgerTotal(
        ledger
    ) {

        if (
            ledger &&
            ledger.total !== undefined
        ) {

            return toNumber(
                ledger.total
            );
        }


        let total = 0;


        Object.values(
            ledger?.months || {}
        ).forEach(
            monthData => {

                total +=
                    toNumber(
                        monthData.total
                    );
            }
        );


        return total;
    }


    /* =====================================================
       PARTY TOTAL
    ====================================================== */

    function calculatePartyTotal(
        party
    ) {

        if (
            party &&
            party.total !== undefined
        ) {

            return toNumber(
                party.total
            );
        }


        let total = 0;


        Object.values(
            party?.months || {}
        ).forEach(
            monthData => {

                total +=
                    toNumber(
                        monthData.total
                    );
            }
        );


        return total;
    }


    /* =====================================================
       TOGGLE BUTTON
    ====================================================== */

    function createToggleButton(
        expanded
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "row-toggle";

        button.setAttribute(
            "aria-expanded",
            expanded
                ? "true"
                : "false"
        );

        button.title =
            expanded
                ? "Collapse"
                : "Expand";

        button.innerHTML =
            expanded
                ? '<i class="fa-solid fa-minus"></i>'
                : '<i class="fa-solid fa-plus"></i>';

        return button;
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


            state.expandedLedgers.clear();

            state.expandedParties.clear();


            reportData.rows.forEach(
                ledger => {

                    const ledgerName =
                        String(
                            ledger.ledger_name ||
                            "Unknown Ledger"
                        ).trim();


                    state.expandedLedgers.add(
                        `ledger::${ledgerName}`
                    );


                    const parties =
                        Array.isArray(
                            ledger.parties
                        )
                            ? ledger.parties
                            : [];


                    parties.forEach(
                        party => {

                            const partyName =
                                String(
                                    party.party_name ||
                                    "Unknown Party"
                                ).trim();


                            state.expandedParties.add(
                                `party::${ledgerName}::${partyName}`
                            );
                        }
                    );
                }
            );


            rerender();
        }
    );


    /* =====================================================
       COLLAPSE ALL
    ====================================================== */

    collapseAllBtn?.addEventListener(
        "click",
        function () {

            state.expandedLedgers.clear();

            state.expandedParties.clear();

            rerender();
        }
    );


    /* =====================================================
       RERENDER
    ====================================================== */

    function rerender() {

        if (reportData) {

            renderReport(
                reportData
            );
        }
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
            toNumber(value);


        td.textContent =
            formatAmount(number);


        if (number < 0) {

            td.classList.add(
                "amount-negative"
            );

        } else {

            td.classList.add(
                "amount-positive"
            );
        }


        return td;
    }


    /* =====================================================
       NUMBER CONVERSION
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

            return Number.isFinite(value)
                ? value
                : 0;
        }


        const cleaned =
            String(value)
                .replace(/,/g, "")
                .replace(/[₹$]/g, "")
                .trim();


        const number =
            Number(cleaned);


        return Number.isFinite(number)
            ? number
            : 0;
    }


    /* =====================================================
       FORMAT AMOUNT
    ====================================================== */

    function formatAmount(
        value
    ) {

        if (
            !Number.isFinite(value)
        ) {

            value = 0;
        }


        return new Intl.NumberFormat(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(value);
    }


    /* =====================================================
       MONTH HEADER
    ====================================================== */

    function formatMonthHeader(
        month
    ) {

        if (!month) {
            return "";
        }


        /*
         * Backend normally sends:
         *
         * Apr-26
         * May-26
         * Jun-26
         *
         * Keep this as-is.
         *
         * Do NOT use:
         *
         * new Date("Apr-26")
         *
         * because browsers can interpret that
         * incorrectly.
         */

        const match =
            String(month).match(
                /^([A-Za-z]{3})-(\d{2}|\d{4})$/
            );


        if (match) {

            return `${match[1]}-${match[2]}`;
        }


        /*
         * Support YYYY-MM if backend ever
         * returns that format.
         */

        const numericMatch =
            String(month).match(
                /^(\d{4})-(\d{1,2})$/
            );


        if (numericMatch) {

            const year =
                numericMatch[1];

            const monthNumber =
                Number(
                    numericMatch[2]
                );


            const names = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec"
            ];


            if (
                monthNumber >= 1 &&
                monthNumber <= 12
            ) {

                return `${names[
                    monthNumber - 1
                ]}-${year}`;
            }
        }


        return String(month);
    }


    /* =====================================================
       PERIOD
    ====================================================== */

    function formatPeriod(
        from,
        to
    ) {

        if (!from || !to) {
            return "";
        }


        return `${formatDate(from)} → ${formatDate(to)}`;
    }


    function formatDate(
        value
    ) {

        if (!value) {
            return "";
        }


        const parts =
            String(value).split("-");


        if (
            parts.length !== 3
        ) {

            return String(value);
        }


        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]);

        const day =
            Number(parts[2]);


        if (
            !year ||
            !month ||
            !day
        ) {

            return String(value);
        }


        const date =
            new Date(
                year,
                month - 1,
                day
            );


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


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


        reportStatus.classList.toggle(
            "success",
            !isError
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
                    '<i class="fa-solid fa-spinner fa-spin"></i> Loading bank summary…';


                reportStatus.classList.remove(
                    "error",
                    "success"
                );
            }


            if (tableWrap) {
                tableWrap.hidden = true;
            }


            if (summaryToolbar) {
                summaryToolbar.hidden = true;
            }


            if (applyPeriodBtn) {
                applyPeriodBtn.disabled = true;
            }

        } else {

            if (applyPeriodBtn) {
                applyPeriodBtn.disabled = false;
            }
        }
    }

})();