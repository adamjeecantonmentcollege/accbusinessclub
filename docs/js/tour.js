(function () {
  "use strict";

  function tourCard(tour) {
    var yearHtml = tour.year
      ? '<span class="year-chip">' + tour.year + '</span>'
      : "";
    return (
      '<div class="event-card">' +
        '<div class="skeleton" style="width:100%;height:200px">' +
          '<img class="event-card-img" src="' + tour.image + '" alt="' + tour.title + '" loading="lazy" onload="this.parentElement.classList.remove(\'skeleton\')">' +
        '</div>' +
        '<div class="event-card-body">' +
          yearHtml +
          '<h3>' + tour.title + '</h3>' +
          '<p>' + tour.description + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  function init() {
    var container = document.getElementById("tour-grid");
    if (!container) return;

    fetch("/tour.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        container.innerHTML = data.map(tourCard).join("");
      })
      .catch(function (err) {
        console.error("tour.js: failed to load tour.json", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();