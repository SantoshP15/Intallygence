
// ================================
// Global Configuration
// ================================

let pivotConfig = {
    rows: [],
    columns: [],
    values: [],
    period: null,   
    filters: [],
    layout: null,
    dataSource: "SalesInventory"
};

// =======================================
// CURRENT REPORT DATA SOURCE
// =======================================

let currentDataSource = "SalesInventory";
let currentDateColumns = [...DATE_COLUMNS];
let currentColumnTypes = { ...COLUMN_TYPES };

const REPORT_DATA_SOURCES = {
    sales: "SalesInventory",
    purchase: "PurchaseInventory"
};


// =======================================
// LAYOUT CHANGE
// =======================================

const layoutSelect =
    document.getElementById("layoutType");

if (layoutSelect) {

    layoutSelect.addEventListener(
        "change",
        function () {

            pivotConfig.layout =
                this.value;

        }
    );

}


// =======================================
// LAST GENERATED TABULAR REPORT
// =======================================


let lastTabularReport = null;
let lastPivotReport = null;

// ================================
// Utility
// ================================

function exists(area, field) {

    return pivotConfig[area].some(item => {

        if (typeof item === "string")
            return item === field;

        return item.field === field;

    });

}

// =================================
// Hide fields already used in
// Rows / Columns
// =================================

function updateRowColumnOptions() {

    const rowSelect = document.getElementById("rowField");
    const columnSelect = document.getElementById("columnField");

    if (!rowSelect || !columnSelect)
        return;

    const rowFields = pivotConfig.rows;
    const columnFields = pivotConfig.columns;


    // Hide Columns already selected in Rows

    [...columnSelect.options].forEach(option => {

        if (!option.value)
            return;

        option.hidden =
            rowFields.includes(option.value);

    });


    // Hide Rows already selected in Columns

    [...rowSelect.options].forEach(option => {

        if (!option.value)
            return;

        option.hidden =
            columnFields.includes(option.value);

    });

}
// =======================================
// ENABLE / DISABLE COLUMNS
// Columns can only be used after a Row
// has been selected
// =======================================

function updateColumnAccess() {

    const columnSelect =
        document.getElementById("columnField");

    if (!columnSelect)
        return;

    const hasRows =
        pivotConfig.rows.length > 0;

    columnSelect.disabled = !hasRows;

    // Optional visual indication
    if (hasRows) {

        columnSelect.style.opacity = "1";
        columnSelect.style.cursor = "pointer";

    } else {

        columnSelect.style.opacity = "0.55";
        columnSelect.style.cursor = "not-allowed";

    }
}

// ================================
// Create Chip
// ================================

function createChip(text, removeCallback, badge = "") {

    const chip = document.createElement("div");
    chip.className = "field-item";

    const left = document.createElement("div");

    left.innerHTML = badge
        ? `${text} <span class="badge">${badge}</span>`
        : text;

    const remove = document.createElement("span");

    remove.className = "remove-btn";

    remove.innerHTML = "&times;";

    remove.onclick = function (e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        removeCallback(e);
    };

    chip.appendChild(left);

    chip.appendChild(remove);

    return chip;

}

// ================================
// Render Rows
// ================================

function renderRows() {

    const container = document.getElementById("rows");

    container.innerHTML = "";

    pivotConfig.rows.forEach(field => {

        container.appendChild(

            createChip(field, () => {

                pivotConfig.rows =
                    pivotConfig.rows.filter(f => f !== field);

                renderRows();

                updateRowColumnOptions();
                updateColumnAccess();

            })

        );

    });

}

// ================================
// Add Row
// ================================

function addRow() {

    const select = document.getElementById("rowField");

    const field = select.value;

    if (!field)
        return;

    if (exists("rows", field))
        return;

    pivotConfig.rows.push(field);

    renderRows();

    select.value = "";

    updateRowColumnOptions();
    updateColumnAccess();

}

// ================================
// Render Columns
// ================================

function renderColumns() {

    const container = document.getElementById("columns");

    container.innerHTML = "";

    pivotConfig.columns.forEach(field => {

        container.appendChild(

            createChip(field, () => {

                pivotConfig.columns =
                    pivotConfig.columns.filter(f => f !== field);

                renderColumns();
                updateRowColumnOptions();

            })

        );

    });

}

// ================================
// Add Column
// ================================

function addColumn() {

    // Columns require at least one Row
    if (pivotConfig.rows.length === 0) {

        alert("Please select at least one Row before adding Columns.");

        return;
    }

    const select =
        document.getElementById("columnField");

    const field =
        select.value;

    if (!field)
        return;

    if (exists("columns", field))
        return;

    pivotConfig.columns.push(field);

    renderColumns();

    select.value = "";

    updateRowColumnOptions();

    // Pop-up message after selecting multiple columns in 'Columns' section
    if (pivotConfig.columns.length > 1) {
        alert("Notice: You have selected multiple fields in the 'Columns' section (" + pivotConfig.columns.join(", ") + "). Combining multiple column fields will create pivot headers for all unique value combinations.");
    }
}
// ================================
// Render Values
// ================================

function renderValues() {

    const container = document.getElementById("values");

    container.innerHTML = "";

    pivotConfig.values.forEach((item, index) => {

        const chip = createChip(

            item.field,

            () => {

                pivotConfig.values.splice(index, 1);

                renderValues();

            },

            item.aggregate

        );

        container.appendChild(chip);

    });

}

// ================================
// Add Value
// ================================

function addValue() {

    const fieldSelect = document.getElementById("valueField");

    const aggSelect = document.getElementById("aggregate");

    const field = fieldSelect.value;

    const aggregate = aggSelect.value;

    if (!field)
        return;

    // Prevent duplicate field + aggregate
    const existsValue = pivotConfig.values.some(v =>
        v.field === field &&
        v.aggregate === aggregate
    );

    if (existsValue)
        return;

    pivotConfig.values.push({

        field: field,

        aggregate: aggregate

    });

    renderValues();

    fieldSelect.value = "";

    aggSelect.value = "";

}

// ================================
// Remove All Values
// ================================

function clearValues() {

    pivotConfig.values = [];

    renderValues();

}

// ================================
// Get Value Configuration
// ================================

function getValueConfig() {

    return pivotConfig.values.map(item => {

        return {

            field: item.field,

            aggregate: item.aggregate

        };

    });

}
// ================================
// Render Filters
// ================================

function renderFilters() {

    const container = document.getElementById("filters");

    container.innerHTML = "";

    pivotConfig.filters.forEach((filter, index) => {

        const wrapper = document.createElement("div");
        wrapper.className = "field-item";

        // Left section
        const left = document.createElement("div");

        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "6px";
        left.style.flex = "0 0 auto";

        const title = document.createElement("span");

        title.innerHTML = `<strong>${filter.field}</strong>`;

        left.appendChild(title);

        // ===============================
        // Filter Summary
        // ===============================

        const summary = document.createElement("div");

        summary.className = "filter-summary";

        summary.innerHTML = "Select Values ▼";

        left.appendChild(summary);

        // ===============================
        // Popup
        // ===============================

        const popup = document.createElement("div");

        popup.className = "filter-popup";
        // ===============================
        // Date / Normal Filter
        // ===============================


        popup.style.display = "none";
        popup.style.position = "absolute";
        popup.style.zIndex = "99999";

        // Date Filter
if (currentDateColumns.includes(filter.field)) {

    createDateFilter(filter, popup, summary);

} else {

    // Search
    const search = document.createElement("input");

    search.type = "text";
    search.placeholder = "Search...";
    search.className = "filter-search";

    popup.appendChild(search);

    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "checkbox-container";

    popup.appendChild(checkboxContainer);

    search.onkeyup = function () {

        const text = this.value.toLowerCase();

        checkboxContainer
            .querySelectorAll(".checkbox-item")
            .forEach(item => {

                item.style.display =
                    item.innerText.toLowerCase().includes(text)
                    ? "flex"
                    : "none";

            });

    };

    loadFilterValues(
        filter.field,
        checkboxContainer,
        filter,
        summary,
        popup
    );

    const applyBtn = document.createElement("button");

    applyBtn.className = "apply-filter";

    applyBtn.innerText = "Apply";

    popup.appendChild(applyBtn);

}

document.body.appendChild(popup);

        // Open / Close Popup

        summary.onclick = function (e) {

            e.stopPropagation();

            // Close every popup
            document.querySelectorAll(".filter-popup")
                .forEach(p => {

                    if (p !== popup)
                        p.style.display = "none";

                });

            const rect = summary.getBoundingClientRect();

            popup.style.position = "fixed";
            popup.style.left = rect.left + "px";
            popup.style.top = (rect.bottom + 6) + "px";
            popup.style.width = "260px";
            popup.style.maxHeight = "400px";
            popup.style.overflowY = "auto";

            popup.style.display =
                popup.style.display === "block"
                    ? "none"
                    : "block";

        };

        wrapper.appendChild(left);

        // Remove button
        const remove = document.createElement("span");

        remove.className = "remove-btn";

        remove.innerHTML = "&times;";

        remove.onclick = function (e) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }

            popup.remove();

            pivotConfig.filters.splice(index, 1);

            renderFilters();

        };

        wrapper.appendChild(remove);

        container.appendChild(wrapper);

    });

}
// ================================
// Render Period
// ================================

function renderPeriod() {

    const container =
        document.getElementById("period");

    if (!container)
        return;

    container.innerHTML = "";


    // =================================
    // FIND DATE FILTER
    // =================================

    const period = pivotConfig.period;  


    if (!period)
        return;


    // =================================
    // WRAPPER
    // =================================

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "field-item";


    // =================================
    // SUMMARY
    // =================================

    const summary =
        document.createElement("div");

    summary.className =
        "filter-summary";


    // =================================
    // SHOW PERIOD COLUMN + SELECTION
    // =================================

    let periodText = "";

    if (period.from && period.to) {

        periodText =
            period.from +
            " → " +
            period.to;

    }

    else if (
        period.selectedDates &&
        period.selectedDates.length > 0
    ) {

        periodText =
            period.selectedDates.length +
            " date(s) selected";

    }

    else {

        periodText =
            "Select Date Range";

    }


    // =================================
    // SHOW COLUMN NAME
    // =================================

    summary.innerHTML =
        period.field +
        "  " +
        periodText +
        " ▼";


    // =================================
    // POPUP
    // =================================

    const popup =
        document.createElement("div");

    popup.className =
        "filter-popup";

    popup.style.display =
        "none";

    popup.style.position =
        "fixed";

    popup.style.zIndex =
        "99999";


    // =================================
    // CREATE DATE FILTER
    // =================================

    createDateFilter(
        period,
        popup,
        summary
    );


    document.body.appendChild(popup);


    // =================================
    // OPEN POPUP
    // =================================

    summary.onclick = function(e) {

        e.stopPropagation();

        document
            .querySelectorAll(".filter-popup")
            .forEach(p => {

                if (p !== popup)
                    p.style.display = "none";

            });


        const rect =
            summary.getBoundingClientRect();


        popup.style.left =
            rect.left + "px";

        popup.style.top =
            (rect.bottom + 6) + "px";

        popup.style.width =
            "260px";

        popup.style.maxHeight =
            "400px";

        popup.style.overflowY =
            "auto";


        popup.style.display =
            popup.style.display === "block"
                ? "none"
                : "block";

    };


    // =================================
    // REMOVE PERIOD
    // =================================

    const remove = document.createElement("span");

    remove.className = "remove-btn";

    remove.innerHTML = "&times;";

    remove.style.position = "relative";
    remove.style.zIndex = "100";
    remove.style.cursor = "pointer";
    remove.style.pointerEvents = "auto";

    remove.addEventListener("click", function(e) {

        if (e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
        }

        // Close and remove all date popups
        document.querySelectorAll(".filter-popup").forEach(p => p.remove());

        // Clear Period config
        pivotConfig.period = null;

        // Reset Period dropdown
        const periodSelect =
            document.getElementById("periodField");

        if (periodSelect) {
            periodSelect.value = "";
        }

        // Directly clear container DOM
        const periodContainer =
            document.getElementById("period");

        if (periodContainer) {
            periodContainer.innerHTML = "";
        }

        // Re-render Period
        renderPeriod();

    }, true);

    wrapper.appendChild(summary);

    wrapper.appendChild(remove);

    container.appendChild(wrapper);
}
// ================================
// Add Period
// ================================

