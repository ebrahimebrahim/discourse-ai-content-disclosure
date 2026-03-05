# AI Content Disclosure Nudge

A Discourse theme component that nudges authors to disclose AI-generated or AI-assisted content. When someone pastes a block of text into the composer, a small banner appears with options to label the content. Clicking a button prepends a disclosure blockquote to the post. This is an honor-based system — the disclosure is normal, editable post text.

## Installation

1. In Discourse admin, go to **Appearance > Components**
2. Click **Install > From a git repository** and enter this repository's URL
3. Open the component and use **"Include component on these themes"** to add it to your active theme

To preview without affecting other users, create a test theme, add the component to it, and browse with `?preview_theme_id=<ID>` appended to any URL.

## Settings

All settings are configurable under **Appearance > Components > AI Content Disclosure Nudge**:

| Setting | Default | Description |
|---------|---------|-------------|
| `min_paste_length` | 100 | Minimum pasted characters to trigger the nudge |
| `nudge_message` | "Looks like you pasted some content — is it AI-generated?" | Banner prompt text |
| `generated_label` / `assisted_label` | "AI-generated" / "AI-assisted" | Button labels |
| `generated_message` / `assisted_message` | "This post contains AI-generated content." / "This post was written with AI assistance." | Disclosure message text |

## Compatibility

- Discourse 3.1+ (including 2025.x / 2026.x)
- Light and dark themes
- Mobile responsive
- No external dependencies
