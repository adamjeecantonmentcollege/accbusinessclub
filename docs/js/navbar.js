document.addEventListener("DOMContentLoaded", () => {

    // --- Auto-show navbar on pages without intro ---
    const navbar = document.getElementById("glass-nav");
    if (navbar && !document.getElementById("intro-screen")) {
        navbar.classList.add("dropped", "spread");
    }

    // --- Hamburger Menu Toggle ---
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileLinks = document.querySelectorAll(".mobile-menu-link");

    function closeMobileMenu() {
        hamburgerBtn.classList.remove("active");
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
    }

    hamburgerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = mobileMenu.classList.contains("open");
        if (isOpen) {
            closeMobileMenu();
        } else {
            hamburgerBtn.classList.add("active");
            mobileMenu.classList.add("open");
            document.body.style.overflow = "hidden";
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener("click", closeMobileMenu);
    });

    mobileMenu.addEventListener("click", (e) => {
        if (e.target === mobileMenu) closeMobileMenu();
    });

});