function addPeriod() {

    const select =
        document.getElementById("periodField");

    const field =
        select.value;

    if (!field)
        return;

    // Only one Period allowed
    if (pivotConfig.period)
        return;

    // Make sure it is a date column
    if (!currentDateColumns.includes(field))
        return;

    pivotConfig.period = {
        field: field,
        selectedDates: [],
        from: "",
        to: ""
    };

    // Render the period chip
    renderPeriod();

    // Reset dropdown
    select.value = "";

    // =====================================
    // OPEN DATE POPUP AUTOMATICALLY
    // =====================================

    setTimeout(() => {

        const periodSummary =
            document.querySelector("#period .filter-summary");

        if (periodSummary) {
            periodSummary.click();
        }

    }, 50);
}
// ================================
// Add Filter
// ================================

function addFilter() {

    const select = document.getElementById("filterField");

    const field = select.value;

    if (!field)
        return;

    const existsFilter = pivotConfig.filters.some(f => f.field === field);

    if (existsFilter)
        return;

    pivotConfig.filters.push({

        field: field,

        selected: [],

        selectedDates: [],

        from: "",

        to: ""

    });

    renderFilters();

    select.value = "";

}
// ================================
// Load Filter Values
// ================================

// =======================================
// Load Filter Values
// =======================================

function loadFilterValues(field, container, filter, summary, popup) {

    container.innerHTML = "Loading...";

    fetch("/filter-values/" + encodeURIComponent(field) + "?table=" + encodeURIComponent(currentDataSource))
        .then(res => res.json())
        .then(values => {

            container.innerHTML = "";

            // -------------------------
            // Select All
            // -------------------------

            const selectAllLabel = document.createElement("label");
            selectAllLabel.className = "checkbox-item";

            const selectAllBox = document.createElement("input");
            selectAllBox.type = "checkbox";

            selectAllLabel.appendChild(selectAllBox);
            selectAllLabel.append(" Select All");

            container.appendChild(selectAllLabel);

            // -------------------------
            // Value Checkboxes
            // -------------------------

            values.forEach(value => {

                const label = document.createElement("label");
                label.className = "checkbox-item";

                const checkbox = document.createElement("input");

                checkbox.type = "checkbox";
                checkbox.className = "filter-checkbox";
                checkbox.value = value;

                if (filter.selected.includes(value))
                    checkbox.checked = true;

                label.appendChild(checkbox);
                label.append(" " + value);

                container.appendChild(label);

            });

            // -------------------------
            // Get all value checkboxes
            // -------------------------

            const valueCheckboxes =
                [...container.querySelectorAll(".filter-checkbox")];

            // -------------------------
            // Initial Select All State
            // -------------------------

            selectAllBox.checked =
                valueCheckboxes.length > 0 &&
                valueCheckboxes.every(cb => cb.checked);

            // -------------------------
            // Select All Event
            // -------------------------

            selectAllBox.addEventListener("change", function () {

                valueCheckboxes.forEach(cb => {

                    cb.checked = this.checked;

                });

            });

            // -------------------------
            // Individual Checkbox Event
            // -------------------------

            valueCheckboxes.forEach(cb => {

                cb.addEventListener("click", function (e) {

                    e.stopPropagation();

                });

                cb.addEventListener("change", function () {

                    selectAllBox.checked =
                        valueCheckboxes.every(box => box.checked);

                });

            });

            // -------------------------
            // Apply
            // -------------------------

            popup.querySelector(".apply-filter").onclick = function () {

                filter.selected = [];

                valueCheckboxes.forEach(cb => {

                    if (cb.checked)
                        filter.selected.push(cb.value);

                });

                if (filter.selected.length === 0) {

                    summary.innerHTML = "Select Values ▼";

                }
                else if (filter.selected.length === 1) {

                    summary.innerHTML = filter.selected[0];

                }
                else if (filter.selected.length === 2) {

                    summary.innerHTML =
                        filter.selected.join(", ");

                }
                else {

                    summary.innerHTML =
                        filter.selected[0] +
                        " +" +
                        (filter.selected.length - 1);

                }

                popup.style.display = "none";

            };

        })
        .catch(err => {

            console.error(err);

            container.innerHTML = "Unable to load values";

        });

}
// ================================
// Get Filters
// ================================

function getFilters() {

    let allFilters = [
        ...pivotConfig.filters
    ];


    // Add Period as a filter

    if (pivotConfig.period) {

        allFilters.push(
            pivotConfig.period
        );

    }


    return allFilters
        .filter(f => {

            // Date Hierarchy
            if (f.selectedDates && f.selectedDates.length > 0)
                return true;

            // Date Range
            if (f.from && f.to)
                return true;

            // Normal Filter
            return f.selected && f.selected.length > 0;

        })
        .map(f => {

            // ==========================
            // Date Hierarchy
            // ==========================

            if (f.selectedDates && f.selectedDates.length > 0) {

                return {
                    field: f.field,
                    selectedDates: f.selectedDates
                };

            }

            // ==========================
            // Date Range
            // ==========================

            if (f.from && f.to) {

                return {
                    field: f.field,
                    from: f.from,
                    to: f.to
                };

            }

            // ==========================
            // Normal Filter
            // ==========================

            return {
                field: f.field,
                values: f.selected
            };

        });

}
// ================================
// Get Filters
// ================================

// ================================
// Render Pivot Table
// ================================

function renderTable(response) {

    const output = document.getElementById("output");

    output.innerHTML = "";

    const columns = response.columns;
    const data = response.data;

    if (!data || data.length === 0) {

        output.innerHTML = "<h3>No Data Found</h3>";

        return;

    }

    const table = document.createElement("table");
    table.className = "pivot-table";
    table.id = "pivotTable";

    // Header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    columns.forEach(col => {

        const th = document.createElement("th");
        th.innerText = col;
        headerRow.appendChild(th);

    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");

    // Store totals for numeric columns
    const totals = {};

    columns.forEach(col => totals[col] = 0);

    data.forEach((row, rowIndex) => {

        const tr = document.createElement("tr");

        columns.forEach((col, colIndex) => {

            const td = document.createElement("td");

            let value = row[col];

            if (value === null || value === undefined)
            value = "";

            if (!isNaN(value) && value !== "") {

                const num = Number(value);

                totals[col] += num;

                td.innerText = num.toLocaleString("en-IN");

                td.style.textAlign = "right";

            }
            else {

                td.innerText = value;

            }

            tr.appendChild(td);

        });

        tbody.appendChild(tr);

    });


// =======================================
// Grand Total Row
// =======================================



    const tfoot = document.createElement("tfoot");

    const totalRow = document.createElement("tr");

    totalRow.className = "grand-total";


    columns.forEach((col, index) => {

        const td = document.createElement("td");

        if (index === 0) {

            td.innerHTML =
                "<strong>Grand Total</strong>";

        }
        else if (totals[col] !== 0) {

            td.innerHTML =
               "<strong>" +
               totals[col].toLocaleString("en-IN") +
                "</strong>";

            td.style.textAlign = "right";

        }

        totalRow.appendChild(td);

    });


    tfoot.appendChild(totalRow);


    // Add body first
    table.appendChild(tbody);

    // Add Grand Total separately
    table.appendChild(tfoot);

    output.appendChild(table);


    const dataTable = new DataTable('#pivotTable', {
        ordering: true,
        searching: true,
        paging: true,
        pageLength: 10,
        lengthChange: true,

        autoWidth: false,

        scrollX: true,
        scrollCollapse: false,

        layout: {
            topStart: 'pageLength',
            topEnd: 'search',
            bottomStart: 'info',
            bottomEnd: 'paging'
        }
    });

    dataTable.columns.adjust();

}
// ================================
// Generate Pivot
// ================================

document.addEventListener("DOMContentLoaded", function () {

    const btn =
        document.getElementById("generate");

    if (btn) {
        btn.addEventListener(
            "click",
            generatePivot
        );
    }


    // =================================
    // LAYOUT CHANGE
    // =================================

    const layoutSelect =
        document.getElementById("layoutType");

    if (layoutSelect) {

        layoutSelect.addEventListener(
            "change",
            function () {

                pivotConfig.layout =
                    this.value;

            }
        );

    }


    updateRowColumnOptions();

});

function renderPivotTable(result) {

    const output =
        document.getElementById("output");

    if (!output)
        return;

    output.innerHTML = "";

    const table =
        document.createElement("table");

    table.className =
        "pivot-result-table";

    // ================================
    // HEADER
    // ================================

    const thead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");

    result.columns.forEach(column => {

        const th =
            document.createElement("th");

        th.textContent = column;

        headerRow.appendChild(th);

    });

    thead.appendChild(headerRow);

    table.appendChild(thead);


    // ================================
    // BODY
    // ================================

    const tbody =
        document.createElement("tbody");

    result.data.forEach(row => {

        const tr =
            document.createElement("tr");

        result.columns.forEach(column => {

            const td =
                document.createElement("td");

            td.textContent =
                row[column] ?? "";

            tr.appendChild(td);

        });

        tbody.appendChild(tr);

    });

    table.appendChild(tbody);

    output.appendChild(table);
}

