// =========================================================
// CREATE YOUR OWN REPORT
// =========================================================

function createOwnReport() {

    window.location.href =
        "/pivot";

}


// =========================================================
// REPORT TYPE
// =========================================================

function openReport(reportType) {

    console.log(
        "Selected report:",
        reportType
    );


    /*
       We will connect Sales,
       Purchase, Debit Note etc.
       to their respective table
       sources next.

       For now, these cards are
       placeholders.
    */

    if (reportType === "sales") {

        window.location.href =
            "/pivot";

    }

}