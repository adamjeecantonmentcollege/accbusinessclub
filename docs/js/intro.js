document.addEventListener("DOMContentLoaded", () => {

    // --- Intro Character Splits ---
    const jumpPhraseEl = document.getElementById("jump-phrase");
    const text = jumpPhraseEl.innerText;
    jumpPhraseEl.innerHTML = "";

    let delayCounter = 0;
    [...text].forEach(char => {
        const span = document.createElement("span");
        if (char === " ") {
            span.classList.add("space");
        } else {
            span.innerText = char;
            span.style.animationDelay = `${delayCounter * 0.03}s`;
            delayCounter++;
        }
        jumpPhraseEl.appendChild(span);
    });

    const introScreen = document.getElementById("intro-screen");
    const navbar = document.getElementById("glass-nav");
    const heroSection = document.getElementById("hero-section");

    setTimeout(() => {
        introScreen.classList.add("exit");
        document.body.style.overflowY = "visible";
        document.body.style.height = "auto";
    }, 3500);

    setTimeout(() => { navbar.classList.add("dropped"); }, 4000);

    setTimeout(() => {
        navbar.classList.add("spread");
        heroSection.classList.add("loaded");
    }, 4600);

});
