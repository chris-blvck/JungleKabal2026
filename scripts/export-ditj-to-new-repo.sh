#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-../DieInTheJungle-TelegramMiniApp}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$(python3 - <<PY
import os
print(os.path.abspath(os.path.join('$ROOT_DIR', '$TARGET_DIR')))
PY
)"

printf "[INFO] Source repo: %s\n" "$ROOT_DIR"
printf "[INFO] Target repo: %s\n" "$TARGET_DIR"

mkdir -p "$TARGET_DIR"

# Initialize git repo if missing
if [ ! -d "$TARGET_DIR/.git" ]; then
  git -C "$TARGET_DIR" init >/dev/null
fi

# Minimal Vite + React scaffold files
cp "$ROOT_DIR/package.json" "$TARGET_DIR/package.json"
cp "$ROOT_DIR/package-lock.json" "$TARGET_DIR/package-lock.json"
cp "$ROOT_DIR/vite.config.js" "$TARGET_DIR/vite.config.js"
cp "$ROOT_DIR/index.html" "$TARGET_DIR/index.html"
cp "$ROOT_DIR/postcss.config.js" "$TARGET_DIR/postcss.config.js"
cp "$ROOT_DIR/tailwind.config.js" "$TARGET_DIR/tailwind.config.js"

mkdir -p "$TARGET_DIR/src" "$TARGET_DIR/public/games/die in the jungle" "$TARGET_DIR/src/components/ui" "$TARGET_DIR/src/lib"

# Core game files
cp "$ROOT_DIR/src/pages/DieInTheJungle.tsx" "$TARGET_DIR/src/DieInTheJungle.tsx"
cp "$ROOT_DIR/src/components/ui/button.jsx" "$TARGET_DIR/src/components/ui/button.jsx"
cp "$ROOT_DIR/src/lib/utils.js" "$TARGET_DIR/src/lib/utils.js"
cp "$ROOT_DIR/src/index.css" "$TARGET_DIR/src/index.css"

# Telegram-friendly minimal app shell
cat > "$TARGET_DIR/src/App.jsx" <<'APP'
import React from "react";
import DieInTheJungle from "./DieInTheJungle";

export default function App() {
  return <DieInTheJungle />;
}
APP

cat > "$TARGET_DIR/src/main.jsx" <<'MAIN'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
MAIN

# Copy game assets bundle as-is
if [ -d "$ROOT_DIR/public/games/die in the jungle" ]; then
  rm -rf "$TARGET_DIR/public/games/die in the jungle"
  cp -R "$ROOT_DIR/public/games/die in the jungle" "$TARGET_DIR/public/games/die in the jungle"
fi

# Repo-specific README
cat > "$TARGET_DIR/README.md" <<'README'
# Die In The Jungle — Telegram Mini App Repo

This repository is a separated game workspace extracted from JungleKabal2026.

## Included
- `src/DieInTheJungle.tsx` (main game component)
- `public/games/die in the jungle/...` (game assets)
- minimal Vite React shell (`src/main.jsx`, `src/App.jsx`)

## Run
```bash
npm install
npm run dev
```

## Notes
- Initial scope is Telegram-first (no wallet required).
- "On build sur Solana" can remain as product/branding direction while keeping launch off-chain.
README

# TS config for TSX import compatibility in isolated repo
cat > "$TARGET_DIR/tsconfig.json" <<'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "strict": false,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
TSCONFIG

# Helpful .gitignore
cat > "$TARGET_DIR/.gitignore" <<'GITIGNORE'
node_modules
.DS_Store
dist
.env
GITIGNORE

printf "[DONE] Export completed.\n"
printf "Next steps:\n"
printf "  cd %s\n" "$TARGET_DIR"
printf "  npm install\n"
printf "  npm run dev\n"
