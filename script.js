const STORAGE_KEY = 'field_log_entries';
let editingId = null;
let selectedEntryId = null;
let currentFilteredEntries = [];

/* Analytics Dashboard state — which dataset the charts draw from
   ('all' stored entries, or the 'filtered' set already computed by
   render()) and how the time chart groups dates. No separate data
   store: both read from the same loadEntries()/currentFilteredEntries. */
let analyticsScope = 'all';
let geoChipsExpanded = false;
let analyticsTimeGrouping = 'daily';

const CATEGORY_COLORS = {
  'Interesting Place': '#B5541F',
  'Nature': '#4B6B3A',
  'History & Culture': '#5C4A7A',
  'Food & Drink': '#C86D2A',
  'Photo Spot': '#2F6690',
  'Adventure': '#3B5B6B',
  'Favourite': '#C24D3D',
  'Want to Revisit': '#8C6D1F',
  'Other': '#6E6659',
  /* Backward compatibility for any previously stored records */
  'Land use': '#B5541F',
  'Vegetation': '#4B6B3A',
  'Water body': '#2F6690',
  'Infrastructure': '#6B5B3E',
  'Sample point': '#8C6D1F',
  'Soil sample': '#8C6D1F',
  'Settlement': '#B5541F',
  'Transport corridor': '#3B5B6B',
  'Hazard zone': '#C24D3D',
  'Cultural site': '#5C4A7A'
};
const CATEGORY_TINTS = {
  'Interesting Place': '#F7EFE6',
  'Nature': '#EBF0E6',
  'History & Culture': '#EFEBF5',
  'Food & Drink': '#FDF2E9',
  'Photo Spot': '#E9F2F7',
  'Adventure': '#EAF0F3',
  'Favourite': '#FAECE9',
  'Want to Revisit': '#F7F3E6',
  'Other': '#EFECE6',
  'Land use': '#F7EFE6',
  'Vegetation': '#EBF0E6',
  'Water body': '#E9F2F7',
  'Infrastructure': '#EFECE6',
  'Sample point': '#F7F3E6',
  'Soil sample': '#F7F3E6',
  'Settlement': '#F7EFE6',
  'Transport corridor': '#EAF0F3',
  'Hazard zone': '#FAECE9',
  'Cultural site': '#EFEBF5'
};

/* One glyph per category, used as the map marker symbol */
const CATEGORY_GLYPHS = {
  'Interesting Place': '✦',
  'Nature': '✤',
  'History & Culture': '♦',
  'Food & Drink': '☕',
  'Photo Spot': '📷',
  'Adventure': '▲',
  'Favourite': '♥',
  'Want to Revisit': '⚐',
  'Other': '•',
  'Land use': '✦',
  'Vegetation': '✤',
  'Water body': '≈',
  'Infrastructure': '■',
  'Sample point': '⚐',
  'Soil sample': '⚐',
  'Settlement': '✦',
  'Transport corridor': '▲',
  'Hazard zone': '!',
  'Cultural site': '♦'
};

/* Context per category shown on the category detail page */
const CATEGORY_DESCRIPTIONS = {
  'Interesting Place': 'Curious corners, quiet courtyards, tucked-away alleys, unique architecture, and atmospheric spots that caught your attention while exploring.',
  'Nature': 'Canopied walking paths, secret gardens, serene lakeside benches, blooming trees, and calm green sanctuaries in the heart of the city or outdoors.',
  'History & Culture': 'Old stone gateways, heritage buildings, timeless ruins, shrines, local memorial plaques, and places soaked in stories of the past.',
  'Food & Drink': 'Cozy coffee shops with the perfect window seat, neighbourhood bakeries, warm evening bistros, and places that make you feel instantly at home.',
  'Photo Spot': 'Scenic overlooks, golden-hour viewpoints, textured brick walls, and spots with just the right light to frame a picture.',
  'Adventure': 'Hidden staircases, forest trails, ridge climbs, spontaneous detours, and routes that made your journey feel like an exploration.',
  'Favourite': 'The treasured places you find yourself returning to again and again — your comfort spots and personal landmarks.',
  'Want to Revisit': 'Discoveries you glimpsed while passing by and earmarked for next time — a place to bring a friend, read a book, or see at dusk.'
};

/* Photos used as the category detail page background */
const CATEGORY_PHOTOS = {
  'Interesting Place': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1800&q=70',
  'Nature': 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=70',
  'History & Culture': 'https://images.unsplash.com/photo-1548625361-12503521b949?auto=format&fit=crop&w=1800&q=70',
  'Food & Drink': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1800&q=70',
  'Photo Spot': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1800&q=70',
  'Adventure': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=70',
  'Favourite': 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1800&q=70',
  'Want to Revisit': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=70'
};

/* ---------- Add Discovery form: category chips, location status, live preview ---------- */
const PRIMARY_CATEGORIES = ['Interesting Place', 'Nature', 'History & Culture', 'Food & Drink', 'Photo Spot', 'Adventure', 'Favourite', 'Want to Revisit', 'Other'];

function buildCategoryChips() {
  const grid = document.getElementById('categoryChips');
  if (!grid) return;
  grid.innerHTML = '';
  PRIMARY_CATEGORIES.forEach(cat => {
    const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
    const glyph = CATEGORY_GLYPHS[cat] || CATEGORY_GLYPHS['Other'];
    const chip = document.createElement('div');
    chip.className = 'cat-chip';
    chip.dataset.category = cat;
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('aria-pressed', 'false');
    chip.innerHTML = `<span class="chip-glyph" style="background:${color}">${glyph}</span><span>${cat}</span>`;
    chip.addEventListener('click', () => selectCategoryChip(cat));
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCategoryChip(cat); }
    });
    grid.appendChild(chip);
  });
}

function selectCategoryChip(cat) {
  const select = document.getElementById('category');
  select.value = cat;
  document.querySelectorAll('.cat-chip').forEach(el => {
    const isActive = el.dataset.category === cat;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  document.getElementById('categoryError').style.display = 'none';
  updateDiscoveryPreview();
}

function syncChipsToSelect() {
  const current = document.getElementById('category').value;
  document.querySelectorAll('.cat-chip').forEach(el => {
    const isActive = el.dataset.category === current;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function updateLocationStatus() {
  const lat = document.getElementById('lat').value.trim();
  const lng = document.getElementById('lng').value.trim();
  const statusEl = document.getElementById('locationStatus');
  const statusText = document.getElementById('locationStatusText');
  const subtle = document.getElementById('coordsSubtle');

  if (lat !== '' && lng !== '' && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
    statusEl.classList.add('confirmed');
    statusText.textContent = 'Location saved ✓';
    subtle.style.display = 'block';
    subtle.textContent = formatCoord(lat, lng);
  } else {
    statusEl.classList.remove('confirmed');
    statusText.textContent = 'No location selected yet';
    subtle.style.display = 'none';
    subtle.textContent = '';
  }
  updateDiscoveryPreview();
}

function updateDiscoveryPreview() {
  const name = document.getElementById('siteName').value.trim();
  const category = document.getElementById('category').value;
  const notes = document.getElementById('notes').value.trim();
  const lat = document.getElementById('lat').value.trim();
  const lng = document.getElementById('lng').value.trim();

  const emptyEl = document.getElementById('previewEmpty');
  const cardEl = document.getElementById('previewCard');

  if (name === '' && notes === '' && lat === '' && lng === '') {
    emptyEl.style.display = 'block';
    cardEl.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  cardEl.style.display = 'block';

  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
  const glyph = CATEGORY_GLYPHS[category] || CATEGORY_GLYPHS['Other'];

  const glyphEl = document.getElementById('previewGlyph');
  glyphEl.textContent = glyph;
  glyphEl.style.background = color;
  document.getElementById('previewName').textContent = name || 'Untitled discovery';
  document.getElementById('previewCat').textContent = category;
  document.getElementById('previewNote').textContent = notes ? '"' + notes + '"' : '';
  document.getElementById('previewNote').style.display = notes ? 'block' : 'none';

  const hasLocation = lat !== '' && lng !== '' && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  document.getElementById('previewLoc').textContent = hasLocation ? '📍 Location selected' : '📍 No location selected yet';
}

['siteName', 'notes'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateDiscoveryPreview);
});
['lat', 'lng'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateLocationStatus);
});

document.getElementById('pickOnMapBtn').addEventListener('click', () => {
  document.getElementById('mapCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Tap anywhere on the map to drop a pin here.');
});

document.getElementById('useMyLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    showToast('Your browser does not support location access.', 'delete');
    return;
  }
  const btn = document.getElementById('useMyLocationBtn');
  const originalText = btn.textContent;
  btn.textContent = 'Locating...';
  btn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.textContent = originalText;
      btn.disabled = false;
      handleMapClickToAdd({ latlng: L.latLng(pos.coords.latitude, pos.coords.longitude) });
      if (map) map.flyTo([pos.coords.latitude, pos.coords.longitude], Math.max(map.getZoom(), 14), { duration: 0.6 });
    },
    () => {
      btn.textContent = originalText;
      btn.disabled = false;
      showToast('Could not get your location — try picking it on the map instead.', 'delete');
    }
  );
});


function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/* Starter exploration journal discoveries for a warm first impression */
const SEED_LOCAL = [
  { name: 'Corner Book Café Courtyard', category: 'Food & Drink', lat: '12.9352', lng: '77.6146', notes: 'Quiet cobblestone nook shaded by a banyan tree. Best filter roast in town.', daysAgo: 9 },
  { name: 'Cubbon Park Bamboo Grove', category: 'Nature', lat: '12.9763', lng: '77.5929', notes: 'Sunlight filtering through the bamboo stems around 7 AM. Peaceful breeze.', daysAgo: 8 },
  { name: 'Ulsoor Lake Pavilions', category: 'Interesting Place', lat: '12.9816', lng: '77.6203', notes: 'Old stone pavilion steps looking out toward the island sanctuary.', daysAgo: 8 },
  { name: 'Pottery Town Back Alleys', category: 'History & Culture', lat: '12.9980', lng: '77.6080', notes: 'Artisans shaping clay lamps right by their doorsteps in soft afternoon light.', daysAgo: 7 },
  { name: 'Lalbagh Glass House Vista', category: 'Favourite', lat: '12.9507', lng: '77.5848', notes: 'Victorian iron structure framed by flowering jacarandas in March.', daysAgo: 6 },
  { name: 'Turahalli Forest Boulder Lookout', category: 'Adventure', lat: '12.8912', lng: '77.5186', notes: 'Short climb up granite boulders; opens to a panoramic sunset view over south Bangalore.', daysAgo: 5 },
  { name: 'Windmill Craftworks Rooftop', category: 'Want to Revisit', lat: '12.9818', lng: '77.7290', notes: 'Open-air balcony with bookshelves and ambient jazz. Need to come back for evening reading.', daysAgo: 4 },
  { name: 'Sankey Tank Sunset Deck', category: 'Photo Spot', lat: '13.0078', lng: '77.5732', notes: 'Golden hour reflection over the water ripples with flocks of herons roosting.', daysAgo: 3 },
  { name: 'Malleshwaram 8th Cross Flower Mkt', category: 'Interesting Place', lat: '13.0035', lng: '77.5685', notes: 'Fragrant jasmine garlands, vibrant marigolds, and vintage wooden shopfronts.', daysAgo: 2 },
  { name: 'Nandi Hills Sunrise Point', category: 'Favourite', lat: '13.3702', lng: '77.6835', notes: 'Mist rolling across the valley floor just as the morning sun breaks.', daysAgo: 0 }
];