function generatePivot() {

    console.log("Generate Clicked");

    console.log(pivotConfig);

    if (pivotConfig.rows.length === 0 || pivotConfig.values.length === 0) {

        showReportValidation(
            "Select at least one Row and one Value before clicking Go."
        );

        return;

    }

    const layoutSelect =
    document.getElementById("layoutType");

    if (!layoutSelect) {
        console.error(
            "Layout selector not found"
        );
        return;
    }

    pivotConfig.layout =
        layoutSelect.value;

    const requestData = {
        dataSource: currentDataSource,
        rows: pivotConfig.rows,
        columns: pivotConfig.columns,
        values: pivotConfig.values,
        filters: getFilters(),
        layout: pivotConfig.layout
    };
    console.log(requestData);
    console.log(JSON.stringify(requestData, null, 2));

    fetch("/generate-pivot", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(requestData)

    })
    .then(async response => {

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Server error while generating pivot"
            );

        }

        return data;

    })

    .then(data => {

        console.log("Response:", data);

        // =======================================
        // HANDLE EXPORT CSV
        // =======================================
        // Show Save Report button
        const saveReportBtn =
            document.getElementById("saveReportBtn");

        if (saveReportBtn) {
            saveReportBtn.style.display = "block";
        }
        const exportCsvBtn = document.getElementById("exportCsvBtn");

        const exportExcelBtn = document.getElementById("exportExcelBtn");


        if (data.layout === "pivot") {

            // Store Pivot result
            lastPivotReport = data;
            lastTabularReport = null;

            // Show Excel
            if (exportExcelBtn) {
                exportExcelBtn.style.display =
                    "inline-block";
            }

            // Hide CSV
            if (exportCsvBtn) {
                exportCsvBtn.style.display =
                    "none";
            }

            renderPivotTable(data);

        }
        else {

            // Store Tabular result
            lastTabularReport = data;
            lastPivotReport = null;

            // Show CSV
            if (exportCsvBtn) {
                exportCsvBtn.style.display =
                    "inline-block";
            }

            // Hide Excel
            if (exportExcelBtn) {
                exportExcelBtn.style.display =
                    "none";
            }

            renderTable(data);
        }

        // ==========================
        // MOVE BUILDER UP
        // ==========================

        const builderArea =
            document.getElementById("builderArea");

        if (builderArea) {
            builderArea.classList.add("report-generated");
        }
        const saveArea =
        document.querySelector(".save-area");

        if (saveArea) {
        saveArea.classList.add("report-generated");
}

        // ==========================
        // REMOVE INFO BOX
        // ==========================

        const infoArea =
            document.querySelector(".info-area");

     if (infoArea) {
            infoArea.classList.add("report-generated");
        }

        // ==========================
        // SHOW OUTPUT
        // ==========================

        const outputArea =
            document.getElementById("outputArea");

        if (outputArea) {

            setTimeout(() => {

                outputArea.classList.add("report-generated");

            }, 250);

        }

    })

    .catch(error => {

        console.error(
            "Generate Pivot Error:",
            error
        );

        alert(
            "Error generating pivot:\n\n" +
            error.message
        );

    });

}
document.addEventListener("click", function(e) {

    // If click is inside a filter popup, do nothing
    if (e.target.closest(".filter-popup")) {
        return;
    }
    if (e.target.closest(".flatpickr-calendar")) {
        return;
    }

    // Otherwise close all filter popups
    document.querySelectorAll(".filter-popup").forEach(p => {
        p.style.display = "none";
    });

});

// =======================================
// RESET REPORT BUILDER
// =======================================

function resetReportBuilder() {

    // -----------------------------------
    // Clear configuration
    // -----------------------------------

    pivotConfig.rows = [];
    pivotConfig.columns = [];
    pivotConfig.values = [];
    pivotConfig.period = null;
    pivotConfig.filters = [];
    pivotConfig.layout = "tabular";
    pivotConfig.dataSource = currentDataSource;


    // -----------------------------------
    // Clear Rows
    // -----------------------------------

    renderRows();


    // -----------------------------------
    // Clear Columns
    // -----------------------------------

    renderColumns();


    // -----------------------------------
    // Clear Values
    // -----------------------------------

    renderValues();


    // -----------------------------------
    // Clear Filters
    // -----------------------------------

    renderFilters();


    // -----------------------------------
    // Clear Period
    // -----------------------------------

    renderPeriod();


    // -----------------------------------
    // Reset dropdowns
    // -----------------------------------

    const rowSelect =
        document.getElementById("rowField");

    const columnSelect =
        document.getElementById("columnField");

    const valueSelect =
        document.getElementById("valueField");

    const aggregateSelect =
        document.getElementById("aggregate");

    const periodSelect =
        document.getElementById("periodField");

    const filterSelect =
        document.getElementById("filterField");

    const layoutSelect =
        document.getElementById("layoutType");

    // -----------------------------------
    // Hide Save Report button
    // -----------------------------------

    const saveReportBtn =
        document.getElementById("saveReportBtn");

    if (saveReportBtn) {
        saveReportBtn.style.display = "none";
    }


    if (rowSelect)
        rowSelect.value = "";

    if (columnSelect)
        columnSelect.value = "";

    if (valueSelect)
        valueSelect.value = "";

    if (aggregateSelect)
        aggregateSelect.value = "SUM";

    if (periodSelect)
        periodSelect.value = "";

    if (filterSelect)
        filterSelect.value = "";

    if (layoutSelect) {

        layoutSelect.value = "tabular";

        pivotConfig.layout = "tabular";
    }


    // -----------------------------------
    // Update Row / Column availability
    // -----------------------------------

    updateRowColumnOptions();

    updateColumnAccess();


    // -----------------------------------
    // Clear generated report
    // -----------------------------------

    const output =
        document.getElementById("output");

    if (output)
        output.innerHTML = "";


    // -----------------------------------
    // Hide export buttons
    // -----------------------------------

    const exportCsvBtn =
        document.getElementById("exportCsvBtn");

    const exportExcelBtn =
        document.getElementById("exportExcelBtn");

    if (exportCsvBtn)
        exportCsvBtn.style.display = "none";

    if (exportExcelBtn)
        exportExcelBtn.style.display = "none";


    // -----------------------------------
    // Reset stored reports
    // -----------------------------------

    lastTabularReport = null;
    lastPivotReport = null;


    console.log(
        "Report builder has been reset."
    );
}
// =======================================
// RESET BUTTON
// =======================================

const resetReportBtn =
    document.getElementById("resetReportBtn");

if (resetReportBtn) {

    resetReportBtn.addEventListener(
        "click",
        function () {

            resetReportBuilder();

        }
    );

}
function createDateFilter(filter, popup, summary) {

    popup.innerHTML = "";

    // --------------------------
    // FROM DATE
    // --------------------------

    const fromLabel = document.createElement("label");
    fromLabel.innerText = "From";

    popup.appendChild(fromLabel);

    const fromInput = document.createElement("input");
    fromInput.type = "text";
    fromInput.className = "date-picker";
    fromInput.placeholder = "Start Date";

    popup.appendChild(fromInput);

    // --------------------------
    // TO DATE
    // --------------------------

    const toLabel = document.createElement("label");
    toLabel.innerText = "To";

    popup.appendChild(toLabel);

    const toInput = document.createElement("input");
    toInput.type = "text";
    toInput.className = "date-picker";
    toInput.placeholder = "End Date";

    popup.appendChild(toInput);

    // --------------------------
    // APPLY
    // --------------------------

    const apply = document.createElement("button");

    apply.className = "apply-date";

    apply.innerText = "Apply";

    popup.appendChild(apply);

    // --------------------------
    // Hierarchy Title
    // --------------------------

    const hr = document.createElement("hr");
    popup.appendChild(hr);

    const heading = document.createElement("div");

    heading.className = "date-heading";
    heading.innerHTML = "<strong>Browse Dates</strong>";

    popup.appendChild(heading);

// --------------------------
// Search Box
// --------------------------

    const search = document.createElement("input");

    search.type = "text";
    search.placeholder = "Search...";
    search.className = "filter-search";

    popup.appendChild(search);

// --------------------------
// Hierarchy Container
// --------------------------

    const hierarchyContainer = document.createElement("div");

    hierarchyContainer.className = "date-tree";

    popup.appendChild(hierarchyContainer);

// Load hierarchy

    loadDateHierarchy(
        filter.field,
        hierarchyContainer,
        filter
    );


    // --------------------------
    // Flatpickr Date Range
    // --------------------------

    let fromPicker;
    let toPicker;


    // FROM DATE
    fromPicker = flatpickr(fromInput, {
        dateFormat: "Y-m-d",

        onChange: function(selectedDates) {

            if (selectedDates.length === 0)
                return;

            const fromDate = selectedDates[0];

            // To date cannot be before From date
            toPicker.set("minDate", fromDate);

            // If existing To date is invalid, clear it
            if (toInput.value && toInput.value < fromInput.value) {
                toPicker.clear();
            }
        }
    });


    // TO DATE
    toPicker = flatpickr(toInput, {
        dateFormat: "Y-m-d",

        onChange: function(selectedDates) {

            if (
                selectedDates.length > 0 &&
                fromInput.value &&
                toInput.value < fromInput.value
            ) {
                alert("To date cannot be earlier than From date.");
            toPicker.clear();
            }
    }
});

    // --------------------------
    // Apply
    // --------------------------

    apply.onclick = function () {

    // =====================================
    // DATE RANGE VALIDATION
    // =====================================

    if (fromInput.value && toInput.value) {

        if (toInput.value < fromInput.value) {

            alert("To date cannot be earlier than From date.");

            return;
        }

        filter.selectedDates = [];

        filter.from = fromInput.value;
        filter.to = toInput.value;

        summary.innerHTML =
            filter.field +
            "  " +
            filter.from +
            " → " +
            filter.to;
    }

    // =====================================
    // HIERARCHY SELECTION
    // =====================================
    else {

        filter.from = "";
        filter.to = "";

        if (filter.selectedDates.length > 0) {

            summary.innerHTML =
                filter.field +
                "  " +
                filter.selectedDates.length +
                " date(s) selected";

        } else {

            summary.innerHTML =
                "Select Date Range ▼";
        }
    }

    popup.style.display = "none";
};

}
function loadDateHierarchy(field, container, filter)
{
    container.innerHTML = "Loading...";

    fetch("/date-hierarchy/" + encodeURIComponent(field) + "?table=" + encodeURIComponent(currentDataSource))
    .then(r => r.json())
    .then(data => {

        container.innerHTML = "";

        if(!filter.selectedDates)
            filter.selectedDates=[];

        Object.keys(data).forEach(year=>{

            // ======================
            // YEAR
            // ======================

            const yearDiv=document.createElement("div");
            yearDiv.className="tree-year";

            const yearHeader=document.createElement("div");
            yearHeader.className="tree-header";

            const yearToggle=document.createElement("span");
            yearToggle.innerHTML="▶";

            const yearCheck=document.createElement("input");
            yearCheck.type="checkbox";

            const yearText=document.createElement("span");
            yearText.innerText=" "+year;

            yearHeader.appendChild(yearToggle);
            yearHeader.appendChild(yearCheck);
            yearHeader.appendChild(yearText);

            yearDiv.appendChild(yearHeader);

            const yearBody=document.createElement("div");
            yearBody.className="tree-body";
            yearBody.style.display="none";

            yearDiv.appendChild(yearBody);

            // expand collapse

            yearToggle.onclick=function(){

                if(yearBody.style.display==="none"){

                    yearBody.style.display="block";
                    yearToggle.innerHTML="▼";

                }else{

                    yearBody.style.display="none";
                    yearToggle.innerHTML="▶";

                }

            };

            // ======================
            // MONTH
            // ======================

            Object.keys(data[year]).forEach(month=>{

                const monthDiv=document.createElement("div");
                monthDiv.className="tree-month";

                const monthHeader=document.createElement("div");
                monthHeader.className="tree-header";

                const monthToggle=document.createElement("span");
                monthToggle.innerHTML="▶";

                const monthCheck=document.createElement("input");
                monthCheck.type="checkbox";

                const monthText=document.createElement("span");
                monthText.innerText=" "+month;

                monthHeader.appendChild(monthToggle);
                monthHeader.appendChild(monthCheck);
                monthHeader.appendChild(monthText);

                monthDiv.appendChild(monthHeader);

                const monthBody=document.createElement("div");
                monthBody.className="tree-body";
                monthBody.style.display="none";

                monthDiv.appendChild(monthBody);

                monthToggle.onclick=function(){

                    if(monthBody.style.display==="none"){

                        monthBody.style.display="block";
                        monthToggle.innerHTML="▼";

                    }else{

                        monthBody.style.display="none";
                        monthToggle.innerHTML="▶";

                    }

                };

                // ======================
                // DATES
                // ======================

                data[year][month].forEach(date=>{

                    const label=document.createElement("label");
                    label.className="checkbox-item";

                    const check=document.createElement("input");

                    check.type="checkbox";
                    check.value=date;

                    if(filter.selectedDates.includes(date))
                        check.checked=true;

                    check.onchange = function () {

                        console.log("Clicked:", date);

                        if (!filter.selectedDates)
                            filter.selectedDates = [];

                        if (this.checked) {

                            if (!filter.selectedDates.includes(date))
                                filter.selectedDates.push(date);

                        } else {

                            filter.selectedDates =
                                filter.selectedDates.filter(d => d !== date);

                        }

                        console.log("selectedDates =", filter.selectedDates);
                        console.log("Length =", filter.selectedDates.length);
                        console.log("pivotConfig =", pivotConfig.filters);

                    };

                    label.appendChild(check);
                    label.append(" "+date);

                    monthBody.appendChild(label);

                });

                // Month select all

                monthCheck.onchange=function(){

                    monthBody.querySelectorAll("input").forEach(c=>{

                        c.checked=this.checked;
                        c.dispatchEvent(new Event("change"));

                    });

                };

                yearBody.appendChild(monthDiv);

            });

            // Year select all

            yearCheck.onchange=function(){

                yearBody.querySelectorAll("input").forEach(c=>{

                    c.checked=this.checked;
                    c.dispatchEvent(new Event("change"));

                });

            };

            container.appendChild(yearDiv);

        });

    });

}
const generateButton = document.getElementById("generate");
const builderArea = document.getElementById("builderArea");
const infoArea = document.querySelector(".info-area");
const outputArea = document.getElementById("outputArea");


