# 🗺️ Memory Map

> Capture, share, and explore memories pinned to real-world locations on an interactive map.

**Memory Map** is a feature-rich, full-stack social web application built with **Next.js (App Router)**. Users can geo-tag their memories with photos, audio, and music, connect through a social layer (comments, reactions, follows, collaboration), and engage with a full gamification + in-app economy (streaks, shop, gacha, premium). It ships with a dedicated mobile API layer (for the companion Flutter client) and a complete admin & moderation suite.

---

## ✨ Features

### 🗺️ Memories & Map
- **Interactive geo-tagging** — pin memories to exact coordinates with a location name, date, story, and one of **8 emotions** (Happy, Sad, Nostalgic, Excited, Peaceful, Grateful, Romantic, Adventurous).
- **Mapbox-powered map** with **marker clustering** (Supercluster) for smooth rendering at scale.
- **Rich media** — multiple photos per memory, an editable **cover image** (crop, reposition, zoom, rotate), and **audio clips** (10/15/30s) stored on Supabase.
- **Spotify integration** — attach a track to a memory.
- **Stickers** — decorate memory photos with positioned/rotated/scaled stickers and custom text.
- **Privacy controls** — public/private memories, pinning, and tags.
- **Premium map markers** — cosmetic marker styles for premium users.

### 👥 Social & Community
- **Comments** with threaded replies and **voice comments**.
- **Reactions** — Love, Wow, Sad, Laugh.
- **Follow / followers** system.
- **Memory collaboration** — invite others to co-own a memory (invite / accept / decline).
- **Global chat** — public real-time chat with guest support, replies, and moderation.
- **Notifications** — comments, replies, reactions, follows, premium activation, and album/collaboration invites.
- **Public profiles** at `/u/[username]`.

### 📁 Albums
- Group memories into **albums** with cover, icon, and description.
- **Role-based album collaborators** (Owner / Editor / Contributor) with a cover-approval flow.
- **Sticky notes** and **per-album chat**.

### 🔥 Gamification
- **Daily streaks** with current/longest streak and active-day tracking.
- **Streak badges** at milestones, with a pinnable badge on your profile.
- **Points** as the in-app currency.

### 💰 In-App Economy
- **Shop** with 6 item types: avatar frames, profile banners, memory-card themes, username decorations, memory stickers, and premium features.
- **Inventory** with equip/unequip.
- **Gacha / mystery box** with 4 tiers (Basic / Elite / Epic / Legend), duplicate detection, and refunds.
- **Top-up** points via manual proof-of-payment, verified by an admin.

### 💎 Premium
- Monthly subscription with weekly free gacha pulls, monthly streak freezes, exclusive cosmetic items, premium markers, and Spotify access.

### 🔒 Authentication & Security
- **NextAuth.js v5** session auth + a **separate JWT-based mobile API** for the Flutter client.
- **Email OTP verification** (pre-register + post-register) and **password reset** flows via Nodemailer.
- Two verification states: email-verified (feature gating) and an admin-granted **verified badge**.
- **Rate limiting**, **profanity filtering**, and input sanitization (DOMPurify).

### 🛡️ Moderation & Admin
- **Content reporting** with a review workflow.
- **User feedback** with categories and admin replies.
- **Ban system** with **ban appeals**.
- **Admin dashboard** to manage users, reports, feedback, top-ups, and premium orders — with a full **audit log** of admin actions.

---

## 🛠️ Tech Stack

| Area | Technology |
| --- | --- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + React 19 |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Auth** | [NextAuth.js v5](https://authjs.dev/) + JWT (`jsonwebtoken`) for mobile |
| **Maps** | [Mapbox GL](https://www.mapbox.com/) + [react-map-gl](https://visgl.github.io/react-map-gl/) + [Supercluster](https://github.com/mapbox/supercluster) |
| **Storage** | [Supabase Storage](https://supabase.com/) + [sharp](https://sharp.pixelplumbing.com/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/), Canvas Confetti |
| **3D** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) + drei |
| **Media** | [WaveSurfer.js](https://wavesurfer.xyz/) (audio), [react-easy-crop](https://github.com/ValentinH/react-easy-crop) |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Email** | [Nodemailer](https://nodemailer.com/) |

---

## 📂 Project Structure

```
memory-map/
├─ app/
│  ├─ (auth)/              # Login, register, forgot/reset password
│  ├─ (main)/              # Core app: dashboard, map, memories, albums,
│  │                       #   community, profile, settings, shop, gacha,
│  │                       #   inventory, streak, premium, topup, feedbacks
│  ├─ admin/               # Admin portal: users, reports, feedbacks,
│  │                       #   topup, premium, appeals
│  ├─ api/                 # Route handlers (REST API layer)
│  │  └─ mobile/           # Dedicated JWT-authenticated endpoints for Flutter
│  ├─ appeal/              # Public ban-appeal page
│  └─ u/                   # Public user profiles
├─ components/             # UI + feature components (map, albums, memories,
│                          #   dashboard, global-chat, onboarding, profile, ui…)
├─ hooks/                  # Custom React hooks
├─ lib/                    # Core logic: auth, prisma, mail, supabase,
│                          #   premium, rate-limit, profanity, validations,
│                          #   audit, monitoring, services/
├─ prisma/                 # Prisma schema & migrations
├─ public/                 # Static assets
├─ scripts/                # Utility/maintenance scripts
└─ types/                  # Shared TypeScript types
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) **v18+**
- A **PostgreSQL** database (Supabase recommended)
- A **Mapbox** access token
- (Optional) **Spotify** API credentials and an **SMTP** account for email

### 1. Clone the repository
```bash
git clone https://github.com/fairuzjs/memory-map.git
cd memory-map
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the template and fill in your values:
```bash
cp .env.example .env
```
Key variables (see `.env.example` for the full list):
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — NextAuth config
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase
- `EMAIL_SERVER_*`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL` — SMTP / email
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` — Spotify integration
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` — Mapbox

> ⚠️ Never commit your `.env` file.

### 4. Set up the database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma client, push schema, and build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

> **Note:** `build` currently runs `prisma db push`. For production deployments with controlled migrations, consider switching to `prisma migrate deploy`.

---

## 📱 Mobile API

A dedicated, JWT-authenticated API lives under `app/api/mobile/` (e.g. `mobile/memories`, `mobile/upload`) to serve the companion **Flutter** client, independently of the NextAuth web session.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Check the [issues page](https://github.com/fairuzjs/memory-map/issues).

## 📝 License

This project is available under the [MIT License](LICENSE).