const SEED_NATIONWIDE = [
  { name: 'Dolphin’s Nose Cliff Edge, Kodaikanal', category: 'Adventure', lat: '10.2185', lng: '77.5020', notes: 'Breathtaking flat rock projecting over a 2,000-meter sheer drop into the clouds.', daysAgo: 20 },
  { name: 'Fort Kochi Antique Quarter', category: 'History & Culture', lat: '9.9656', lng: '76.2421', notes: 'Colonial arched doorways, spice warehouses, and wooden rafters seasoned by sea air.', daysAgo: 19 },
  { name: 'Dhanushkodi Ghost Town & Shore', category: 'Interesting Place', lat: '9.1770', lng: '79.4180', notes: 'Submerged ruins between two oceans, where the Bay of Bengal meets the Indian Ocean.', daysAgo: 18 },
  { name: 'French Quarter Promenade, Pondicherry', category: 'Photo Spot', lat: '11.9340', lng: '79.8350', notes: 'Mustard yellow facades draped in bright bougainvillea along cobblestone streets.', daysAgo: 17 },
  { name: 'Ghat Steps at Assi, Varanasi', category: 'Favourite', lat: '25.2890', lng: '83.0070', notes: 'Quiet dawn tea in earthen cups watching wooden rowboats glide through the mist.', daysAgo: 16 },
  { name: 'Chand Baori Stepwell, Abhaneri', category: 'History & Culture', lat: '27.0072', lng: '76.6064', notes: 'Hypnotic geometric symmetry of 3,500 narrow steps descending thirteen stories.', daysAgo: 15 },
  { name: 'Nubra Valley Sand Dunes, Ladakh', category: 'Adventure', lat: '34.6938', lng: '77.5647', notes: 'High-altitude desert dunes flanked by snow-peaked Himalayan ridges.', daysAgo: 14 },
  { name: 'Blue City Rooftop Overlook, Jodhpur', category: 'Photo Spot', lat: '26.2980', lng: '73.0180', notes: 'Sea of indigo-painted houses sprawling beneath the towering Mehrangarh Fort walls.', daysAgo: 13 },
  { name: 'Mawlynnong Living Root Bridge', category: 'Nature', lat: '25.2017', lng: '91.8819', notes: 'Living rubber tree roots intertwined over decades across a clear rushing stream.', daysAgo: 12 },
  { name: 'Alleppey Backwater Canoe Canal', category: 'Want to Revisit', lat: '9.4981', lng: '76.3388', notes: 'Narrow emerald water alleys shaded by coconut palms; want to take a slow wooden canoe again.', daysAgo: 11 },
  { name: 'Pangong Lake Shoreline', category: 'Favourite', lat: '33.7595', lng: '78.6674', notes: 'Vivid turquoise water shifting to deep navy as clouds drift overhead at 14,000 ft.', daysAgo: 10 },
  { name: 'Old Manali Apple Orchard Trail', category: 'Nature', lat: '32.2530', lng: '77.1720', notes: 'Winding dirt path through blooming orchards leading up to quiet wooden cabins.', daysAgo: 9 },
  { name: 'Little Lhasa Monks Walk, McLeod Ganj', category: 'History & Culture', lat: '32.2426', lng: '76.3213', notes: 'Fluttering prayer flags whispering in pine scented mountain winds along the kora.', daysAgo: 3 },
  { name: 'Chorla Ghat Forest Pass, Goa-Karnataka', category: 'Adventure', lat: '15.6320', lng: '74.1380', notes: 'Dense monsoon canopy with mist hanging over the Western Ghats road.', daysAgo: 2 },
  { name: 'Hampi Matanga Hill Sunrise', category: 'Favourite', lat: '15.3350', lng: '76.4600', notes: 'Panoramic golden vista of boulder hills, temple towers, and the winding Tungabhadra.', daysAgo: 1 }
];

function seedToEntry(s, now, day, offset) {
  return {
    id: now - offset * 1000,
    name: s.name,
    category: s.category,
    lat: s.lat,
    lng: s.lng,
    notes: s.notes,
    date: new Date(now - s.daysAgo * day).toISOString(),
    pinned: false
  };
}

/* Seed a starter dataset the first time the app is ever opened on this browser,
   so the map and stats aren't empty on a fresh install. Never overwrites real data. */
function seedSampleEntriesIfEmpty() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return; // user already has data (even an emptied list)
  const now = Date.now();
  const day = 86400000;
  const sample = SEED_LOCAL.concat(SEED_NATIONWIDE);
  const entries = sample.map((s, i) => seedToEntry(s, now, day, sample.length - i));
  saveEntries(entries);
}

/* One-time migration: browsers that already saved the original 10-entry
   seed set (from before the 15 nationwide entries existed) get the
   nationwide set merged in, matched by name so nothing is duplicated
   and nothing you've added or edited yourself is touched. Runs once,
   tracked by MIGRATION_KEY, so deleting the nationwide entries afterward
   sticks. */
const MIGRATION_KEY = 'field_log_nationwide_migrated_v1';
function migrateNationwideEntriesIfNeeded() {
  if (localStorage.getItem(MIGRATION_KEY) === '1') return;
  const entries = loadEntries();
  if (entries.length === 0) { localStorage.setItem(MIGRATION_KEY, '1'); return; }
  const existingNames = new Set(entries.map(e => e.name));
  const missing = SEED_NATIONWIDE.filter(s => !existingNames.has(s.name));
  if (missing.length > 0) {
    const now = Date.now();
    const day = 86400000;
    const added = missing.map((s, i) => seedToEntry(s, now, day, missing.length - i));
    saveEntries(entries.concat(added));
  }
  localStorage.setItem(MIGRATION_KEY, '1');
}

/* ---------- helpers ---------- */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatCoord(lat, lng) {
  const latDir = parseFloat(lat) >= 0 ? 'N' : 'S';
  const lngDir = parseFloat(lng) >= 0 ? 'E' : 'W';
  const latAbs = Math.abs(parseFloat(lat)).toFixed(4);
  const lngAbs = Math.abs(parseFloat(lng)).toFixed(4);
  return `${latAbs}° ${latDir}, ${lngAbs}° ${lngDir}`;
}

function showToast(msg, kind, subtext) {
  const t = document.getElementById('toast');
  const iconSvg = kind === 'delete'
    ? `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#9B3B2B" stroke-width="1.6"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" fill="none" stroke="#9B3B2B" stroke-width="1.6" stroke-linecap="round"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#B7D9A8" stroke-width="1.6"/><path d="M4.8 8.3l2.1 2.1 4.3-4.6" fill="none" stroke="#B7D9A8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const subtextHtml = subtext ? `<span class="toast-subtext">${subtext}</span>` : '';
  t.innerHTML = `<span class="toast-icon">${iconSvg}</span><span class="toast-text"><span>${msg}</span>${subtextHtml}</span>`;
  t.classList.remove('show');
  void t.offsetWidth; // restart icon-draw animation
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---------- animated count-up for stat numbers ---------- */
function animateStatNumber(el, newVal) {
  const oldVal = parseInt(el.textContent, 10) || 0;
  const target = parseInt(newVal, 10) || 0;
  if (oldVal === target) { el.textContent = target; return; }
  const duration = 350;
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = Math.round(oldVal + (target - oldVal) * eased);
    el.textContent = current;
    if (p < 1) { requestAnimationFrame(step); }
    else {
      el.textContent = target;
      const card = el.closest('.stat');
      if (card) {
        card.classList.remove('bump');
        void card.offsetWidth;
        card.classList.add('bump');
      }
    }
  }
  requestAnimationFrame(step);
}

/* ---------- map ---------- */
let map, markerLayer;
let markersById = {};
let lastEntryIds = new Set();
let justAddedId = null;
let tempMarker = null; // temporary "click-to-add" location marker, kept outside markerLayer

/* Compare Two Locations — no separate data store: these just hold the
   ids of two existing entries. compareLine lives directly on `map`
   (not markerLayer), so it survives markerLayer being rebuilt by
   updateMap() on every render(). */
let compareEntryIdA = null;
let compareEntryIdB = null;
let compareLine = null;

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', subdomains: 'abc', maxZoom: 19
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  map.on('click', handleMapClickToAdd);
}

/* ---------- click-to-add location ---------- */
function handleMapClickToAdd(e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  document.getElementById('lat').value = lat;
  document.getElementById('lng').value = lng;

  const tempIcon = L.divIcon({
    className: '',
    html: `<div class="temp-marker"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  if (tempMarker) {
    tempMarker.setLatLng(e.latlng);
    tempMarker.setIcon(tempIcon); // restarts the marker's entrance animation
  } else {
    tempMarker = L.marker(e.latlng, { icon: tempIcon, zIndexOffset: 1000 }).addTo(map);
  }

  // "Save something here?" — an explicit, opt-in prompt rather than a
  // plain info popup, so a casual click never silently commits the user
  // to anything beyond dropping the pin; the form is only opened/focused
  // once they choose to.
  const popupWrap = document.createElement('div');
  popupWrap.className = 'save-here-popup';
  const title = document.createElement('div');
  title.className = 'save-here-title';
  title.textContent = 'Save something here?';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'save-here-btn';
  btn.textContent = 'Add Discovery';
  btn.addEventListener('click', () => {
    map.closePopup();
    const nameField = document.getElementById('siteName');
    nameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameField.focus();
  });
  popupWrap.appendChild(title);
  popupWrap.appendChild(btn);

  tempMarker.bindPopup(popupWrap, { className: 'save-here-popup-wrap', closeButton: true }).openPopup();

  showToast('Location selected — coordinates added to the form.');
  updateLocationStatus();
}

/* Reframes the map's own title/subtitle to reflect an active category
   filter (e.g. "MY NATURE DISCOVERIES"), so filtering reads as "my
   discoveries of this kind" rather than a generic dataset filter. */
function updateMapTitleForFilter(activeCategoryFilter) {
  const titleEl = document.querySelector('.map-title-main');
  const subEl = document.querySelector('.map-subtitle');
  if (!titleEl || !subEl) return;
  if (activeCategoryFilter) {
    titleEl.textContent = 'MY ' + activeCategoryFilter.toUpperCase() + ' DISCOVERIES';
    subEl.textContent = 'Places and moments you\u2019ve saved in this category.';
  } else {
    titleEl.textContent = 'MY DISCOVERIES';
    subEl.textContent = 'Places and moments you\u2019ve saved while exploring.';
  }
}

/* Shows/removes the "Your map starts here." overlay depending on whether
   any discovery has a location yet. The map itself stays visible and
   still receives clicks (for click-to-add) underneath the overlay. */
