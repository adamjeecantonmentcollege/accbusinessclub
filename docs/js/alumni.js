(function () {
  'use strict';

  function isValidSocial(val) {
    if (!val) return false;
    var s = String(val).trim();
    var sl = s.toLowerCase();
    if (s === "" || sl === "null" || sl === "none" || sl === "undefined" || s === "#") {
      return false;
    }
    return true;
  }

  function isValidWhatsApp(val) {
    if (!isValidSocial(val)) return false;
    var digits = String(val).replace(/[^0-9]/g, "");
    return digits.length >= 7;
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var container = document.getElementById('alumni-grid');
    var tabsEl    = document.getElementById('alumni-tabs');
    if (!container) return;

    var isHomepage = container.hasAttribute('data-homepage');
    var alumniData, sortedYears;

    try {
      var res = await fetch('/alumni.json');
      if (!res.ok) throw new Error('Network error');
      alumniData = await res.json();
    } catch (e) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.3);text-align:center;padding:40px 0;">Could not load alumni data.</p>';
      return;
    }

    var grouped = {};
    alumniData.forEach(function (m) {
      if (!grouped[m.year]) grouped[m.year] = [];
      grouped[m.year].push(m);
    });

    sortedYears = Object.keys(grouped).sort(function (a, b) { return Number(b) - Number(a); });

    if (isHomepage) {
      // Homepage: show only 3, no year tabs
      var flat = [];
      sortedYears.forEach(function (year) {
        var items = grouped[year].slice().sort(function (a, b) { return a.sort_order - b.sort_order; });
        flat = flat.concat(items);
      });
      renderGrid(flat.slice(0, 3));
      if (window.initStagger) initStagger(container);
      return;
    }

    if (tabsEl) {
      tabsEl.innerHTML = '';
      sortedYears.forEach(function (year, i) {
        var btn = document.createElement('button');
        btn.className = 'year-tab' + (i === 0 ? ' active' : '');
        btn.textContent = year;
        btn.setAttribute('data-year', year);
        btn.addEventListener('click', function () {
          var act = tabsEl.querySelector('.year-tab.active');
          if (act) act.classList.remove('active');
          btn.classList.add('active');
          renderGrid(grouped[year]);
        });
        tabsEl.appendChild(btn);
      });
    }

    renderGrid(grouped[sortedYears[0]]);

    function renderGrid(members) {
      members.sort(function (a, b) { return a.sort_order - b.sort_order; });
      container.memberData = members;

      container.innerHTML = members.map(function (m, index) {
        var initials = getInitials(m.name);
        var imgHtml;
        if (m.image_url) {
          imgHtml = '<img class="member-img" src="' + escapeAttr(m.image_url) + '" alt="' + escapeAttr(m.name) + '" loading="lazy">';
        } else {
          imgHtml = '';
        }

        return '<div class="member-card alumni-card" data-member-index="' + index + '" style="cursor: pointer;">' +
          '<div class="member-img-wrapper">' +
          '<div class="member-placeholder"><span class="member-initials">' + escapeHtml(initials) + '</span></div>' +
          imgHtml +
          '</div>' +
          '<div class="member-card-text">' +
          '<h3 class="member-name">' + escapeHtml(m.name) + '</h3>' +
          '<p class="member-role">' + escapeHtml(m.panel_name) + '</p>' +
          '</div></div>';
      }).join('');

      setupCardClicks(container);

      // Handle image load errors – hide broken images to reveal placeholder
      var imgs = container.querySelectorAll('.member-img');
      var i;
      for (i = 0; i < imgs.length; i++) {
        imgs[i].addEventListener('error', function () {
          this.style.display = 'none';
        });
        // If image already errored before listener attached
        if (imgs[i].complete && imgs[i].naturalWidth === 0) {
          imgs[i].style.display = 'none';
        }
      }
    }

    function setupCardClicks(container) {
      container.addEventListener("click", function (e) {
        var card = e.target.closest(".member-card");
        if (!card) return;
        var index = card.getAttribute("data-member-index");
        if (index === null || index === undefined) return;
        var member = container.memberData[index];
        if (member) {
          window.openProfileModal(member, true);
        }
      });
    }

    function getInitials(name) {
      return name.split(' ').map(function (w) { return w.charAt(0); }).join('').substring(0, 2).toUpperCase();
    }

    function escapeHtml(str) {
      var d = document.createElement('div');
      d.appendChild(document.createTextNode(str));
      return d.innerHTML;
    }

    function escapeAttr(str) {
      return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  });

  /* --- MODAL LOGIC INJECTION --- */
  if (!window.openProfileModal) {
    window.openProfileModal = function (member, isAlumni) {
      var modal = document.getElementById("profile-detail-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "profile-detail-modal";
        modal.className = "profile-detail-modal";
        modal.innerHTML = 
          '<div class="profile-modal-backdrop"></div>' +
          '<div class="profile-modal-container">' +
            '<button class="profile-modal-close" aria-label="Close modal">×</button>' +
            '<div class="profile-modal-card-wrapper">' +
              '<button class="profile-info-btn" aria-label="Toggle Details">' +
                '<svg class="info-svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>' +
                '<svg class="back-svg" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>' +
              '</button>' +
              '<div class="profile-modal-card">' +
                '<div class="profile-card-front">' +
                  '<div class="profile-card-img-container">' +
                    '<img class="profile-card-img" src="" alt="">' +
                  '</div>' +
                  '<div class="profile-card-text">' +
                    '<h2 class="profile-front-name"></h2>' +
                    '<p class="profile-front-role"></p>' +
                  '</div>' +
                '</div>' +
                '<div class="profile-card-back">' +
                  '<div class="profile-card-batch"></div>' +
                  '<div class="profile-card-scrollable"></div>' +
                  '<div class="profile-social-fab">' +
                    '<div class="fab-options"></div>' +
                    '<button class="fab-trigger" aria-label="Toggle Social Menu">' +
                      '<svg class="connect-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<circle cx="18" cy="5" r="3"></circle>' +
                        '<circle cx="6" cy="12" r="3"></circle>' +
                        '<circle cx="18" cy="19" r="3"></circle>' +
                        '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>' +
                        '<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>' +
                      '</svg>' +
                      '<svg class="close-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                        '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                      '</svg>' +
                    '</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        document.body.appendChild(modal);

        var closeBtn = modal.querySelector(".profile-modal-close");
        var backdrop = modal.querySelector(".profile-modal-backdrop");
        var infoBtn = modal.querySelector(".profile-info-btn");
        var wrapper = modal.querySelector(".profile-modal-card-wrapper");
        var fab = modal.querySelector(".profile-social-fab");
        var fabTrigger = modal.querySelector(".fab-trigger");

        var setBackgroundInteractions = function (allow) {
          var pointerVal = allow ? "" : "none";
          var selectors = [".scroll-container", ".page-header", ".page-content", ".navbar", ".site-footer"];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el) el.style.pointerEvents = pointerVal;
          }
        };

        var closeModal = function () {
          modal.classList.remove("active");
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
          var scrollContainer = document.querySelector(".scroll-container");
          if (scrollContainer) {
            scrollContainer.style.overflowY = "";
          }
          setBackgroundInteractions(true);
          setTimeout(function () {
            wrapper.classList.remove("flipped-state");
            fab.classList.remove("expanded");
            fab.classList.remove("force-collapsed");
          }, 400);
        };

        closeBtn.addEventListener("click", closeModal);
        backdrop.addEventListener("click", closeModal);
        infoBtn.addEventListener("click", function () {
          wrapper.classList.toggle("flipped-state");
        });
        
        var isHovered = false;
        fab.addEventListener("mouseenter", function () {
          isHovered = true;
          fab.classList.remove("force-collapsed");
        });
        fab.addEventListener("mouseleave", function () {
          isHovered = false;
          fab.classList.remove("force-collapsed");
        });

        fabTrigger.addEventListener("click", function (e) {
          e.stopPropagation();
          var isExpanded = fab.classList.contains("expanded") || (isHovered && !fab.classList.contains("force-collapsed"));
          if (isExpanded) {
            fab.classList.remove("expanded");
            fab.classList.add("force-collapsed");
          } else {
            fab.classList.add("expanded");
            fab.classList.remove("force-collapsed");
          }
        });
        
        modal.addEventListener("click", function (e) {
          if (!fab.contains(e.target)) {
            fab.classList.remove("expanded");
            fab.classList.remove("force-collapsed");
          }
          // Close when clicking outside the card wrapper / close button
          if (!e.target.closest('.profile-modal-card-wrapper') && !e.target.closest('.profile-modal-close')) {
            closeModal();
          }
        });

        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && modal.classList.contains("active")) {
            closeModal();
          }
        });

        // Touch/scroll locking on backdrop and background
        modal.addEventListener("touchmove", function (e) {
          var scrollable = e.target.closest(".profile-card-scrollable");
          if (scrollable) {
            var scrollTop = scrollable.scrollTop;
            var scrollHeight = scrollable.scrollHeight;
            var clientHeight = scrollable.clientHeight;
            var contentHeight = scrollHeight - clientHeight;
            
            if (contentHeight <= 0) {
              e.preventDefault();
              return;
            }
            
            var touch = e.touches[0] || e.changedTouches[0];
            var isSwipingDown = touch.clientY > (scrollable.lastTouchY || 0);
            scrollable.lastTouchY = touch.clientY;
            
            if (scrollTop <= 0 && isSwipingDown) {
              e.preventDefault();
            } else if (scrollTop >= contentHeight && !isSwipingDown) {
              e.preventDefault();
            }
          } else {
            e.preventDefault();
          }
        }, { passive: false });

        modal.addEventListener("touchstart", function (e) {
          var scrollable = e.target.closest(".profile-card-scrollable");
          if (scrollable && e.touches.length > 0) {
            scrollable.lastTouchY = e.touches[0].clientY;
          }
        }, { passive: true });
      }

      var name = member.name || "";
      var role = member.role || member.panel_name || "";
      var image = member.image || member.image_url || "";
      
      var initials = name.split(" ").map(function (w) { return w.charAt(0); }).join("").substring(0, 2).toUpperCase();
      var escapedInitials = encodeURIComponent(initials);

      if (!image) {
        image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%231a1f2e' width='400' height='400'/%3E%3Ctext fill='%234a5568' font-size='120' x='200' y='220' text-anchor='middle' font-family='Inter,sans-serif'%3E" + escapedInitials + "%3C/text%3E%3C/svg%3E";
      }

      var imgEl = modal.querySelector(".profile-card-img");
      imgEl.src = image;
      imgEl.alt = name;
      imgEl.onerror = function () {
        this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%231a1f2e' width='400' height='400'/%3E%3Ctext fill='%234a5568' font-size='120' x='200' y='220' text-anchor='middle' font-family='Inter,sans-serif'%3E" + escapedInitials + "%3C/text%3E%3C/svg%3E";
      };

      modal.querySelector(".profile-front-name").textContent = name;
      modal.querySelector(".profile-front-role").textContent = role;

      var scrollable = modal.querySelector(".profile-card-scrollable");
      scrollable.innerHTML = generateProfileDetailsHTML(member, isAlumni);
      scrollable.scrollTop = 0;

      var batchEl = modal.querySelector(".profile-card-batch");
      if (batchEl) {
        if (isAlumni && member.year) {
          batchEl.textContent = member.year;
          batchEl.style.display = "block";
        } else {
          batchEl.textContent = "";
          batchEl.style.display = "none";
        }
      }

      // Populate FAB socials dynamically
      var fab = modal.querySelector(".profile-social-fab");
      var fabOptions = modal.querySelector(".fab-options");
      var optionsHtml = "";

      // Facebook
      var fbValid = isValidSocial(member.facebook);
      var fbUrl = fbValid ? (member.facebook.startsWith("http") ? member.facebook : "https://facebook.com/" + member.facebook) : "#";
      optionsHtml += '<a href="' + escapeAttr(fbUrl) + '" target="_blank" class="fab-option facebook' + (fbValid ? '' : ' disabled') + '" aria-label="Facebook">' +
        '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
        '</a>';

      // Instagram
      var instaValid = isValidSocial(member.instagram);
      var instaUrl = "#";
      if (instaValid) {
        var instaHandle = member.instagram.replace("@", "");
        instaUrl = member.instagram.startsWith("http") ? member.instagram : "https://instagram.com/" + instaHandle;
      }
      optionsHtml += '<a href="' + escapeAttr(instaUrl) + '" target="_blank" class="fab-option instagram' + (instaValid ? '' : ' disabled') + '" aria-label="Instagram">' +
        '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>' +
        '</a>';

      // LinkedIn
      var liValid = isValidSocial(member.linkedin_url);
      var liUrl = liValid ? member.linkedin_url : "#";
      optionsHtml += '<a href="' + escapeAttr(liUrl) + '" target="_blank" class="fab-option linkedin' + (liValid ? '' : ' disabled') + '" aria-label="LinkedIn">' +
        '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.73C24 .774 23.2 0 22.222 0z"/></svg>' +
        '</a>';

      // WhatsApp
      var waValid = isValidWhatsApp(member.whatsapp);
      var waUrl = "#";
      if (waValid) {
        var waNum = member.whatsapp.replace(/[^0-9+]/g, "");
        waUrl = "https://wa.me/" + (waNum.startsWith("+") ? waNum.slice(1) : waNum);
      }
      optionsHtml += '<a href="' + escapeAttr(waUrl) + '" target="_blank" class="fab-option whatsapp' + (waValid ? '' : ' disabled') + '" aria-label="WhatsApp">' +
        '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
        '</a>';

      fabOptions.innerHTML = optionsHtml;
      fab.style.display = "flex";
      fab.classList.remove("expanded");

      modal.querySelector(".profile-modal-card-wrapper").classList.remove("flipped-state");
      modal.classList.add("active");
      
      // Lock scrolling on body and bento scroll container
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      var scrollContainer = document.querySelector(".scroll-container");
      if (scrollContainer) {
        scrollContainer.style.overflowY = "hidden";
      }
      setBackgroundInteractions(false);
    };

    function generateProfileDetailsHTML(member, isAlumni) {
      var html = "";
      
      html += '<div class="profile-modal-details-header">';
      html += '  <h2 class="profile-detail-name">' + escapeHtml(member.name || "") + '</h2>';
      var designation = member.role || member.panel_name || "";
      if (designation) {
        html += '  <p class="profile-detail-role">' + escapeHtml(designation) + '</p>';
      }
      if (member.year && !isAlumni) {
        html += '  <p class="profile-detail-year">Batch: ' + escapeHtml(member.year) + '</p>';
      }
      html += '</div>';

      if (member.quote) {
        html += '<div class="profile-detail-quote">';
        html += '  <span class="quote-mark">“</span>';
        html += '  <p>' + escapeHtml(member.quote) + '</p>';
        html += '</div>';
      }

      if (member.achievements && member.achievements.length > 0) {
        html += '<div class="profile-detail-section">';
        html += '  <h3>Achievements</h3>';
        html += '  <ul class="profile-achievements-list">';
        member.achievements.forEach(function(ach) {
          var text = typeof ach === "object" ? ach.text : ach;
          html += '    <li>' + escapeHtml(text) + '</li>';
        });
        html += '  </ul>';
        html += '</div>';
      }

      var knownKeys = ["id", "image", "image_url", "sort_order", "created_at", "name", "role", "panel_name", "year", "quote", "achievements", "facebook", "instagram", "linkedin_url", "whatsapp", "phone_number", "email"];
      var otherHtml = "";
      Object.keys(member).forEach(function(key) {
        if (knownKeys.indexOf(key) === -1 && member[key]) {
          var val = member[key];
          if (typeof val === "string" || typeof val === "number") {
            var friendlyKey = key.replace(/_/g, " ").replace(/\b\w/g, function(l) { return l.toUpperCase(); });
            otherHtml += '  <div class="profile-detail-row">';
            otherHtml += '    <span class="profile-detail-key">' + escapeHtml(friendlyKey) + ':</span>';
            otherHtml += '    <span class="profile-detail-val">' + escapeHtml(val) + '</span>';
            otherHtml += '  </div>';
          }
        }
      });

      if (otherHtml) {
        html += '<div class="profile-detail-section">';
        html += '  <h3>Additional Information</h3>';
        html += '  <div class="profile-details-table">' + otherHtml + '</div>';
        html += '</div>';
      }

      return html;
    }

    function escapeHtml(str) {
      var d = document.createElement("div");
      d.appendChild(document.createTextNode(str));
      return d.innerHTML;
    }

    function escapeAttr(str) {
      return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
  }
})();
