document.addEventListener("DOMContentLoaded", () => {
    const footerContainer = document.getElementById("site-footer");
    if (!footerContainer) return;

    footerContainer.innerHTML = `
        <div class="footer-wave"></div>
        <div class="footer-inner">
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="footer-logos">
                        <img class="footer-logo" src="/assets/logo/acc.png" alt="ACC">
                        <img class="footer-logo" src="/assets/logo/acc_bc.png" alt="ACC Business Club">
                    </div>
                    <p class="footer-tagline">Adamjee Cantonment College Business Club</p>
                    <p class="footer-email">abc@acc.edu.bd</p>
                </div>
                <div class="footer-links-col">
                    <h4>Quick Links</h4>
                    <a href="/">Home</a>
                    <a href="/about/">About Us</a>
                    <a href="/events/">Events</a>
                    <a href="/gallery/">Gallery</a>
                </div>
                <div class="footer-links-col">
                    <h4>Teams</h4>
                    <a href="/executives/">Executives</a>
                    <a href="/teachers/">Teachers</a>
                    <a href="/advisors/">Advisors</a>
                </div>
                <div class="footer-links-col">
                    <h4>Connect</h4>
                    <a href="/contact/">Contact</a>
                    <a href="#" class="footer-social" aria-label="Facebook">Facebook</a>
                    <a href="#" class="footer-social" aria-label="Instagram">Instagram</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>© 2026 Adamjee Cantonment College Business Club. All rights reserved.</p>
                <p class="footer-credit">Made with love by <a href="https://linkedin.com/in/asayman" target="_blank" rel="noopener">AS Ayman</a></p>
            </div>
        </div>
    `;
});
