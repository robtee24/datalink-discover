(function () {
  /**
   * HubSpot Forms API (v3 integration submit).
   * Endpoint: POST https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}
   * Uses your portal ID and the form’s GUID (from HubSpot → Marketing → Forms → embed / form details).
   * No private API key is sent from the browser; this public endpoint is how embedded HubSpot forms work.
   *
   * In HubSpot, create a form (or edit the linked form) with internal field names matching the payload:
   * firstname, lastname, company, jobtitle, email, phone, plus a single-line text property discover_event
   * for “which event(s)” (semicolon-separated labels).
   */
  var HUBSPOT_PORTAL_ID = "486200";
  var HUBSPOT_FORM_GUID = "8c9b18cc-546f-4a65-81aa-2ba8a8512e4f";

  var EVENT_OPTIONS = {
    bentonville: "Discover — Bentonville · June 17–19, 2026",
    "west-coast": "Discover — West Coast · September 9–11, 2026",
  };

  var form = document.getElementById("discover-apply-form");
  var statusEl = document.getElementById("apply-form-status");
  var eventField = document.getElementById("field-event");

  if (!form) return;

  var checkboxes = form.querySelectorAll('input[name="apply_event"][type="checkbox"]');

  function getSelectedSlugs() {
    var out = [];
    checkboxes.forEach(function (cb) {
      if (cb.checked) out.push(cb.value);
    });
    return out;
  }

  function syncHiddenEventField() {
    var slugs = getSelectedSlugs();
    eventField.value = slugs.length ? slugs.join(",") : "";
  }

  function humanLabelsForSlugs(slugs) {
    return slugs
      .map(function (s) {
        return EVENT_OPTIONS[s] || s;
      })
      .join("; ");
  }

  function applyUrlPreselection() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.getAll("event").map(function (s) {
      return String(s).toLowerCase().trim();
    });
    if (fromUrl.length === 0) {
      checkboxes.forEach(function (cb) {
        cb.checked = false;
      });
    } else {
      checkboxes.forEach(function (cb) {
        cb.checked = fromUrl.indexOf(cb.value) !== -1;
      });
      if (getSelectedSlugs().length === 0) {
        checkboxes.forEach(function (cb) {
          cb.checked = false;
        });
      }
    }
    syncHiddenEventField();
  }

  applyUrlPreselection();

  checkboxes.forEach(function (cb) {
    cb.addEventListener("change", syncHiddenEventField);
  });

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

    var selected = getSelectedSlugs();
    syncHiddenEventField();

    if (selected.length === 0) {
      showStatus("Please select at least one event.", true);
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
    var eventHuman = humanLabelsForSlugs(selected);

    if (!HUBSPOT_PORTAL_ID || !HUBSPOT_FORM_GUID) {
      showStatus(
        "Thank you — your details are captured for this preview. Connect HubSpot in js/apply-form.js (portal ID + form GUID) to sync submissions automatically.",
        false
      );
      form.reset();
      applyUrlPreselection();
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
        return res.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (ignore) {}
          if (!res.ok) {
            var msg =
              data.message ||
              (data.errors &&
                data.errors[0] &&
                (data.errors[0].message || data.errors[0].errorType)) ||
              text ||
              "HTTP " + res.status;
            var err = new Error(msg);
            err.hubspotBody = data;
            throw err;
          }
          return data;
        });
      })
      .then(function () {
        showStatus("Thank you. Our team will review your application and follow up by email.", false);
        form.reset();
        applyUrlPreselection();
      })
      .catch(function (err) {
        if (typeof console !== "undefined" && console.error) {
          console.error("HubSpot form submit:", err && err.message, err && err.hubspotBody);
        }
        var detail = err && err.message ? String(err.message) : "";
        if (detail && detail.length < 220) {
          showStatus(
            "We could not submit the form: " + detail + " If this persists, email learnmore@datalinknetworks.net or call (877) 487-3783.",
            true
          );
        } else {
          showStatus("Something went wrong. Please email learnmore@datalinknetworks.net or call (877) 487-3783.", true);
        }
      });
  });
})();
