// ================================
// Global Configuration
// ================================

let pivotConfig = {
    rows: [],
    columns: [],
    values: [],
    filters: []
};

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

    remove.onclick = removeCallback;

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

            })

        );

    });

}

// ================================
// Add Column
// ================================

function addColumn() {

    const select = document.getElementById("columnField");

    const field = select.value;

    if (!field)
        return;

    if (exists("columns", field))
        return;

    pivotConfig.columns.push(field);

    renderColumns();

    select.value = "";

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

    aggSelect.value = "SUM";

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
        left.style.flex = "1";

        const title = document.createElement("div");
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
if (DATE_COLUMNS.includes(filter.field)) {

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

            popup.style.left = rect.left + "px";
            popup.style.top = (rect.bottom + 5) + "px";

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

        remove.onclick = function () {

            popup.remove();

            pivotConfig.filters.splice(index, 1);

            renderFilters();

        };

        wrapper.appendChild(remove);

        container.appendChild(wrapper);

    });

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

    fetch("/filter-values/" + encodeURIComponent(field))
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

    return pivotConfig.filters
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

    const totalRow = document.createElement("tr");
    totalRow.className = "grand-total";

    columns.forEach((col, index) => {

        const td = document.createElement("td");

        if (index === 0) {

            td.innerHTML = "<strong>Grand Total</strong>";

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

    tbody.appendChild(totalRow);
    table.appendChild(tbody);
    output.appendChild(table);
    new DataTable('#pivotTable', {
        ordering: true,
        searching: true,
        paging: true,
        pageLength: 25
    });

}
// ================================
// Generate Pivot
// ================================

document.addEventListener("DOMContentLoaded", function () {

    const btn = document.getElementById("generate");

    if (btn) {
        btn.addEventListener("click", generatePivot);
    }

});

function generatePivot() {

    console.log("Generate Clicked");

    console.log(pivotConfig);

    if (pivotConfig.values.length === 0) {

        alert("Please select at least one Value.");

        return;

    }

    const requestData = {

    rows: pivotConfig.rows,

    columns: pivotConfig.columns,

    values: pivotConfig.values,

    filters: getFilters()

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

    

    .then(response => response.json())

    .then(data => {

        console.log("Response:", data);

        renderTable(data);      

    })

    .catch(error => {

        console.error(error);

        alert("Error generating pivot");

    });

}
document.addEventListener("click", function(e){

    document.querySelectorAll(".filter-popup").forEach(p=>{

        if(!p.contains(e.target)){

            p.style.display = "none";

        }

    });

});
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
    // Flatpickr
    // --------------------------

    flatpickr(fromInput, {

        dateFormat: "Y-m-d"

    });

    flatpickr(toInput, {

        dateFormat: "Y-m-d"

    });

    // --------------------------
    // Apply
    // --------------------------

    apply.onclick = function () {

    // If user entered a custom range, use it
        if (fromInput.value && toInput.value) {

            filter.selectedDates = [];

            filter.from = fromInput.value;
            filter.to = toInput.value;

            summary.innerHTML =
                filter.from + " → " + filter.to;

        }
    // Otherwise keep hierarchy selection
        else {

            filter.from = "";
            filter.to = "";

            if (filter.selectedDates.length > 0) {

                summary.innerHTML =
                    filter.selectedDates.length + " date(s) selected";

            } else {

                summary.innerHTML = "Select Date Range ▼";

            }

        }

        popup.style.display = "none";

    };

}
function loadDateHierarchy(field, container, filter)
{
    container.innerHTML = "Loading...";

    fetch("/date-hierarchy/" + encodeURIComponent(field))
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