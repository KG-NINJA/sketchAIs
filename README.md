# Sketch to AI

Touch-friendly sketch app for GitHub Pages.

Draw on the canvas, export the sketch as Markdown, and pass it to any AI service with one click.

## Features

- Touch and mouse drawing
- Pen color and size controls
- Eraser, undo, and clear
- Markdown export with embedded PNG data URL
- Copy Markdown to clipboard
- Open ChatGPT, Claude, Gemini, Perplexity, or a custom AI URL
- Download PNG or Markdown
- Agent API / x402 payment section is marked as planned

## GitHub Pages

This app works as a static site.

Upload these files to a GitHub repository:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Then enable GitHub Pages:

1. Open the repository settings.
2. Go to `Pages`.
3. Select the branch and root folder.
4. Save.

## x402 Payment

The UI currently shows:

```text
x402: 10 min / 0.001 USDC (planned)
```

The payment feature is planned and not required for GitHub Pages static hosting.

Worker-related draft files may exist in this workspace, but GitHub Pages only needs the static files listed above.

## Local Preview

Run a simple static server:

```powershell
python -m http.server 4178
```

Open:

```text
http://localhost:4178
```