if (generateButton) {

    generateButton.addEventListener("click", function () {

        if (pivotConfig.rows.length === 0 || pivotConfig.values.length === 0) {
            return;
        }

        // Move builder upward
        if (builderArea) {
            builderArea.classList.add("report-generated");
        }

        // Move information box upward
        if (infoArea) {
            infoArea.classList.add("report-generated");
        }

        // Show result area
        setTimeout(() => {

            if (outputArea) {
                outputArea.classList.add("report-generated");
            }

        }, 400);

    });

}

function showReportValidation(message) {
    const modal = document.getElementById("reportValidationModal");
    const messageElement = document.getElementById("reportValidationMessage");
    const closeButton = document.getElementById("closeReportValidation");

    if (!modal || !messageElement) return;

    messageElement.textContent = message;
    modal.hidden = false;
    closeButton?.focus();
}

function closeReportValidation() {
    const modal = document.getElementById("reportValidationModal");
    if (modal) modal.hidden = true;
}

document.getElementById("closeReportValidation")?.addEventListener("click", closeReportValidation);
document.getElementById("reportValidationModal")?.addEventListener("click", function (event) {
    if (event.target === this) closeReportValidation();
});

const pivotAiBtn = document.getElementById("pivotAiBtn");
const pivotAiModal = document.getElementById("pivotAiModal");
const closePivotAiModal = document.getElementById("closePivotAiModal");
const pivotSettingsBtn = document.getElementById("pivotSettingsBtn");
const pivotSettingsMenu = document.getElementById("pivotSettingsMenu");

pivotAiBtn?.addEventListener("click", () => { pivotAiModal.hidden = false; });
closePivotAiModal?.addEventListener("click", () => { pivotAiModal.hidden = true; });
pivotAiModal?.addEventListener("click", function (event) { if (event.target === this) this.hidden = true; });
pivotSettingsBtn?.addEventListener("click", function (event) {
    event.stopPropagation();
    const isOpen = pivotSettingsMenu.hidden;
    pivotSettingsMenu.hidden = !isOpen;
    this.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", event => {
    if (pivotSettingsMenu && !pivotSettingsMenu.hidden && !event.target.closest(".pivot-settings-wrap")) {
        pivotSettingsMenu.hidden = true;
        pivotSettingsBtn?.setAttribute("aria-expanded", "false");
    }
});

document.querySelectorAll("[data-pivot-period]").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll("[data-pivot-period]").forEach(item => item.classList.remove("active"));
        this.classList.add("active");
    });
});

document.querySelectorAll("[data-pivot-amount]").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll("[data-pivot-amount]").forEach(item => item.classList.remove("active"));
        this.classList.add("active");
    });
});

const pivotSwitchCompanyBtn = document.getElementById("pivotSwitchCompanyBtn");
const pivotCompanySelector = document.getElementById("pivotCompanySelector");
const pivotSelectAllCompanies = document.getElementById("pivotSelectAllCompanies");
const pivotCompanyInputs = [...document.querySelectorAll('input[name="pivot-active-company"]')];

pivotSwitchCompanyBtn?.addEventListener("click", function () {
    const isOpen = pivotCompanySelector.hidden;
    pivotCompanySelector.hidden = !isOpen;
    this.setAttribute("aria-expanded", String(isOpen));
});

pivotSelectAllCompanies?.addEventListener("change", function () {
    pivotCompanyInputs.forEach((input, index) => { input.checked = this.checked || index === 0; });
});

pivotCompanyInputs.forEach(input => input.addEventListener("change", () => {
    if (!pivotCompanyInputs.some(item => item.checked) && pivotCompanyInputs[0]) pivotCompanyInputs[0].checked = true;
    if (pivotSelectAllCompanies) pivotSelectAllCompanies.checked = pivotCompanyInputs.every(item => item.checked);
}));

document.addEventListener("DOMContentLoaded", function () {

    updateRowColumnOptions();
    updateColumnAccess();

});
function updateAggregationOptions() {

    const valueField =
        document.getElementById("valueField");

    const aggregate =
        document.getElementById("aggregate");


    if (!valueField || !aggregate)
        return;


    const field =
        valueField.value;


    // Clear existing options
    aggregate.innerHTML = "";


    // -------------------------------
    // Placeholder
    // -------------------------------

    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
        "Select Aggregation";

    placeholder.selected = true;

    aggregate.appendChild(placeholder);


    // No Value selected
    if (!field)
        return;


    // -------------------------------
    // Get column type
    // -------------------------------

    const type =
        (currentColumnTypes[field] || "").toLowerCase();


    const numericTypes = [
        "int",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "decimal",
        "numeric",
        "float",
        "double",
        "real"
    ];


    const isNumeric =
        numericTypes.some(
            t => type.startsWith(t)
        );


    // -------------------------------
    // Numeric field
    // -------------------------------

    if (isNumeric) {

        [
            "SUM",
            "COUNT",
            "AVG",
            "MIN",
            "MAX"
        ].forEach(agg => {

            const option =
                document.createElement("option");

            option.value = agg;
            option.textContent = agg;

            aggregate.appendChild(option);

        });

    }

    // -------------------------------
    // Text / non-numeric field
    // -------------------------------

    else {

        const option =
            document.createElement("option");

        option.value = "COUNT";
        option.textContent = "COUNT";

        aggregate.appendChild(option);

    }

}
document
    .getElementById("valueField")
    .addEventListener(
        "change",
        updateAggregationOptions
    );
// =======================================
// ADD VALUE AFTER AGGREGATION SELECTION
// =======================================

const valueField =
    document.getElementById("valueField");

const aggregateSelect =
    document.getElementById("aggregate");


if (aggregateSelect) {

    aggregateSelect.addEventListener(
        "change",
        function () {

            // No Value selected
            if (!valueField.value)
                return;


            // No Aggregation selected
            if (!this.value)
                return;


            // Add Value
            addValue();

        }
    );

}
// =======================================
// SAVE REPORT
// =======================================

const saveReportBtn =
    document.getElementById("saveReportBtn");


if (saveReportBtn) {

    saveReportBtn.addEventListener(
        "click",
        saveCurrentReport
    );

}


function saveCurrentReport() {


    const layoutSelect =
        document.getElementById("layoutType");

    if (layoutSelect) {

        pivotConfig.layout =
            layoutSelect.value;

    }

    // -----------------------------------
    // Make sure something was selected
    // -----------------------------------

    if (
        pivotConfig.rows.length === 0 &&
        pivotConfig.columns.length === 0 &&
        pivotConfig.values.length === 0
    ) {

        alert(
            "Please create a report before saving."
        );

        return;
    }


    // -----------------------------------
    // Ask for report name
    // -----------------------------------

    const reportName =
        prompt("Enter a name for this report:");


    if (!reportName)
        return;


    // -----------------------------------
    // Send to Flask
    // -----------------------------------

    fetch("/save-report", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            report_name:
                reportName.trim(),

            config:
                pivotConfig

        })

    })


    .then(response =>
        response.json()
    )


    .then(data => {

        if (data.success) {

            alert(
                "Report saved successfully."
            );

        }
        else {

            alert(
                data.error ||
                "Could not save report."
            );

        }

    })


    .catch(error => {

        console.error(error);

        alert(
            "Error saving report."
        );

    });

}

// =======================================
// MY SAVED REPORTS
// =======================================

const savedReportsBtn =
    document.getElementById(
        "savedReportsBtn"
    );


if (savedReportsBtn) {

    savedReportsBtn.addEventListener(
        "click",
        loadSavedReports
    );

}


// =======================================
// LOAD SAVED REPORTS
// =======================================

