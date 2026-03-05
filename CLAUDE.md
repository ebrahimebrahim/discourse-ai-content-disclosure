# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discourse theme component that detects paste events in the composer and nudges authors to disclose AI-generated or AI-assisted content. This is an honor-based system — disclosures are normal editable post text.

## Architecture

This is a **Discourse theme component** (not a plugin). It follows Discourse's theme component conventions:

- `about.json` — Component manifest (minimum Discourse version: 3.1.0)
- `settings.yml` — Nine admin-configurable theme settings with types, ranges, and defaults
- `common/head_tag.html` — All CSS (injected via `<style>` tag into every page)
- `javascripts/discourse/api-initializers/ai-disclosure-nudge.js` — All application logic (~210 lines)

### Key Design Patterns

- **API Initializer**: Entry point uses `apiInitializer()` from `discourse/lib/api`, Discourse's standard extension mechanism for theme components
- **Composer version compatibility**: `getComposerModel()` tries three lookup strategies — `service:composer` (2025+), `composer`, and `controller:composer` (legacy <3.3) — to support all Discourse versions
- **Lazy DOM creation**: The nudge banner element is created on first paste, not at initialization
- **Capture-phase event delegation**: Paste listener is registered on `document` in capture phase to intercept before Discourse's own handlers
- **Settings with fallbacks**: `getSetting()` reads from the `settings` global (injected by Discourse's theme infrastructure) with hardcoded defaults
- **Disclosure detection**: The `:robot:` emoji prefix (`> :robot:`) is hardcoded; detection checks for this prefix via `hasExistingDisclosure()` to prevent duplicates. Only the message text after the prefix is configurable via settings.

### CSS Conventions

- Uses Discourse CSS custom properties (`--secondary`, `--primary-low`, `--tertiary`, `--danger`, etc.) for theme compatibility
- Z-index 1060 (above composer, below modals)
- Mobile breakpoint at 600px; bottom offset 70px to clear mobile composer toolbar
- `:has()` selector with fallback for rendered disclosure blockquote styling

## Development & Testing

There is no build step, test suite, or linter. The component is plain vanilla JavaScript and CSS.

**To test manually on a Discourse instance:**

1. Install the component (Appearance > Components > Install > From a git repository, enter this repo's URL)
2. Create a test theme and add this component to it (don't set as default)
3. Browse with `?preview_theme_id=<ID>` to preview without affecting other users

**Quick test checklist** (from README):
1. Open any topic, click Reply
2. Paste text >100 characters — nudge banner should appear bottom-right
3. Click AI-generated or AI-assisted — disclosure blockquote is prepended
4. Paste again — nudge should NOT reappear (disclosure already exists)
5. Remove disclosure text, paste again — nudge reappears
6. Dismiss or wait 8 seconds — nudge fades out