function updateMapEmptyState(withCoordsCount) {
  const mapCard = document.getElementById('mapCard');
  let overlay = document.getElementById('mapEmptyState');
  if (withCoordsCount === 0) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mapEmptyState';
      overlay.className = 'map-empty-state';

      const title = document.createElement('div');
      title.className = 'mes-title';
      title.textContent = 'Your map starts here.';
      const sub = document.createElement('div');
      sub.className = 'mes-sub';
      sub.textContent = 'Save your first discovery and watch your exploration take shape.';
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'mes-cta';
      cta.textContent = 'Add Discovery →';
      cta.addEventListener('click', () => {
        const nameField = document.getElementById('siteName');
        nameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameField.focus();
      });

      overlay.appendChild(title);
      overlay.appendChild(sub);
      overlay.appendChild(cta);
      mapCard.appendChild(overlay);
    }
  } else if (overlay) {
    overlay.remove();
  }
}

/* Compact "Discovery Preview Card" shown when a marker is tapped —
   name, category, a short excerpt of why it was saved, when it was
   discovered, and a way into the full (existing) detail panel. */
function showDiscoveryPreview(entry) {
  const marker = markersById[entry.id];
  if (!marker) return;

  const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
  const glyph = CATEGORY_GLYPHS[entry.category] || CATEGORY_GLYPHS['Other'];

  const wrap = document.createElement('div');
  wrap.className = 'discovery-preview-popup';

  const top = document.createElement('div');
  top.className = 'dpp-top';
  const glyphEl = document.createElement('span');
  glyphEl.className = 'dpp-glyph';
  glyphEl.style.background = color;
  glyphEl.textContent = glyph;
  const textWrap = document.createElement('div');
  const nameEl = document.createElement('div');
  nameEl.className = 'dpp-name';
  nameEl.textContent = entry.name;
  const catEl = document.createElement('div');
  catEl.className = 'dpp-cat';
  catEl.textContent = entry.category;
  textWrap.appendChild(nameEl);
  textWrap.appendChild(catEl);
  top.appendChild(glyphEl);
  top.appendChild(textWrap);
  wrap.appendChild(top);

  const notes = (entry.notes || '').trim();
  if (notes) {
    const excerpt = notes.length > 90 ? notes.slice(0, 90).trim() + '\u2026' : notes;
    const excerptEl = document.createElement('div');
    excerptEl.className = 'dpp-excerpt';
    excerptEl.textContent = '\u201c' + excerpt + '\u201d';
    wrap.appendChild(excerptEl);
  }

  const dateEl = document.createElement('div');
  dateEl.className = 'dpp-date';
  dateEl.textContent = 'Discovered ' + formatDate(entry.date);
  wrap.appendChild(dateEl);

  const viewBtn = document.createElement('button');
  viewBtn.type = 'button';
  viewBtn.className = 'dpp-view-btn';
  viewBtn.textContent = 'View Discovery \u2192';
  viewBtn.addEventListener('click', () => {
    map.closePopup();
    openEntryDetail(entry.id);
  });
  wrap.appendChild(viewBtn);

  marker.bindPopup(wrap, { className: 'discovery-popup', closeButton: true, maxWidth: 240, minWidth: 200 }).openPopup();
}

/* Clicking a marker: center attention on it (highlight + dim the rest)
   and open the lightweight preview first — "View Discovery" from the
   preview is what opens the full existing detail panel (item 7's
   Map → Preview → Detail chain). */
function handleMarkerClick(id) {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  selectedEntryId = id;
  setSelectedCard(id);
  setSelectedMarker(id);
  echoAnalyticsCategory(entry.category);
  showDiscoveryPreview(entry);
}

/* If the preview popup is dismissed without opening the full detail
   (which has its own, separate close/selection handling), clear the
   ephemeral selection/dim state so the map returns to normal. */
function handleMarkerPopupClose(id) {
  if (selectedEntryId !== id) return;
  const detailOpen = !document.getElementById('detailPanel').classList.contains('app-hidden');
  if (detailOpen) return; // the full detail panel owns the selection now
  selectedEntryId = null;
  document.querySelectorAll('.map-marker.marker-selected').forEach(el => el.classList.remove('marker-selected'));
  document.querySelectorAll('.map-marker.dimmed-by-selection').forEach(el => el.classList.remove('dimmed-by-selection'));
  document.querySelectorAll('.entry.selected').forEach(el => el.classList.remove('selected'));
}