function loadSavedReports() {

    fetch("/saved-reports")

        .then(response =>
            response.json()
        )

        .then(reports => {

            const modal =
                document.getElementById(
                    "savedReportsModal"
                );

            const list =
                document.getElementById(
                    "savedReportsList"
                );


            // -----------------------------------
            // CHECK MODAL
            // -----------------------------------

            if (!modal || !list) {

                console.error(
                    "Saved Reports modal not found."
                );

                return;
            }


            // -----------------------------------
            // REMOVE ANY OPEN MENUS
            // -----------------------------------

            document
                .querySelectorAll(
                    ".saved-report-menu"
                )
                .forEach(menu => {

                    menu.remove();

                });


            // -----------------------------------
            // CLEAR OLD REPORTS
            // -----------------------------------

            list.innerHTML = "";


            // -----------------------------------
            // NO REPORTS
            // -----------------------------------

            if (!reports.length) {

                list.innerHTML = `

                    <div class="saved-reports-empty">

                        <i
                            class="fa-solid fa-folder-open"
                            style="
                                font-size: 28px;
                                margin-bottom: 10px;
                                display: block;
                                color: #0798d4;
                            "
                        ></i>

                        You don't have any
                        saved reports yet.

                    </div>

                `;

                openSavedReportsModal();

                return;
            }


            // -----------------------------------
            // CREATE REPORT ITEMS
            // -----------------------------------

            reports.forEach(
                (report, index) => {


                    // =================================
                    // REPORT ITEM
                    // =================================

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "saved-report-item";


                    // =================================
                    // REPORT HTML
                    // =================================

                    item.innerHTML = `

                        <span
                            class="saved-report-number"
                        >
                            ${index + 1}
                        </span>


                        <span
                            class="saved-report-details"
                        >

                            <span
                                class="saved-report-name"
                                title="${escapeHtml(
                                    report.report_name
                                )}"
                            >
                                ${escapeHtml(
                                    report.report_name
                                )}
                            </span>


                            ${
                                report.created_at
                                ?
                                `
                                <span
                                    class="saved-report-date"
                                >
                                    Created:
                                    ${formatSavedReportDate(
                                        report.created_at
                                    )}
                                </span>
                                `
                                :
                                ""
                            }

                        </span>


                        <!-- THREE DOT BUTTON -->

                        <button
                            type="button"
                            class="saved-report-menu-btn"
                            title="More options"
                        >

                            <i
                                class="fa-solid fa-ellipsis-vertical"
                            ></i>

                        </button>


                        <!-- OPEN ARROW -->

                        <i
                            class="
                                fa-solid
                                fa-arrow-right
                                saved-report-arrow
                            "
                        ></i>

                    `;


                    // =================================
                    // MENU BUTTON
                    // =================================

                    const menuButton =
                        item.querySelector(
                            ".saved-report-menu-btn"
                        );


                    // =================================
                    // OPEN REPORT BY CLICKING ITEM
                    // =================================

                    item.addEventListener(
                        "click",
                        function (event) {

                            /*
                               Don't open report if
                               three-dot button was clicked.
                            */

                            if (
                                event.target.closest(
                                    ".saved-report-menu-btn"
                                )
                            ) {

                                return;

                            }


                            closeSavedReportsModal();

                            openSavedReport(
                                report.id
                            );

                        }
                    );


                    // =================================
                    // THREE DOT MENU
                    // =================================

                    menuButton.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();


                            // =================================
                            // REMOVE EXISTING MENUS
                            // =================================

                            document
                                .querySelectorAll(
                                    ".saved-report-menu"
                                )
                                .forEach(
                                    menu => {

                                        menu.remove();

                                    }
                                );


                            // =================================
                            // CREATE MENU
                            // =================================

                            const menu =
                                document.createElement(
                                    "div"
                                );

                            menu.className =
                                "saved-report-menu";


                            // =================================
                            // MENU HTML
                            // =================================

                            menu.innerHTML = `

                                <button
                                    type="button"
                                    class="saved-menu-open"
                                >

                                    <i
                                        class="fa-solid fa-folder-open"
                                    ></i>

                                    <span>
                                        Open
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    class="saved-menu-rename"
                                >

                                    <i
                                        class="fa-solid fa-pen"
                                    ></i>

                                    <span>
                                        Rename
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    class="saved-menu-duplicate"
                                >

                                    <i
                                        class="fa-regular fa-copy"
                                    ></i>

                                    <span>
                                        Duplicate
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    class="saved-menu-delete"
                                >

                                    <i
                                        class="fa-solid fa-trash"
                                    ></i>

                                    <span>
                                        Delete
                                    </span>

                                </button>

                            `;


                            // =================================
                            // FORCE MENU VISIBILITY
                            // =================================

                            menu.style.position =
                                "fixed";

                            menu.style.zIndex =
                                "999999";

                            menu.style.display =
                                "block";

                            menu.style.visibility =
                                "visible";

                            menu.style.opacity =
                                "1";

                            menu.style.background =
                                "#ffffff";

                            menu.style.color =
                                "#222222";

                            menu.style.width =
                                "160px";

                            menu.style.padding =
                                "6px 0";

                            menu.style.borderRadius =
                                "8px";

                            menu.style.boxShadow =
                                "0 8px 25px rgba(0,0,0,0.25)";


                            // =================================
                            // ADD MENU TO BODY
                            // =================================

                            document.body.appendChild(
                                menu
                            );


                            // =================================
                            // GET BUTTON POSITION
                            // =================================

                            const buttonRect =
                                menuButton.getBoundingClientRect();


                            const menuWidth =
                                160;

                            const menuHeight =
                                menu.offsetHeight ||
                                170;

                            const spacing =
                                6;


                            let left =
                                buttonRect.right -
                                menuWidth;

                            let top =
                                buttonRect.bottom +
                                spacing;


                            // =================================
                            // KEEP INSIDE RIGHT EDGE
                            // =================================

                            if (
                                left +
                                menuWidth >
                                window.innerWidth -
                                10
                            ) {

                                left =
                                    window.innerWidth -
                                    menuWidth -
                                    10;

                            }


                            // =================================
                            // KEEP INSIDE LEFT EDGE
                            // =================================

                            if (
                                left < 10
                            ) {

                                left = 10;

                            }


                            // =================================
                            // OPEN UPWARD IF NEEDED
                            // =================================

                            if (
                                top +
                                menuHeight >
                                window.innerHeight -
                                10
                            ) {

                                top =
                                    buttonRect.top -
                                    menuHeight -
                                    spacing;

                            }


                            // =================================
                            // APPLY POSITION
                            // =================================

                            menu.style.left =
                                `${left}px`;

                            menu.style.top =
                                `${top}px`;


                            // =================================
                            // OPEN
                            // =================================

                            const openButton =
                                menu.querySelector(
                                    ".saved-menu-open"
                                );


                            if (openButton) {

                                openButton.addEventListener(
                                    "click",
                                    function (e) {

                                        e.stopPropagation();

                                        menu.remove();

                                        closeSavedReportsModal();

                                        openSavedReport(
                                            report.id
                                        );

                                    }
                                );

                            }


                            // =================================
                            // RENAME
                            // =================================

                            const renameButton =
                                menu.querySelector(
                                    ".saved-menu-rename"
                                );


                            if (renameButton) {

                                renameButton.addEventListener(
                                    "click",
                                    function (e) {

                                        e.stopPropagation();

                                        menu.remove();

                                        renameSavedReport(
                                            report
                                        );

                                    }
                                );

                            }


                            // =================================
                            // DUPLICATE
                            // =================================

                            const duplicateButton =
                                menu.querySelector(
                                    ".saved-menu-duplicate"
                                );


                            if (duplicateButton) {

                                duplicateButton.addEventListener(
                                    "click",
                                    function (e) {

                                        e.stopPropagation();

                                        menu.remove();

                                        alert(
                                            "Duplicate functionality will be added next."
                                        );

                                    }
                                );

                            }


                            // =================================
                            // DELETE
                            // =================================

                            const deleteButton =
                                menu.querySelector(
                                    ".saved-menu-delete"
                                );


                            if (deleteButton) {

                                deleteButton.addEventListener(
                                    "click",
                                    function (e) {

                                        e.stopPropagation();

                                        menu.remove();

                                        deleteSavedReport(
                                            report
                                        );

                                    }
                                );

                            }

                        }
                    );


                    // =================================
                    // ADD REPORT ITEM TO LIST
                    // =================================

                    list.appendChild(
                        item
                    );

                }
            );


            // =================================
            // OPEN SAVED REPORTS MODAL
            // =================================

            openSavedReportsModal();

        })


        // =================================
        // ERROR
        // =================================

        .catch(error => {

            console.error(
                "Saved Reports Error:",
                error
            );


            const modal =
                document.getElementById(
                    "savedReportsModal"
                );

            const list =
                document.getElementById(
                    "savedReportsList"
                );


            if (
                modal &&
                list
            ) {

                list.innerHTML = `

                    <div
                        class="saved-reports-empty"
                    >

                        Unable to load
                        saved reports.

                    </div>

                `;

                openSavedReportsModal();

            }

        });

}
// =======================================
// OPEN MODAL
// =======================================

function openSavedReportsModal() {

    const modal =
        document.getElementById(
            "savedReportsModal"
        );


    if (!modal)
        return;


    modal.classList.add(
        "show"
    );

}


// =======================================
// CLOSE MODAL
// =======================================

// =========================================================
// CLOSE SAVED REPORTS MODAL
// =========================================================

function closeSavedReportsModal() {

    // -----------------------------------------
    // REMOVE ALL OPEN SAVED REPORT MENUS
    // -----------------------------------------

    document
        .querySelectorAll(
            ".saved-report-floating-menu, .saved-report-menu"
        )
        .forEach(menu => {
            menu.remove();
        });


    // -----------------------------------------
    // CLOSE MODAL
    // -----------------------------------------

    const modal =
        document.getElementById(
            "savedReportsModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );

}


// =======================================
// CLOSE BUTTONS
// =======================================

// =========================================================
// CLOSE BUTTON
// =========================================================

const closeSavedReports =
    document.getElementById(
        "closeSavedReports"
    );


if (closeSavedReports) {

    closeSavedReports.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            closeSavedReportsModal();

        }
    );

}


// =========================================================
// CANCEL BUTTON
// =========================================================

const cancelSavedReports =
    document.getElementById(
        "cancelSavedReports"
    );


if (cancelSavedReports) {

    cancelSavedReports.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            closeSavedReportsModal();

        }
    );

}


// =======================================
// CLOSE WHEN CLICKING OUTSIDE
// =======================================

// =========================================================
// CLOSE SAVED REPORTS WHEN CLICKING OUTSIDE
// =========================================================

const savedReportsOverlay =
    document.querySelector(
        ".saved-reports-overlay"
    );


