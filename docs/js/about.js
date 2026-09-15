(function () {
  "use strict";

  function init() {
    var content = document.getElementById("about-content");
    if (!content) return;

    fetch("/about.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var html = "";

        data.sections.forEach(function (sec) {
          html += '<div class="about-section">' +
            '<h2>' + sec.heading + '</h2>' +
            '<p>' + sec.body + '</p>' +
          '</div>';
        });

        if (data.stats && data.stats.length) {
          html += '<div class="about-stats">';
          data.stats.forEach(function (stat) {
            html += '<div class="stat-card">' +
              '<span class="stat-number">' + stat.number + '</span>' +
              '<span class="stat-label">' + stat.label + '</span>' +
            '</div>';
          });
          html += '</div>';
        }

        content.innerHTML = html;
      })
      .catch(function (err) {
        console.error("about.js: failed to load about.json", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
