(function () {
  var path = window.location.pathname || "";
  var nested = path.indexOf("/sessions/") !== -1 || path.indexOf("/speakers/") !== -1;
  var base = nested ? "../" : "";

  var current = "";
  if (
    path.endsWith("index.html") ||
    path.endsWith("/") ||
    path.match(/discover-2026\/?$/) ||
    path.match(/datalink-discover-2026\/?$/)
  )
    current = "home";
  else if (path.indexOf("upcoming-conferences.html") !== -1) current = "conferences";
  else if (path.indexOf("venue.html") !== -1) current = "venue";
  else if (path.indexOf("schedule.html") !== -1) current = "schedule";
  else if (path.indexOf("/speakers/") !== -1) current = "speakers";
  else if (path.indexOf("/sessions/") !== -1) current = "schedule";

  function aria(id) {
    return current === id ? ' aria-current="page"' : "";
  }

  var applyHref = base + "index.html#apply";
  var logoSrc =
    "https://www.datalinknetworks.net/hs-fs/hubfs/New%20Logo%20Text%20White.png?width=220&name=New%20Logo%20Text%20White.png";
  var header =
    '<header class="site-header">' +
    '<div class="wrap inner">' +
    '<a class="logo logo--mark" href="' +
    base +
    'index.html" aria-label="Datalink Discover — home">' +
    '<img src="' +
    logoSrc +
    '" alt="Datalink Networks" width="200" height="53" />' +
    "</a>" +
    '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
    '<nav id="site-nav" class="nav-main" aria-label="Primary">' +
    '<a href="' +
    base +
    'index.html"' +
    aria("home") +
    ">Home</a>" +
    '<a href="' +
    base +
    'upcoming-conferences.html"' +
    aria("conferences") +
    ">Upcoming conferences</a>" +
    '<a href="' +
    base +
    'venue.html"' +
    aria("venue") +
    ">Venue</a>" +
    '<a href="' +
    base +
    'schedule.html"' +
    aria("schedule") +
    ">Schedule</a>" +
    '<a href="' +
    base +
    'speakers/index.html"' +
    aria("speakers") +
    ">Speakers</a>" +
    '<a class="cta" href="' +
    applyHref +
    '">Apply for access</a>' +
    "</nav></div></header>";

  var footer =
    '<footer class="site-footer">' +
    '<div class="wrap grid">' +
    "<div><h3>Discover series</h3><p>Small, intimate Datalink Discover conferences for information security and technology executives—AI, cloud, and cybersecurity, with partners like Microsoft and TD SYNNEX.</p></div>" +
    "<div><h3>Apply</h3><p>Admission is complimentary for invited guests. Qualifying attendees may receive a fully covered experience including travel, lodging, and meals—subject to application review.</p><p><a href=\"" +
    applyHref +
    '">Apply for complimentary access →</a></p></div>' +
    "<div><h3>Contact</h3><p>Phone: <a href=\"tel:8774873783\">(877) 487-3783</a><br>Email: <a href=\"mailto:learnmore@datalinknetworks.net?subject=Datalink%20Discover%20%E2%80%94%20Complimentary%20Access%20Application\">learnmore@datalinknetworks.net</a></p><p><a href=\"" +
    base +
    'upcoming-conferences.html">Upcoming conferences</a><br><a href="' +
    base +
    'schedule.html">Schedule</a><br><a href="https://www.datalinknetworks.net" target="_blank" rel="noopener">Datalink Networks</a></p></div>' +
    "</div><div class=\"wrap\" style=\"margin-top:2rem;text-align:center;font-size:0.85rem\">Eligibility and benefits confirmed upon selection. © Datalink Networks.</div></footer>";

  function inject() {
    var h = document.getElementById("site-header");
    var f = document.getElementById("site-footer");
    if (h) h.innerHTML = header;
    if (f) f.innerHTML = footer;

    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", inject);
  else inject();
})();