if (savedReportsOverlay) {

    savedReportsOverlay.addEventListener(
        "click",
        function (event) {

            // Only close when the actual overlay
            // is clicked.

            if (
                event.target ===
                savedReportsOverlay
            ) {

                closeSavedReportsModal();

            }

        }
    );

}


// =======================================
// ESCAPE KEY
// =======================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeSavedReportsModal();

        }

    }
);
// =======================================
// ESCAPE HTML
// =======================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


// =======================================
// FORMAT DATE
// =======================================

function formatSavedReportDate(
    dateValue
) {

    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}
function openSavedReport(reportId) {

    fetch(`/saved-report/${reportId}`)

        .then(response => response.json())

        .then(report => {

            if (report.error) {
                alert(report.error);
                return;
            }


            // =================================
            // RESTORE SAVED CONFIGURATION
            // =================================

            pivotConfig = report.report_config || {};

            // Backward compatibility for older saved reports
            currentDataSource =
                pivotConfig.dataSource || "SalesInventory";

            pivotConfig.dataSource = currentDataSource;

            const layoutSelect =
                document.getElementById("layoutType");

            if (
                layoutSelect &&
                pivotConfig.layout
            ) {

                layoutSelect.value =
                    pivotConfig.layout;

            }


            // Make sure period exists
            if (!pivotConfig.period) {
                pivotConfig.period = null;
            }


            // =================================
            // LOAD CORRECT DATA SOURCE COLUMNS
            // =================================

            loadReportColumns(currentDataSource)
                .then(() => {

                    // =================================
                    // RENDER ALL BUILDERS
                    // =================================

                    renderRows();
                    renderColumns();
                    renderValues();
                    renderPeriod();
                    renderFilters();

                    // =================================
                    // RESTORE PERIOD DROPDOWN
                    // =================================

                    const periodSelect =
                        document.getElementById("periodField");

                    if (periodSelect) {
                        periodSelect.value =
                            pivotConfig.period
                                ? pivotConfig.period.field
                                : "";
                    }

                    // =================================
                    // GENERATE REPORT
                    // =================================

                    generatePivot();
                });


        })

        .catch(error => {

            console.error(error);

            alert("Error opening saved report.");

        });
}
document.querySelectorAll(".report-type").forEach(button => {

    button.addEventListener("click", async function () {

        const reportType = this.dataset.type;
        const newDataSource = REPORT_DATA_SOURCES[reportType];

        // Only configured report types are allowed for now
        if (!newDataSource) {
            alert(
                "Data source is not configured for this report type yet."
            );
            return;
        }

        // Remove active from all
        document
            .querySelectorAll(".report-type")
            .forEach(btn => btn.classList.remove("active"));

        // Activate clicked report type
        this.classList.add("active");

        currentDataSource = newDataSource;
        pivotConfig.dataSource = currentDataSource;

        console.log("Selected Report:", reportType);
        console.log("Data Source:", currentDataSource);

        // =====================================
        // HIDE OLD REPORT ACTION BUTTONS
        // =====================================

        const exportCsvBtn = document.getElementById("exportCsvBtn");
        const saveReportBtn = document.getElementById("saveReportBtn");

        if (exportCsvBtn) {
            exportCsvBtn.style.display = "none";
        }

        if (saveReportBtn) {
            saveReportBtn.style.display = "none";
        }

        // =====================================
        // CLEAR OLD REPORT CONFIGURATION
        // =====================================

        pivotConfig.rows = [];
        pivotConfig.columns = [];
        pivotConfig.values = [];
        pivotConfig.period = null;
        pivotConfig.filters = [];

        // Clear previous output
        const output = document.getElementById("output");
        if (output) {
            output.innerHTML = "";
        }

        // =====================================
        // LOAD COLUMNS FOR SELECTED TABLE
        // =====================================

        try {

            await loadReportColumns(currentDataSource);

            renderRows();
            renderColumns();
            renderValues();
            renderPeriod();
            renderFilters();

            resetFieldSelects();
            updateRowColumnOptions();
            updateColumnAccess();
            updateAggregationOptions();

        } catch (error) {

            console.error(
                "Unable to load report columns:",
                error
            );

            alert(
                "Unable to load columns for " +
                currentDataSource +
                ".\n\n" +
                error.message
            );
        }
    });

});


// =======================================
// LOAD REPORT COLUMNS
// =======================================

async function loadReportColumns(dataSource) {

    const response = await fetch(
        "/report-columns/" +
        encodeURIComponent(dataSource)
    );

    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(
            data.error ||
            "Unable to load report columns."
        );
    }

    currentDateColumns = data.date_columns || [];
    currentColumnTypes = data.column_types || {};

    populateSelect(
        "rowField",
        data.columns || [],
        "Select Rows"
    );

    populateSelect(
        "columnField",
        data.columns || [],
        "Select Columns"
    );

    populateSelect(
        "valueField",
        data.columns || [],
        "Select Values"
    );

    populateSelect(
        "filterField",
        data.columns || [],
        "Select Filters"
    );

    populateSelect(
        "periodField",
        currentDateColumns,
        "Select Period"
    );
}


// =======================================
// POPULATE SELECT DROPDOWN
// =======================================

function populateSelect(selectId, columns, placeholder) {

    const select = document.getElementById(selectId);

    if (!select) return;

    select.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    option.selected = true;
    select.appendChild(option);

    columns.forEach(column => {

        const item = document.createElement("option");
        item.value = column;
        item.textContent = column;
        select.appendChild(item);

    });
}


// =======================================
// RESET FIELD SELECTS
// =======================================

function resetFieldSelects() {

    const ids = [
        "rowField",
        "columnField",
        "valueField",
        "periodField",
        "filterField"
    ];

    ids.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.value = "";
    });

    const aggregate =
        document.getElementById("aggregate");

    if (aggregate) {
        aggregate.innerHTML =
            '<option value="">Select Aggregation</option>';
    }
}

