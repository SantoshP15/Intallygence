document.addEventListener("DOMContentLoaded", () => {
    const exportButton = document.querySelector("[data-export-excel]");

    if (!exportButton) {
        return;
    }

    exportButton.addEventListener("click", () => {
        const table = document.querySelector("#tableWrap table, .report-table-card table, .table-card table");

        if (!table || typeof XLSX === "undefined") {
            return;
        }

        const workbook = XLSX.utils.table_to_book(table, {
            sheet: exportButton.dataset.sheet || "Report"
        });

        XLSX.writeFile(
            workbook,
            `${exportButton.dataset.filename || "report"}.xlsx`
        );
    });
});
