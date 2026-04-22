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
   * Form fields must match your HubSpot form field internal names (see form editor → field → internal name).
   * HubSpot creates/updates the contact from the standard Email property (`email`). If the form only has `work_email`,
   * submissions show “No contact record” / “No email was entered” even when work_email has a value — extra JSON keys
   * are not applied unless that field exists on the form. Add a real form field (hidden is fine) mapped to Contact →
   * Email, internal name `email`, then publish. We send both `email` and `work_email` with the same address.
   * If submissions still appear empty in HubSpot: turn off reCAPTCHA on the form (API cannot solve it), publish the form,
   * and confirm each field’s internal name under the field’s “Advanced” / property mapping in the form editor.
   *
   * Context: `hutk` (hubspotutk cookie), `pageUri`, `pageName`, optional `ipAddress`. Do not add extra context keys
   * (e.g. userAgent) unless documented — they can make the whole request invalid on the public submit endpoint.
   *
   * If HubSpot shows the submission but “no contact” / cookie warnings: (1) Confirm `hubspotutk` exists before submit
   * (DevTools → Application → Cookies; Network → request body has context.hutk). (2) Allowlist the site domain under
   * Settings → Tracking Code → Advanced / Domains. (3) Check Form submissions → Spam. (4) Form must include every
   * submitted field internal name (since 2022, extra CRM fields return FIELD_NOT_IN_FORM_DEFINITION / 400). (5) If the
   * form requires GDPR/legal consent, the API payload must include matching legalConsentOptions or HubSpot may not
   * create/update the contact as expected.
   */
  var HUBSPOT_FORMS_HOST = "https://api.hsforms.com";
  // var HUBSPOT_FORMS_HOST = "https://api-eu1.hsforms.com"; // uncomment if your portal is EU-hosted

  /** Portal = segment after /forms/ in editor URL; form GUID = UUID in path or _hsFormId on share preview links. */
  var HUBSPOT_PORTAL_ID = "486200";
  var HUBSPOT_FORM_GUID = "1367822b-5536-471b-9308-f10fbf2e35e3";

  /** HubSpot internal value for discover_event — Bentonville (from field settings in HubSpot). */
  var DISCOVER_EVENT_BENTONVILLE = "8_zkT2mv1n-gr_EqISs0N";

  var form = document.getElementById("discover-apply-form");
  var statusEl = document.getElementById("apply-form-status");
  var formPanel = document.getElementById("apply-form-panel");
  var successPanel = document.getElementById("apply-success-panel");
  var cardHeading = document.getElementById("apply-card-heading");

  if (!form) return;

  function showStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.removeAttribute("hidden");
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", !!isError);
  }

  /** Replaces the form block with the thank-you message. Form returns on full page load (session persistence later). */
  function showApplySuccess() {
    showStatus("", false);
    if (statusEl) statusEl.setAttribute("hidden", "");
    if (cardHeading) cardHeading.setAttribute("hidden", "");
    if (formPanel) formPanel.setAttribute("hidden", "");
    if (successPanel) {
      successPanel.removeAttribute("hidden");
      try {
        successPanel.focus();
        successPanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch (ignore) {}
    }
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
    return ctx;
  }

  /** Wait briefly for HubSpot’s script to set `hubspotutk` (injected from site.js). */
  function waitForHubspotUtk(maxWaitMs) {
    if (getHubspotUtk()) return Promise.resolve();
    var start = Date.now();
    return new Promise(function (resolve) {
      var id = setInterval(function () {
        if (getHubspotUtk() || Date.now() - start >= maxWaitMs) {
          clearInterval(id);
          resolve();
        }
      }, 80);
    });
  }

  /** Flatten HubSpot error payload for display (message alone is often generic). */
  function hubspotErrorDetail(data) {
    if (!data || typeof data !== "object") return "";
    var parts = [];
    if (data.message) parts.push(String(data.message));
    if (data.errors && data.errors.length) {
      data.errors.forEach(function (er) {
        if (!er) return;
        var bit = er.message || er.errorType || (typeof er === "string" ? er : "");
        if (bit) parts.push(String(bit));
      });
    }
    if (data.correlationId) parts.push("Reference: " + data.correlationId);
    return parts.filter(Boolean).join(" — ");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showStatus("");

    if (form.website && form.website.value) {
      showApplySuccess();
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

    var discoverEventValue = DISCOVER_EVENT_BENTONVILLE;

    if (!HUBSPOT_PORTAL_ID || !HUBSPOT_FORM_GUID) {
      form.reset();
      showApplySuccess();
      return;
    }

    var formsBase = (HUBSPOT_FORMS_HOST || "https://api.hsforms.com").replace(/\/+$/, "");
    var url =
      formsBase +
      "/submissions/v3/integration/submit/" +
      encodeURIComponent(HUBSPOT_PORTAL_ID) +
      "/" +
      encodeURIComponent(HUBSPOT_FORM_GUID);

    function field(name, value) {
      return { name: name, value: value };
    }

    var fields = [
      field("email", String(email)),
      field("work_email", String(email)),
      field("firstname", firstname),
      field("lastname", lastname),
      field("company", company),
      field("jobtitle", jobtitle),
      field("phone", phone),
      field("discover_event", discoverEventValue),
    ];

    waitForHubspotUtk(5500)
      .then(function () {
        if (!getHubspotUtk() && typeof console !== "undefined" && console.warn) {
          console.warn(
            "[Discover apply] hubspotutk still missing after wait — HubSpot often cannot link this submission to a contact. Allowlist the domain, disable ad blockers for this page, and confirm the tracking script loads (see apply.html head + js/site.js)."
          );
        }
        return fetchClientIp();
      })
      .then(function (clientIp) {
        var ctx = buildFormContext(clientIp);
        if (typeof console !== "undefined" && console.info) {
          console.info("[Discover apply] HubSpot submit: context.hutk present = " + (ctx.hutk ? "yes" : "no"));
        }
        return {
          submittedAt: String(Date.now()),
          fields: fields,
          context: ctx,
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
            var msg = hubspotErrorDetail(data) || text || "HTTP " + res.status;
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
            console.info(
              "[Discover apply] If the submission shows no contact in HubSpot, open that submission and read the on-screen banner (missing cookie vs spam vs consent)."
            );
          }
          return data;
        });
      })
      .then(function () {
        form.reset();
        showApplySuccess();
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
        if (detail && detail.length < 480) {
          showStatus(
            "We could not submit the form: " + detail + " If this persists, email arindt@datalinknetworks.net or call (877) 487-3783.",
            true
          );
        } else {
          showStatus("Something went wrong. Please email arindt@datalinknetworks.net or call (877) 487-3783.", true);
        }
      });
  });
})();
