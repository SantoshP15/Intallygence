/* =========================================================
   COMMON HEADER JAVASCRIPT
   ========================================================= */

/* =========================================================
   GET HEADER ELEMENTS
   ========================================================= */

const headerAiBtn =
    document.querySelector(".ai-mode-btn");

const settingsBtn =
    document.getElementById("settingsBtn");

const settingsPopup =
    document.getElementById("settingsPopup");

const switchCompanyBtn =
    document.getElementById("switchCompanyBtn");

const companySelector =
    document.getElementById("companySelector");

const selectAllCompanies =
    document.getElementById("selectAllCompanies");

const activeCompanyName =
    document.getElementById("activeCompanyName");

const companyInputs = [
    ...document.querySelectorAll(
        'input[name="active-company"]'
    )
];


/* =========================================================
   AI MODE
   ========================================================= */

if (headerAiBtn) {

    headerAiBtn.addEventListener("click", function (event) {

        event.stopPropagation();

        /*
         * Dispatch a custom event so individual pages
         * can optionally listen for AI mode.
         */
        document.dispatchEvent(
            new CustomEvent("aiModeClicked")
        );

    });

}


/* =========================================================
   SETTINGS POPUP
   ========================================================= */

if (settingsBtn) {

    settingsBtn.setAttribute(
        "aria-expanded",
        "false"
    );

    settingsBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            if (!settingsPopup) {
                return;
            }

            const isOpen =
                settingsPopup.classList.toggle("show");

            this.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            /*
             * If Settings opens, close
             * Switch Company.
             */
            if (
                isOpen &&
                companySelector
            ) {
                companySelector.classList.remove("show");
            }

            if (
                isOpen &&
                switchCompanyBtn
            ) {
                switchCompanyBtn.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }

        }
    );

}


/* =========================================================
   SETTINGS POPUP CLICK
   ========================================================= */

if (settingsPopup) {

    settingsPopup.addEventListener(
        "click",
        function (event) {

            /*
             * Prevent the document click handler
             * from immediately closing Settings.
             */
            event.stopPropagation();

        }
    );

}


/* =========================================================
   PERIOD SELECTOR
   ========================================================= */

document
    .querySelectorAll(
        ".selector-btn[data-period]"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                document
                    .querySelectorAll(
                        ".selector-btn[data-period]"
                    )
                    .forEach(function (item) {

                        item.classList.remove(
                            "active"
                        );

                    });

                this.classList.add("active");

                /*
                 * Make selected period available
                 * to other scripts.
                 */
                document.dispatchEvent(
                    new CustomEvent(
                        "periodSelectorChanged",
                        {
                            detail: {
                                period:
                                    this.dataset.period
                            }
                        }
                    )
                );

            }
        );

    });


/* =========================================================
   AMOUNT SELECTOR
   ========================================================= */

document
    .querySelectorAll(
        ".selector-btn[data-amount]"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                document
                    .querySelectorAll(
                        ".selector-btn[data-amount]"
                    )
                    .forEach(function (item) {

                        item.classList.remove(
                            "active"
                        );

                    });

                this.classList.add("active");

                /*
                 * Make selected amount available
                 * to other scripts.
                 */
                document.dispatchEvent(
                    new CustomEvent(
                        "amountSelectorChanged",
                        {
                            detail: {
                                amount:
                                    this.dataset.amount
                            }
                        }
                    )
                );

            }
        );

    });


/* =========================================================
   SWITCH COMPANY
   ========================================================= */

if (switchCompanyBtn) {

    switchCompanyBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            if (!companySelector) {
                return;
            }

            const isOpen =
                companySelector.classList.toggle(
                    "show"
                );

            this.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );

}


/* =========================================================
   COMPANY SELECTOR CLICK
   ========================================================= */

if (companySelector) {

    companySelector.addEventListener(
        "click",
        function (event) {

            /*
             * Keep company selector open
             * while interacting with checkboxes.
             */
            event.stopPropagation();

        }
    );

}


/* =========================================================
   COMPANY SELECTION
   ========================================================= */

