(function () {
  /**
   * HubSpot Forms API — unauthenticated submit (same as embedded forms).
   * POST {HUBSPOT_FORMS_HOST}/submissions/v3/integration/submit/{portalId}/{formGuid}
   *
   * SETUP (required or you get “form … can’t be found”):
   * 1. HubSpot → Marketing → Lead capture → Forms → open the Discover apply form.
   * 2. Click “Share” / “Embed” and find hbspt.forms.create({ portalId: "…", formId: "…" }) (formId is the form GUID).
   * 3. Paste those exact strings into HUBSPOT_PORTAL_ID and HUBSPOT_FORM_GUID below.
   *    Do NOT use a Private App key, workflow ID, or “API key” — only the formId from the embed snippet.
   * 4. If your account uses EU data hosting, set HUBSPOT_FORMS_HOST to https://api-eu1.hsforms.com
   *    (see HubSpot community / docs for regional forms endpoints).
   *
   * Form fields must match your HubSpot form field internal names. We send both `email` (HubSpot default contact email)
   * and `work_email` with the same value so contacts/submissions populate whether the form maps Email or Work email.
   * If submissions still appear empty in HubSpot: turn off reCAPTCHA on the form (API cannot solve it), publish the form,
   * and confirm each field’s internal name under the field’s “Advanced” / property mapping in the form editor.
   *
   * Context: pass `hutk` from the hubspotutk cookie (set when HubSpot tracking is installed on this domain) so HubSpot
   * can link submissions to contacts and analytics. We also pass `ipAddress` when a quick client-IP lookup succeeds.
   */
  var HUBSPOT_FORMS_HOST = "https://api.hsforms.com";
  // var HUBSPOT_FORMS_HOST = "https://api-eu1.hsforms.com"; // uncomment if your portal is EU-hosted

  /** Portal = segment after /forms/ in editor URL; form GUID = UUID in path or _hsFormId on share preview links. */
  var HUBSPOT_PORTAL_ID = "486200";
  var HUBSPOT_FORM_GUID = "1367822b-5536-471b-9308-f10fbf2e35e3";

  /** HubSpot internal values for discover_event options (from field settings in HubSpot). */
  var EVENT_HUBSPOT_VALUES = {
    bentonville: "8_zkT2mv1n-gr_EqISs0N",
    "west-coast": "Yy4r1Tmx_W8tdHBa_USOt",
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

  /** Values HubSpot expects for discover_event (enumeration / multi-checkbox). */
  function hubspotDiscoverEventValue(slugs) {
    return slugs
      .map(function (s) {
        return EVENT_HUBSPOT_VALUES[s] || "";
      })
      .filter(Boolean)
      .join(";");
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

  function showStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", !!isError);
  }

  /** Value of HubSpot’s visitor cookie (required for linking API submissions to contacts / sessions). */
  function getHubspotUtk() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]*)/);
      if (!m || !m[1]) return "";
      return decodeURIComponent(m[1].replace(/^"+|"+$/g, "").trim());
    } catch (e) {
      return "";
    }
  }

  /** Best-effort public IP for HubSpot context (avoids “no IP” warnings on API submissions). */
  function fetchClientIp() {
    var ctrl = new AbortController();
    var t = setTimeout(function () {
      ctrl.abort();
    }, 2500);
    function done() {
      clearTimeout(t);
    }
    return fetch("https://api.ipify.org?format=json", { signal: ctrl.signal, credentials: "omit" })
      .then(function (r) {
        if (!r.ok) return "";
        return r.json();
      })
      .then(function (j) {
        return j && j.ip ? String(j.ip).trim() : "";
      })
      .catch(function () {
        return "";
      })
      .finally(done);
  }

  function buildFormContext(clientIp) {
    var ctx = {
      pageUri: window.location.href,
      pageName: document.title,
    };
    var utk = getHubspotUtk();
    if (utk) ctx.hutk = utk;
    if (clientIp) ctx.ipAddress = clientIp;
    if (typeof navigator !== "undefined" && navigator.userAgent) {
      ctx.userAgent = navigator.userAgent;
    }
    return ctx;
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

    var firstname = document.getElementById("field-firstname").value.trim();
    var lastname = document.getElementById("field-lastname").value.trim();
    var company = document.getElementById("field-company").value.trim();
    var jobtitle = document.getElementById("field-jobtitle").value.trim();
    var email = document.getElementById("field-email").value.trim();
    var phone = document.getElementById("field-phone").value.trim();

    if (!firstname || !lastname || !company || !jobtitle || !email || !phone) {
      showStatus("Please complete all required fields.", true);
      return;
    }

    var discoverEventValue = hubspotDiscoverEventValue(selected);

    if (!HUBSPOT_PORTAL_ID || !HUBSPOT_FORM_GUID) {
      showStatus(
        "Thank you — your details are captured for this preview. Connect HubSpot in js/apply-form.js (portal ID + form GUID) to sync submissions automatically.",
        false
      );
      form.reset();
      applyUrlPreselection();
      return;
    }

    var formsBase = (HUBSPOT_FORMS_HOST || "https://api.hsforms.com").replace(/\/+$/, "");
    var url =
      formsBase +
      "/submissions/v3/integration/submit/" +
      encodeURIComponent(HUBSPOT_PORTAL_ID) +
      "/" +
      encodeURIComponent(HUBSPOT_FORM_GUID);

    var contact = "0-1";
    function f(name, value) {
      return { objectTypeId: contact, name: name, value: value };
    }

    var fields = [
      f("firstname", firstname),
      f("lastname", lastname),
      f("company", company),
      f("jobtitle", jobtitle),
      f("email", email),
      f("work_email", email),
      f("phone", phone),
      f("discover_event", discoverEventValue),
    ];

    if (!getHubspotUtk() && typeof console !== "undefined" && console.warn) {
      console.warn(
        "[Discover apply] No hubspotutk cookie yet. Add HubSpot’s tracking code to this site (same domain) so form submissions link to contacts and sessions."
      );
    }

    fetchClientIp()
      .then(function (clientIp) {
        return {
          submittedAt: String(Date.now()),
          fields: fields,
          context: buildFormContext(clientIp),
        };
      })
      .then(function (payload) {
        return fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
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
          var st = data && (data.status || data.state);
          if (st && String(st).toLowerCase() === "error") {
            var err2 = new Error(data.message || "HubSpot returned an error status in the response body.");
            err2.hubspotBody = data;
            throw err2;
          }
          if (typeof console !== "undefined" && console.info) {
            console.info("[Discover apply] HubSpot response:", data);
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
        var dlow = detail.replace(/\u2019/g, "'").toLowerCase();
        var notFound =
          detail &&
          (dlow.indexOf("can't be found") !== -1 ||
            dlow.indexOf("cannot be found") !== -1 ||
            dlow.indexOf("not be found") !== -1 ||
            dlow.indexOf("form_not_found") !== -1 ||
            dlow.indexOf("invalid form") !== -1);
        if (notFound) {
          showStatus(
            "HubSpot does not recognize this portal + form ID. In HubSpot: Marketing → Lead capture → Forms → your apply form → Share → embed, and copy portalId and formId into HUBSPOT_PORTAL_ID and HUBSPOT_FORM_GUID in js/apply-form.js (they must come from the same snippet). EU-hosted portals: set HUBSPOT_FORMS_HOST to https://api-eu1.hsforms.com . HubSpot message: " +
              detail,
            true
          );
          return;
        }
        if (detail && detail.length < 280) {
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
