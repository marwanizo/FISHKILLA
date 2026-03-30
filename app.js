/* ============================================================
   FISH KILLA — NO LIMIT | app.js
   Download-only NFC album page — Zero backend, 100% static
   ============================================================ */

/* ---------- Album data (hardcoded) ---------- */
const ALBUM = {
  artist: 'FISH KILLA',
  title: 'NO LIMIT',
  year: 2026,
  cover: 'assets/cover.png',
  tracks: [
    {
      number: 1,
      title: 'JADA',
      duration: '3:24',
      url: 'assets/NOLIMIT/jada.mp3',
      filename: 'FISH KILLA - JADA.mp3'
    },
    {
      number: 2,
      title: 'BOMBÖE',
      duration: '2:58',
      url: 'assets/NOLIMIT/bomboe.mp3',
      filename: 'FISH KILLA - BOMBÖE.mp3'
    }
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
      <p class="hero-tagline">Merci d'avoir cop' la carte.<br>Ton album est prêt.</p>
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

  /* Bind individual download buttons */
  ALBUM.tracks.forEach(track => {
    const btn = document.getElementById(`btn-track-${track.number}`);
    if (btn) btn.addEventListener('click', () => downloadTrack(track));
  });
}

/* ---------- Render a single track card ---------- */
function renderTrackCard(track) {
  return `
    <div class="track-card">
      <div class="track-num">${track.number}</div>
      <div class="track-info">
        <div class="track-title">${track.title}</div>
        <div class="track-duration">${track.duration}</div>
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

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', render);
