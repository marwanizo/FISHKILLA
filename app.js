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

const ICON_SPINNER = `
  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
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
    if (btn) btn.addEventListener('click', () => downloadTrack(track, btn));
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
      <button class="btn-track" id="btn-track-${track.number}" aria-label="Télécharger ${track.title}">
        ${ICON_DOWNLOAD}
        <span>Télécharger</span>
      </button>
    </div>
  `;
}

/* ---------- Download a single track ---------- */
async function downloadTrack(track, btn) {
  /* Visual loading state */
  btn.classList.add('loading');
  btn.innerHTML = `${ICON_SPINNER}<span>...</span>`;

  try {
    const response = await fetch(track.url);
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    triggerDownload(blob, track.filename);
  } catch (err) {
    console.error('Download error:', err);
    alert('Erreur lors du téléchargement. Réessaie.');
  } finally {
    /* Restore button */
    btn.classList.remove('loading');
    btn.innerHTML = `${ICON_DOWNLOAD}<span>Télécharger</span>`;
  }
}

/* ---------- Download full album as ZIP ---------- */
async function downloadAlbum() {
  const btn      = document.getElementById('btnDownloadAll');
  const label    = document.getElementById('btnMainLabel');
  const progWrap = document.getElementById('progressWrap');
  const progBar  = document.getElementById('progressBar');
  const progLbl  = document.getElementById('progressLabel');

  /* Guard: already in progress */
  if (btn.classList.contains('loading')) return;

  btn.classList.add('loading');
  label.textContent = 'Préparation...';
  progWrap.classList.add('visible');

  const setProgress = (pct, text) => {
    progBar.style.width = pct + '%';
    progLbl.textContent = text;
  };

  try {
    const zip = new JSZip();
    const folder = zip.folder(`FISH KILLA - NO LIMIT`);
    const total = ALBUM.tracks.length + 1; /* tracks + cover */
    let done = 0;

    setProgress(5, 'Chargement de la pochette...');

    /* Add cover */
    const coverResp = await fetch(ALBUM.cover);
    if (!coverResp.ok) throw new Error('Cover fetch failed');
    const coverBlob = await coverResp.blob();
    const coverExt  = ALBUM.cover.split('.').pop();
    folder.file(`cover.${coverExt}`, coverBlob);
    done++;
    setProgress(Math.round((done / total) * 85) + 5, `Pochette ajoutée...`);

    /* Add each track */
    for (const track of ALBUM.tracks) {
      setProgress(
        Math.round((done / total) * 85) + 5,
        `Chargement de ${track.title}... ${Math.round(((done) / total) * 100)}%`
      );
      const resp = await fetch(track.url);
      if (!resp.ok) throw new Error(`Failed to fetch ${track.title}`);
      const blob = await resp.blob();
      folder.file(track.filename, blob);
      done++;
      setProgress(
        Math.round((done / total) * 85) + 5,
        `${track.title} ajouté... ${Math.round((done / total) * 100)}%`
      );
    }

    setProgress(95, 'Compression du ZIP...');

    /* Generate ZIP blob */
    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (meta) => {
        const pct = Math.round(95 + (meta.percent / 100) * 4);
        setProgress(pct, `Compression... ${Math.round(meta.percent)}%`);
      }
    );

    setProgress(100, 'Téléchargement...');
    triggerDownload(zipBlob, 'FISH KILLA - NO LIMIT.zip');

  } catch (err) {
    console.error('ZIP error:', err);
    alert('Erreur lors de la création du ZIP. Réessaie.');
  } finally {
    setTimeout(() => {
      btn.classList.remove('loading');
      label.textContent = 'TÉLÉCHARGER L\'ALBUM COMPLET';
      progWrap.classList.remove('visible');
      progBar.style.width = '0%';
    }, 1500);
  }
}

/* ---------- Trigger a file download from a Blob ---------- */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  /* Revoke after short delay to allow download to start */
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  render();
  document.getElementById('btnDownloadAll').addEventListener('click', downloadAlbum);
});
