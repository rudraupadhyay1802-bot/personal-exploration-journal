# Field Log

**Notice. Record. Remember.**

Field Log is a personal exploration journal — a calm, map-based notebook for the places, moments, and small details you come across while out in the world. Save a discovery with a name, a note on why it mattered, and where you found it, then revisit it later through your collection, your map, or your exploration insights.

Everything runs entirely in the browser. There is no backend, account, or server — your discoveries are stored locally using `localStorage`, right there on your device.

## Features

- **Add & edit discoveries** — name, category, personal note, and location (pick on map, use your current location, or enter coordinates manually)
- **My Discoveries** — a searchable, filterable, sortable collection of everything you've saved
- **Interactive map** — every discovery with a location appears as a pin; markers and list stay in sync
- **Favourite & Want to Revisit** — mark discoveries that matter to you or that you'd like to return to
- **My Exploration** — personal insights into what you discover, when, and where, built from your own saved data
- **Compare Places** — see two saved discoveries side by side, including the distance between them
- **Search, filter & sort** — combine search, category, and personal-state filters
- **Import / Export** — back up or move your journal as a CSV file
- **Responsive design** — works across desktop, tablet, and mobile
- **Accessible** — semantic structure, visible focus states, and reduced-motion support throughout

## Tech Stack

- HTML, CSS, and vanilla JavaScript — no build step or framework
- [Leaflet.js](https://leafletjs.com/) for the interactive map
- Google Fonts (Poppins & Inter)
- Browser `localStorage` for persistence — no backend required

## Getting Started

No installation or build step needed.

1. Clone the repository
   ```bash
   git clone https://github.com/<your-username>/field-log.git
   cd field-log
   ```
2. Open `index.html` directly in your browser, **or** serve it locally for the best experience (needed for geolocation to work reliably in some browsers):
   ```bash
   npx serve .
   ```
3. Start exploring, and your discoveries will be saved automatically in your browser.

## Project Structure

```
field-log/
├── index.html     # App markup — intro page, map, forms, detail & compare panels
├── script.js      # App logic — storage, rendering, map, search/filter, analytics
├── style.css      # Visual design system — layout, typography, animation
└── README.md
```

## Data & Privacy

All discoveries are stored locally in your browser via `localStorage` under a single key. Nothing is sent to a server, and nothing leaves your device unless you explicitly use the **Export Journal** feature to download your data as a CSV file.

## Author

Created by **Rudra Upadhyay**