function updateMap(entries) {
  markerLayer.clearLayers();
  markersById = {};
  const withCoords = entries.filter(e => e.lat !== '' && e.lng !== '' && !isNaN(parseFloat(e.lat)) && !isNaN(parseFloat(e.lng)));
  const currentIds = new Set(withCoords.map(e => e.id));

  // Reuses the existing category filter select as the single source of
  // truth for "which category is emphasized" — set either by the user
  // changing the dropdown directly, or by clicking a bar in the
  // Analytics Dashboard's category chart (see renderCategoryChart).
  const activeCategoryFilter = document.getElementById('filterCat').value;
  updateMapTitleForFilter(activeCategoryFilter);
  updateMapEmptyState(withCoords.length);

  withCoords.forEach(e => {
    const color = CATEGORY_COLORS[e.category] || CATEGORY_COLORS['Other'];
    const glyph = CATEGORY_GLYPHS[e.category] || CATEGORY_GLYPHS['Other'];
    const isNew = justAddedId === e.id;
    const isDimmedByCategory = activeCategoryFilter && e.category !== activeCategoryFilter;
    const isDimmedBySelection = selectedEntryId && e.id !== selectedEntryId;

    const icon = L.divIcon({
      className: '',
      html: `<div class="map-marker${isNew ? ' new' : ''}${isDimmedByCategory ? ' dimmed' : ''}${isDimmedBySelection ? ' dimmed-by-selection' : ''}${selectedEntryId === e.id ? ' marker-selected' : ''}" style="background:${color}"><span>${glyph}</span>${isNew ? '<span class="marker-new-ring"></span>' : ''}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    const marker = L.marker([parseFloat(e.lat), parseFloat(e.lng)], { icon });
    marker.bindTooltip(e.name, {
      direction: 'top', offset: [0, -14], sticky: true, opacity: 0.95
    });
    marker.on('click', (ev) => { L.DomEvent.stopPropagation(ev); handleMarkerClick(e.id); });
    marker.on('popupclose', () => handleMarkerPopupClose(e.id));
    marker.addTo(markerLayer);
    markersById[e.id] = marker;
  });

  if (withCoords.length > 0 && !(compareEntryIdA && compareEntryIdB)) {
    // When a category filter is active, fly to fit just that category's
    // markers (further emphasizing them); otherwise keep the original
    // behavior of fitting all markers. Skipped entirely while a full
    // A+B comparison is active — applyCompareHighlighting() (called
    // right after this from render()) takes over fitting the map to
    // just those two locations instead.
    const emphasized = activeCategoryFilter ? withCoords.filter(e => e.category === activeCategoryFilter) : withCoords;
    const boundsSource = emphasized.length > 0 ? emphasized : withCoords;
    const bounds = L.latLngBounds(boundsSource.map(e => [parseFloat(e.lat), parseFloat(e.lng)]));
    if (justAddedId && markersById[justAddedId]) {
      map.flyTo(markersById[justAddedId].getLatLng(), Math.max(map.getZoom(), 12), { duration: 0.9 });
    } else {
      map.flyToBounds(bounds, { padding: [30, 30], maxZoom: 13, duration: 0.7 });
    }
  }

  lastEntryIds = currentIds;
  justAddedId = null;
}

function pingMarker(id) {
  const marker = markersById[id];
  if (!marker) return;
  const point = map.latLngToContainerPoint(marker.getLatLng());
  const mapEl = document.getElementById('map');
  const ring = document.createElement('div');
  ring.className = 'marker-ping';
  ring.style.position = 'absolute';
  ring.style.left = (point.x - 12) + 'px';
  ring.style.top = (point.y - 12) + 'px';
  ring.style.width = '24px';
  ring.style.height = '24px';
  ring.style.border = '2px solid var(--accent)';
  mapEl.style.position = 'relative';
  mapEl.appendChild(ring);
  setTimeout(() => ring.remove(), 1100);
}

/* ============================================================
   Compare Two Locations
   Reuses: existing entries (loadEntries/currentFilteredEntries),
   markersById (no new markers are created — existing markers are
   just styled and read from), CATEGORY_COLORS/GLYPHS, formatDate,
   formatCoord and distanceKm (the same haversine helper already
   used for "nearby observations"). No second data store.
   ============================================================ */

/* Which entries populate the two selectors. Per spec: prefer the
   currently-filtered/visible set when a search or category filter
   is active, otherwise use every stored entry. Filtering itself is
   never touched — this only decides what's offered to compare. */
function getCompareSourceEntries() {
  const searchActive = document.getElementById('searchBox').value.trim() !== '';
  const catActive = document.getElementById('filterCat').value !== '';
  return (searchActive || catActive) ? currentFilteredEntries : loadEntries();
}

function populateCompareSelectors() {
  const source = getCompareSourceEntries();
  const selA = document.getElementById('compareSelectA');
  const selB = document.getElementById('compareSelectB');
  const prevA = compareEntryIdA, prevB = compareEntryIdB;

  [selA, selB].forEach(sel => {
    sel.innerHTML = '<option value="">Select a location\u2026</option>';
    source.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.name + ' (' + e.category + ')';
      sel.appendChild(opt);
    });
  });

  compareEntryIdA = (prevA && source.some(e => e.id === prevA)) ? prevA : null;
  compareEntryIdB = (prevB && source.some(e => e.id === prevB)) ? prevB : null;
  selA.value = compareEntryIdA || '';
  selB.value = compareEntryIdB || '';
}

function openComparePanel() {
  populateCompareSelectors();
  renderCompareBody();
  const overlay = document.getElementById('compareOverlay');
  const panel = document.getElementById('comparePanel');
  overlay.classList.remove('app-hidden');
  panel.classList.remove('app-hidden');
  void panel.offsetWidth;
  overlay.classList.add('app-visible');
  panel.classList.add('app-visible');
}

function closeComparePanel() {
  const overlay = document.getElementById('compareOverlay');
  const panel = document.getElementById('comparePanel');
  overlay.classList.remove('app-visible');
  panel.classList.remove('app-visible');
  setTimeout(() => {
    overlay.classList.add('app-hidden');
    panel.classList.add('app-hidden');
  }, 250);
  clearCompareHighlighting();
  compareEntryIdA = null;
  compareEntryIdB = null;
}

function clearCompareHighlighting() {
  if (compareLine && map) { map.removeLayer(compareLine); compareLine = null; }
  document.querySelectorAll('.map-marker.compare-a, .map-marker.compare-b').forEach(el => {
    el.classList.remove('compare-a', 'compare-b');
  });
}

function applyCompareHighlighting() {
  clearCompareHighlighting();
  if (!compareEntryIdA || !compareEntryIdB) return;
  const markerA = markersById[compareEntryIdA];
  const markerB = markersById[compareEntryIdB];
  if (!markerA || !markerB) return;

  const elA = markerA.getElement() && markerA.getElement().querySelector('.map-marker');
  const elB = markerB.getElement() && markerB.getElement().querySelector('.map-marker');
  if (elA) elA.classList.add('compare-a');
  if (elB) elB.classList.add('compare-b');

  compareLine = L.polyline([markerA.getLatLng(), markerB.getLatLng()], {
    color: '#5C4A2E', weight: 3, dashArray: '7,7', opacity: 0.85
  }).addTo(map);

  map.flyToBounds(L.latLngBounds([markerA.getLatLng(), markerB.getLatLng()]), {
    padding: [70, 70], maxZoom: 14, duration: 0.7
  });
}

function formatTimeDiff(dateA, dateB) {
  const ms = Math.abs(new Date(dateB) - new Date(dateA));
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'discovered the same day';
  if (days === 1) return '1 day apart';
  if (days < 31) return days + ' days apart';
  const months = Math.floor(days / 30);
  if (months < 12) return months + (months === 1 ? ' month apart' : ' months apart');
  return (days / 365).toFixed(1) + ' years apart';
}

function fillCompareCard(container, entry, side) {
  container.innerHTML = '';
  container.className = 'compare-card card-' + side;
  const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
  const glyph = CATEGORY_GLYPHS[entry.category] || CATEGORY_GLYPHS['Other'];

  const name = document.createElement('div');
  name.className = 'compare-card-name';
  name.textContent = entry.name;
  container.appendChild(name);

  const badge = document.createElement('div');
  badge.className = 'compare-card-badge';
  badge.style.color = color;
  const dot = document.createElement('span');
  dot.className = 'glyph-dot';
  dot.style.background = color;
  dot.textContent = glyph;
  badge.appendChild(dot);
  const catText = document.createElement('span');
  catText.textContent = entry.category;
  badge.appendChild(catText);
  container.appendChild(badge);

  function row(lbl, val) {
    const r = document.createElement('div');
    r.className = 'compare-card-row';
    const l = document.createElement('span'); l.className = 'cc-lbl'; l.textContent = lbl;
    const v = document.createElement('span'); v.className = 'cc-val'; v.textContent = val;
    r.appendChild(l); r.appendChild(v);
    container.appendChild(r);
  }
  row('Latitude', entry.lat || '\u2014');
  row('Longitude', entry.lng || '\u2014');
  row('Discovered', formatDate(entry.date));

  const notes = document.createElement('div');
  notes.className = 'compare-card-notes';
  notes.textContent = entry.notes || 'No note added.';
  container.appendChild(notes);
}

function renderCompareBody() {
  const body = document.getElementById('compareBody');
  const emptyMsg = document.getElementById('compareEmptyMsg');
  const actionButtons = document.querySelectorAll('#compareViewABtn, #compareViewBBtn, #compareSwapBtn, #compareClearBtn');

  const entries = loadEntries();
  const entryA = compareEntryIdA ? entries.find(e => e.id === compareEntryIdA) : null;
  const entryB = compareEntryIdB ? entries.find(e => e.id === compareEntryIdB) : null;

  if (!entryA || !entryB) {
    body.style.display = 'none';
    emptyMsg.style.display = 'block';
    actionButtons.forEach(b => b.disabled = true);
    applyCompareHighlighting();
    return;
  }

  emptyMsg.style.display = 'none';
  body.style.display = 'block';
  actionButtons.forEach(b => b.disabled = false);

  fillCompareCard(document.getElementById('compareCardA'), entryA, 'a');
  fillCompareCard(document.getElementById('compareCardB'), entryB, 'b');

  const banner = document.getElementById('compareDistanceBanner');
  banner.innerHTML = '';
  const latA = parseFloat(entryA.lat), lngA = parseFloat(entryA.lng);
  const latB = parseFloat(entryB.lat), lngB = parseFloat(entryB.lng);
  if (isNaN(latA) || isNaN(lngA) || isNaN(latB) || isNaN(lngB)) {
    banner.textContent = 'Distance unavailable \u2014 one or both locations are missing coordinates.';
  } else {
    const km = distanceKm(latA, lngA, latB, lngB);
    const distText = km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(2) + ' km';
    banner.appendChild(document.createTextNode('Straight-line distance: ' + distText));
    const note = document.createElement('span');
    note.className = 'cmp-dist-note';
    note.textContent = 'Straight-line distance between the two saved locations';
    banner.appendChild(note);
  }

  const catRow = document.getElementById('compareCategoryRow');
  catRow.innerHTML = '';
  const sameCategory = entryA.category === entryB.category;
  const catTag = document.createElement('span');
  catTag.className = 'cmp-tag ' + (sameCategory ? 'same' : 'diff');
  catTag.textContent = sameCategory ? 'Same category' : 'Different categories';
  catRow.appendChild(catTag);
  if (sameCategory) {
    const colorA = CATEGORY_COLORS[entryA.category] || CATEGORY_COLORS['Other'];
    const span = document.createElement('span');
    span.style.color = colorA; span.style.fontWeight = '700';
    span.textContent = entryA.category;
    catRow.appendChild(document.createTextNode('Both are '));
    catRow.appendChild(span);
    catRow.appendChild(document.createTextNode('.'));
  } else {
    const colorA = CATEGORY_COLORS[entryA.category] || CATEGORY_COLORS['Other'];
    const colorB = CATEGORY_COLORS[entryB.category] || CATEGORY_COLORS['Other'];
    const spanA = document.createElement('span'); spanA.style.color = colorA; spanA.style.fontWeight = '700'; spanA.textContent = entryA.category;
    const spanB = document.createElement('span'); spanB.style.color = colorB; spanB.style.fontWeight = '700'; spanB.textContent = entryB.category;
    catRow.appendChild(document.createTextNode('A is '));
    catRow.appendChild(spanA);
    catRow.appendChild(document.createTextNode(', B is '));
    catRow.appendChild(spanB);
    catRow.appendChild(document.createTextNode('.'));
  }

  const dateRow = document.getElementById('compareDateRow');
  dateRow.innerHTML = '';
  dateRow.appendChild(document.createTextNode(
    'A: ' + formatDate(entryA.date) + '   \u00b7   B: ' + formatDate(entryB.date) +
    '   \u2014   ' + formatTimeDiff(entryA.date, entryB.date)
  ));

  applyCompareHighlighting();
}

document.getElementById('compareBtn').addEventListener('click', openComparePanel);
document.getElementById('compareCloseBtn').addEventListener('click', closeComparePanel);
document.getElementById('compareCloseBtn2').addEventListener('click', closeComparePanel);
document.getElementById('compareOverlay').addEventListener('click', closeComparePanel);

document.getElementById('compareSelectA').addEventListener('change', (e) => {
  compareEntryIdA = e.target.value ? Number(e.target.value) : null;
  renderCompareBody();
});
document.getElementById('compareSelectB').addEventListener('change', (e) => {
  compareEntryIdB = e.target.value ? Number(e.target.value) : null;
  renderCompareBody();
});

document.getElementById('compareViewABtn').addEventListener('click', () => {
  if (compareEntryIdA && markersById[compareEntryIdA]) {
    map.flyTo(markersById[compareEntryIdA].getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
    pingMarker(compareEntryIdA);
  }
});
document.getElementById('compareViewBBtn').addEventListener('click', () => {
  if (compareEntryIdB && markersById[compareEntryIdB]) {
    map.flyTo(markersById[compareEntryIdB].getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
    pingMarker(compareEntryIdB);
  }
});
document.getElementById('compareSwapBtn').addEventListener('click', () => {
  const tmp = compareEntryIdA;
  compareEntryIdA = compareEntryIdB;
  compareEntryIdB = tmp;
  document.getElementById('compareSelectA').value = compareEntryIdA || '';
  document.getElementById('compareSelectB').value = compareEntryIdB || '';
  renderCompareBody();
});
document.getElementById('compareClearBtn').addEventListener('click', () => {
  compareEntryIdA = null;
  compareEntryIdB = null;
  document.getElementById('compareSelectA').value = '';
  document.getElementById('compareSelectB').value = '';
  renderCompareBody();
});

function linkEntryFromMap(id) {
  document.querySelectorAll('.entry.map-linked').forEach(el => el.classList.remove('map-linked'));
  const card = document.querySelector(`.entry[data-id="${id}"]`);
  if (card) {
    card.classList.add('map-linked');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => card.classList.remove('map-linked'), 1600);
  }
  openEntryDetail(id);
}

/* ---------- distance helper (haversine, in km) ---------- */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ---------- selection helpers (reuse existing markers/cards, no re-creation) ---------- */
function setSelectedMarker(id) {
  // Also dims every other marker (item 11: the selected discovery stands
  // out; the rest recede slightly but stay visible — never hidden).
  Object.keys(markersById).forEach(key => {
    const marker = markersById[key];
    const el = marker.getElement() && marker.getElement().querySelector('.map-marker');
    if (!el) return;
    el.classList.remove('marker-selected', 'dimmed-by-selection');
    if (String(id) === key) {
      el.classList.add('marker-selected');
    } else {
      el.classList.add('dimmed-by-selection');
    }
  });
}

function setSelectedCard(id) {
  document.querySelectorAll('.entry.selected').forEach(el => el.classList.remove('selected'));
  const card = document.querySelector(`.entry[data-id="${id}"]`);
  if (card) card.classList.add('selected');
}

/* ---------- entry detail panel ---------- */
function updateDetailNavButtons() {
  const idx = currentFilteredEntries.findIndex(e => e.id === selectedEntryId);
  const pos = document.getElementById('detailNavPos');
  const prevBtn = document.getElementById('detailPrevBtn');
  const nextBtn = document.getElementById('detailNextBtn');
  if (idx === -1 || currentFilteredEntries.length === 0) {
    pos.textContent = '';
    prevBtn.disabled = true; nextBtn.disabled = true;
    return;
  }
  pos.textContent = (idx + 1) + ' of ' + currentFilteredEntries.length;
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx >= currentFilteredEntries.length - 1;
}

function renderNearby(entry) {
  const listEl = document.getElementById('detailNearbyList');
  listEl.innerHTML = '';
  const lat1 = parseFloat(entry.lat), lng1 = parseFloat(entry.lng);
  if (isNaN(lat1) || isNaN(lng1)) {
    listEl.innerHTML = '<div class="detail-nearby-empty">This discovery has no saved location.</div>';
    return;
  }
  const all = loadEntries();
  const nearby = [];
  all.forEach(other => {
    if (other.id === entry.id) return;
    const lat2 = parseFloat(other.lat), lng2 = parseFloat(other.lng);
    if (isNaN(lat2) || isNaN(lng2)) return;
    const d = distanceKm(lat1, lng1, lat2, lng2);
    if (d <= 5) nearby.push({ entry: other, dist: d });
  });
  nearby.sort((a, b) => a.dist - b.dist);

  if (nearby.length === 0) {
    listEl.innerHTML = '<div class="detail-nearby-empty">No other discoveries saved within 5 km.</div>';
    return;
  }
  nearby.slice(0, 6).forEach(n => {
    const row = document.createElement('div');
    row.className = 'nearby-item';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'nearby-name';
    nameSpan.textContent = n.entry.name;
    const distSpan = document.createElement('span');
    distSpan.className = 'nearby-dist';
    distSpan.textContent = n.entry.category + ' · ' + n.dist.toFixed(2) + ' km';
    row.appendChild(nameSpan);
    row.appendChild(distSpan);
    row.addEventListener('click', () => openEntryDetail(n.entry.id));
    listEl.appendChild(row);
  });
}

function openEntryDetail(id) {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  selectedEntryId = id;
  const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
  const glyph = CATEGORY_GLYPHS[entry.category] || CATEGORY_GLYPHS['Other'];

  const glyphEl = document.getElementById('detailGlyph');
  glyphEl.textContent = glyph;
  glyphEl.style.background = color;
  document.getElementById('detailName').textContent = entry.name;
  const badgeEl = document.getElementById('detailBadge');
  badgeEl.textContent = entry.category;
  badgeEl.style.color = color;
  const coordEl = document.getElementById('detailCoords');
  if (coordEl) {
    coordEl.textContent = (entry.lat !== '' && entry.lng !== '') ? formatCoord(entry.lat, entry.lng) : 'Not specified';
  }
  const latEl = document.getElementById('detailLat');
  if (latEl) latEl.textContent = entry.lat || '—';
  const lngEl = document.getElementById('detailLng');
  if (lngEl) lngEl.textContent = entry.lng || '—';
  document.getElementById('detailDate').textContent = formatDate(entry.date);
  document.getElementById('detailNotes').textContent = entry.notes || 'No note added.';

  renderNearby(entry);
  updateDetailNavButtons();
  setSelectedCard(id);
  setSelectedMarker(id);
  echoAnalyticsCategory(entry.category); // map/list selection → briefly highlight its category in the dashboard

  if (markersById[id]) {
    map.flyTo(markersById[id].getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.6 });
    pingMarker(id);
  }

  const overlay = document.getElementById('detailOverlay');
  const panel = document.getElementById('detailPanel');
  overlay.classList.remove('app-hidden');
  panel.classList.remove('app-hidden');
  void panel.offsetWidth;
  overlay.classList.add('app-visible');
  panel.classList.add('app-visible');
  document.getElementById('detailCloseBtn').focus();
}

function closeEntryDetail() {
  const overlay = document.getElementById('detailOverlay');
  const panel = document.getElementById('detailPanel');
  overlay.classList.remove('app-visible');
  panel.classList.remove('app-visible');
  setTimeout(() => {
    overlay.classList.add('app-hidden');
    panel.classList.add('app-hidden');
  }, 300);
  document.querySelectorAll('.map-marker.marker-selected').forEach(el => el.classList.remove('marker-selected'));
  document.querySelectorAll('.map-marker.dimmed-by-selection').forEach(el => el.classList.remove('dimmed-by-selection'));
  document.querySelectorAll('.entry.selected').forEach(el => el.classList.remove('selected'));
  selectedEntryId = null;
}

/* ---------- shared delete (used by card delete button AND detail panel) ---------- */
function deleteEntryById(id, cardEl) {
  if (cardEl) {
    cardEl.style.maxHeight = cardEl.offsetHeight + 'px';
    void cardEl.offsetWidth;
    cardEl.classList.add('removing');
  }
  showToast('Discovery deleted', 'delete');
  setTimeout(() => {
    const current = loadEntries();
    saveEntries(current.filter(e => e.id !== id));
    render();
  }, 300);
}

document.getElementById('detailCloseBtn').addEventListener('click', closeEntryDetail);
document.getElementById('detailOverlay').addEventListener('click', closeEntryDetail);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('detailPanel').classList.contains('app-hidden')) {
    closeEntryDetail();
  }
});

document.getElementById('detailViewMapBtn').addEventListener('click', () => {
  if (selectedEntryId && markersById[selectedEntryId]) {
    map.flyTo(markersById[selectedEntryId].getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
    pingMarker(selectedEntryId);
  }
});

document.getElementById('detailEditBtn').addEventListener('click', () => {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === selectedEntryId);
  if (!entry) return;
  closeEntryDetail();
  startEdit(entry);
});

document.getElementById('detailDeleteBtn').addEventListener('click', () => {
  if (!selectedEntryId) return;
  if (!confirm('Delete this discovery from your journal? This cannot be undone.')) return;
  const cardEl = document.querySelector(`.entry[data-id="${selectedEntryId}"]`);
  deleteEntryById(selectedEntryId, cardEl);
  closeEntryDetail();
});

document.getElementById('detailCopyBtn').addEventListener('click', () => {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === selectedEntryId);
  if (!entry) return;
  const text = entry.lat + ', ' + entry.lng;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('Coordinates copied to clipboard'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Coordinates copied to clipboard');
  }
});

document.getElementById('detailPrevBtn').addEventListener('click', () => {
  const idx = currentFilteredEntries.findIndex(e => e.id === selectedEntryId);
  if (idx > 0) openEntryDetail(currentFilteredEntries[idx - 1].id);
});
document.getElementById('detailNextBtn').addEventListener('click', () => {
  const idx = currentFilteredEntries.findIndex(e => e.id === selectedEntryId);
  if (idx > -1 && idx < currentFilteredEntries.length - 1) openEntryDetail(currentFilteredEntries[idx + 1].id);
});

/* ---------- stats (Discoveries, Places Explored, Want to Revisit, Favourite Spots) ---------- */
function updateStats(entries) {
  const totalEl = document.getElementById('statTotal');
  if (totalEl) animateStatNumber(totalEl, entries.length);

  // Places Explored — distinct location points / named spots
  const locSet = new Set();
  entries.forEach(e => {
    if (e.lat !== '' && e.lng !== '' && !isNaN(parseFloat(e.lat)) && !isNaN(parseFloat(e.lng))) {
      locSet.add(parseFloat(e.lat).toFixed(3) + ',' + parseFloat(e.lng).toFixed(3));
    } else if (e.name) {
      locSet.add(e.name.toLowerCase().trim());
    }
  });
  const locEl = document.getElementById('statLocations');
  if (locEl) animateStatNumber(locEl, locSet.size);

  // Want to Revisit count
  const revisitCount = entries.filter(e => e.category === 'Want to Revisit').length;
  const revisitEl = document.getElementById('statRevisit');
  if (revisitEl) animateStatNumber(revisitEl, revisitCount);

  // Favourite Spots count (category 'Favourite' or pinned entries)
  const favouriteCount = entries.filter(e => e.category === 'Favourite' || e.pinned).length;
  const favEl = document.getElementById('statFavourites');
  if (favEl) animateStatNumber(favEl, favouriteCount);

  // Keep backwards compatibility if old stat elements exist
  const catsEl = document.getElementById('statCats');
  if (catsEl) {
    const cats = new Set(entries.map(e => e.category));
    animateStatNumber(catsEl, cats.size);
  }
}

/* ============================================================
   Analytics Dashboard
   Reuses: CATEGORY_COLORS/GLYPHS, animateStatNumber(), distanceKm(),
   the #filterCat select, and the entries/filtered arrays render()
   already computes. No second data store — everything here reads
   from loadEntries() / the arrays passed in from render().
   ============================================================ */

/* Recomputes the whole dashboard. Called once per render() — i.e.
   automatically on every add/edit/delete/import/filter/search,
   since render() already runs after all of those. */
function renderAnalytics(allEntries, filteredEntries) {
  const scopeNoteEl = document.getElementById('analyticsScopeNote');
  scopeNoteEl.textContent = analyticsScope === 'filtered'
    ? 'Showing: ' + filteredEntries.length + ' of ' + allEntries.length + ' Discoveries'
    : 'Showing: All Discoveries';

  animateStatNumber(document.getElementById('anaTotal'), allEntries.length);

  const locSet = new Set();
  allEntries.forEach(e => {
    if (e.lat !== '' && e.lng !== '' && !isNaN(parseFloat(e.lat)) && !isNaN(parseFloat(e.lng))) {
      locSet.add(parseFloat(e.lat).toFixed(3) + ',' + parseFloat(e.lng).toFixed(3));
    } else if (e.name) {
      locSet.add(e.name.toLowerCase().trim());
    }
  });
  animateStatNumber(document.getElementById('anaLocations'), locSet.size);

  const revisitEntries = allEntries.filter(e => e.category === 'Want to Revisit');
  const favouriteEntries = allEntries.filter(e => e.category === 'Favourite');
  animateStatNumber(document.getElementById('anaRevisit'), revisitEntries.length);
  animateStatNumber(document.getElementById('anaFavourites'), favouriteEntries.length);

  const chartData = analyticsScope === 'filtered' ? filteredEntries : allEntries;
  renderCategoryChart(chartData);
  renderTimeChart(chartData);
  renderGeoDistribution(chartData);
  renderInsightList(document.getElementById('analyticsRevisitList'), revisitEntries,
    'Nothing marked for a revisit yet.', 'Save a discovery as "Want to Revisit" when you\'d like to come back.');
  renderInsightList(document.getElementById('analyticsFavouritesList'), favouriteEntries,
    'No favourites yet.', 'Mark a discovery as Favourite when it becomes one of your special finds.');
}

/* Compact, clickable list used by the "Places to Revisit" and
   "Favourite Discoveries" sections — opens the existing discovery
   detail panel, same as everywhere else in the app. */
function renderInsightList(container, entries, emptyTitle, emptySub) {
  container.innerHTML = '';
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'analytics-empty';
    const t = document.createElement('div'); t.className = 'analytics-empty-title'; t.textContent = emptyTitle;
    const s = document.createElement('div'); s.className = 'analytics-empty-sub'; s.textContent = emptySub;
    empty.appendChild(t); empty.appendChild(s);
    container.appendChild(empty);
    return;
  }
  const sorted = entries.slice().sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach(entry => {
    const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
    const glyph = CATEGORY_GLYPHS[entry.category] || CATEGORY_GLYPHS['Other'];
    const hasCoords = entry.lat !== '' && entry.lng !== '' && !isNaN(parseFloat(entry.lat)) && !isNaN(parseFloat(entry.lng));
    const row = document.createElement('div');
    row.className = 'insight-item';
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', 'Open ' + entry.name);

    const glyphSpan = document.createElement('span');
    glyphSpan.className = 'insight-glyph';
    glyphSpan.style.background = color;
    glyphSpan.textContent = glyph;

    const body = document.createElement('div');
    body.className = 'insight-body';
    const nameEl = document.createElement('div');
    nameEl.className = 'insight-name';
    nameEl.textContent = entry.name;
    const metaEl = document.createElement('div');
    metaEl.className = 'insight-meta';
    metaEl.textContent = entry.category + ' · ' + (hasCoords ? formatCoord(entry.lat, entry.lng) : 'Location not specified') + ' · ' + formatDate(entry.date);
    body.appendChild(nameEl);
    body.appendChild(metaEl);

    row.appendChild(glyphSpan);
    row.appendChild(body);

    const open = () => openEntryDetail(entry.id);
    row.addEventListener('click', open);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

    container.appendChild(row);
  });
}

/* ---------- category distribution chart ---------- */
function renderCategoryChart(data) {
  const container = document.getElementById('analyticsCategoryChart');
  container.innerHTML = '';

  if (data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'analytics-empty';
    const t = document.createElement('div'); t.className = 'analytics-empty-title'; t.textContent = 'Your exploration story is just beginning.';
    const s = document.createElement('div'); s.className = 'analytics-empty-sub'; s.textContent = "Save a few more discoveries and you'll start seeing patterns here.";
    empty.appendChild(t); empty.appendChild(s);
    container.appendChild(empty);
    return;
  }

  const counts = {};
  data.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
  const activeFilter = document.getElementById('filterCat').value;
  const maxCount = Math.max(...Object.values(counts));

  Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach(cat => {
    const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
    const glyph = CATEGORY_GLYPHS[cat] || CATEGORY_GLYPHS['Other'];
    const count = counts[cat];

    const row = document.createElement('div');
    row.className = 'cat-bar-row' + (activeFilter === cat ? ' active' : '');
    row.dataset.category = cat;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', cat + ': ' + count + ' discoveries, click to filter');

    const label = document.createElement('div');
    label.className = 'cat-bar-label';
    const glyphSpan = document.createElement('span');
    glyphSpan.className = 'cat-bar-glyph';
    glyphSpan.style.background = color;
    glyphSpan.textContent = glyph;
    const txtSpan = document.createElement('span');
    txtSpan.className = 'txt';
    txtSpan.textContent = cat;
    label.appendChild(glyphSpan);
    label.appendChild(txtSpan);

    const track = document.createElement('div');
    track.className = 'cat-bar-track';
    const fill = document.createElement('div');
    fill.className = 'cat-bar-fill';
    fill.style.width = (count / maxCount * 100).toFixed(1) + '%';
    fill.style.background = color;
    track.appendChild(fill);

    const countEl = document.createElement('div');
    countEl.className = 'cat-bar-count';
    countEl.textContent = count;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(countEl);

    const toggleThisCategory = () => {
      const filterEl = document.getElementById('filterCat');
      filterEl.value = (filterEl.value === cat) ? '' : cat; // click again to clear
      syncFilterActiveState();
      render();
    };
    row.addEventListener('click', toggleThisCategory);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleThisCategory(); }
    });

    container.appendChild(row);
  });
}

/* Briefly pulses a category's bar — used when a map marker or entry
   card is opened, so the dashboard visually echoes the selection
   without changing the actual filter (that stays a deliberate,
   click-driven action on the bar itself, see above). */
function echoAnalyticsCategory(category) {
  const row = document.querySelector('.cat-bar-row[data-category="' + CSS.escape(category) + '"]');
  if (!row) return;
  row.classList.remove('echo');
  void row.offsetWidth;
  row.classList.add('echo');
  setTimeout(() => row.classList.remove('echo'), 1200);
}

/* ---------- time-based chart ---------- */
function renderTimeChart(data) {
  const container = document.getElementById('analyticsTimeChart');
  container.innerHTML = '';

  if (data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'analytics-empty';
    const t = document.createElement('div'); t.className = 'analytics-empty-title'; t.textContent = 'Your exploration story is just beginning.';
    const s = document.createElement('div'); s.className = 'analytics-empty-sub'; s.textContent = "Save a few more discoveries and you'll start seeing patterns here.";
    empty.appendChild(t); empty.appendChild(s);
    container.appendChild(empty);
    return;
  }

  const groups = {};
  data.forEach(e => {
    const key = analyticsTimeGrouping === 'monthly' ? e.date.slice(0, 7) : e.date.slice(0, 10);
    groups[key] = (groups[key] || 0) + 1;
  });
  const keys = Object.keys(groups).sort();
  const maxCount = Math.max(...Object.values(groups));

  keys.forEach(key => {
    const count = groups[key];
    const wrap = document.createElement('div');
    wrap.className = 'time-bar-wrap';

    const bar = document.createElement('div');
    bar.className = 'time-bar';
    bar.style.height = Math.max(4, Math.round(count / maxCount * 90)) + 'px';
    bar.title = key + ': ' + count + ' discovery' + (count === 1 ? '' : 'ies');

    const label = document.createElement('div');
    label.className = 'time-bar-label';
    label.textContent = analyticsTimeGrouping === 'monthly' ? key : key.slice(5); // MM-DD for daily

    wrap.appendChild(bar);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
}

/* ---------- "Where I Explore" — a friendly place summary, not a
   spatial-analysis grid. No coordinate spans, no quadrants. ---------- */
function renderGeoDistribution(data) {
  const grid = document.getElementById('analyticsGeoGrid');
  grid.innerHTML = '';

  if (data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'analytics-empty';
    const t = document.createElement('div'); t.className = 'analytics-empty-title'; t.textContent = 'Your exploration story is just beginning.';
    const s = document.createElement('div'); s.className = 'analytics-empty-sub'; s.textContent = "Save a few more discoveries and you'll start seeing patterns here.";
    empty.appendChild(t); empty.appendChild(s);
    grid.appendChild(empty);
    return;
  }

  const mapped = data.filter(e => e.lat !== '' && e.lng !== '' && !isNaN(parseFloat(e.lat)) && !isNaN(parseFloat(e.lng)));

  const summary = document.createElement('p');
  summary.className = 'geo-summary';
  summary.textContent = mapped.length === data.length
    ? 'Every one of your discoveries has a place on the map.'
    : mapped.length + ' of your ' + data.length + ' discoveries are pinned on the map.';
  grid.appendChild(summary);

  const chipWrap = document.createElement('div');
  chipWrap.className = 'geo-place-chips';

  const places = [];
  const seen = new Set();
  data.forEach(e => {
    const key = e.name.toLowerCase().trim();
    if (seen.has(key)) return;
    seen.add(key);
    places.push(e);
  });

  const GEO_CHIP_LIMIT = 6;
  const visibleCount = geoChipsExpanded ? places.length : Math.min(GEO_CHIP_LIMIT, places.length);

  function makeChip(e) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'geo-place-chip';
    chip.textContent = '📍 ' + e.name;
    chip.addEventListener('click', () => openEntryDetail(e.id));
    return chip;
  }

  places.slice(0, visibleCount).forEach(e => chipWrap.appendChild(makeChip(e)));

  const remaining = places.length - visibleCount;
  if (remaining > 0) {
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'geo-place-chip geo-place-more';
    moreBtn.textContent = '+ ' + remaining + ' more';
    moreBtn.setAttribute('aria-label', 'Show ' + remaining + ' more places');
    moreBtn.addEventListener('click', () => {
      geoChipsExpanded = true;
      renderGeoDistribution(data);
    });
    chipWrap.appendChild(moreBtn);
  } else if (geoChipsExpanded && places.length > GEO_CHIP_LIMIT) {
    const lessBtn = document.createElement('button');
    lessBtn.type = 'button';
    lessBtn.className = 'geo-place-chip geo-place-less';
    lessBtn.textContent = 'Show less';
    lessBtn.addEventListener('click', () => {
      geoChipsExpanded = false;
      renderGeoDistribution(data);
    });
    chipWrap.appendChild(lessBtn);
  }

  grid.appendChild(chipWrap);
}

/* Scope ("All observations" / "Filtered view") and time-grouping
   ("Daily" / "Monthly") toggle buttons — static markup, so wired
   once here rather than re-bound on every render(). */
document.querySelectorAll('.analytics-scope-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.analytics-scope-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    analyticsScope = btn.dataset.scope;
    render();
  });
});
document.querySelectorAll('.analytics-time-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.analytics-time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    analyticsTimeGrouping = btn.dataset.group;
    render();
  });
});

/* ---------- render ---------- */
let flashId = null;

/* ---------- search / filter / sort presentation helpers ---------- */
function updateQuickFilterState(filterCat) {
  const favBtn = document.getElementById('favouriteFilterBtn');
  const revisitBtn = document.getElementById('revisitFilterBtn');
  const clearBtn = document.getElementById('clearFiltersBtn');
  favBtn.setAttribute('aria-pressed', filterCat === 'Favourite' ? 'true' : 'false');
  revisitBtn.setAttribute('aria-pressed', filterCat === 'Want to Revisit' ? 'true' : 'false');

  const search = document.getElementById('searchBox').value.trim();
  const sortBy = document.getElementById('sortBy').value;
  const hasActiveFilters = !!filterCat || !!search || sortBy !== 'date';
  clearBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';
}

function updateCollectionHeader(filterCat) {
  const titleEl = document.getElementById('collectionTitle');
  const subEl = document.getElementById('collectionSubtitle');
  if (filterCat === 'Want to Revisit') {
    titleEl.textContent = 'Places to Revisit';
    subEl.textContent = 'A few discoveries worth coming back to.';
  } else if (filterCat === 'Favourite') {
    titleEl.textContent = 'Favourite Discoveries';
    subEl.textContent = 'The places and moments that stayed with you.';
  } else {
    titleEl.textContent = 'My Discoveries';
    subEl.textContent = "The places, moments and little details you've saved.";
  }
}

function updateResultsCount(shownCount, totalCount, search, filterCat) {
  const el = document.getElementById('resultsCount');
  if (!search && !filterCat) {
    el.textContent = shownCount === 1 ? '1 discovery' : shownCount + ' discoveries';
  } else {
    el.textContent = shownCount === 1 ? '1 discovery found' : shownCount + ' discoveries found';
  }
}

function renderEmptyState(container, totalCount, search, filterCat) {
  if (totalCount === 0) {
    container.innerHTML = `
      <div class="empty-title">Your journal starts here.</div>
      <div class="empty-sub">Save your first discovery and start building your personal collection.</div>
      <button type="button" class="empty-cta" id="emptyAddDiscoveryBtn">Add Discovery →</button>
    `;
    const btn = document.getElementById('emptyAddDiscoveryBtn');
    if (btn) btn.addEventListener('click', () => {
      document.getElementById('siteName').scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('siteName').focus();
    });
    return;
  }

  if (search) {
    container.innerHTML = `
      <div class="empty-title">Nothing matched that search.</div>
      <div class="empty-sub">Try another word, place, or category.</div>
      <button type="button" class="empty-cta" id="emptyClearSearchBtn">Clear Search</button>
    `;
    const btn = document.getElementById('emptyClearSearchBtn');
    if (btn) btn.addEventListener('click', clearAllFilters);
    return;
  }

  if (filterCat === 'Favourite') {
    container.innerHTML = `
      <div class="empty-title">No favourites yet.</div>
      <div class="empty-sub">Save the discoveries that mean something to you as favourites.</div>
    `;
    return;
  }

  if (filterCat === 'Want to Revisit') {
    container.innerHTML = `
      <div class="empty-title">No places marked for a revisit yet.</div>
      <div class="empty-sub">Mark somewhere when you know you'd like to come back.</div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="empty-title">Nothing matched that search.</div>
    <div class="empty-sub">Try another word, place, or category.</div>
    <button type="button" class="empty-cta" id="emptyClearSearchBtn">Clear Search</button>
  `;
  const btn = document.getElementById('emptyClearSearchBtn');
  if (btn) btn.addEventListener('click', clearAllFilters);
}

function clearAllFilters() {
  document.getElementById('searchBox').value = '';
  document.getElementById('filterCat').value = '';
  document.getElementById('sortBy').value = 'date';
  document.getElementById('searchClearBtn').style.display = 'none';
  render();
}

function render() {
  const entries = loadEntries();
  updateStats(entries);
  updateMap(entries);

  const search = document.getElementById('searchBox').value.trim().toLowerCase();
  const filterCat = document.getElementById('filterCat').value;
  const sortBy = document.getElementById('sortBy').value;

  let filtered = entries.filter(e => {
    const matchesSearch = !search
      || e.name.toLowerCase().includes(search)
      || (e.notes && e.notes.toLowerCase().includes(search))
      || (e.category && e.category.toLowerCase().includes(search));
    const matchesCat = !filterCat || e.category === filterCat;
    return matchesSearch && matchesCat;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'date') return b.date.localeCompare(a.date);
    if (sortBy === 'dateAsc') return a.date.localeCompare(b.date);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'nameDesc') return b.name.localeCompare(a.name);
    return 0;
  });

  // pinned entries float to top, preserving the chosen sort within each group
  filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  currentFilteredEntries = filtered;
  if (selectedEntryId !== null) setSelectedMarker(selectedEntryId);

  renderAnalytics(entries, filtered); // dashboard updates on every render() — add/edit/delete/import/filter all funnel through here
  updateQuickFilterState(filterCat);
  updateCollectionHeader(filterCat, search);
  updateResultsCount(filtered.length, entries.length, search, filterCat);

  const list = document.getElementById('entryList');
  const emptyMsg = document.getElementById('emptyMsg');
  list.innerHTML = '';

  if (filtered.length === 0) {
    renderEmptyState(emptyMsg, entries.length, search, filterCat);
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  filtered.forEach((entry, idx) => {
    const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
    const tint = CATEGORY_TINTS[entry.category] || CATEGORY_TINTS['Other'];

    const div = document.createElement('div');
    div.className = 'entry' + (entry.pinned ? ' pinned' : '') + (entry.id === selectedEntryId ? ' selected' : '');
    div.dataset.id = entry.id;
    div.style.borderLeftColor = color;
    div.style.background = tint;
    div.style.animationDelay = (idx * 45) + 'ms';
    div.addEventListener('click', (ev) => {
      if (ev.target.closest('button')) return;
      openEntryDetail(entry.id);
    });

    const top = document.createElement('div');
    top.className = 'entry-top';

    const titleWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'entry-title';

    const pinBtn = document.createElement('button');
    pinBtn.className = 'pin-btn';
    pinBtn.textContent = entry.pinned ? '★' : '☆';
    pinBtn.title = entry.pinned ? 'Unpin' : 'Pin to top';
    pinBtn.addEventListener('click', () => {
      pinBtn.classList.remove('bounce');
      void pinBtn.offsetWidth;
      pinBtn.classList.add('bounce');
      const current = loadEntries();
      const i = current.findIndex(e => e.id === entry.id);
      if (i > -1) {
        current[i].pinned = !current[i].pinned;
        saveEntries(current);
        showToast(current[i].pinned ? 'Discovery pinned to top' : 'Discovery unpinned');
        flashId = entry.id;
        render();
      }
    });

    const nameSpan = document.createElement('span');
    nameSpan.textContent = entry.name;
    title.appendChild(pinBtn);
    title.appendChild(nameSpan);
    titleWrap.appendChild(title);

    if (entry.lat !== '' && entry.lng !== '') {
      const coords = document.createElement('div');
      coords.className = 'coords';
      coords.textContent = formatCoord(entry.lat, entry.lng);
      titleWrap.appendChild(coords);
    }

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = entry.category;
    badge.style.color = color;

    top.appendChild(titleWrap);
    top.appendChild(badge);
    div.appendChild(top);

    if (entry.notes) {
      const notes = document.createElement('div');
      notes.className = 'entry-notes';
      notes.textContent = entry.notes;
      div.appendChild(notes);
    }

    const meta = document.createElement('div');
    meta.className = 'entry-meta';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'entry-date';
    dateSpan.textContent = formatDate(entry.date);

    const actions = document.createElement('div');
    actions.className = 'entry-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(entry));

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      const cardEl = delBtn.closest('.entry');
      deleteEntryById(entry.id, cardEl);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    meta.appendChild(dateSpan);
    meta.appendChild(actions);
    div.appendChild(meta);

    if (flashId === entry.id) {
      div.classList.add('flash');
    }

    list.appendChild(div);
  });

  if (flashId !== null) {
    const flashed = document.querySelector(`.entry[data-id="${flashId}"]`);
    if (flashed) flashed.scrollIntoView({ behavior: 'smooth', block: 'center' });
    flashId = null;
  }
}

/* ---------- add / edit form ---------- */
function startEdit(entry) {
  editingId = entry.id;
  document.getElementById('siteName').value = entry.name;
  document.getElementById('category').value = entry.category;
  document.getElementById('lat').value = entry.lat;
  document.getElementById('lng').value = entry.lng;
  document.getElementById('notes').value = entry.notes;
  syncChipsToSelect();
  updateLocationStatus();
  updateDiscoveryPreview();
  const titleEl = document.getElementById('formTitle');
  titleEl.textContent = 'Edit Discovery';
  titleEl.classList.remove('swap'); void titleEl.offsetWidth; titleEl.classList.add('swap');
  document.getElementById('saveBtn').textContent = 'Update Discovery';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  document.querySelector('.form-card').classList.add('editing-glow');
  document.getElementById('siteName').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
  editingId = null;
  document.getElementById('siteName').value = '';
  document.getElementById('lat').value = '';
  document.getElementById('lng').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('category').value = 'Interesting Place';
  syncChipsToSelect();
  updateLocationStatus();
  updateDiscoveryPreview();
  document.getElementById('nameError').style.display = 'none';
  document.getElementById('categoryError').style.display = 'none';
  const titleEl = document.getElementById('formTitle');
  titleEl.textContent = 'Add Discovery';
  titleEl.classList.remove('swap'); void titleEl.offsetWidth; titleEl.classList.add('swap');
  document.getElementById('saveBtn').textContent = 'Save Discovery';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.querySelector('.form-card').classList.remove('editing-glow');
}

function showSaveSuccess(btn) {
  const originalHTML = btn.innerHTML;
  const label = originalHTML;
  btn.innerHTML = `<span class="btn-label">${label}</span><span class="check-icon"><svg width="14" height="14" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Saved</span>`;
  btn.classList.add('success');
  setTimeout(() => {
    btn.classList.remove('success');
    setTimeout(() => { btn.innerHTML = label; }, 200);
  }, 900);
}

document.getElementById('saveBtn').addEventListener('click', () => {
  const nameField = document.getElementById('siteName');
  const name = nameField.value.trim();
  const categoryValue = document.getElementById('category').value;

  document.getElementById('nameError').style.display = 'none';
  document.getElementById('categoryError').style.display = 'none';

  if (name === '') {
    nameField.focus();
    nameField.classList.remove('shake');
    void nameField.offsetWidth;
    nameField.classList.add('shake');
    setTimeout(() => nameField.classList.remove('shake'), 400);
    document.getElementById('nameError').style.display = 'block';
    return;
  }

  if (!categoryValue) {
    document.getElementById('categoryError').style.display = 'block';
    document.getElementById('categoryChips').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const entries = loadEntries();
  const saveBtn = document.getElementById('saveBtn');

  if (editingId !== null) {
    const idx = entries.findIndex(e => e.id === editingId);
    if (idx > -1) {
      entries[idx] = {
        ...entries[idx],
        name: name,
        category: document.getElementById('category').value,
        lat: document.getElementById('lat').value.trim(),
        lng: document.getElementById('lng').value.trim(),
        notes: document.getElementById('notes').value.trim()
      };
      saveEntries(entries);
      showToast('Discovery updated');
      flashId = entries[idx].id;
      justAddedId = entries[idx].id;
    }
  } else {
    const newEntry = {
      id: Date.now(),
      name: name,
      category: document.getElementById('category').value,
      lat: document.getElementById('lat').value.trim(),
      lng: document.getElementById('lng').value.trim(),
      notes: document.getElementById('notes').value.trim(),
      date: new Date().toISOString(),
      pinned: false
    };
    entries.push(newEntry);
    saveEntries(entries);
    showToast('Discovery saved', 'success', "You'll be able to find it here whenever you want to remember it.");
    flashId = newEntry.id;
    justAddedId = newEntry.id;
  }

  showSaveSuccess(saveBtn);
  resetForm();
  render();
});

document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

const searchBoxEl = document.getElementById('searchBox');
const searchClearBtn = document.getElementById('searchClearBtn');
searchBoxEl.addEventListener('input', () => {
  searchClearBtn.style.display = searchBoxEl.value ? 'inline-block' : 'none';
  render();
});
searchClearBtn.addEventListener('click', () => {
  searchBoxEl.value = '';
  searchClearBtn.style.display = 'none';
  searchBoxEl.focus();
  render();
});

const filterCatEl = document.getElementById('filterCat');
const sortByEl = document.getElementById('sortBy');
function syncFilterActiveState() {
  filterCatEl.classList.toggle('active-filter', filterCatEl.value !== '');
  sortByEl.classList.toggle('active-filter', sortByEl.value !== 'date');
}
filterCatEl.addEventListener('change', () => { syncFilterActiveState(); render(); });
sortByEl.addEventListener('change', () => { syncFilterActiveState(); render(); });
syncFilterActiveState();

document.getElementById('favouriteFilterBtn').addEventListener('click', () => {
  filterCatEl.value = filterCatEl.value === 'Favourite' ? '' : 'Favourite';
  syncFilterActiveState();
  render();
});
document.getElementById('revisitFilterBtn').addEventListener('click', () => {
  filterCatEl.value = filterCatEl.value === 'Want to Revisit' ? '' : 'Want to Revisit';
  syncFilterActiveState();
  render();
});
document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  clearAllFilters();
  syncFilterActiveState();
});

/* ---------- CSV export / import ---------- */
function csvEscape(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const entries = loadEntries();
  const headers = ['name', 'category', 'lat', 'lng', 'notes', 'date', 'pinned'];
  const rows = [headers.join(',')];
  entries.forEach(e => {
    rows.push(headers.map(h => csvEscape(e[h])).join(','));
  });
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'field-log-journal.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported ' + entries.length + ' discoveries');
});

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
  }
  result.push(cur);
  return result;
}

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target.result;
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) { showToast('That file has no discoveries to import'); return; }
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const entries = loadEntries();
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => obj[h] = values[idx] !== undefined ? values[idx] : '');
      entries.push({
        id: Date.now() + i,
        name: obj.name || 'Untitled Discovery',
        category: obj.category || 'Other',
        lat: obj.lat || '',
        lng: obj.lng || '',
        notes: obj.notes || '',
        date: obj.date || new Date().toISOString(),
        pinned: obj.pinned === 'true'
      });
      count++;
    }
    saveEntries(entries);
    showToast('Imported ' + count + ' discoveries');
    render();
    e.target.value = '';
  };
  reader.readAsText(file);
});

/* ---------- "Discovery Trail" — animates the 01 NOTICE / 02 RECORD /
   03 REMEMBER steps on the intro page as one continuous journey: a thin
   path linking the three step markers, with a small point that travels
   along it, briefly pulsing each marker and highlighting its row as it
   arrives. Built from the real on-screen position of each marker so it
   stays accurate at any viewport width; runs once when the section first
   enters view, and respects prefers-reduced-motion. ---------- */
(function setupDiscoveryTrail() {
  const wrap = document.getElementById('discoveryTrailWrap');
  if (!wrap) return;
  const svg = document.getElementById('discoveryTrailSvg');
  const bgPath = document.getElementById('discoveryTrailBg');
  const fgPath = document.getElementById('discoveryTrailFg');
  const dot = document.getElementById('discoveryTrailDot');
  const chips = Array.from(wrap.querySelectorAll('.step-chip'));
  const nums = Array.from(wrap.querySelectorAll('.step-chip-num'));
  if (chips.length < 3 || nums.length < 3) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pathLength = 0;
  let points = [];

  function measure() {
    const wrapRect = wrap.getBoundingClientRect();
    points = nums.map(el => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - wrapRect.left + r.width / 2,
        y: r.top - wrapRect.top + r.height / 2
      };
    });
    svg.setAttribute('width', wrapRect.width);
    svg.setAttribute('height', wrapRect.height);
    svg.setAttribute('viewBox', '0 0 ' + wrapRect.width + ' ' + wrapRect.height);

    // Subtle organic curve on wider screens; a clean, nearly-straight
    // line on narrow ones so it reads as a simple vertical timeline.
    const amplitude = wrapRect.width <= 420 ? 0 : 6;
    const [p0, p1, p2] = points;
    const c1 = { x: (p0.x + p1.x) / 2 + amplitude, y: (p0.y + p1.y) / 2 };
    const c2 = { x: (p1.x + p2.x) / 2 + amplitude, y: (p1.y + p2.y) / 2 };
    const d = 'M ' + p0.x + ' ' + p0.y +
      ' Q ' + c1.x + ' ' + c1.y + ' ' + p1.x + ' ' + p1.y +
      ' Q ' + c2.x + ' ' + c2.y + ' ' + p2.x + ' ' + p2.y;

    bgPath.setAttribute('d', d);
    fgPath.setAttribute('d', d);
    pathLength = fgPath.getTotalLength();
    fgPath.style.strokeDasharray = pathLength;
    fgPath.style.strokeDashoffset = reduceMotion ? 0 : pathLength;
    dot.setAttribute('cx', p0.x);
    dot.setAttribute('cy', p0.y);
  }

  function pulse(el) {
    el.classList.remove('is-pulsing');
    // eslint-disable-next-line no-unused-expressions
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('is-pulsing');
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function drawTo(fraction) {
    fgPath.style.strokeDashoffset = pathLength * (1 - fraction);
    const pt = fgPath.getPointAtLength(pathLength * fraction);
    dot.setAttribute('cx', pt.x);
    dot.setAttribute('cy', pt.y);
  }

  // Piecewise timeline (seconds): rest at 01, travel to 02, rest at 02,
  // travel to 03, rest/settle at 03. Matches the ~5s cadence requested.
  const timeline = [
    { t: 0.0, frac: 0.0 },
    { t: 1.0, frac: 0.0 },
    { t: 2.0, frac: 0.5 },
    { t: 3.0, frac: 0.5 },
    { t: 4.0, frac: 1.0 },
    { t: 5.0, frac: 1.0 }
  ];

  function fractionAt(tSec) {
    for (let i = 0; i < timeline.length - 1; i++) {
      const a = timeline[i], b = timeline[i + 1];
      if (tSec >= a.t && tSec <= b.t) {
        if (a.frac === b.frac) return a.frac;
        const localT = (tSec - a.t) / (b.t - a.t);
        return a.frac + (b.frac - a.frac) * easeInOutCubic(localT);
      }
    }
    return timeline[timeline.length - 1].frac;
  }

  let rafId = null;
  let startTime = null;
  let markerHit = [false, false, false]; // 01 start, 02 reached, 03 reached

  function tick(now) {
    if (startTime === null) startTime = now;
    const tSec = (now - startTime) / 1000;
    const frac = fractionAt(Math.min(tSec, 5));
    drawTo(frac);

    if (!markerHit[0]) {
      markerHit[0] = true;
      chips[0].classList.add('is-active');
      pulse(nums[0]);
    }
    if (!markerHit[1] && tSec >= 2.0) {
      markerHit[1] = true;
      chips[1].classList.add('is-active');
      pulse(nums[1]);
    }
    if (!markerHit[2] && tSec >= 4.0) {
      markerHit[2] = true;
      chips[2].classList.add('is-active');
      pulse(nums[2]);
    }

    if (tSec < 5) {
      rafId = requestAnimationFrame(tick);
    } else {
      dot.classList.remove('is-live');
      fgPath.style.strokeDashoffset = 0;
    }
  }

  function runStatic() {
    measure();
    fgPath.style.strokeDashoffset = 0;
    dot.classList.remove('is-live');
    chips.forEach(c => c.classList.add('is-active'));
  }

  function runAnimated() {
    measure();
    dot.classList.add('is-live');
    rafId = requestAnimationFrame(tick);
  }

  // Draw the thin baseline path immediately (before the section is even
  // in view) so steps 01–03 always look connected, per the "initial
  // state" requirement; only the travelling point waits for the reveal.
  measure();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }
  window.addEventListener('load', measure);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (rafId === null) measure();
      else measure(); // keep path accurate; current frac is reapplied next tick
    }, 150);
  });

  const trailObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (reduceMotion) runStatic();
        else runAnimated();
        trailObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  trailObserver.observe(wrap);
})();

/* ---------- scroll-reveal for sections ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- fullscreen map ---------- */
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  const mapCard = document.getElementById('mapCard');
  if (!document.fullscreenElement) {
    mapCard.requestFullscreen().then(() => {
      mapCard.classList.add('map-fullscreen');
      setTimeout(() => map.invalidateSize(), 150);
    }).catch(() => showToast('Fullscreen not supported here'));
  } else {
    document.exitFullscreen();
  }
});
document.addEventListener('fullscreenchange', () => {
  const mapCard = document.getElementById('mapCard');
  if (!document.fullscreenElement) {
    mapCard.classList.remove('map-fullscreen');
  }
  setTimeout(() => map.invalidateSize(), 150);
});

/* ---------- intro page ---------- */
const INTRO_SEEN_KEY = 'field_log_intro_seen';
let appInitialized = false;

function enterApp() {
  const intro = document.getElementById('introPage');
  const appRoot = document.getElementById('appRoot');
  const categoryPage = document.getElementById('categoryPage');
  if (intro) {
    intro.classList.add('intro-exit');
  }
  if (categoryPage) {
    categoryPage.classList.add('app-hidden');
  }
  appRoot.classList.remove('app-hidden');
  // trigger reflow so the opacity transition actually runs
  void appRoot.offsetWidth;
  appRoot.classList.add('app-visible');

  if (!appInitialized) {
    appInitialized = true;
    seedSampleEntriesIfEmpty();
    migrateNationwideEntriesIfNeeded();
    buildCategoryChips();
    updateLocationStatus();
    updateDiscoveryPreview();
    initMap();
    render();
    setTimeout(() => { if (map) map.invalidateSize(); }, 350);
  }
  localStorage.setItem(INTRO_SEEN_KEY, '1');
  if (intro) {
    setTimeout(() => intro.remove(), 700);
  }
}

document.getElementById('enterAppBtn').addEventListener('click', enterApp);

/* ---------- category detail page ---------- */
function renderCategoryEntry(entry) {
  const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
  const div = document.createElement('div');
  div.className = 'entry';
  div.style.borderLeftColor = color;

  const top = document.createElement('div');
  top.className = 'entry-top';
  const titleWrap = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'entry-title';
  title.textContent = entry.name;
  titleWrap.appendChild(title);
  if (entry.lat !== '' && entry.lng !== '') {
    const coords = document.createElement('div');
    coords.className = 'coords';
    coords.textContent = formatCoord(entry.lat, entry.lng);
    titleWrap.appendChild(coords);
  }
  top.appendChild(titleWrap);
  div.appendChild(top);

  if (entry.notes) {
    const notes = document.createElement('div');
    notes.className = 'entry-notes';
    notes.textContent = entry.notes;
    div.appendChild(notes);
  }

  const meta = document.createElement('div');
  meta.className = 'entry-meta';
  const dateSpan = document.createElement('span');
  dateSpan.className = 'entry-date';
  dateSpan.textContent = formatDate(entry.date);
  meta.appendChild(dateSpan);
  div.appendChild(meta);

  return div;
}

function showCategoryPage(category) {
  // Make sure entries (including the migrated nationwide set) exist
  // even if the visitor hasn't entered the main app yet.
  seedSampleEntriesIfEmpty();
  migrateNationwideEntriesIfNeeded();

  const intro = document.getElementById('introPage');
  const appRoot = document.getElementById('appRoot');
  const categoryPage = document.getElementById('categoryPage');

  if (intro) intro.classList.add('intro-exit');
  appRoot.classList.add('app-hidden');
  categoryPage.classList.remove('app-hidden');
  categoryPage.scrollTop = 0;

  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
  const glyph = CATEGORY_GLYPHS[category] || CATEGORY_GLYPHS['Other'];
  const photo = CATEGORY_PHOTOS[category];
  categoryPage.style.backgroundImage = photo ? `url('${photo}')` : 'none';
  document.getElementById('catGlyph').textContent = glyph;
  document.getElementById('catGlyph').style.background = color;
  document.getElementById('catTitle').textContent = category;
  document.getElementById('catDesc').textContent = CATEGORY_DESCRIPTIONS[category] || '';

  const entries = loadEntries().filter(e => e.category === category);
  entries.sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById('catCount').textContent = entries.length;

  const list = document.getElementById('catEntryList');
  const emptyMsg = document.getElementById('catEmptyMsg');
  list.innerHTML = '';
  if (entries.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
    entries.forEach(entry => list.appendChild(renderCategoryEntry(entry)));
  }
}

document.querySelectorAll('.tile[data-category]').forEach(tile => {
  tile.addEventListener('click', () => showCategoryPage(tile.dataset.category));
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showCategoryPage(tile.dataset.category);
    }
  });
});

document.getElementById('catBackBtn').addEventListener('click', () => {
  document.getElementById('categoryPage').classList.add('app-hidden');
  const intro = document.getElementById('introPage');
  if (intro) intro.classList.remove('intro-exit');
});
document.getElementById('catEnterAppBtn').addEventListener('click', enterApp);

// A small on-demand link (added to the title block below) always
// re-opens the intro, regardless of the stored flag — handy for
// revisiting the landing page without clearing browser storage.
window.showFieldLogIntro = function () {
  localStorage.removeItem(INTRO_SEEN_KEY);
  location.reload();
};
const viewIntroLink = document.getElementById('viewIntroLink');
if (viewIntroLink) {
  viewIntroLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.showFieldLogIntro();
  });
}

// Always show the intro page first when the file is opened/run.
// (Previously this skipped straight to the app on repeat visits —
// now the intro is shown every time, per user preference.)