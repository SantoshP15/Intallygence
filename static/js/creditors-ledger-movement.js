"use strict";


const API = "/api/creditors-ledger-movement";


let reportData = [];


// =========================================================
// DOM
// =========================================================

function $(id) {
    return document.getElementById(id);
}


// =========================================================
// NUMBER
// =========================================================

function number(value) {

    const n = Number(value);

    if (!Number.isFinite(n)) {
        return "0.00";
    }

    return n.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// LOAD
// =========================================================

async function loadReport() {

    const body = $("reportBody");

    body.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                Loading...
            </td>
        </tr>
    `;


    const params = new URLSearchParams({

        // group:
        //     $("groupSelect").value,

        // from_date:
        //     $("fromDate").value,

        // to_date:
        //     $("toDate").value

    });


    try {

        const response = await fetch(
            `${API}?${params.toString()}`,
            {
                credentials: "same-origin"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load report."
            );

        }


        reportData =
            Array.isArray(data.rows)
                ? data.rows
                : [];


        render(
            $("searchInput").value
        );


        updateSummary(
            data
        );


    } catch (error) {

        console.error(
            "Ledger Movement:",
            error
        );


        body.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="error"
                >
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;

    }

}


// =========================================================
// FILTER
// =========================================================

function filteredRows(searchValue) {

    const search =
        String(searchValue || "")
            .trim()
            .toLowerCase();


    if (!search) {
        return reportData;
    }


    return reportData.filter(
        ledger =>
            String(
                ledger.ledger_name || ""
            )
            .toLowerCase()
            .includes(search)
    );

}


// =========================================================
// RENDER
// =========================================================

function render(searchValue = "") {

    const body = $("reportBody");

    body.innerHTML = "";


    const rows =
        filteredRows(searchValue);


    if (!rows.length) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty"
                >
                    No records found.
                </td>
            </tr>
        `;

        $("ledgerCount").textContent = "0";

        return;
    }


    $("ledgerCount").textContent =
        rows.length;


    rows.forEach(
        (ledger, ledgerIndex) => {

            // =============================================
            // LEDGER TOTAL ROW
            // =============================================

            const ledgerTr =
                document.createElement("tr");

            ledgerTr.className =
                "ledger-row";


            ledgerTr.dataset.index =
                ledgerIndex;


            ledgerTr.innerHTML = `

                <td class="ledger-name">

                    <button
                        type="button"
                        class="expand-btn"
                        data-index="${ledgerIndex}"
                        aria-expanded="false"
                    >
                        +
                    </button>

                    <strong>
                        ${escapeHtml(
                            ledger.ledger_name
                        )}
                    </strong>

                </td>


                <td class="ledger-total-label">
                    Total
                </td>


                <td>
                    ${number(
                        ledger.total.credit_note
                    )}
                </td>


                <td>
                    ${number(
                        ledger.total.journal
                    )}
                </td>


                <td>
                    ${number(
                        ledger.total.opening
                    )}
                </td>


                <td>
                    ${number(
                        ledger.total.sales
                    )}
                </td>


                <td class="grand-total">
                    ${number(
                        ledger.total.grand_total
                    )}
                </td>

            `;


            body.appendChild(
                ledgerTr
            );


            // =============================================
            // BILL ROWS
            // =============================================

            ledger.rows.forEach(
                bill => {

                    const billTr =
                        document.createElement("tr");

                    billTr.className =
                        "bill-row";

                    billTr.dataset.parent =
                        ledgerIndex;

                    billTr.style.display =
                        "none";


                    billTr.innerHTML = `

                        <td></td>


                        <td class="bill-ref">

                            ${escapeHtml(
                                bill.bill_ref_no
                            )}

                        </td>


                        <td>
                            ${number(
                                bill.credit_note
                            )}
                        </td>


                        <td>
                            ${number(
                                bill.journal
                            )}
                        </td>


                        <td>
                            ${number(
                                bill.opening
                            )}
                        </td>


                        <td>
                            ${number(
                                bill.sales
                            )}
                        </td>


                        <td class="grand-total">
                            ${number(
                                bill.grand_total
                            )}
                        </td>

                    `;


                    body.appendChild(
                        billTr
                    );

                }
            );

        }
    );

}


// =========================================================
// EXPAND / COLLAPSE
// =========================================================

function toggleLedger(index) {

    const button =
        document.querySelector(
            `.expand-btn[data-index="${index}"]`
        );


    if (!button) {
        return;
    }


    const expanded =
        button.getAttribute(
            "aria-expanded"
        ) === "true";


    const children =
        document.querySelectorAll(
            `tr.bill-row[data-parent="${index}"]`
        );


    children.forEach(
        row => {

            row.style.display =
                expanded
                    ? "none"
                    : "table-row";

        }
    );


    button.setAttribute(
        "aria-expanded",
        String(!expanded)
    );


    button.textContent =
        expanded
            ? "+"
            : "−";

}


// =========================================================
// SUMMARY
// =========================================================

function updateSummary(data) {

    // $("summaryGroup").textContent =
    //     data.group ||
    //     $("groupSelect").value;


    const totals =
        data.grand_total || {};


    $("summaryTotal").textContent =
        number(
            totals.grand_total
        );


    $("totalCreditNote").textContent =
        number(
            totals.credit_note
        );


    $("totalJournal").textContent =
        number(
            totals.journal
        );


    $("totalOpening").textContent =
        number(
            totals.opening
        );


    $("totalSales").textContent =
        number(
            totals.sales
        );


    $("totalGrand").textContent =
        number(
            totals.grand_total
        );

}


// =========================================================
// CSV
// =========================================================

function exportCSV() {

    const rows =
        filteredRows(
            $("searchInput").value
        );


    if (!rows.length) {

        alert(
            "There is no data to export."
        );

        return;
    }


    const csv = [];


    csv.push([
        "Ledger Name",
        "Voucher / Bill Ref No",
        "Credit Note",
        "Journal",
        "Opening",
        "Sales",
        "Grand Total"
    ]);


    rows.forEach(
        ledger => {

            ledger.rows.forEach(
                bill => {

                    csv.push([
                        ledger.ledger_name,
                        bill.bill_ref_no,
                        bill.credit_note,
                        bill.journal,
                        bill.opening,
                        bill.sales,
                        bill.grand_total
                    ]);

                }
            );

        }
    );


    const csvText =
        csv.map(
            row =>
                row.map(
                    value =>
                        `"${String(
                            value ?? ""
                        ).replace(
                            /"/g,
                            '""'
                        )}"`
                ).join(",")
        ).join("\n");


    const blob =
        new Blob(
            [csvText],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "ledger-movement.csv";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


// =========================================================
// EVENTS
// =========================================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".expand-btn"
            );


        if (!button) {
            return;
        }


        toggleLedger(
            Number(
                button.dataset.index
            )
        );

    }
);


$("refreshBtn")
    .addEventListener(
        "click",
        loadReport
    );


$("exportBtn")
    .addEventListener(
        "click",
        exportCSV
    );


// $("groupSelect")
//     .addEventListener(
//         "change",
//         loadReport
//     );


// $("fromDate")
//     .addEventListener(
//         "change",
//         loadReport
//     );


// $("toDate")
//     .addEventListener(
//         "change",
//         loadReport
//     );


$("searchInput")
    .addEventListener(
        "input",
        event => {

            render(
                event.target.value
            );

        }
    );


// =========================================================
// INITIAL LOAD
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadReport();

    }
);