function renderPivotTable(result) {

    const output = document.getElementById("output");

    if (!output)
        return;

    output.innerHTML = "";

    if (!result.data || result.data.length === 0) {

        output.innerHTML =
            "<div class='no-data'>No Data Found</div>";

        return;
    }


    // ==========================================
    // CONFIG
    // ==========================================

    const rowFields =
        pivotConfig.rows || [];

    const columnFields =
        pivotConfig.columns || [];

    const valueFields =
        pivotConfig.values || [];


    const resultColumns =
        result.columns || [];


    // ==========================================
    // ROW COLUMNS
    // ==========================================

    const rowColumns =
        resultColumns.filter(
            column =>
                rowFields.includes(column)
        );


    // ==========================================
    // VALUE / PIVOT COLUMNS
    // ==========================================

    const valueColumns =
        resultColumns.filter(
            column =>
                !rowColumns.includes(column)
        );


    // ==========================================
    // PARSE VALUE COLUMNS
    // ==========================================

    const parsedColumns =
        valueColumns.map(column => {

            // ----------------------------------
            // PIVOT MODE
            // ----------------------------------

            if (column.startsWith("PV__")) {

                const parts =
                    column.split("__");

                return {

                    original: column,

                    isPivot: true,

                    pivotValue:
                        parts[1] || "",

                    aggregate:
                        parts[2] || "",

                    field:
                        parts.slice(3).join("__")

                };

            }


            // ----------------------------------
            // NO COLUMN MODE
            // ----------------------------------

            const match =
                column.match(
                    /^(SUM|COUNT|AVG|MIN|MAX)_(.+)$/
                );


            if (match) {

                return {

                    original: column,

                    isPivot: false,

                    pivotValue: "",

                    aggregate:
                        match[1],

                    field:
                        match[2]

                };

            }


            return {

                original: column,

                isPivot: false,

                pivotValue: "",

                aggregate: "",

                field: column

            };

        });


    // ==========================================
    // PIVOT GROUPS
    // ==========================================

    const pivotGroups = [];


    if (columnFields.length > 0) {

        parsedColumns.forEach(item => {

            let group =
                pivotGroups.find(
                    g =>
                        g.label === item.pivotValue
                );


            if (!group) {

                group = {

                    label:
                        item.pivotValue,

                    columns: []

                };

                pivotGroups.push(group);

            }


            group.columns.push(item);

        });

    }


    // ==========================================
    // TABLE
    // ==========================================

    const table =
        document.createElement("table");

    table.className =
        "excel-pivot-table";


    // ==========================================
    // HEADER
    // ==========================================

    const thead =
        document.createElement("thead");


    // ==========================================
    // HEADER ROW 1
    // ==========================================

    const headerRow1 =
        document.createElement("tr");


    // ------------------------------------------
    // ROW HEADERS
    // ------------------------------------------

    rowColumns.forEach(column => {

        const th =
            document.createElement("th");

        th.textContent =
            column;

        th.rowSpan =
            columnFields.length > 0
                ? 2
                : 1;

        headerRow1.appendChild(th);

    });


    // ------------------------------------------
    // PIVOT COLUMNS
    // ------------------------------------------

    if (columnFields.length > 0) {

        pivotGroups.forEach(group => {

            const th =
                document.createElement("th");

            th.textContent =
                formatPivotHeader(
                    group.label
                );

            th.colSpan =
                group.columns.length;

            th.className =
                "pivot-column-group";

            headerRow1.appendChild(th);

        });

    }


    // ------------------------------------------
    // NORMAL VALUE COLUMNS
    // ------------------------------------------

    else {

        parsedColumns.forEach(item => {

            const th =
                document.createElement("th");

            th.textContent =
                formatValueHeader(item);

            headerRow1.appendChild(th);

        });

    }


    thead.appendChild(
        headerRow1
    );


    // ==========================================
    // HEADER ROW 2
    // ==========================================

    if (columnFields.length > 0) {

        const headerRow2 =
            document.createElement("tr");


        parsedColumns.forEach(item => {

            const th =
                document.createElement("th");

            th.textContent =
                formatValueHeader(item);

            headerRow2.appendChild(th);

        });


        thead.appendChild(
            headerRow2
        );

    }


    table.appendChild(
        thead
    );


    // ==========================================
    // TBODY
    // ==========================================

    const tbody =
        document.createElement("tbody");


    // ==========================================
    // GRAND TOTAL STORAGE
    // ==========================================

    const grandTotals = {};

    parsedColumns.forEach(item => {

        grandTotals[item.original] = 0;

    });


    // ==========================================
    // RENDER MULTI-ROW HIERARCHY
    // ==========================================

    renderHierarchy(
        result.data,
        rowColumns,
        parsedColumns,
        tbody,
        grandTotals,
        0
    );


    table.appendChild(
        tbody
    );


    // ==========================================
    // GRAND TOTAL
    // ==========================================

    const tfoot =
        document.createElement("tfoot");


    const grandRow =
        document.createElement("tr");

    grandRow.className =
        "pivot-grand-total-row";


    const grandLabel =
        document.createElement("td");

    grandLabel.textContent =
        "Grand Total";

    grandLabel.colSpan =
        Math.max(
            rowColumns.length,
            1
        );

    grandRow.appendChild(
        grandLabel
    );


    let overallTotal = 0;


    parsedColumns.forEach(item => {

        const td =
            document.createElement("td");


        const total =
            grandTotals[item.original] || 0;


        td.textContent =
            formatNumber(total);

        td.style.textAlign =
            "right";


        overallTotal +=
            total;


        grandRow.appendChild(td);

    });


    tfoot.appendChild(
        grandRow
    );


    table.appendChild(
        tfoot
    );


    output.appendChild(
        table
    );

}
function renderHierarchy(
    data,
    rowColumns,
    parsedColumns,
    tbody,
    grandTotals
) {

    renderGroupLevel(
        data,
        rowColumns,
        parsedColumns,
        tbody,
        grandTotals,
        0
    );

}
function renderGroupLevel(
    data,
    rowColumns,
    parsedColumns,
    tbody,
    grandTotals,
    level,
    parentGroupId = null
) {

    const field =
        rowColumns[level];

    // ==========================================
    // GROUP DATA
    // ==========================================

    const groups = new Map();

    data.forEach(row => {

        const key =
            row[field] ?? "(Blank)";

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(row);

    });


    // ==========================================
    // PROCESS EACH GROUP
    // ==========================================

    groups.forEach(
        (groupRows, groupValue) => {

            const groupId =
                "pivot-group-" +
                level +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 10);


            // ======================================
            // LAST LEVEL = CUSTOMER
            // ======================================

            if (
                level ===
                rowColumns.length - 1
            ) {

                // ----------------------------------
                // CUSTOMER ROWS
                // ----------------------------------

                groupRows.forEach(row => {

                    const tr =
                        createLeafRow(
                            row,
                            rowColumns,
                            parsedColumns,
                            grandTotals
                        );

                    if (parentGroupId) {

                        tr.dataset.parentGroup =
                            parentGroupId;

                    }

                    tbody.appendChild(tr);

                });


                // ----------------------------------
                // CUSTOMER SUBTOTAL
                // ----------------------------------

                const subtotal =
                    createGroupSubtotal(
                        groupRows,
                        groupValue,
                        rowColumns,
                        parsedColumns,
                        level
                    );

                if (parentGroupId) {

                    subtotal.dataset.parentGroup =
                        parentGroupId;

                }

                tbody.appendChild(
                    subtotal
                );

                return;
            }


            // ======================================
            // CREATE PARENT ROW
            // ======================================

            const parentRow =
                document.createElement("tr");

            parentRow.className =
                "pivot-parent-row";

            parentRow.dataset.groupId =
                groupId;

            if (parentGroupId) {

                parentRow.dataset.parentGroup =
                    parentGroupId;

            }


            // ======================================
            // EMPTY CELLS BEFORE CURRENT LEVEL
            // ======================================

            for (let i = 0; i < level; i++) {

                const emptyTd =
                    document.createElement("td");

                emptyTd.textContent = "";

                parentRow.appendChild(
                    emptyTd
                );

            }


            // ======================================
            // LABEL CELL
            // ======================================

            const labelTd =
                document.createElement("td");

            labelTd.className =
                "pivot-parent-label";


            // ======================================
            // TOGGLE
            // ======================================

            const toggle =
                createPivotToggle(
                    groupId,
                    false
                );

            labelTd.appendChild(
                toggle
            );


            // ======================================
            // LABEL
            // ======================================

            const label =
                document.createElement("span");

            label.textContent =
                groupValue;

            labelTd.appendChild(
                label
            );


            parentRow.appendChild(
                labelTd
            );


            // ======================================
            // EMPTY VALUE CELLS
            // ======================================

            parsedColumns.forEach(() => {

                const td =
                    document.createElement("td");

                td.textContent = "";

                parentRow.appendChild(
                    td
                );

            });


            // ======================================
            // EMPTY GRAND TOTAL
            // ======================================

            // const totalTd =
            //     document.createElement("td");

            // totalTd.textContent = "";

            // parentRow.appendChild(
            //     totalTd
            // );


            // ======================================
            // ADD PARENT ROW
            // ======================================

            tbody.appendChild(
                parentRow
            );


            // ======================================
            // CHILD LEVEL
            // ======================================

            renderGroupLevel(
                groupRows,
                rowColumns,
                parsedColumns,
                tbody,
                grandTotals,
                level + 1,
                groupId
            );


            // ======================================
            // GROUP SUBTOTAL
            // ======================================

            const subtotal =
                createGroupSubtotal(
                    groupRows,
                    groupValue,
                    rowColumns,
                    parsedColumns,
                    level
                );

            subtotal.dataset.parentGroup =
                parentGroupId || "";

            tbody.appendChild(
                subtotal
            );

        }
    );
}
function createLeafRow(
    row,
    rowColumns,
    parsedColumns,
    grandTotals
) {

    const tr =
        document.createElement("tr");


    tr.className =
        "pivot-leaf-row";


    // ==========================================
    // ROW FIELDS
    // ==========================================

    rowColumns.forEach(
        (column, index) => {

            const td =
                document.createElement("td");


            // ======================================
            // ONLY SHOW LOWEST LEVEL
            // ======================================

            if (
                index ===
                rowColumns.length - 1
            ) {

                td.textContent =
                    row[column] ?? "";


                td.style.paddingLeft =
                    `${rowColumns.length * 20}px`;

            }
            else {

                // Parent fields are already
                // displayed above

                td.textContent =
                    "";

            }


            tr.appendChild(
                td
            );

        }
    );


    // ==========================================
    // VALUES
    // ==========================================

    appendPivotValues(
        tr,
        row,
        parsedColumns,
        grandTotals
    );


    return tr;

}
function createGroupSubtotal(
    groupRows,
    groupValue,
    rowColumns,
    parsedColumns,
    level
) {

    const tr = document.createElement("tr");

    tr.className = "pivot-subtotal";


    // ==========================================
    // FIND ACTUAL VALUE COLUMNS
    // ==========================================

    if (!groupRows || groupRows.length === 0) {
        return tr;
    }

    const firstRow = groupRows[0];

    const valueColumns =
        Object.keys(firstRow).filter(
            column => !rowColumns.includes(column)
        );


    // ==========================================
    // EMPTY CELLS BEFORE CURRENT LEVEL
    // ==========================================

    for (let i = 0; i < level; i++) {

        const td = document.createElement("td");

        td.textContent = "";

        tr.appendChild(td);
    }


    // ==========================================
    // TOTAL LABEL
    // ==========================================

    const labelTd =
        document.createElement("td");

    labelTd.className =
        "pivot-subtotal-label";

    labelTd.textContent =
        groupValue + " Total";

    tr.appendChild(labelTd);


    // ==========================================
    // EMPTY CELLS FOR LOWER ROW LEVELS
    // ==========================================

    for (
        let i = level + 1;
        i < rowColumns.length;
        i++
    ) {

        const td =
            document.createElement("td");

        td.textContent = "";

        tr.appendChild(td);
    }


    // ==========================================
    // CALCULATE VALUE TOTALS
    // ==========================================

    valueColumns.forEach(column => {

        const td =
            document.createElement("td");

        let total = 0;

        groupRows.forEach(row => {

            const rawValue =
                row[column];

            if (
                rawValue !== null &&
                rawValue !== undefined &&
                rawValue !== ""
            ) {

                const numericValue =
                    Number(rawValue);

                if (!isNaN(numericValue)) {

                    total += numericValue;

                }

            }

        });


        td.textContent =
            total.toLocaleString("en-IN");

        td.style.textAlign = "right";

        tr.appendChild(td);

    });



    return tr;
}
function appendPivotValues(
    tr,
    row,
    parsedColumns,
    grandTotals
) {

    let rowTotal = 0;


    parsedColumns.forEach(
        item => {

            const td =
                document.createElement("td");


            const rawValue =
                row[item.original];


            if (
                rawValue !== null &&
                rawValue !== undefined &&
                rawValue !== "" &&
                !isNaN(rawValue)
            ) {

                const number =
                    Number(rawValue);


                td.textContent =
                    formatNumber(number);


                td.style.textAlign =
                    "right";


                grandTotals[
                    item.original
                ] += number;


                rowTotal += number;

            }
            else {

                td.textContent = "";

            }


            tr.appendChild(
                td
            );

        }
    );


    // ==========================================
    // ROW GRAND TOTAL
    // ==========================================

    // const totalTd =
    //     document.createElement("td");


    // totalTd.textContent =
    //     formatNumber(
    //         rowTotal
    //     );


    // totalTd.style.textAlign =
    //     "right";


    // totalTd.className =
    //     "pivot-grand-total";


    // tr.appendChild(
    //     totalTd
    // );

}
function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        isNaN(value)
    ) {

        return "";

    }


    return Number(value)
        .toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );

}
function formatValueHeader(item) {

    let field =
        item.field
            .replace(
                /_/g,
                " "
            );


    if (item.aggregate) {

        return `${field} (${item.aggregate})`;

    }


    return field;

}
function formatPivotHeader(value) {

    if (!value)
        return "";

    /*
        2025_04_01
        ↓
        01-Apr-2025
    */

    const match =
        value.match(
            /^(\d{4})_(\d{2})_(\d{2})$/
        );


    if (match) {

        const year =
            match[1];

        const month =
            match[2];

        const day =
            match[3];


        const date =
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );


        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    return value.replace(
        /_/g,
        " "
    );

}
function getValueDisplayName(
    column,
    valueFields
) {

    for (const value of valueFields) {

        const safeField =
            value.field.replace(
                /[^A-Za-z0-9_]/g,
                "_"
            );

        const suffix =
            `_${value.aggregate}_${safeField}`;


        if (column.endsWith(suffix)) {

            return `${value.field} (${value.aggregate})`;

        }

    }


    return column;
}
function buildPivotColumnGroups(
    pivotColumns,
    valueFields
) {

    const groups = [];

    pivotColumns.forEach(column => {

        let matchedValue = null;
        let groupLabel = column;


        // ======================================
        // FIND VALUE FIELD
        // ======================================

        for (const value of valueFields) {

            const safeField =
                value.field.replace(
                    /[^A-Za-z0-9_]/g,
                    "_"
                );

            const suffix =
                `_${value.aggregate}_${safeField}`;


            if (column.endsWith(suffix)) {

                matchedValue = value;

                groupLabel =
                    column.slice(
                        0,
                        -suffix.length
                    );

                break;

            }

        }


        // ======================================
        // FIND EXISTING GROUP
        // ======================================

        let group =
            groups.find(
                g => g.label === groupLabel
            );


        if (!group) {

            group = {

                label: groupLabel,

                values: []

            };

            groups.push(group);

        }


        group.values.push({

            column: column,

            value: matchedValue

        });

    });


    return groups;
}
function createPivotToggle(
    groupId,
    initiallyExpanded = false
) {
    const button =
        document.createElement("button");

    button.className =
        "pivot-toggle";

    button.type =
        "button";

    button.textContent =
        initiallyExpanded
            ? "−"
            : "+";

    button.dataset.groupId =
        groupId;

    button.onclick =
        function(e) {

            e.stopPropagation();

            const expanded =
                button.textContent === "−";

            togglePivotGroup(
                groupId,
                !expanded
            );

            button.textContent =
                expanded
                    ? "+"
                    : "−";
        };

    /*
       Start collapsed
    */
    if (!initiallyExpanded) {

        setTimeout(() => {

            togglePivotGroup(
                groupId,
                false
            );

        }, 0);
    }

    return button;
}
function togglePivotGroup(
    groupId,
    expanded
) {

    // ==========================================
    // FIND ALL ROWS BELONGING TO GROUP
    // ==========================================

    const rows =
        document.querySelectorAll(
            `[data-parent-group="${groupId}"]`
        );


    rows.forEach(row => {

        if (expanded) {

            row.classList.remove(
                "pivot-hidden"
            );

        }
        else {

            row.classList.add(
                "pivot-hidden"
            );

        }

    });


    // ==========================================
    // FIND NESTED GROUPS
    // ==========================================

    const nestedGroups =
        document.querySelectorAll(
            `[data-parent-group="${groupId}"][data-group-id]`
        );


    nestedGroups.forEach(
        nestedGroup => {

            const nestedId =
                nestedGroup.dataset.groupId;


            if (!expanded) {

                nestedGroup.classList.add(
                    "pivot-hidden"
                );


                // Hide everything below it

                hideNestedRows(
                    nestedId
                );

            }
            else {

                nestedGroup.classList.remove(
                    "pivot-hidden"
                );

            }

        }
    );

}
function hideNestedRows(groupId) {

    const children =
        document.querySelectorAll(
            `[data-parent-group="${groupId}"]`
        );


    children.forEach(row => {

        row.classList.add(
            "pivot-hidden"
        );


        if (
            row.dataset.groupId
        ) {

            hideNestedRows(
                row.dataset.groupId
            );

        }

    });

}
/* =========================================
   RESPONSIVE 1920 × 1080 CANVAS
========================================= */

