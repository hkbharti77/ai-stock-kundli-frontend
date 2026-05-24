# 🔮 AI Stock Kundli - Frontend App

**Premium, Enterprise-Grade Investment Intelligence UI Dashboard**

This repository houses the modern, high-fidelity frontend web application for **AI Stock Kundli**. Built with Next.js 14, TypeScript, and Vanilla CSS/Tailwind, it provides retail and enterprise investors with a fast, responsive, and beautiful interface to consume multi-agent AI research, tracking tools, and portfolio insights.

---

## ✨ Features & Design Aesthetics

*   **Premium Visuals:** Features custom glassmorphism design layouts, rich harmonious color schemes tailored for visual excellence, and modern responsive typography.
*   **Multilingual Support:** Fully localized out of the box in **English (`en`)**, **Hindi (`hi`)**, and **Gujarati (`gu`)** for fluid retail accessibility.
*   **Interactive Visualizations:** High-quality dashboards featuring financial charts, interactive thesis gauges, and dynamic watchlist indicators.
*   **Real-Time Data Streams:** Integrated with backend WebSocket/SSE APIs to waiting-load and dynamically update data.

---

## 🛠 Tech Stack

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router architecture)
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for robust type safety
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & custom CSS stylesheets
*   **Icons:** [Lucide React](https://lucide.dev/) for clean modern vector icons
*   **State Management:** Reactive React state and hooks (e.g., custom hooks for real-time status)

---

## 📁 Repository Structure

```text
frontend/
├── src/
│   ├── app/                # Next.js App Router (Pages, layouts, routes)
│   ├── components/         # Premium UI Components (Thesis, charts, watchlist widgets, language selector)
│   ├── hooks/              # Custom React hooks (Translation, API connectors)
│   ├── locales/            # Multi-language dictionary files (en.json, hi.json, gu.json)
│   └── styles/             # Global styling configurations
├── public/                 # Static asset resources
├── tailwind.config.ts      # Tailwind configuration file
├── tsconfig.json           # TypeScript compilation settings
└── next.config.mjs         # Next.js bundler and compiler settings
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 20+
*   NPM or Yarn / PNPM

### 1. Installation
Clone the repository and install dependency modules:
```bash
npm install
```

### 2. Configuration
Create a `.env.local` file inside the root directory and specify the URL of the running FastAPI backend:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server
Start the local Next.js development server:
```bash
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.*

### 4. Build for Production
To build a highly optimized production bundle:
```bash
npm run build
npm run start
```

---

*Built with ❤️ for Indian investors.*
