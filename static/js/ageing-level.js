const API = "/api/ageing-level";

let rows = [];
let shown = [];


const $ = id =>
    document.getElementById(id);


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const d = new Date();

        $("asOnDate").value =
            d.toISOString().slice(0, 10);


        $("asOnDate")
            .addEventListener(
                "change",
                load
            );


        $("searchInput")
            .addEventListener(
                "input",
                filter
            );


        $("refreshBtn")
            .addEventListener(
                "click",
                load
            );


        $("clearBtn")
            .addEventListener(
                "click",
                () => {

                    $("searchInput").value = "";

                    filter();

                }
            );


        $("exportBtn")
            .addEventListener(
                "click",
                exportCSV
            );


        load();

    }
);


async function load() {

    $("status").textContent =
        "Loading Ageing Level...";


    try {

        const params =
            new URLSearchParams({
                source: "view_DayBook",
                as_on: $("asOnDate").value
            });


        const response =
            await fetch(
                `${API}?${params}`
            );


        if (!response.ok) {

            throw new Error(
                "Server returned " +
                response.status
            );

        }


        const data =
            await response.json();


        rows =
            Array.isArray(data)
                ? data
                : (data.rows || []);


        filter();


    } catch (error) {

        console.error(
            "Ageing Level Error:",
            error
        );


        rows = [];

        filter();


        $("status").textContent =
            "Unable to load report";

    }

}


function filter() {

    const search =
        $("searchInput")
            .value
            .toLowerCase()
            .trim();


    shown =
        rows.filter(
            row =>
                !search ||
                String(
                    row.ledger_name || ""
                )
                .toLowerCase()
                .includes(search)
        );


    render();

    summary();

}


function render() {

    const body =
        $("tbody");


    body.innerHTML = "";


    shown.forEach(
        row => {

            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <td class="left">

                    <span class="expand">
                        +
                    </span>

                    ${esc(row.ledger_name)}

                </td>

                <td>
                    ${num(row["0_30"])}
                </td>

                <td>
                    ${num(row["31_60"])}
                </td>

                <td>
                    ${num(row["61_90"])}
                </td>

                <td>
                    ${num(row["91_120"])}
                </td>

                <td>
                    ${num(row["121_plus"])}
                </td>

                <td>
                    ${num(row.grand_total)}
                </td>

            `;


            body.appendChild(tr);

        }
    );

}


function summary() {

    const total =
        shown.reduce(
            (sum, row) =>
                sum +
                Number(
                    row.grand_total
                || 0
                ),
            0
        );


    $("ledgerCount").textContent =
        shown.length
            .toLocaleString("en-IN");


    $("netOutstanding").textContent =
        num(total);


    const totals = {

        "0_30": 0,
        "31_60": 0,
        "61_90": 0,
        "91_120": 0,
        "121_plus": 0

    };


    shown.forEach(
        row => {

            Object.keys(totals)
                .forEach(
                    key => {

                        totals[key] +=
                            Number(
                                row[key] || 0
                            );

                    }
                );

        }
    );


    $("total_0_30").textContent =
        num(totals["0_30"]);


    $("total_31_60").textContent =
        num(totals["31_60"]);


    $("total_61_90").textContent =
        num(totals["61_90"]);


    $("total_91_120").textContent =
        num(totals["91_120"]);


    $("total_121_plus").textContent =
        num(totals["121_plus"]);


    $("grandTotal").textContent =
        num(total);


    $("status").textContent =
        shown.length.toLocaleString("en-IN") +
        " ledgers";

}


function num(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function esc(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m])
    );

}


function exportCSV() {

    if (!shown.length) {

        alert(
            "No records to export."
        );

        return;

    }


    const headers = [
        "Ledger Name",
        "0-30",
        "31-60",
        "61-90",
        "91-120",
        "121+",
        "Grand Total"
    ];


    const data = [

        headers,

        ...shown.map(
            row => [
                row.ledger_name,
                row["0_30"],
                row["31_60"],
                row["61_90"],
                row["91_120"],
                row["121_plus"],
                row.grand_total
            ]
        )

    ];


    const csv =
        data
            .map(
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
            )
            .join("\n");


    const blob =
        new Blob(
            ["\ufeff" + csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const a =
        document.createElement("a");


    a.href = url;

    a.download =
        "Debtors_Ageing_Level.csv";

    a.click();


    URL.revokeObjectURL(url);

}