(function () {

    const DESIGN_WIDTH = 1920;
    const DESIGN_HEIGHT = 1080;

    const canvas =
        document.querySelector(".pivot-canvas");

    const wrapper =
        document.querySelector(".pivot-wrapper");

    if (!canvas || !wrapper) {
        console.warn("Pivot canvas/wrapper not found.");
        return;
    }

    function updateCanvasScale() {

        const viewportWidth =
            document.documentElement.clientWidth;

        const viewportHeight =
            document.documentElement.clientHeight;

        /*
         * Base scale on browser width.
         * This makes the 1920px canvas use the
         * available browser width at Ctrl + 0.
         */
        let scale =
            viewportWidth / DESIGN_WIDTH;

        /*
         * Do not enlarge beyond 100%.
         */
        scale = Math.min(scale, 1);

        /*
         * Apply scale.
         */
        document.documentElement.style
            .setProperty(
                "--canvas-scale",
                scale
            );

        /*
         * Keep wrapper height synchronized.
         */
        wrapper.style.minHeight =
            (DESIGN_HEIGHT * scale) + "px";
    }

    updateCanvasScale();

    window.addEventListener(
        "resize",
        updateCanvasScale
    );

})();

// =======================================
// EXPORT TABULAR REPORT TO CSV
// =======================================

function exportTabularCSV() {

    if (!lastTabularReport) {
        alert(
            "CSV export is available only for Tabular reports."
        );
        return;
    }

    const columns =
        lastTabularReport.columns;

    const data =
        lastTabularReport.data;

    // ---------------------------------------
    // CSV escape helper
    // ---------------------------------------

    function escapeCSV(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        value = String(value);

        // Escape quotes
        value = value.replace(/"/g, '""');

        // Wrap every value in quotes
        return `"${value}"`;
    }

    // ---------------------------------------
    // Header
    // ---------------------------------------

    const csvRows = [];

    csvRows.push(
        columns
            .map(column => escapeCSV(column))
            .join(",")
    );

    // ---------------------------------------
    // Data
    // ---------------------------------------

    data.forEach(row => {

        const rowData =
            columns.map(column => {

                return escapeCSV(
                    row[column]
                );

            });

        csvRows.push(
            rowData.join(",")
        );
    });

    // ---------------------------------------
    // Create CSV file
    // ---------------------------------------

    const csvContent =
        "\uFEFF" +
        csvRows.join("\r\n");

    const blob =
        new Blob(
            [csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

    // ---------------------------------------
    // File name
    // ---------------------------------------

    const fileName =
        "Tabular_Report_" +
        new Date()
            .toISOString()
            .slice(0, 10) +
        ".csv";

    // ---------------------------------------
    // Download
    // ---------------------------------------

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
// =======================================
// EXPORT CSV BUTTON
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const exportCsvBtn =
            document.getElementById(
                "exportCsvBtn"
            );

        if (exportCsvBtn) {

            exportCsvBtn.addEventListener(
                "click",
                exportTabularCSV
            );

        }

    }
);
// =======================================
// EXPORT PIVOT REPORT TO EXCEL
// =======================================

function exportCurrentPivotExcel() {

    console.log("Excel Export clicked");


    // ---------------------------------------
    // Check Pivot report
    // ---------------------------------------

    if (!lastPivotReport) {

        alert(
            "Excel export is available only for Pivot reports."
        );

        return;
    }


    // ---------------------------------------
    // Check SheetJS
    // ---------------------------------------

    if (typeof XLSX === "undefined") {

        alert(
            "Excel export library is not loaded."
        );

        return;
    }


    // ---------------------------------------
    // Find Pivot table
    // ---------------------------------------

    const pivotTable =
        document.querySelector(
            ".excel-pivot-table"
        );


    if (!pivotTable) {

        alert(
            "Pivot table not found."
        );

        return;
    }


    try {

        // -----------------------------------
        // Clone table
        // -----------------------------------

        const exportTable =
            pivotTable.cloneNode(true);


        // -----------------------------------
        // Remove interactive buttons
        // -----------------------------------

        exportTable
            .querySelectorAll(
                ".pivot-toggle"
            )
            .forEach(button => {

                /*
                   Keep the hierarchy indentation
                   but remove the +/- button
                   itself from Excel.
                */

                button.remove();

            });


        // -----------------------------------
        // Remove other interactive elements
        // -----------------------------------

        exportTable
            .querySelectorAll(
                "button"
            )
            .forEach(button => {

                button.remove();

            });


        // -----------------------------------
        // Create workbook
        // -----------------------------------

        const workbook =
            XLSX.utils.book_new();


        // -----------------------------------
        // Convert Pivot table
        // -----------------------------------

        const worksheet =
            XLSX.utils.table_to_sheet(
                exportTable,
                {
                    raw: true
                }
            );


        // -----------------------------------
        // Column widths
        // -----------------------------------

        const range =
            XLSX.utils.decode_range(
                worksheet["!ref"]
            );


        const columnWidths = [];


        for (
            let column = range.s.c;
            column <= range.e.c;
            column++
        ) {

            let maxLength = 0;


            for (
                let row = range.s.r;
                row <= range.e.r;
                row++
            ) {

                const cellAddress =
                    XLSX.utils.encode_cell({
                        r: row,
                        c: column
                    });


                const cell =
                    worksheet[cellAddress];


                if (!cell)
                    continue;


                const value =
                    String(
                        cell.v ?? ""
                    );


                maxLength =
                    Math.max(
                        maxLength,
                        value.length
                    );

            }


            columnWidths.push({

                wch:
                    Math.min(
                        Math.max(
                            maxLength + 2,
                            12
                        ),
                        35
                    )

            });

        }


        worksheet["!cols"] =
            columnWidths;


        // -----------------------------------
        // Freeze header
        // -----------------------------------

        worksheet["!freeze"] = {
            xSplit: 0,
            ySplit: 2
        };


        // -----------------------------------
        // Add worksheet
        // -----------------------------------

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Pivot Report"
        );


        // -----------------------------------
        // File name
        // -----------------------------------

        const fileName =
            "Pivot_Report_" +
            new Date()
                .toISOString()
                .slice(0, 10) +
            ".xlsx";


        // -----------------------------------
        // Download
        // -----------------------------------

        XLSX.writeFile(
            workbook,
            fileName
        );


        console.log(
            "Excel exported successfully."
        );

    }
    catch (error) {

        console.error(
            "Excel Export Error:",
            error
        );

        alert(
            "Excel export failed.\n\n" +
            error.message
        );

    }

}
// =======================================
// EXPORT EXCEL BUTTON
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const exportExcelBtn =
            document.getElementById(
                "exportExcelBtn"
            );


        if (exportExcelBtn) {

            exportExcelBtn.addEventListener(
                "click",
                exportCurrentPivotExcel
            );

        }

    }
);
// =======================================
// RENAME SAVED REPORT
// =======================================

function renameSavedReport(report) {

    const newName =
        prompt(
            "Enter new report name:",
            report.report_name
        );


    if (
        newName === null ||
        !newName.trim()
    ) {

        return;

    }


    fetch(
        `/saved-report/${report.id}/rename`,
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                report_name:
                    newName.trim()

            })

        }
    )

    .then(response =>
        response.json()
    )

    .then(result => {

        if (result.error) {

            alert(
                result.error
            );

            return;

        }


        loadSavedReports();

    })

    .catch(error => {

        console.error(
            error
        );

        alert(
            "Unable to rename report."
        );

    });

}
document.addEventListener("DOMContentLoaded", function () {

    const rowField = document.getElementById("rowField");
    const columnField = document.getElementById("columnField");
    const valueField = document.getElementById("valueField");
    const periodField = document.getElementById("periodField");
    const filterField = document.getElementById("filterField");
    const aggregateSelect = document.getElementById("aggregate");

    // ==========================
    // ROW
    // ==========================

    if (rowField) {

        rowField.addEventListener("change", function () {

            if (!this.value)
                return;

            addRow();

        });

    }


    // ==========================
    // COLUMN
    // ==========================

    if (columnField) {

        columnField.addEventListener("change", function () {

            if (!this.value)
                return;

            addColumn();

        });

    }


    // ==========================
    // VALUE
    // ==========================

// ==========================
// VALUE + AGGREGATION
// ==========================

    if (valueField && aggregateSelect) {

    aggregateSelect.addEventListener("change", function () {

        // Do nothing until a Value is selected
        if (!valueField.value)
            return;

        addValue();

    });

    }


    // ==========================
    // PERIOD
    // ==========================

    if (periodField) {

        periodField.addEventListener("change", function () {

            if (!this.value)
                return;

            addPeriod();

        });

    }


    // ==========================
    // FILTER
    // ==========================

    if (filterField) {

        filterField.addEventListener("change", function () {

            if (!this.value)
                return;

            addFilter();

        });

    }

});
