import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  // ── AI Content Disclosure — Paste Detection ──────────────────────
  //
  // Detects paste events in the composer and shows a subtle nudge
  // for authors to disclose AI-generated or AI-assisted content.
  // ─────────────────────────────────────────────────────────────────

  const siteSettings = api.container.lookup("service:site-settings");
  const themePrefix = api._currentThemeId ? `theme_translations.${api._currentThemeId}.` : "";

  // ── Settings ──────────────────────────────────────────────────
  // Theme settings are available via the settings object injected
  // by Discourse's theme infrastructure. We access them via the
  // api.container's theme-settings service, or fall back to defaults.
  let themeSettings;
  try {
    const allThemeSettings = api.container.lookup("service:theme-settings");
    themeSettings = allThemeSettings?.getSetting ? allThemeSettings : null;
  } catch (e) {
    themeSettings = null;
  }

  // Helper to read a setting with a fallback default
  function getSetting(key, fallback) {
    // Modern Discourse exposes theme settings on the settings object
    // that is available in the theme's JS scope
    if (typeof settings !== "undefined" && settings[key] !== undefined) {
      return settings[key];
    }
    return fallback;
  }

  const MIN_PASTE_LENGTH     = getSetting("min_paste_length", 100);
  const LABEL_GENERATED      = getSetting("generated_label", "AI-generated");
  const LABEL_ASSISTED       = getSetting("assisted_label", "AI-assisted");
  const NUDGE_MESSAGE        = getSetting("nudge_message", "Looks like you pasted some content — is it AI-generated?");
  const DESC_GENERATED       = getSetting("generated_hover_description", "Lightly reviewed AI-generated content");
  const DESC_ASSISTED        = getSetting("assisted_hover_description", "Reviewed and edited AI-generated content");
  const DESC_HUMAN           = getSetting("human_written_hint", "Content is authored by a human? Just dismiss this notice.");

  // Hardcoded prefix — keeps CSS styling and detection reliable
  const DISCLOSURE_PREFIX    = "> :robot:";
  const DISCLOSURE_GENERATED = `${DISCLOSURE_PREFIX} ${getSetting("generated_message", "This post contains AI-generated content.")}`;
  const DISCLOSURE_ASSISTED  = `${DISCLOSURE_PREFIX} ${getSetting("assisted_message", "This post was written with AI assistance.")}`;

  function hasExistingDisclosure(text) {
    return text.includes(DISCLOSURE_PREFIX);
  }

  let nudgeEl = null;

  // ── Utility ─────────────────────────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Build the nudge DOM element (once, lazily) ──────────────
  function ensureNudge() {
    if (nudgeEl) return nudgeEl;

    nudgeEl = document.createElement("div");
    nudgeEl.className = "ai-disclosure-nudge --fading-out";
    nudgeEl.setAttribute("role", "status");
    nudgeEl.setAttribute("aria-live", "polite");
    nudgeEl.innerHTML = `
      <span class="ai-disclosure-nudge__text">${escapeHtml(NUDGE_MESSAGE)}</span>
      <span class="ai-disclosure-nudge__actions">
        <button class="ai-disclosure-nudge__btn --generated"
                data-disclosure="generated">${escapeHtml(LABEL_GENERATED)}</button>
        <button class="ai-disclosure-nudge__btn --assisted"
                data-disclosure="assisted">${escapeHtml(LABEL_ASSISTED)}</button>
        <span class="ai-disclosure-nudge__spacer"></span>
        <button class="ai-disclosure-nudge__dismiss"
                title="Dismiss" aria-label="Dismiss">✕</button>
      </span>
      <span class="ai-disclosure-nudge__description">${escapeHtml(DESC_HUMAN)}</span>
    `;
    document.body.appendChild(nudgeEl);

    // Event delegation within the nudge
    nudgeEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-disclosure]");
      if (btn) {
        addDisclosure(btn.dataset.disclosure);
        return;
      }
      if (e.target.closest(".ai-disclosure-nudge__dismiss")) {
        hideNudge();
      }
    });

    // Dynamic description text that changes on button hover
    const descEl = nudgeEl.querySelector(".ai-disclosure-nudge__description");
    const hoverDescriptions = { generated: DESC_GENERATED, assisted: DESC_ASSISTED };

    nudgeEl.querySelectorAll("[data-disclosure]").forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        descEl.textContent = hoverDescriptions[btn.dataset.disclosure];
      });
      btn.addEventListener("mouseleave", () => {
        descEl.textContent = DESC_HUMAN;
      });
    });

    return nudgeEl;
  }

  // ── Show / hide helpers ─────────────────────────────────────
  function showNudge() {
    const el = ensureNudge();
    // Force reflow so the transition plays even if we're re-showing
    el.classList.add("--fading-out");
    void el.offsetHeight;
    el.classList.remove("--fading-out");
  }

  function hideNudge() {
    if (nudgeEl) nudgeEl.classList.add("--fading-out");
  }

  // ── Composer access (supports both modern service and legacy controller) ─
  function getComposerModel() {
    // Modern Discourse (2025+): service-based composer
    try {
      const composerService = api.container.lookup("service:composer");
      if (composerService?.model) return composerService.model;
    } catch (e) { /* not available */ }

    // Fallback: try as a plain service name without prefix
    try {
      const composerAlt = api.container.lookup("composer");
      if (composerAlt?.model) return composerAlt.model;
    } catch (e) { /* not available */ }

    // Legacy Discourse (<3.3): controller-based composer
    try {
      const composerController = api.container.lookup("controller:composer");
      if (composerController?.model) return composerController.model;
    } catch (e) { /* not available */ }

    return null;
  }

  function getReplyText() {
    const model = getComposerModel();
    if (!model) return "";
    return (typeof model.get === "function" ? model.get("reply") : model.reply) || "";
  }

  function setReplyText(text) {
    const model = getComposerModel();
    if (!model) return;
    if (typeof model.set === "function") {
      model.set("reply", text);
    } else {
      model.reply = text;
    }
  }

  // ── Insert disclosure into the composer ──────────────────────
  function addDisclosure(type) {
    const currentText = getReplyText();

    // Don't double-add
    if (hasExistingDisclosure(currentText)) {
      hideNudge();
      return;
    }

    const disclosure =
      type === "generated" ? DISCLOSURE_GENERATED : DISCLOSURE_ASSISTED;

    setReplyText(disclosure + "\n\n" + currentText);
    hideNudge();
  }

  // ── Paste handler ───────────────────────────────────────────
  function onPaste(e) {
    // Only act on the composer textarea
    if (
      !e.target.matches ||
      !e.target.matches("textarea.d-editor-input, .d-editor-input textarea")
    ) {
      return;
    }

    // Check length of pasted text
    const pasted =
      e.clipboardData?.getData("text/plain") ||
      e.clipboardData?.getData("text") ||
      "";
    if (pasted.length < MIN_PASTE_LENGTH) return;

    // Small delay so Discourse state updates with the pasted text
    setTimeout(() => {
      const currentText = getReplyText();

      // Skip if disclosure already present
      if (hasExistingDisclosure(currentText)) return;

      showNudge();
    }, 150);
  }

  // ── Cleanup when composer closes ────────────────────────────
  function onComposerClose() {
    hideNudge();
  }

  // ── Wire it up ──────────────────────────────────────────────
  // Use capture-phase event delegation
  document.addEventListener("paste", onPaste, true);

  // Hide nudge when the composer is cancelled or closed
  api.onAppEvent("composer:will-close",  onComposerClose);
  api.onAppEvent("composer:cancelled",   onComposerClose);

  // Also hide on route change (navigating away)
  api.onPageChange(() => hideNudge());
});
