# AI Content Disclosure Nudge

A Discourse theme component that detects paste events in the composer and nudges authors to disclose AI-generated or AI-assisted content.

## How It Works

When an author pastes text longer than a configurable threshold (default 100 chars) into the composer, a small floating banner appears offering two buttons: AI-generated and AI-assisted, plus a dismiss button.

Clicking a button prepends a disclosure blockquote to the post. The nudge auto-fades after 8 seconds and reappears on the next paste if no disclosure exists yet. Once a disclosure is present, subsequent pastes are ignored.

The disclosure is normal editable post text. This is an honor-based system.

## Installation

1. In Discourse admin, go to Appearance > Components
2. Click Install > From a git repository and enter this repository's URL
3. To add it to your live site: open the component and use the "Include component on these themes" setting to add it to your active theme

## Testing Without Affecting Other Users

You can preview the component without rolling it out:

1. Go to Appearance > Themes > Install and create a new empty theme (e.g. "Test Theme")
2. Do NOT set it as default
3. Add "AI Content Disclosure Nudge" to this test theme via Included Components
4. Note the theme ID from the URL (e.g. /admin/customize/themes/42 means ID is 42)
5. Browse your forum with ?preview_theme_id=42 appended to any URL
6. Only your session sees the component; other users are unaffected

## Settings

After installing, click the component in Appearance > Components to adjust:

- min_paste_length (default 100): Minimum characters to trigger nudge
- nudge_duration_seconds (default 8): Auto-fade delay
- generated_label / assisted_label: Button text
- nudge_message: The prompt shown in the banner
- generated_disclosure / assisted_disclosure: Markdown prepended to the post

## Quick Test Checklist

1. Open any topic and click Reply
2. Paste a block of text longer than 100 characters
3. The nudge banner should appear in the bottom-right
4. Click AI-generated or AI-assisted to see the disclosure prepended
5. Paste again; nudge should NOT appear since disclosure already exists
6. Remove the disclosure text, paste again; nudge reappears
7. Click the dismiss button or wait 8 seconds; nudge fades out

## Compatibility

- Discourse 2025.x / 2026.x and later (also supports legacy 3.x versions)
- Works with light and dark themes (uses Discourse CSS custom properties)
- Mobile responsive
- No external dependencies
