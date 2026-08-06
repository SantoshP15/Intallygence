// ================================
// ELEMENTS
// ================================

const hero = document.querySelector(".hero");

const loginContainer = document.querySelector(".login-container");
const loginBox = document.querySelector(".login-box");

const enterArrow = document.querySelector(".enter-arrow");
const backBtn = document.getElementById("backBtn");

const logo = document.querySelector(".logo");
const logoImg = document.querySelector(".logo img");

const features = document.querySelectorAll(".features span");

// Blueprint Lines
const leftLine = document.querySelector(".left");
const rightLine = document.querySelector(".right");
const leftH = document.querySelector(".left-line");
const rightH = document.querySelector(".right-line");


// ================================
// PAGE LOAD ANIMATION
// ================================

window.addEventListener("DOMContentLoaded", () => {

    // -----------------------
    // Blueprint Lines
    // -----------------------

    setTimeout(() => {

        if (leftLine) leftLine.style.transform = "scaleY(1)";
        if (rightLine) rightLine.style.transform = "scaleY(1)";

    }, 50);

    setTimeout(() => {

        if (leftH) leftH.style.transform = "scaleX(1)";
        if (rightH) rightH.style.transform = "scaleX(1)";

    }, 650);


    // -----------------------
    // Features
    // -----------------------

    features.forEach((feature, index) => {

        feature.style.opacity = "0";
        feature.style.transform = "translateY(20px)";
        feature.style.transition = ".6s ease";

        setTimeout(() => {

            feature.style.opacity = "1";
            feature.style.transform = "translateY(0)";

        }, 1200 + (index * 180));

    });

});

// ================================
// LOGO HOVER
// ================================

if (logoImg) {

    logoImg.addEventListener("mouseenter", () => {

        logoImg.style.transform = "scale(1.03)";

    });

    logoImg.addEventListener("mouseleave", () => {

        logoImg.style.transform = "scale(1)";

    });

}


// ================================
// ENTER (Arrow Click)
// ================================
if (enterArrow) {

    enterArrow.addEventListener("click", () => {

        // Hide only tagline, features and splash arrow
        document.querySelector(".topline").style.opacity = "0";
        // document.querySelector(".features").style.opacity = "0";
        document.querySelector(".enter-arrow").style.opacity = "0";
        enterArrow.style.display = "none";
        // Move logo upward
        document.querySelector(".logo").style.transform = "translateY(-170px)";

        // Show login
        if (loginContainer) {
            loginContainer.classList.add("show");
        }

    });

}


// ================================
// BACK
// ================================

if (backBtn) {

    backBtn.addEventListener("click", () => {

        hero.style.opacity = "1";
        hero.style.transform = "translateY(0)";

        if (loginContainer) {

            loginContainer.style.top = "120%";
            loginContainer.style.transform = "translate(-50%,0)";

        }

        if (loginBox) {

            loginBox.style.opacity = "0";
            loginBox.style.transform = "translateY(60px) scale(.92)";

        }

    });

}


// ================================
// KEYBOARD SHORTCUTS
// ================================

document.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && enterArrow) {

        enterArrow.click();

    }

});

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && backBtn) {

        backBtn.click();

    }

});