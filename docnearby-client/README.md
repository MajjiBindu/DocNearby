## DocNearby Client (React + Vite + Tailwind)

Frontend for **DocNearby** — a location-based doctor & clinic finder with appointment booking for patients in Tier 2/3 cities in India (focused on independent local doctors and smaller clinics).

### Tech

- React (Vite)
- Tailwind CSS
- React Router
- Axios

### Setup

1. Install dependencies.
2. Create `.env` from `.env.example`.

### Environment variables

See `.env.example`:

- `VITE_API_URL` (e.g., `https://docnearby-backend.onrender.com`)

### Run locally

- `npm run dev`

### Auth + protected routes

- JWT is stored in `localStorage` as `dn_token`
- Protected routes redirect to `/login` when token is missing:
  - `/patient`
  - `/doctor`

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
