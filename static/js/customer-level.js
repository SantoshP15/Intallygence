const periodForm = document.getElementById("periodForm");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const reportStatus = document.getElementById("reportStatus");
const tableWrap = document.getElementById("tableWrap");

function fiscalYearDates() {
    const today = new Date();
    const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    return { from: `${startYear}-04-01`, to: `${startYear + 1}-03-31` };
}
function amount(value) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value || 0); }
function percent(value) { return `${(value || 0).toFixed(2)}%`; }
function escapeHtml(text) { const element = document.createElement("div"); element.textContent = text; return element.innerHTML; }

function renderReport(report) {
    if (!report.rows.length) {
        tableWrap.innerHTML = '<div class="empty-state">No sales were found for this period.</div>';
        tableWrap.hidden = false;
        return;
    }
    const monthHeaders = report.months.map(month => `<th colspan="3">${month}</th>`).join("");
    const subHeaders = report.months.map(() => "<th>Sales</th><th>Sales %</th><th>Running %</th>").join("");
    const rows = report.rows.map(row => `<tr><td>${escapeHtml(row.customer)}</td>${row.months.map(month => `<td>${amount(month.sales)}</td><td>${percent(month.percent)}</td><td class="running">${percent(month.running_percent)}</td>`).join("")}<td class="total">${amount(row.total)}</td><td class="total">${percent(row.total_percent)}</td></tr>`).join("");
    const totals = report.months.map((month, index) => `<td>${amount(report.rows.reduce((total, row) => total + row.months[index].sales, 0))}</td><td>100.00%</td><td>100.00%</td>`).join("");
    tableWrap.innerHTML = `<table class="customer-table"><thead><tr><th rowspan="2">Customer</th>${monthHeaders}<th colspan="2">Total Sales</th></tr><tr>${subHeaders}<th>Sales</th><th>Sales %</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Grand Total</td>${totals}<td>${amount(report.grand_total)}</td><td>100.00%</td></tr></tfoot></table>`;
    tableWrap.hidden = false;
}

async function loadReport() {
    reportStatus.hidden = false;
    reportStatus.textContent = "Loading customer sales…";
    tableWrap.hidden = true;
    try {
        const response = await fetch(`/api/customer-level?${new URLSearchParams({ from: fromDate.value, to: toDate.value })}`);
        const report = await response.json();
        if (!response.ok) throw new Error(report.error || "Unable to load the report.");
        renderReport(report);
        reportStatus.hidden = true;
    } catch (error) {
        reportStatus.textContent = error.message;
    }
}

const fiscalDates = fiscalYearDates();
fromDate.value = fiscalDates.from;
toDate.value = fiscalDates.to;
periodForm.addEventListener("submit", event => { event.preventDefault(); loadReport(); });
loadReport();
