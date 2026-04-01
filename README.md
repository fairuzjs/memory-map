# 🗺️ Memory Map

Memory Map is a modern, full-stack web application built with Next.js that allows users to capture, share, and explore their memories on an interactive map. Discover the world through the stories and experiences of others, while keeping track of your own digital footprint.

## 🚀 Features

- **📍 Interactive Geo-Tagging**: Pin your memories to specific geographical locations using our interactive map visualization (powered by Leaflet).
- **🧑‍🤝‍🧑 Social Interaction**: Connect with the community through comments, and expressive reactions (Love, Wow, Sad, Laugh). Collaborate with friends on shared memories.
- **🔥 Gamification**: Stay active to maintain your streaks and earn unique profile badges.
- **🛡️ Robust Moderation System**: Built-in reporting for inappropriate content, integrated user feedback system, and a comprehensive Admin Dashboard.
- **🔒 Secure Authentication**: Complete authentication flow (Login, Register, Forgot Password) powered by NextAuth and secure email verification.
- **🎨 Modern UI/UX**: Sleek, responsive, and accessible interface crafted with Tailwind CSS, Shadcn UI, and Framer Motion.

## 💻 Tech Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js (v5)](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Maps:** [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/) & Canvas Confetti

## 📂 Project Structure

- `app/(auth)`: Public routes for authentication (Login, Register, Password Reset).
- `app/(main)`: The core application area (Dashboard, Interactive Map, Community, Profile, Settings).
- `app/admin`: Secure portal for administrators to manage users, reports, and feedbacks.
- `app/api`: Next.js Route Handlers strictly serving the API layer.
- `components/`: Reusable React components structured cleanly via Radix UI/Shadcn.
- `prisma/`: Database schema definitions and migrations.

## 🛠️ Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/en/) (v18+) and a running instance of a **PostgreSQL** database.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/memory-map.git
cd memory-map
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and configure the necessary environment variables based on the `.env.example` structure. You will need:
- `DATABASE_URL` (PostgreSQL connection string)
- NextAuth configurations (`AUTH_SECRET`, etc.)
- SMTP/Email credentials (for Nodemailer)
- Any other third-party API keys (e.g., Supabase storage if used)

### 4. Setup Prisma Database

Push the schema to your database and generate the Prisma client:

```bash
npx prisma db push
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/memory-map/issues).

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
