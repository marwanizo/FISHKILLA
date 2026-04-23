/* ============================================================
   FISH KILLA — NO LIMIT | app.js
   Download-only NFC album page — Zero backend, 100% static
   ============================================================ */

/* ---------- ZIP download URL (GitHub Release) ---------- */
/* ⚠️  Remplace cette URL par celle de ta GitHub Release avant de déployer */
const ZIP_URL = 'https://github.com/marwanizo/FISHKILLA/releases/download/fish-killa-v1/FISH.KILLA.-.NO.LIMIT.zip';

/* ---------- Album data (hardcoded) ---------- */
const ALBUM = {
  artist: 'FISH KILLA',
  title: 'NO LIMIT',
  year: 2026,
  cover: 'assets/cover.webp',
  tracks: [
    { number: 1,  title: 'No Limit' },
    { number: 2,  title: 'Ghetto Youth feat. Stonebwoy' },
    { number: 3,  title: "J'y Arriverais" },
    { number: 4,  title: 'Abaralanbè' },
    { number: 5,  title: 'Wari' },
    { number: 6,  title: 'Besoin de ton amour feat. Clayton Hamilton' },
    { number: 7,  title: 'BB feat. Hiro' },
    { number: 8,  title: 'Djarabi' },
    { number: 9,  title: 'Love Sogni feat. Takana Zion' },
    { number: 10, title: 'Ma Guinée' },
    { number: 11, title: 'Bomboé Préférée feat. Sidiki Diabaté' },
    { number: 12, title: 'Agbogbo' },
    { number: 13, title: 'Jada feat. Black M' },
    { number: 14, title: 'Khahylli' },
    { number: 15, title: "N'nah" },
    { number: 16, title: "Wine Up feat. L'Saï & Dj Sultan Nash" },
    { number: 17, title: 'Cima Natoma' },
    { number: 18, title: 'Rendez-Vous' }
  ]
};

/* ---------- SVG icons ---------- */
const ICON_DOWNLOAD = `
  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`;

/* ---------- Render page ---------- */
function render() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <!-- Hero -->
    <section class="hero">
      <div class="cover-wrap">
        <img
          class="cover-img"
          src="${ALBUM.cover}"
          alt="${ALBUM.artist} — ${ALBUM.title} cover"
          loading="eager"
          decoding="async"
        />
        <div class="cover-shine"></div>
      </div>
      <div class="hero-meta">
        <h1 class="artist-name">${ALBUM.artist}</h1>
        <p class="album-title">${ALBUM.title}</p>
        <p class="album-year">${ALBUM.year}</p>
      </div>
      <p class="hero-tagline">Merci.<br>Ton album est prêt.</p>
    </section>

    <!-- Track list -->
    <section class="tracklist-section">
      <p class="section-label">Morceaux</p>
      <div class="tracklist" id="tracklist">
        ${ALBUM.tracks.map(track => renderTrackCard(track)).join('')}
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p class="footer-copy">© ${ALBUM.year} ${ALBUM.artist}. Cet album est réservé au propriétaire de la carte NFC.</p>
      <p class="footer-powered">Powered by NFC FOR YOU</p>
    </footer>
  `;

}

/* ---------- Render a single track card ---------- */
function renderTrackCard(track) {
  return `
    <div class="track-card">
      <div class="track-num">${track.number}</div>
      <div class="track-info">
        <div class="track-title">${track.title}</div>
      </div>
    </div>
  `;
}

/* ---------- Download a single track (native — instantané) ---------- */
function downloadTrack(track) {
  const a = document.createElement('a');
  a.href     = track.url;
  a.download = track.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ---------- Modal helpers ---------- */
function openModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('open');
  setTimeout(() => document.getElementById('contactInput').focus(), 350);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modalError').textContent = '';
}

function validateContact(value) {
  const v = value.trim();
  if (!v) return 'Saisis ton email ou ton numéro de téléphone.';
  /* basic email check */
  if (v.includes('@') && v.includes('.')) return null;
  /* basic phone check: digits, spaces, +, -, min 6 chars */
  if (/^[\d\s+\-().]{6,}$/.test(v)) return null;
  return 'Format invalide. Ex : jean@mail.com ou +33 6 12 34 56 78';
}

async function handleDownload(e) {
  e.preventDefault();

  const contact   = document.getElementById('contactInput').value.trim();
  const errEl     = document.getElementById('modalError');
  const submitBtn = document.getElementById('modalSubmit');
  const label     = document.getElementById('submitLabel');

  /* Validate */
  const err = validateContact(contact);
  if (err) { errEl.textContent = err; return; }
  errEl.textContent = '';

  /* Prevent double-submit */
  submitBtn.disabled = true;

  /* Fire-and-forget — no await so the user gesture stays active */
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact })
  }).catch(fetchErr => console.warn('[notify]', fetchErr));

  /* Trigger download IMMEDIATELY inside the user gesture.
     window.location.href is never blocked by popup blockers (unlike
     window.open after an await) and works on iOS Safari + Android. */
  window.location.href = ZIP_URL;

  /* Show success feedback, then reset & close after 2s */
  label.textContent = 'Téléchargement lancé ✓';
  setTimeout(() => {
    closeModal();
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    label.textContent = 'Confirmer & Télécharger';
    document.getElementById('contactInput').value = '';
  }, 2000);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  render();

  /* CTA opens modal */
  document.getElementById('btnDownloadAll').addEventListener('click', openModal);

  /* Close buttons */
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  /* ESC key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* Form submit */
  document.getElementById('downloadForm').addEventListener('submit', handleDownload);
});
