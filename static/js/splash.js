const hero = document.querySelector(".hero");
const loginContainer = document.querySelector(".login-container");
const loginBox = document.querySelector(".login-box");

const enterBtn = document.getElementById("enterBtn");
const backBtn = document.getElementById("backBtn");

// ================================
// ENTER
// ================================

enterBtn.addEventListener("click", () => {

    // Hero animation
    hero.style.transform = "translateY(-80px)";
    hero.style.opacity = "0";

    // Login section
    loginContainer.style.top = "50%";
    loginContainer.style.transform = "translate(-50%, -50%)";

    loginBox.style.opacity = "1";
    loginBox.style.transform = "translateY(0) scale(1)";

});

// ================================
// BACK
// ================================

backBtn.addEventListener("click", () => {

    hero.style.transform = "translateY(0)";
    hero.style.opacity = "1";

    loginContainer.style.top = "120%";
    loginContainer.style.transform = "translate(-50%, 0)";

    loginBox.style.opacity = "0";
    loginBox.style.transform = "translateY(60px) scale(.92)";

});

// ================================
// Hover Effect on Logo
// ================================

const logo = document.querySelector(".logo img");

if (logo) {

    logo.addEventListener("mouseenter", () => {

        logo.style.transform = "scale(1.03)";

    });

    logo.addEventListener("mouseleave", () => {

        logo.style.transform = "scale(1)";

    });

}

// ================================
// Feature Animation
// ================================

const features = document.querySelectorAll(".features span");

features.forEach((feature, index) => {

    feature.style.opacity = "0";
    feature.style.transform = "translateY(20px)";

    setTimeout(() => {

        feature.style.transition = ".6s ease";

        feature.style.opacity = "1";
        feature.style.transform = "translateY(0)";

    }, 300 + (index * 180));

});

// ================================
// Button Hover Arrow Animation
// ================================

const arrow = enterBtn.querySelector("i");

if (arrow) {

    enterBtn.addEventListener("mouseenter", () => {

        arrow.style.transform = "translateX(6px)";
        arrow.style.transition = ".3s";

    });

    enterBtn.addEventListener("mouseleave", () => {

        arrow.style.transform = "translateX(0px)";

    });

}

// ================================
// Keyboard Shortcut
// Press Enter to open login
// ================================

document.addEventListener("keydown", function (e) {

    if (e.key === "Enter" && hero.style.opacity !== "0") {

        enterBtn.click();

    }

});

// ================================
// ESC returns to splash
// ================================

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape" && hero.style.opacity === "0") {

        backBtn.click();

    }

});

// ================================
// Blueprint Line Animation
// ================================

window.addEventListener("load", () => {

    const leftLine = document.querySelector(".left");
    const rightLine = document.querySelector(".right");
    const hLeft = document.querySelector(".left-line");
    const hRight = document.querySelector(".right-line");

    leftLine.style.transform = "scaleY(1)";
    rightLine.style.transform = "scaleY(1)";

    setTimeout(() => {

        hLeft.style.transform = "scaleX(1)";
        hRight.style.transform = "scaleX(1)";

    }, 500);

});
setTimeout(() => {

    document.querySelector(".logo").style.opacity = "1";
    document.querySelector(".logo").style.transform = "translateY(0)";

}, 1000);