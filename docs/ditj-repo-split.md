# DITJ repo split

Script ajouté pour extraire le jeu vers un repo séparé:

- `scripts/export-ditj-to-new-repo.sh`

## Usage

```bash
./scripts/export-ditj-to-new-repo.sh
```

Par défaut, le nouveau repo est créé ici:

- `../DieInTheJungle-TelegramMiniApp`

Pour choisir un autre dossier cible:

```bash
./scripts/export-ditj-to-new-repo.sh ../MonNouveauRepoJeu
```

## Ce qui est copié

- `src/pages/DieInTheJungle.tsx` -> `src/DieInTheJungle.tsx`
- `src/components/ui/button.jsx`
- `src/lib/utils.js`
- `src/index.css`
- `public/games/die in the jungle/...`
- fichiers Vite/Tailwind de base (`package.json`, `vite.config.js`, etc.)
- un shell minimal (`src/App.jsx`, `src/main.jsx`, `README.md`, `tsconfig.json`)