companyInputs.forEach(function (input) {

    input.addEventListener(
        "change",
        function () {

            /*
             * Do not allow all companies
             * to be unchecked.
             */
            if (
                !this.checked &&
                !companyInputs.some(
                    item => item.checked
                )
            ) {

                this.checked = true;

                return;
            }


            /*
             * Update active company.
             *
             * The first checked company is used
             * as the displayed active company.
             */
            if (
                this.checked &&
                activeCompanyName
            ) {

                activeCompanyName.textContent =
                    this.value;

            }


            /*
             * Update Select All state.
             */
            if (selectAllCompanies) {

                selectAllCompanies.checked =
                    companyInputs.length > 0 &&
                    companyInputs.every(
                        item => item.checked
                    );

            }


            /*
             * Notify other scripts.
             */
            document.dispatchEvent(
                new CustomEvent(
                    "companyChanged",
                    {
                        detail: {
                            company:
                                this.value,
                            checked:
                                this.checked
                        }
                    }
                )
            );

        }
    );

});


/* =========================================================
   SELECT ALL COMPANIES
   ========================================================= */

if (selectAllCompanies) {

    selectAllCompanies.addEventListener(
        "change",
        function () {

            /*
             * Select / deselect all.
             */
            companyInputs.forEach(
                function (input) {

                    input.checked =
                        selectAllCompanies.checked;

                }
            );


            /*
             * Never allow zero companies.
             */
            if (
                !selectAllCompanies.checked &&
                companyInputs.length > 0
            ) {

                companyInputs.forEach(
                    function (input, index) {

                        input.checked =
                            index === 0;

                    }
                );

            }


            /*
             * Update displayed active company.
             */
            if (
                activeCompanyName &&
                companyInputs.length > 0
            ) {

                const firstChecked =
                    companyInputs.find(
                        input => input.checked
                    );

                if (firstChecked) {

                    activeCompanyName.textContent =
                        firstChecked.value;

                }

            }


            /*
             * Keep Select All state accurate.
             */
            selectAllCompanies.checked =
                companyInputs.length > 0 &&
                companyInputs.every(
                    input => input.checked
                );


            /*
             * Notify other scripts.
             */
            document.dispatchEvent(
                new CustomEvent(
                    "companiesChanged",
                    {
                        detail: {
                            companies:
                                companyInputs
                                    .filter(
                                        input =>
                                            input.checked
                                    )
                                    .map(
                                        input =>
                                            input.value
                                    )
                        }
                    }
                )
            );

        }
    );

}


/* =========================================================
   CLOSE POPUPS WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    function () {

        /*
         * Close Settings.
         */
        if (settingsPopup) {

            settingsPopup.classList.remove(
                "show"
            );

        }

        if (settingsBtn) {

            settingsBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }


        /*
         * Close Company Selector.
         */
        if (companySelector) {

            companySelector.classList.remove(
                "show"
            );

        }

        if (switchCompanyBtn) {

            switchCompanyBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }


        /*
         * Close Settings.
         */
        if (settingsPopup) {

            settingsPopup.classList.remove(
                "show"
            );

        }

        if (settingsBtn) {

            settingsBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }


        /*
         * Close Company Selector.
         */
        if (companySelector) {

            companySelector.classList.remove(
                "show"
            );

        }

        if (switchCompanyBtn) {

            switchCompanyBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }
);


/* =========================================================
   INITIALISE SELECT ALL STATE
   ========================================================= */

if (
    selectAllCompanies &&
    companyInputs.length > 0
) {

    selectAllCompanies.checked =
        companyInputs.every(
            input => input.checked
        );

}


/* =========================================================
   HEADER INITIALISED
   ========================================================= */

console.log(
    "Common header initialized."
);
document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // SIGN OUT CONFIRMATION
    // =========================
    const logoutForm = document.querySelector('form[action*="logout"]');

    logoutForm?.addEventListener("submit", function (event) {
        const confirmed = window.confirm("Are you sure you want to sign out?");

        if (!confirmed) {
            event.preventDefault();
        }
    });

});