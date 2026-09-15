(function () {
  "use strict";

  function contactItem(item) {
    if (item.type === "social") {
      var linksHtml = item.links.map(function (l) {
        return '<a href="' + l.url + '" aria-label="' + l.label + '">' + l.label + '</a>';
      }).join(" ");
      return '<div class="contact-item">' +
        '<h3>' + item.heading + '</h3>' + linksHtml +
      '</div>';
    }
    return '<div class="contact-item">' +
      '<h3>' + item.heading + '</h3>' +
      '<p>' + item.value + '</p>' +
    '</div>';
  }

  function init() {
    var container = document.getElementById("contact-info");
    if (!container) return;

    fetch("/contact.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        container.innerHTML = data.info.map(contactItem).join("");
      })
      .catch(function (err) {
        console.error("contact.js: failed to load contact.json", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
