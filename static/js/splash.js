/* =========================================================
   1920 × 1080 RESPONSIVE CANVAS
   WITH BROWSER-ZOOM DETECTION
   ========================================================= */

(function () {

    const DESIGN_WIDTH = 1920;
    const DESIGN_HEIGHT = 1080;

    const wrapper =
        document.querySelector(".splash-wrapper");

    if (!wrapper) {
        return;
    }


    /*
     * IMPORTANT:
     *
     * Start the page at Ctrl + 0.
     *
     * This gives us the browser's normal
     * devicePixelRatio for this computer.
     */

    const baseDevicePixelRatio =
        window.devicePixelRatio || 1;


    function updateSplashScale() {

        /*
         * Current browser viewport in CSS pixels.
         */
        const viewportWidth =
            document.documentElement.clientWidth;


        /*
         * Current DPR changes when Chrome zoom
         * changes.
         *
         * Example:
         *
         * 100%  -> base DPR
         * 125%  -> DPR approximately 1.25 × base
         *  80%  -> DPR approximately 0.80 × base
         */
        const currentDevicePixelRatio =
            window.devicePixelRatio || 1;


        /*
         * Estimate browser zoom.
         */
        const browserZoom =
            currentDevicePixelRatio /
            baseDevicePixelRatio;


        /*
         * Calculate the width available at
         * NORMAL 100% zoom.
         *
         * This is the key calculation.
         *
         * viewportWidth changes with Ctrl +/-
         * but browserZoom compensates for it.
         */
        const normalZoomWidth =
            viewportWidth *
            browserZoom;


        /*
         * Calculate how much the original
         * 1920px design should be scaled.
         *
         * Example laptop:
         *
         * normal width = 1366
         *
         * scale =
         * 1366 / 1920
         *
         * = 0.711
         */
        let canvasScale =
            normalZoomWidth /
            DESIGN_WIDTH;


        /*
         * Never enlarge the design beyond
         * its original 1920 × 1080 size
         * just because the monitor is wider.
         */
        canvasScale =
            Math.min(
                canvasScale,
                1
            );


        /*
         * Safety minimum.
         */
        canvasScale =
            Math.max(
                canvasScale,
                0.1
            );


        /*
         * Send scale to CSS.
         */
        document.documentElement.style.setProperty(
            "--canvas-scale",
            canvasScale
        );


        /*
         * The wrapper must have exactly the
         * scaled height of the canvas.
         */
        const scaledHeight =
            DESIGN_HEIGHT *
            canvasScale;


        wrapper.style.height =
            scaledHeight + "px";
    }


    /*
     * First calculation.
     */
    updateSplashScale();


    /*
     * Browser resize.
     */
    window.addEventListener(
        "resize",
        updateSplashScale
    );


    /*
     * Some Chrome zoom changes trigger
     * resize without DPR updating immediately.
     *
     * This catches that change.
     */
    let lastDPR =
        window.devicePixelRatio;


    setInterval(function () {

        const currentDPR =
            window.devicePixelRatio;


        if (currentDPR !== lastDPR) {

            lastDPR =
                currentDPR;

            updateSplashScale();
        }

    }, 250);


})();
// ================================
// ELEMENTS
// ================================

const hero =
    document.querySelector(".hero");

const loginContainer =
    document.querySelector(".login-container");

const loginBox =
    document.querySelector(".login-box");

const enterArrow =
    document.querySelector(".enter-arrow");

const backBtn =
    document.getElementById("backBtn");

const logo =
    document.querySelector(".logo");

const logoImg =
    document.querySelector(".logo img");

const features =
    document.querySelectorAll(".features span");


// Blueprint Lines

const leftLine =
    document.querySelector(".left");

const rightLine =
    document.querySelector(".right");

const leftH =
    document.querySelector(".left-line");

const rightH =
    document.querySelector(".right-line");


// ================================
// PAGE LOAD ANIMATION
// ================================

