(function () {
  var path = (window.location.pathname || "").replace(/\\/g, "/");

  function computeLayout() {
    var L = {
      root: "",
      apply: "apply.html",
      upcoming: "upcoming-conferences.html",
      css: "css/main.css",
      bv: "bentonville/",
      wc: "west-coast/",
      section: "series",
      eventRoot: "",
    };
    if (path.indexOf("/bentonville/sessions/") !== -1 || path.indexOf("/bentonville/speakers/") !== -1) {
      L.root = "../../";
      L.apply = "../../apply.html";
      L.upcoming = "../../upcoming-conferences.html";
      L.bv = "../";
      L.wc = "../../west-coast/";
      L.section = "bentonville";
      L.eventRoot = "../";
    } else if (path.indexOf("/bentonville/") !== -1) {
      L.root = "../";
      L.apply = "../apply.html";
      L.upcoming = "../upcoming-conferences.html";
      L.bv = "";
      L.wc = "../west-coast/";
      L.section = "bentonville";
      L.eventRoot = "";
    } else if (path.indexOf("/west-coast/sessions/") !== -1 || path.indexOf("/west-coast/speakers/") !== -1) {
      L.root = "../../";
      L.apply = "../../apply.html";
      L.upcoming = "../../upcoming-conferences.html";
      L.bv = "../../bentonville/";
      L.wc = "../";
      L.section = "west-coast";
      L.eventRoot = "../";
    } else if (path.indexOf("/west-coast/") !== -1) {
      L.root = "../";
      L.apply = "../apply.html";
      L.upcoming = "../upcoming-conferences.html";
      L.bv = "../bentonville/";
      L.wc = "";
      L.section = "west-coast";
      L.eventRoot = "";
    } else {
      L.root = "";
      L.apply = "apply.html";
      L.upcoming = "upcoming-conferences.html";
      L.bv = "bentonville/";
      L.wc = "west-coast/";
      L.section = "series";
    }
    return L;
  }

  var L = computeLayout();

  var applyQuery =
    L.section === "bentonville"
      ? "?event=bentonville"
      : L.section === "west-coast"
        ? "?event=west-coast"
        : "";
  var applyHref = L.apply + (applyQuery ? applyQuery : "");

  var current = "";
  if (path.indexOf("/bentonville/index.html") !== -1 || path.match(/\/bentonville\/?$/)) {
    if (L.section === "bentonville") current = "bv-overview";
  }
  if (path.indexOf("/west-coast/index.html") !== -1 || path.match(/\/west-coast\/?$/)) {
    if (L.section === "west-coast") current = "wc-overview";
  }
  if (
    (path.endsWith("index.html") || path.endsWith("/") || path.match(/discover-2026\/?$/) || path.match(/datalink-discover-2026\/?$/)) &&
    L.section === "series"
  ) {
    current = "home";
  }
  if (path.indexOf("upcoming-conferences.html") !== -1) current = "conferences";
  if (path.indexOf("apply.html") !== -1) current = "apply";
  if (L.section === "bentonville" && path.indexOf("venue.html") !== -1) current = "bv-venue";
  if (L.section === "bentonville" && path.indexOf("schedule.html") !== -1) current = "bv-schedule";
  if (L.section === "west-coast" && path.indexOf("venue.html") !== -1) current = "wc-venue";
  if (L.section === "west-coast" && path.indexOf("schedule.html") !== -1) current = "wc-schedule";
  if (path.indexOf("/bentonville/speakers/") !== -1) current = "bv-speakers";
  if (path.indexOf("/west-coast/speakers/") !== -1) current = "wc-speakers";

  function aria(id) {
    return current === id ? ' aria-current="page"' : "";
  }

  var logoSrc =
    "https://www.datalinknetworks.com/hs-fs/hubfs/New%20Logo%20Text%20White.png?width=220&name=New%20Logo%20Text%20White.png";

  var dropdownBv =
    '<div class="nav-dropdown">' +
    '<button type="button" class="nav-dropdown__btn" aria-expanded="false" aria-haspopup="true" aria-controls="nav-dd-bv">Bentonville</button>' +
    '<div id="nav-dd-bv" class="nav-dropdown__panel" role="menu">' +
    '<a role="menuitem" href="' +
    L.bv +
    'index.html"' +
    aria("bv-overview") +
    ">Event overview</a>" +
    '<a role="menuitem" href="' +
    L.bv +
    'schedule.html"' +
    aria("bv-schedule") +
    ">Schedule</a>" +
    '<a role="menuitem" href="' +
    L.bv +
    'venue.html"' +
    aria("bv-venue") +
    ">Venue &amp; travel</a>" +
    '<a role="menuitem" href="' +
    L.bv +
    'speakers/index.html"' +
    aria("bv-speakers") +
    ">Speakers</a>" +
    '<a role="menuitem" class="nav-dropdown__cta" href="' +
    L.apply +
    '?event=bentonville">Apply for All Expenses Paid Access</a>' +
    "</div></div>";

  var dropdownWc =
    '<div class="nav-dropdown">' +
    '<button type="button" class="nav-dropdown__btn" aria-expanded="false" aria-haspopup="true" aria-controls="nav-dd-wc">Mandalay Beach</button>' +
    '<div id="nav-dd-wc" class="nav-dropdown__panel" role="menu">' +
    '<a role="menuitem" href="' +
    L.wc +
    'index.html"' +
    aria("wc-overview") +
    ">Event overview</a>" +
    '<a role="menuitem" href="' +
    L.wc +
    'schedule.html"' +
    aria("wc-schedule") +
    ">Schedule</a>" +
    '<a role="menuitem" href="' +
    L.wc +
    'venue.html"' +
    aria("wc-venue") +
    ">Venue &amp; travel</a>" +
    '<a role="menuitem" href="' +
    L.wc +
    'speakers/index.html"' +
    aria("wc-speakers") +
    ">Speakers</a>" +
    '<a role="menuitem" class="nav-dropdown__cta" href="' +
    L.apply +
    '?event=west-coast">Apply for All Expenses Paid Access</a>' +
    "</div></div>";

  var header =
    '<header class="site-header">' +
    '<div class="wrap site-header__inner">' +
    '<a class="logo logo--mark" href="' +
    L.root +
    'index.html" aria-label="Datalink Discover — home">' +
    '<img src="' +
    logoSrc +
    '" alt="Datalink Networks" width="200" height="53" />' +
    "</a>" +
    '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
    '<nav id="site-nav" class="nav-main" aria-label="Primary">' +
    '<a href="' +
    L.root +
    'index.html"' +
    aria("home") +
    ">Series home</a>" +
    dropdownBv +
    dropdownWc +
    '<a href="' +
    L.upcoming +
    '"' +
    aria("conferences") +
    ">Upcoming conferences</a>" +
    '<a class="nav-main__apply" href="' +
    applyHref +
    '"' +
    aria("apply") +
    ">Apply for All Expenses Paid Access</a>" +
    "</nav></div></header>";

  function eventSubnav() {
    if (L.section !== "bentonville" && L.section !== "west-coast") return "";
    var er = L.eventRoot;
    var isBv = L.section === "bentonville";
    var label = isBv
      ? "Bentonville · June 17–19, 2026"
      : '<span class="event-subnav__badge--stack"><span class="event-subnav__badge-line">Mandalay Beach: September 29 – October 2, 2026</span><span class="event-subnav__badge-line event-subnav__badge-line--muted">Oxnard, CA / Zachari Dunes on Mandalay Beach</span></span>';
    return (
      '<nav class="event-subnav" aria-label="' +
      (isBv ? "Bentonville Discover navigation" : "Mandalay Beach Discover navigation") +
      '">' +
      '<div class="wrap event-subnav__inner">' +
      '<span class="event-subnav__badge">' +
      label +
      "</span>" +
      '<div class="event-subnav__links">' +
      '<a href="' +
      er +
      'index.html"' +
      aria(isBv ? "bv-overview" : "wc-overview") +
      ">Overview</a>" +
      '<a href="' +
      er +
      'schedule.html"' +
      aria(isBv ? "bv-schedule" : "wc-schedule") +
      ">Schedule</a>" +
      '<a href="' +
      er +
      'venue.html"' +
      aria(isBv ? "bv-venue" : "wc-venue") +
      ">Venue</a>" +
      '<a href="' +
      er +
      'speakers/index.html"' +
      aria(isBv ? "bv-speakers" : "wc-speakers") +
      ">Speakers</a>" +
      "</div></div></nav>"
    );
  }

  var footer =
    '<footer class="site-footer">' +
    '<div class="wrap site-footer__grid">' +
    "<div><h3>Discover series</h3><p>Private, application-only conferences for senior security and technology leaders—curated sessions on AI, cloud, and cybersecurity with strategic partners.</p></div>" +
    "<div><h3>Apply</h3><p>By approval only. Qualifying leaders may receive all expenses paid (travel, lodging, meals, and conference costs). Other approved guests receive complimentary conference access.</p><p><a href=\"" +
    applyHref +
    '">Apply for All Expenses Paid Access →</a></p></div>' +
    "<div><h3>Contact</h3><p>Phone: <a href=\"tel:8774873783\">(877) 487-3783</a><br>Email: <a href=\"mailto:learnmore.com\">learnmore.com</a></p><p><a href=\"" +
    L.upcoming +
    '">Upcoming conferences</a><br><a href="' +
    L.root +
    'index.html">Series home</a><br><a href="https://www.datalinknetworks.com" target="_blank" rel="noopener">Datalink Networks</a></p></div>' +
    '</div><div class="wrap site-footer__legal">Invitation-only events. Benefits confirmed upon selection. © Datalink Networks.</div></footer>';

  function wireDropdowns() {
    document.querySelectorAll(".nav-dropdown").forEach(function (dd) {
      var btn = dd.querySelector(".nav-dropdown__btn");
      var panel = dd.querySelector(".nav-dropdown__panel");
      if (!btn || !panel) return;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = dd.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      panel.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          dd.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
        });
      });
    });
    document.addEventListener("click", function () {
      document.querySelectorAll(".nav-dropdown.is-open").forEach(function (dd) {
        dd.classList.remove("is-open");
        var b = dd.querySelector(".nav-dropdown__btn");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    });
  }

  function syncChromeHeight() {
    var shell = document.querySelector(".site-sticky-head");
    var px = shell ? shell.offsetHeight : 88;
    document.documentElement.style.setProperty("--site-chrome-h", px + "px");
  }

  function inject() {
    var h = document.getElementById("site-header");
    var f = document.getElementById("site-footer");
    if (h) {
      var sub = eventSubnav();
      h.innerHTML = '<div class="site-sticky-head">' + header + sub + "</div>";
    }
    if (f) f.innerHTML = footer;

    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        requestAnimationFrame(function () {
          requestAnimationFrame(syncChromeHeight);
        });
      });
    }
    wireDropdowns();
    syncChromeHeight();
    requestAnimationFrame(syncChromeHeight);
    window.addEventListener("resize", syncChromeHeight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncChromeHeight);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})();
