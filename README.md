# Orion Dashboard Starter

A tiny Next.js + Tailwind starter that gives you a talking agent (Orion) you can deploy to Vercel and embed in your Empire dashboard.

## Quick Start
1. Download and unzip.
2. Put your portrait at `public/avatars/lyra.jpg`.
3. `npm install`
4. `npm run dev` (local) or push to GitHub and import to Vercel.
5. On Vercel, set `OPENAI_API_KEY` (Project Settings → Environment Variables).
6. Visit `/orion`.

## Notes
- Works without the API endpoint if you remove `apiEndpoint` prop (local-only commands).
- Uses Web Speech API for TTS/STT (Chrome recommended).
