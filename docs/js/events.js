(function () {
  "use strict";

  function eventCard(evt) {
    return (
      '<div class="event-card">' +
        '<div class="skeleton" style="width:100%;height:200px">' +
          '<img class="event-card-img" src="' + evt.image + '" alt="' + evt.title + '" loading="lazy" onload="this.parentElement.classList.remove(\'skeleton\')">' +
        '</div>' +
        '<div class="event-card-body">' +
          '<h3>' + evt.title + '</h3>' +
          '<p>' + evt.description + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  function init() {
    var container = document.getElementById("events-grid");
    if (!container) return;

    var limit = container.hasAttribute("data-limit")
      ? parseInt(container.getAttribute("data-limit"), 10)
      : Infinity;

    fetch("/events.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = limit < Infinity ? data.slice(0, limit) : data;
        container.innerHTML = items.map(eventCard).join("");
      })
      .catch(function (err) {
        console.error("events.js: failed to load events.json", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
