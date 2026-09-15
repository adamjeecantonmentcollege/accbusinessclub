(function () {
  "use strict";

  function galleryItem(item) {
    return (
      '<div class="gallery-item skeleton">' +
        '<img src="' + item.image + '" alt="' + (item.caption || "Gallery image") + '" loading="lazy" onload="this.parentElement.classList.remove(\'skeleton\')">' +
      '</div>'
    );
  }

  function init() {
    var container = document.getElementById("gallery-grid");
    if (!container) return;

    fetch("/gallery.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        container.innerHTML = data.map(galleryItem).join("");
      })
      .catch(function (err) {
        console.error("gallery.js: failed to load gallery.json", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
