# 🗑️ Litter Hitter

A gamified trash-pickup logging app that uses AI vision to verify litter submissions and reward users with points.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) |
| **Build Tool** | [Vite](https://vite.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Backend / DB** | [Supabase](https://supabase.com/) (PostgreSQL + Auth) |
| **AI Vision** | [Google Gemini API](https://ai.google.dev/) (multi-model fallback) |
| **Maps** | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) via [react-map-gl](https://visgl.github.io/react-map-gl/) |
| **Language** | JavaScript (ESM) |

## Features

- 📸 **Live camera capture** — snap a photo directly in the browser with multi-camera support
- 🤖 **AI trash verification** — Gemini vision confirms whether the photo contains litter
- 🗺️ **Map view** — see pickup locations plotted on an interactive map
- 🏆 **Points & leaderboard** — earn points per verified submission, compete globally
- 👤 **User profiles** — choose an avatar and track your personal stats

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com/) project
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- A [Mapbox](https://account.mapbox.com/) access token

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_access_token
```

### Run Locally

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```
