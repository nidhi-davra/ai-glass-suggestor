# Virtual Glasses App

## View and try-on glasses with AI suggestion
<video src="public/glass-suggestion.mp4" controls width="720"></video>

## Manage glasses catalog
<video src="public/glass-catalog.mp4" controls width="720"></video>

A React + Express (SQLite) app for virtual eyeglasses try-on and a small catalog manager.

## Prerequisites
- Node.js 18+ and npm
- (Optional, for AI analysis on catalog uploads) OpenAI API key

## Setup
1) Install root dependencies:
```
npm install
```
2) Install server dependencies:
```
cd server && npm install && cd ..
```
3) Configure environment (at project root):
```
# .env
OPENAI_API_KEY=your_api_key_here   # required only for AI analysis on /catalog
```

## Run (development)
Run client and server together:
```
npm run dev
```
- Client: `http://localhost:3000`
- API server: `http://localhost:4000`

## App routes
- `/` – Virtual Try-On
  - Upload a front-facing photo
  - App detects your face shape and overlays the selected frames
  - “Suggestions by AI” toggle filters frames by your detected shape (local filter)
- `/catalog` – Catalog Manager
  - Upload new frame images (immediately saved to the DB)
  - Auto-analyze newly uploaded frames to populate `recommendedFor` and `styles` (requires `OPENAI_API_KEY`)
  - Delete items from the catalog

## Notes
- Data is stored in a local SQLite file at `server/data.sqlite` (created automatically on first run).
- If `OPENAI_API_KEY` is not set, uploads still work but AI analysis on `/catalog` will be disabled.