window.addEventListener(
    "DOMContentLoaded",
    () => {


        // -----------------------
        // Blueprint Lines
        // -----------------------

        setTimeout(() => {

            if (leftLine) {

                leftLine.style.transform =
                    "scaleY(1)";
            }


            if (rightLine) {

                rightLine.style.transform =
                    "scaleY(1)";
            }

        }, 50);


        setTimeout(() => {

            if (leftH) {

                leftH.style.transform =
                    "scaleX(1)";
            }


            if (rightH) {

                rightH.style.transform =
                    "scaleX(1)";
            }

        }, 650);


        // -----------------------
        // Features
        // -----------------------

        features.forEach(
            (feature, index) => {

                feature.style.opacity =
                    "0";

                feature.style.transform =
                    "translateY(20px)";

                feature.style.transition =
                    ".6s ease";


                setTimeout(() => {

                    feature.style.opacity =
                        "1";

                    feature.style.transform =
                        "translateY(0)";

                }, 1200 + (index * 180));

            }
        );

    }
);


// ================================
// LOGO HOVER
// ================================

if (logoImg) {

    logoImg.addEventListener(
        "mouseenter",
        () => {

            logoImg.style.transform =
                "scale(1.03)";

        }
    );


    logoImg.addEventListener(
        "mouseleave",
        () => {

            logoImg.style.transform =
                "scale(1)";

        }
    );

}


// ================================
// ENTER ARROW
// ================================

if (enterArrow) {

    enterArrow.addEventListener(
        "click",
        () => {


            // -----------------------
            // Hide topline
            // -----------------------

            const topline =
                document.querySelector(".topline");

            if (topline) {

                topline.style.opacity =
                    "0";

                topline.classList.add(
                    "hide-on-enter"
                );
            }


            // -----------------------
            // Hide features
            // -----------------------

            const featureContainer =
                document.querySelector(".features");

            if (featureContainer) {

                featureContainer.classList.add(
                    "hide-on-enter"
                );
            }


            // -----------------------
            // Hide arrow
            // -----------------------

            enterArrow.style.opacity =
                "0";

            enterArrow.style.display =
                "none";


            // -----------------------
            // Move logo upward
            // -----------------------

            /*
               Original movement:
               170px on a 1920px canvas

               170 / 1920 = 8.854%

               Using vw keeps the movement
               proportional when the canvas
               scales with browser zoom.
            */

            if (logo) {

                logo.style.transform =
                    "translateX(-50%) translateY(-8.854vw)";
            }


            // -----------------------
            // Show login links
            // -----------------------

            const loginLinks =
                document.querySelector(
                    ".login-links"
                );

            if (loginLinks) {

                loginLinks.classList.add(
                    "show"
                );
            }


            // -----------------------
            // Show login
            // -----------------------

            if (loginContainer) {

                loginContainer.classList.add(
                    "show"
                );
            }

        }
    );

}


// ================================
// BACK
// ================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {


            // -----------------------
            // Restore hero
            // -----------------------

            if (hero) {

                hero.style.opacity =
                    "1";

                hero.style.transform =
                    "translateY(0)";
            }


            // -----------------------
            // Move login away
            // -----------------------

            if (loginContainer) {

                loginContainer.style.top =
                    "120%";

                loginContainer.style.transform =
                    "translate(-50%, 0)";
            }


            // -----------------------
            // Reset login box
            // -----------------------

            if (loginBox) {

                loginBox.style.opacity =
                    "0";

                loginBox.style.transform =
                    "translateY(60px) scale(.92)";
            }

        }
    );

}


// ================================
// KEYBOARD SHORTCUTS
// ================================

document.addEventListener(
    "keydown",
    (e) => {

        if (
            e.key === "Enter" &&
            enterArrow
        ) {

            enterArrow.click();
        }

    }
);


document.addEventListener(
    "keydown",
    (e) => {

        if (
            e.key === "Escape" &&
            backBtn
        ) {

            backBtn.click();
        }

    }
);


// ================================
// LOGIN FORM LOADER
// ================================

const loginForm =
    document.querySelector(".login-form");

const loginLoader =
    document.getElementById("loginLoader");


if (loginForm && loginLoader) {

    loginForm.addEventListener(
        "submit",
        function (e) {

            e.preventDefault();


            loginLoader.classList.add(
                "show"
            );


            setTimeout(() => {

                loginForm.submit();

            }, 1700);

        }
    );

}


// ================================
// RESET LOADER WHEN PAGE RETURNS
// ================================

window.addEventListener(
    "pageshow",
    function () {

        const loginLoader =
            document.getElementById(
                "loginLoader"
            );


        if (loginLoader) {

            loginLoader.classList.remove(
                "show"
            );
        }

    }
);