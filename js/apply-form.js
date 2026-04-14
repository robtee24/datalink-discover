(function () {
  /**
   * HubSpot Forms API (v3 integration submit).
   * Create a form in HubSpot with matching fields (or map custom internal names),
   * then set portal ID + form GUID below. CORS is allowed for this endpoint from browsers.
   * Field names expected: firstname, lastname, company, jobtitle, email, phone,
   * plus a single-line text field with internal name discover_event (create in HubSpot).
   */
  var HUBSPOT_PORTAL_ID = "";
  var HUBSPOT_FORM_GUID = "";

  var form = document.getElementById("discover-apply-form");
  var statusEl = document.getElementById("apply-form-status");
  var eventField = document.getElementById("field-event");
  var eventLabel = document.getElementById("apply-event-label");

  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var ev = (params.get("event") || "").toLowerCase();
  var eventHuman = "Datalink Discover (your choice of event)";
  if (ev === "bentonville") eventHuman = "Discover — Bentonville · June 17–19, 2026";
  else if (ev === "west-coast") eventHuman = "Discover — West Coast · September 9–11, 2026 (announced dates)";
  eventField.value = ev || "unspecified";
  if (eventLabel) eventLabel.textContent = "Applying for: " + eventHuman;

  function splitName(full) {
    var t = (full || "").trim();
    if (!t) return { first: "", last: "" };
    var i = t.indexOf(" ");
    if (i === -1) return { first: t, last: "." };
    return { first: t.slice(0, i).trim(), last: t.slice(i + 1).trim() || "." };
  }

  function showStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", !!isError);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showStatus("");

    if (form.website && form.website.value) {
      showStatus("Thanks — we will be in touch.", false);
      return;
    }

    var fullname = document.getElementById("field-fullname").value.trim();
    var company = document.getElementById("field-company").value.trim();
    var jobtitle = document.getElementById("field-jobtitle").value.trim();
    var email = document.getElementById("field-email").value.trim();
    var phone = document.getElementById("field-phone").value.trim();

    if (!fullname || !company || !jobtitle || !email || !phone) {
      showStatus("Please complete all required fields.", true);
      return;
    }

    var names = splitName(fullname);
    var eventVal = eventField.value;

    if (!HUBSPOT_PORTAL_ID || !HUBSPOT_FORM_GUID) {
      showStatus(
        "Thank you — your details are captured for this preview. Connect HubSpot in js/apply-form.js (portal ID + form GUID) to sync submissions automatically.",
        false
      );
      form.reset();
      eventField.value = ev || "unspecified";
      return;
    }

    var url =
      "https://api.hsforms.com/submissions/v3/integration/submit/" +
      encodeURIComponent(HUBSPOT_PORTAL_ID) +
      "/" +
      encodeURIComponent(HUBSPOT_FORM_GUID);

    var payload = {
      fields: [
        { name: "firstname", value: names.first },
        { name: "lastname", value: names.last },
        { name: "company", value: company },
        { name: "jobtitle", value: jobtitle },
        { name: "email", value: email },
        { name: "phone", value: phone },
        { name: "discover_event", value: eventHuman },
      ],
      context: {
        pageUri: window.location.href,
        pageName: document.title,
      },
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Submit failed");
        return res.json().catch(function () {
          return {};
        });
      })
      .then(function () {
        showStatus("Thank you. Our team will review your application and follow up by email.", false);
        form.reset();
        eventField.value = ev || "unspecified";
      })
      .catch(function () {
        showStatus("Something went wrong. Please email learnmore@datalinknetworks.net or call (877) 487-3783.", true);
      });
  });
})();
