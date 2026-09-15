document.addEventListener("DOMContentLoaded", () => {

    // --- Core Word Ecosystem Loop ---
    const words = ["networking", "leadership", "marketing", "finance", "strategy", "fintech"];
    const track = document.getElementById("scroller-track");
    let currentIndex = 0;

    words.forEach((word) => {
        const wordEl = document.createElement("div");
        wordEl.classList.add("scroller-word");
        wordEl.innerHTML = `<span class="arrow">→</span>${word}`;
        track.appendChild(wordEl);
    });

    const wordElements = document.querySelectorAll(".scroller-word");
    const orb1 = document.getElementById("orb1");
    const orb2 = document.getElementById("orb2");

    const orbPositions = [
        {t1: "-5%", l1: "-5%", t2: "60%", l2: "50%"},
        {t1: "40%", l1: "10%", t2: "20%", l2: "60%"},
        {t1: "10%", l1: "40%", t2: "50%", l2: "10%"},
        {t1: "-10%", l1: "50%", t2: "40%", l2: "30%"},
        {t1: "30%", l1: "30%", t2: "-5%", l2: "60%"},
        {t1: "50%", l1: "20%", t2: "10%", l2: "40%"}
    ];

    // --- Hero Background Photo Crossfade System ---
    const heroPhotoUrls = {
    networking: "assets/gallery/gallery-4.webp",
    leadership: "assets/gallery/gallery-11.webp",
    marketing:  "assets/gallery/gallery-6.webp",
    finance:    "assets/gallery/gallery-13.webp",
    strategy:   "assets/gallery/gallery-9.webp",
    fintech:    "assets/gallery/gallery-5.webp"
    };
    const photo1 = document.getElementById("hero-photo-1");
    const photo2 = document.getElementById("hero-photo-2");
    let activePhoto = photo1;
    let inactivePhoto = photo2;

    Object.values(heroPhotoUrls).forEach(url => {
        const img = new Image();
        img.src = url;
    });

    function updateHeroPhoto(word) {
        const url = heroPhotoUrls[word];
        if (!url) return;
        inactivePhoto.style.backgroundImage = `url('${url}')`;
        activePhoto.classList.remove("active");
        inactivePhoto.classList.add("active");
        [activePhoto, inactivePhoto] = [inactivePhoto, activePhoto];
    }

    function updateDynamicEcosystem() {
        const currentWord = words[currentIndex];

        document.body.setAttribute("data-theme", currentWord);

        wordElements.forEach(el => el.classList.remove("active"));
        if (wordElements[currentIndex]) {
            wordElements[currentIndex].classList.add("active");
        }

        const pos = orbPositions[currentIndex];
        if (pos) {
            orb1.style.top = pos.t1; orb1.style.left = pos.l1;
            orb2.style.top = pos.t2; orb2.style.left = pos.l2;
        }

        updateHeroPhoto(currentWord);

        const dynamicWordHeight = wordElements[0] ? wordElements[0].offsetHeight : 110;
        const translateY = -(currentIndex * dynamicWordHeight);
        track.style.transform = `translateY(calc(${translateY}px - ${dynamicWordHeight / 2}px))`;
    }

    photo1.style.backgroundImage = `url('${heroPhotoUrls[words[0]]}')`;

    updateDynamicEcosystem();
    window.addEventListener("resize", updateDynamicEcosystem);

    setTimeout(() => {
        setInterval(() => {
            currentIndex = (currentIndex + 1) % words.length;
            updateDynamicEcosystem();
        }, 3200);
    }, 5000);

});
