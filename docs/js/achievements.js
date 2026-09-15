(function () {
  "use strict";

  function achievementCard(ach) {
    var yearHtml = ach.year
      ? '<span class="year-chip">' + ach.year + '</span>'
      : "";
    return (
      '<div class="event-card">' +
        '<div class="skeleton" style="width:100%;height:200px">' +
          '<img class="event-card-img" src="' + ach.image + '" alt="' + ach.title + '" loading="lazy" onload="this.parentElement.classList.remove(\'skeleton\')">' +
        '</div>' +
        '<div class="event-card-body">' +
          yearHtml +
          '<h3>' + ach.title + '</h3>' +
          '<p>' + ach.description + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  function init() {
    var container = document.getElementById("achievements-grid");
    if (!container) return;

    fetch("/achievements.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        container.innerHTML = data.map(achievementCard).join("");
      })
      .catch(function (err) {
        console.error("achievements.js: failed to load achievements.json", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();