# ♻️ RecycleRumble — Hackathon Vibecoding Plan

> **Goal:** Build a playful, photo-driven recycling competition app in 1–2 hours.  
> **Stack:** React (Vite) + Supabase (DB, storage) + Mapbox GL + Gemini API (image validation)

---

## 🎯 Core Concept

Players take photos of items they recycle. Each submission is verified by AI and adds points to their score. On a live global map, each player is represented by a customizable character pinned to their chosen location — the more they recycle, the **bigger** their character appears. Everyone competes on the same leaderboard.

---

## 🗂️ Feature Scope (Hackathon-Safe)

| Feature | In Scope | Cut to Keep It Simple |
|---|---|---|
| Photo submission | ✅ Upload image from device | ❌ No live camera capture |
| AI verification | ✅ Gemini 1.5 Flash checks if item is recyclable | ❌ No category breakdown |
| Global map | ✅ Characters pinned to player's chosen location | ❌ No automatic GPS |
| Location control | ✅ Player drops a pin on the map; can change anytime | ❌ No address search |
| Character size scaling | ✅ CSS scale based on point total | ❌ No animations |
| Character selection | ✅ 4–5 preset characters (emoji or SVG) | ❌ No custom avatars |
| Leaderboard | ✅ Simple ranked list | ❌ No pagination |

---

## 🧱 Tech Stack

```
Frontend:   React + Vite (fastest scaffolding)
Styling:    Tailwind CSS (utility-first, no design decisions)
Map:        Mapbox GL JS (react-map-gl wrapper)
Backend:    Supabase (postgres + image storage — no auth)
AI Check:   Google Gemini 1.5 Flash API (vision)
Hosting:    Vercel (drag and drop deploy)
```

**Why this stack?** Supabase gives a full DB + storage with no backend code. Mapbox GL renders beautiful, interactive maps with custom markers. Gemini 1.5 Flash is fast and free-tier-friendly for vision tasks.

---

## 🗄️ Data Model (Supabase)

### `profiles` table
```sql
id          uuid  primary key default gen_random_uuid()
username    text  unique
character   text  -- e.g. "frog", "robot", "panda"
lat         float -- player's chosen map pin location
lng         float
points      int   default 0
```

> **No auth:** on first visit, the player picks a username. Store their `profile.id` in `localStorage` to identify them on return visits.

### `submissions` table
```sql
id          uuid  primary key default gen_random_uuid()
user_id     uuid  references profiles(id)
image_url   text
item_name   text  -- returned by Gemini
verified    bool
created_at  timestamp default now()
```

---

## 📁 File Structure

```
src/
├── App.jsx               # Router: /setup (first visit), /home, /map
├── pages/
│   ├── Setup.jsx         # Username + character + location picker (first visit only)
│   ├── Home.jsx          # Upload photo + recent submissions + settings
│   └── MapView.jsx       # Global map with character pins
├── components/
│   ├── CharacterPicker.jsx    # 5 character options
│   ├── SubmitPhoto.jsx        # File input + AI check + submit
│   ├── Leaderboard.jsx        # Ranked list sidebar
│   ├── LocationPicker.jsx     # Mapbox map click → set lat/lng
│   └── CharacterMarker.jsx    # Custom Mapbox marker per player
├── lib/
│   ├── supabase.js        # Supabase client
│   └── gemini.js          # Gemini API call for image check
└── characters.js          # Character definitions (emoji + color)
```

---

## 🤖 AI Verification Flow

When a player submits a photo, send it to the Gemini 1.5 Flash API:

```js
// lib/gemini.js
export async function verifyRecyclable(base64Image) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            },
            {
              text: `Does this image show a recyclable item (plastic bottle, cardboard, glass, aluminum can, paper, etc.)?
Reply with ONLY valid JSON, no markdown: { "recyclable": true/false, "item": "item name or unknown" }`
            }
          ]
        }]
      })
    }
  );
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}
```

**On success:** Insert into `submissions`, increment `profiles.points` by 10.  
**On failure:** Show a friendly "Hmm, that doesn't look recyclable!" message.

---

## 🗺️ Map Logic

