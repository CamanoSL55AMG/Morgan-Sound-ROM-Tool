# Morgan Sound ROM Request Tool

A Windsurf-ready React + TypeScript starter package for a browser-based ROM intake app with:

- required-field enforcement
- checklist tracking
- traffic-light risk status
- Sales and Estimating signoff fields
- PDF export via jsPDF

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL Vite prints in the terminal, usually:

```bash
http://localhost:5173
```

## Build for production

```bash
npm run build
npm run preview
```

## Suggested Windsurf workflow

1. Open the `morgan-rom-request-tool` folder in Windsurf.
2. Run `npm install` in the built-in terminal.
3. Run `npm run dev`.
4. Test the form and PDF export.
5. Refine wording, add branding, or connect it to a backend later.

## Project structure

```text
morgan-rom-request-tool/
  src/
    App.tsx
    components/
      MorganRomRequestForm.tsx
    styles/
      global.css
  index.html
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
  README.md
```

## Good next upgrades

- save drafts to local storage or a database
- add login/authentication
- connect to a shared PDF archive
- attach logo artwork to the PDF header
- add email/export workflow
