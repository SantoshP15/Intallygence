document.addEventListener("DOMContentLoaded", () => {
    const exportMenu = document.querySelector("[data-export-menu]");
    const exportButton = document.querySelector("[data-export-excel]");

    if (!exportButton) {
        return;
    }

    if (exportMenu) {
        const toggle = exportMenu.querySelector(".export-menu-toggle");
        const panel = exportMenu.querySelector(".export-menu-panel");

        toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!isOpen));
            panel.hidden = isOpen;
        });

        document.addEventListener("click", () => {
            toggle.setAttribute("aria-expanded", "false");
            panel.hidden = true;
        });
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