Use **Mapbox GL JS** via the `react-map-gl` wrapper. Each player gets a custom marker at their chosen `lat`/`lng`.

### Setting / Updating Location

On the Setup screen (and via a "Move my pin" button in settings), render a `LocationPicker` map. On click, capture the coordinates and save to `profiles`:

```js
// LocationPicker.jsx
<Map onClick={(e) => onLocationSet(e.lngLat.lat, e.lngLat.lng)} ... />
```

### Character Markers

Scale the emoji by the player's point total:

```js
// CharacterMarker.jsx
const size = Math.min(20 + player.points / 5, 80); // 20px → 80px max

<Marker latitude={player.lat} longitude={player.lng}>
  <div style={{ fontSize: size, cursor: 'pointer' }} title={player.username}>
    {character.emoji}
  </div>
</Marker>
```

Heavy recyclers literally tower over newcomers on the map.

---

## 🐸 Characters

Keep it to 5 — easy to implement as emoji + a display name:

| ID | Emoji | Name |
|---|---|---|
| `frog` | 🐸 | Ribbit |
| `robot` | 🤖 | Recyclotron |
| `panda` | 🐼 | Bamboo Bear |
| `alien` | 👽 | Xeno |
| `mushroom` | 🍄 | Fungi |

Store the chosen character ID in the `profiles` table. Let players change it anytime from a simple picker modal in settings — no re-login needed.

---

## 🏗️ Build Order (Timebox)

### Phase 1 — Foundation (15 min)
- [ ] `npm create vite@latest recyclerumble -- --template react`
- [ ] Install: `tailwindcss`, `@supabase/supabase-js`, `react-map-gl`, `mapbox-gl`
- [ ] Create Supabase project, run SQL for `profiles` + `submissions` tables
- [ ] Set up `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_KEY`, `VITE_MAPBOX_TOKEN`

### Phase 2 — Setup Flow (20 min)
- [ ] `Setup.jsx`: username input + `CharacterPicker` + `LocationPicker` map (click to place pin)
- [ ] On submit → insert into `profiles` → save `profile.id` to `localStorage` → redirect to `/home`
- [ ] On return visits, read `localStorage` id and skip setup

### Phase 3 — Submit + Verify (25 min)
- [ ] `SubmitPhoto.jsx`: file input → convert to base64 → call `verifyRecyclable()`
- [ ] If `recyclable: true` → upload image to Supabase Storage → insert submission → add 10 points
- [ ] Show confirmation card with item name and new point total

### Phase 4 — Map + Leaderboard (25 min)
- [ ] `MapView.jsx`: fetch all profiles → render Mapbox map with `CharacterMarker` per player
- [ ] `Leaderboard.jsx`: query profiles ordered by `points desc`, show top 10
- [ ] Add "Move my pin" button → open `LocationPicker` → update `profiles.lat/lng`

### Phase 5 — Polish (15 min)
- [ ] Add a page title / logo
- [ ] Mobile-responsive layout (Tailwind `flex`/`grid`)
- [ ] Deploy to Vercel: `vercel --prod`

---

## ⚠️ Hackathon Shortcuts

These are intentional cuts to stay within the time budget:

- **No auth** — username stored in `localStorage`; treat the ID as the session token
- **No real-time updates** — use a "Refresh" button instead of websocket subscriptions
- **No duplicate detection** — trust the players (it's a hackathon)
- **Points are flat** — every verified item = 10 points, no categories
- **No image moderation** — Gemini's check is the only gate

---

## 🚀 Stretch Goals (If Time Allows)

- Supabase Realtime subscription → map updates live as submissions come in
- Confetti animation on successful submission (`canvas-confetti` package)
- Weekly leaderboard reset using a Supabase cron edge function
- Sound effects (a satisfying "recycling" crunch on submit)

---

## 🔑 Environment Variables Needed

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_KEY=
VITE_MAPBOX_TOKEN=
```

Get keys from: [supabase.com](https://supabase.com) (free project), [aistudio.google.com](https://aistudio.google.com) (Gemini API key), and [account.mapbox.com](https://account.mapbox.com) (Mapbox public token).

---

*Built for a hackathon. Ship it, don't perfect it.* ♻️
