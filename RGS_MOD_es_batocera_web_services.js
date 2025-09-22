// ==UserScript==
// @name         Batocera ES Web – Visual, UX, Games Filter & Systems Dock
// @namespace    https://github.com/RetroGameSets
// @version      0.4.5
// @description  Correction de bug sur interface web batocera, et améliorations
// @author       RetroGameSets
// @match        http://batocera.local:1234/*
// @match        http://batocera:1234/*
// @match        http://*:1234/*
// @icon         https://www.batocera.org/images/batocera-logo2.png
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ------------------ CSS ------------------
  const css = `
  :root{
    --bwe-gap: 16px;
    --bwe-card-bg: #2b3036;
    --bwe-card-border: rgba(255,255,255,.08);
    --bwe-card-shadow: 0 4px 12px rgba(0,0,0,.25);
    --bwe-card-shadow-hover: 0 10px 20px rgba(0,0,0,.35);
    --bwe-radius: 10px;

    --bwe-sys-h: 64px;
    --bwe-sys-pad: 8px;
    --bwe-sys-gap: 10px;
    --bwe-sys-bg: #21262d;
    --bwe-sys-border: rgba(255,255,255,.08);
    --bwe-sys-accent: #58a6ff;
    --bwe-sys-pin: #ffc107;

    --bwe-toolbar-top: 64px;
  }

  html, body { height: 100%; overflow-x: hidden; }
  body {
    background: radial-gradient(1200px 600px at 50% 60%, #2c3350 0%, #1f2a3d 50%, #1b202c 100%) fixed;
    color: #e8ecef;
  }

  body.bwe-padded { padding-top: var(--bwe-total-top-pad, 118px); padding-bottom: var(--bwe-bottom-pad, 92px); }

  body > div.row { display: block !important; margin: 0 !important; width: 100% !important; }
  #gameList { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box; }

  #jumbo { max-width: 60vw; color: #d1d7de; font-size: .9rem; white-space: nowrap; overflow: hidden !important; text-overflow: ellipsis; }
  #jumbo * { overflow: hidden !important; }

  #gameList > .row {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: var(--bwe-gap);
    width: 100%;
    margin: 0 auto !important;
    padding: var(--bwe-gap);
    box-sizing: border-box;
    align-items: stretch;
  }

  .card.card-game {
    background: var(--bwe-card-bg) !important;
    border: 1px solid var(--bwe-card-border) !important;
    border-radius: var(--bwe-radius) !important;
    box-shadow: var(--bwe-card-shadow);
    display: flex; flex-direction: column;
    overflow: hidden !important;
    transition: transform .15s ease, box-shadow .15s ease;
    min-width: 0;
  }
  .card.card-game:hover { transform: translateY(-2px); box-shadow: var(--bwe-card-shadow-hover); }
  .card-img-top.card-img-150 { height: 180px !important; object-fit: cover; width: 100%; }
  .card-title-50 { height: 50px !important; object-fit: contain; object-position: center; background: rgba(255,255,255,.03); border-bottom: 1px solid rgba(255,255,255,.06); padding: 6px; }
  .card-game .card-title.text-center { font-weight: 600; font-size: .95rem; padding: 8px 10px 0 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-game .card-text { padding: 6px 10px 0 10px; color: #cfd6dd; overflow: hidden !important; }
  .card-game .card-text p { margin: 0 0 4px 0; font-size: .85rem; }
  .card-game .fa { color: #ffc107; }
  .card-game .card-footer { border-top: 1px solid rgba(255,255,255,.06); background: transparent; display: flex; gap: 6px; justify-content: center; align-items: center; margin-top: auto; padding: 10px; }
  .card-game .btn { padding: .25rem .6rem; }
  .card-game.bwe-fav { outline: 2px solid #ffc10755; }

  .modal-content { background-color: #0f172a; color: #e5e7eb; border: 1px solid rgba(255,255,255,.08); }
  .modal-header, .modal-footer { border-color: rgba(255,255,255,.1); }
  .modal-title { color: #cbd5e1; }
  .modal-body { color: #e5e7eb; max-height: calc(90vh - 140px); overflow-y: auto; }
  #detailModalImg { border-radius: 6px; object-fit: cover; width: 100%; max-height: 320px; }
  #detailModalBody { color: #cbd5e1; }
  .close { color: #e5e7eb; text-shadow: none; opacity: .85; }
  .close:hover { opacity: 1; }
  .modal-backdrop.show { opacity: .65; }

  .bwe-toolbar {
    position: fixed;
    top: var(--bwe-toolbar-top, 64px);
    left: 0; right: 0;
    z-index: 1030;
    background: rgba(33,37,41,.98);
    border-bottom: 1px solid rgba(255,255,255,.08);
    padding: .35rem .75rem;
    color: #e8ecef;
    backdrop-filter: blur(4px);
    box-shadow: 0 8px 20px rgba(0,0,0,.35);
  }
  .bwe-tools {
    display: flex;
    align-items: center;
    gap: .5rem .75rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .bwe-tools .form-control,
  .bwe-tools .custom-select { width: auto !important; display: inline-block; }
  .bwe-tools .form-control-sm,
  .bwe-tools .custom-select-sm { height: calc(1.5em + .5rem + 2px); padding: .25rem .5rem; }
  .bwe-label { color:#9aa6b2; font-size:.85rem; margin-right:.25rem; white-space: nowrap; }
  #bwe-search { flex: 1 1 420px; min-width: 260px; max-width: 44vw; }
  #bwe-sort { flex: 0 0 220px; }
  #bwe-page-size { flex: 0 0 110px; }
  .bwe-ck-group { flex: 0 1 auto; white-space: nowrap; display: flex; align-items: center; gap: .6rem; }
  .bwe-ck-group input { margin-right: .25rem; }
  .bwe-spacer { flex: 1 1 auto; min-width: 12px; }
  .bwe-summary { color:#adb5bd; font-size:.9rem; white-space: nowrap; }
  .bwe-btn-min { padding: .2rem .5rem; line-height:1.2; }
  .bwe-pager { display:flex; align-items:center; justify-content:center; gap:.35rem; margin: .3rem 0 0; }
  .bwe-pager .btn { padding: .15rem .45rem; }

  #systemList { width: 100%; }
  nav.navbar.fixed-bottom { overflow: clip; }
  #bwe-sysbar { position: relative; width: 100%; padding: 6px 44px; box-sizing: border-box; }
  .bwe-sys-toolbar{ display:flex; align-items:center; gap:8px; margin: 2px 0 6px 0; flex-wrap:wrap; }
  .bwe-sys-toolbar input[type="search"]{ min-width: 160px; border-radius: 6px; border: 1px solid var(--bwe-sys-border); background: #1b1f24; color: #e2e8f0; padding: 2px 6px; font-size: .85rem; }
  .bwe-sys-toolbar select, .bwe-sys-toolbar button { border-radius: 6px; border: 1px solid var(--bwe-sys-border); background: #1b1f24; color: #e2e8f0; padding: 2px 8px; font-size: .85rem; }
  .bwe-sys-toolbar .spacer { flex:1 1 auto; }
  .bwe-sys-clip{ position: relative; overflow: hidden; padding-bottom: 2px; }
  .bwe-sys-strip{ display:flex; align-items:center; gap: var(--bwe-sys-gap); overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; padding:4px 0; margin-bottom:-16px; padding-bottom:16px; }
  .bwe-sys-item{ position:relative; height:var(--bwe-sys-h); min-width:calc(var(--bwe-sys-h) * 1.7); max-width:240px; display:inline-flex; align-items:center; justify-content:center; background:var(--bwe-sys-bg); border:1px solid var(--bwe-sys-border); border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,.25); padding:var(--bwe-sys-pad); user-select:none; cursor:pointer; transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease; overflow:hidden; }
  .bwe-sys-item:hover{ transform: translateY(-1px); box-shadow: 0 8px 18px rgba(0,0,0,.35); }
  .bwe-sys-item.active{ outline: 2px solid var(--bwe-sys-accent); }
  .bwe-sys-item.running{ box-shadow: 0 0 0 2px var(--bwe-sys-accent) inset, 0 10px 20px rgba(0,0,0,.4); }
  .bwe-sys-item img{ height: calc(var(--bwe-sys-h) - 2*var(--bwe-sys-pad)); width:100%; object-fit:contain; object-position:center; filter: drop-shadow(0 2px 2px rgba(0,0,0,.25)); pointer-events:none; }
  .bwe-sys-item .fallback{ font-weight:600; font-size:.9rem; color:#e2e8f0; text-align:center; padding:0 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bwe-pin{ position:absolute; top:4px; right:6px; color:var(--bwe-sys-pin); font-size:16px; text-shadow:0 2px 4px rgba(0,0,0,.4); opacity:.9; }
  .bwe-count{ position:absolute; bottom:2px; right:6px; font-size:.75rem; color:#cbd5e1; background:rgba(0,0,0,.35); padding:2px 6px; border-radius:12px; border:1px solid rgba(255,255,255,.12); }
  .bwe-recent{ position:absolute; bottom:2px; left:6px; font-size:.7rem; color:#9ae6b4; background:rgba(0,0,0,.35); padding:2px 6px; border-radius:12px; border:1px solid rgba(255,255,255,.12); }

  .bwe-sys-arrow{ position:absolute; top:calc(50% + 10px); transform:translateY(-50%); width:36px; height:36px; border-radius:50%; border:1px solid var(--bwe-sys-border); background:rgba(20,22,27,.75); color:#e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; transition: background .12s ease, transform .12s ease; }
  .bwe-sys-arrow:hover{ background:rgba(20,22,27,.95); transform:translateY(-50%) scale(1.05); }
  .bwe-sys-arrow.left{ left:8px; } .bwe-sys-arrow.right{ right:8px; }

  .bwe-hide-scrollbars, .bwe-hide-scrollbars * { scrollbar-width: none !important; }
  .bwe-hide-scrollbars::-webkit-scrollbar, .bwe-hide-scrollbars *::-webkit-scrollbar { width:0 !important; height:0 !important; background:transparent !important; }
  .bwe-thin-scrollbars, .bwe-thin-scrollbars * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.25) transparent; }
  .bwe-thin-scrollbars::-webkit-scrollbar, .bwe-thin-scrollbars *::-webkit-scrollbar { width:6px; height:6px; }
  .bwe-thin-scrollbars *::-webkit-scrollbar-thumb { background: rgba(255,255,255,.25); border-radius:6px; }
  .bwe-thin-scrollbars *::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.35); }
  .bwe-thin-scrollbars *::-webkit-scrollbar-track { background: transparent; }
  `;
  if (typeof GM_addStyle === 'function') GM_addStyle(css);
  else { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }

  // ------------------ Helpers ------------------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s) => (s || '').toString().toLowerCase();
  const isFavGame = (g) => String(g?.favorite) === 'true';
  const hasCheevos = (g) => g && g.cheevosHash && parseInt(g.cheevosHash, 10) !== 0;
  const playCount = (g) => (g && g.playcount ? parseInt(g.playcount, 10) || 0 : 0);
  const getYear = (g) => { const m = String(g?.releasedate || '').match(/^\d{4}/); return m ? parseInt(m[0], 10) : null; };
  const forceVisibleGames = (arr) => (Array.isArray(arr) ? arr.map(g => ({ ...g, hidden: 'false' })) : []);
  const debounce = (fn, wait = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; };

  const recalcTopPads = () => {
    const top = qs('.navbar.fixed-top');
    const tb = qs('.bwe-toolbar');
    const bottom = qs('.navbar.fixed-bottom');
    const topH = top ? top.getBoundingClientRect().height : 56;
    const tbH = tb ? tb.getBoundingClientRect().height : 0;
    const bottomH = bottom ? bottom.getBoundingClientRect().height : 56;
    document.documentElement.style.setProperty('--bwe-toolbar-top', `${Math.ceil(topH)}px`);
    document.body.classList.add('bwe-padded');
    document.body.style.setProperty('--bwe-total-top-pad', `${Math.ceil(topH + tbH + 8)}px`);
    document.body.style.setProperty('--bwe-bottom-pad', `${Math.ceil(bottomH + 12)}px`);
  };
  window.addEventListener('resize', () => requestAnimationFrame(recalcTopPads));

  // ------------------ State: Systems ------------------
  const LS_SYS_KEY = 'bwe-sys-settings-v1';
  const sysState = {
    systems: [],
    filter: '',
    sort: 'pinned-recent-alpha',
    zoom: 1,
    pinned: new Set(),
    recent: [],
    selected: '',
    running: '',
    counts: new Map(),
    scrollbars: 'hide',
  };
  const saveSys = () => {
    const data = {
      filter: sysState.filter, sort: sysState.sort, zoom: sysState.zoom,
      pinned: [...sysState.pinned], recent: sysState.recent.slice(0,12),
      scrollbars: sysState.scrollbars
    };
    localStorage.setItem(LS_SYS_KEY, JSON.stringify(data));
  };
  const loadSys = () => {
    try {
      const raw = localStorage.getItem(LS_SYS_KEY); if (!raw) return;
      const d = JSON.parse(raw);
      sysState.filter = d.filter || '';
      sysState.sort = d.sort || 'pinned-recent-alpha';
      sysState.zoom = Math.min(1.8, Math.max(0.6, d.zoom || 1));
      sysState.pinned = new Set(d.pinned || []);
      sysState.recent = Array.isArray(d.recent) ? d.recent : [];
      sysState.scrollbars = d.scrollbars || 'hide';
    } catch {}
  };
  loadSys();
  const applyScrollbarMode = () => {
    document.documentElement.classList.remove('bwe-hide-scrollbars','bwe-thin-scrollbars');
    if (sysState.scrollbars === 'hide') document.documentElement.classList.add('bwe-hide-scrollbars');
    else if (sysState.scrollbars === 'thin') document.documentElement.classList.add('bwe-thin-scrollbars');
  };

  // ------------------ State: Games ------------------
  const LS_GAMES_KEY = 'bwe-games-settings-v4';
  const gamesState = {
    query: '',
    sort: 'name-asc',
    favOnly: false,
    unplayedOnly: false,
    cheevosOnly: false,
    pageSize: 100,
    page: 1,
    gamesAll: [],
    uiReady: false,
  };
  const saveGames = () => {
    const d = { query:gamesState.query, sort:gamesState.sort, favOnly:gamesState.favOnly,
      unplayedOnly:gamesState.unplayedOnly, cheevosOnly:gamesState.cheevosOnly,
      pageSize:gamesState.pageSize, page:gamesState.page };
    localStorage.setItem(LS_GAMES_KEY, JSON.stringify(d));
  };
  const loadGames = () => {
    try {
      const raw = localStorage.getItem(LS_GAMES_KEY); if (!raw) return;
      const d = JSON.parse(raw);
      gamesState.query = d.query || '';
      gamesState.sort = d.sort || 'name-asc';
      gamesState.favOnly = !!d.favOnly;
      gamesState.unplayedOnly = !!d.unplayedOnly;
      gamesState.cheevosOnly = !!d.cheevosOnly;
      gamesState.pageSize = parseInt(d.pageSize || 100, 10);
      gamesState.page = parseInt(d.page || 1, 10);
    } catch {}
  };
  loadGames();

  // ------------------ Toolbar (Games) ------------------
  const addToolbar = () => {
    if (gamesState.uiReady) return;
    const bar = document.createElement('div');
    bar.className = 'bwe-toolbar';
    bar.innerHTML = `
      <div class="bwe-tools">
        <span class="bwe-label">Recherche</span>
        <input id="bwe-search" class="form-control form-control-sm bwe-input" type="search" placeholder="Nom/genre…" aria-label="Recherche jeux">

        <span class="bwe-label">Tri</span>
        <select id="bwe-sort" class="custom-select custom-select-sm" title="Tri">
          <option value="name-asc">Nom A→Z</option>
          <option value="name-desc">Nom Z→A</option>
          <option value="year-desc">Année ↓</option>
          <option value="year-asc">Année ↑</option>
          <option value="playcount-desc">Sessions ↓</option>
          <option value="playcount-asc">Sessions ↑</option>
          <option value="favorite-first">Favoris d’abord</option>
        </select>

        <span class="bwe-label">Jeux/page</span>
        <select id="bwe-page-size" class="custom-select custom-select-sm" title="Nombre de jeux par page">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="9999">Tous</option>
        </select>

        <div class="bwe-ck-group">
          <label><input type="checkbox" id="bwe-fav"> Favoris</label>
          <label><input type="checkbox" id="bwe-unplayed"> Jamais joués</label>
          <label><input type="checkbox" id="bwe-cheevos"> Succès</label>
        </div>

        <span class="bwe-spacer"></span>
        <button id="bwe-reset" class="btn btn-sm btn-outline-secondary bwe-btn-min" title="Réinitialiser filtres/tri/page">Réinit.</button>
        <span class="bwe-summary" id="bwe-summary"></span>
        <button id="bwe-random" class="btn btn-sm btn-outline-info bwe-btn-min" title="Lancer un jeu aléatoire (filtré)">Aléatoire</button>
        <button id="bwe-export" class="btn btn-sm btn-outline-secondary bwe-btn-min" title="Exporter (JSON)">Exporter</button>
      </div>
      <div class="bwe-pager" id="bwe-pager"></div>
    `;
    const row = document.querySelector('body > div.row');
    if (row && row.parentElement) row.parentElement.insertBefore(bar, row);
    else document.body.insertBefore(bar, document.body.firstChild);

    const search = qs('#bwe-search', bar);
    const sort = qs('#bwe-sort', bar);
    const fav = qs('#bwe-fav', bar);
    const unplayed = qs('#bwe-unplayed', bar);
    const cheevos = qs('#bwe-cheevos', bar);
    const pageSize = qs('#bwe-page-size', bar);
    const randomBtn = qs('#bwe-random', bar);
    const exportBtn = qs('#bwe-export', bar);
    const resetBtn = qs('#bwe-reset', bar);

    search.value = gamesState.query;
    sort.value = gamesState.sort;
    fav.checked = gamesState.favOnly;
    unplayed.checked = gamesState.unplayedOnly;
    cheevos.checked = gamesState.cheevosOnly;
    pageSize.value = String(gamesState.pageSize);

    search.addEventListener('input', (e) => { gamesState.query = e.target.value; gamesState.page = 1; saveGames(); renderFiltered(); });
    sort.addEventListener('change', (e) => { gamesState.sort = e.target.value; gamesState.page = 1; saveGames(); renderFiltered(); });
    fav.addEventListener('change', (e) => { gamesState.favOnly = e.target.checked; gamesState.page = 1; saveGames(); renderFiltered(); });
    unplayed.addEventListener('change', (e) => { gamesState.unplayedOnly = e.target.checked; gamesState.page = 1; saveGames(); renderFiltered(); });
    cheevos.addEventListener('change', (e) => { gamesState.cheevosOnly = e.target.checked; gamesState.page = 1; saveGames(); renderFiltered(); });
    pageSize.addEventListener('change', (e) => { gamesState.pageSize = parseInt(e.target.value,10); gamesState.page = 1; saveGames(); renderFiltered(); });

    resetBtn.addEventListener('click', () => {
      gamesState.query = '';
      gamesState.sort = 'name-asc';
      gamesState.favOnly = false;
      gamesState.unplayedOnly = false;
      gamesState.cheevosOnly = false;
      gamesState.pageSize = 100;
      gamesState.page = 1;
      search.value = '';
      sort.value = 'name-asc';
      fav.checked = unplayed.checked = cheevos.checked = false;
      pageSize.value = '100';
      saveGames();
      renderFiltered();
    });

    randomBtn.addEventListener('click', () => {
      const arr = getFilteredSorted();
      if (!arr.length) return;
      const g = arr[Math.floor(Math.random() * arr.length)];
      unsafeWindow.launchGame?.(String(g.path || '').replace(/'/g,''));
    });
    exportBtn.addEventListener('click', () => {
      const arr = getFilteredSorted();
      const minimal = arr.map(g => ({ name:g.name, path:g.path, genre:g.genre||null, year:getYear(g), playcount:playCount(g), favorite:isFavGame(g), cheevos:hasCheevos(g) }));
      const text = JSON.stringify(minimal, null, 2);
      try { GM_setClipboard?.(text, { type:'text', mimetype:'text/plain' }); alert(`Liste exportée (${minimal.length} éléments) dans le presse-papiers.`); }
      catch { navigator.clipboard?.writeText(text); alert(`Liste exportée (${minimal.length} éléments).`); }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); unsafeWindow.reloadGamelists?.(); }
      if (e.key === 'ArrowRight') pagerGo(gamesState.page + 1);
      if (e.key === 'ArrowLeft') pagerGo(gamesState.page - 1);
    });

    gamesState.uiReady = true;
    requestAnimationFrame(recalcTopPads);
  };

  const updateSummary = (pageCount, total) => {
    const s = qs('#bwe-summary'); if (!s) return;
    const start = total ? ((gamesState.page - 1) * gamesState.pageSize + 1) : 0;
    const end = Math.min(gamesState.page * gamesState.pageSize, total);
    s.textContent = `${total} jeux · ${total ? `${start}-${end}` : '0-0'}`;
  };

  const renderPager = (filteredCount) => {
    const pager = qs('#bwe-pager'); if (!pager) return;
    const pages = gamesState.pageSize >= 9999 ? 1 : Math.max(1, Math.ceil(filteredCount / gamesState.pageSize));
    gamesState.page = Math.min(Math.max(1, gamesState.page), pages);
    const btn = (label, page, disabled = false) =>
      `<button class="btn btn-sm btn-outline-info${disabled ? ' disabled' : ''}" data-page="${page}" title="${label}">${label}</button>`;
    pager.innerHTML = `${btn('«',1,gamesState.page===1)}${btn('‹',gamesState.page-1,gamesState.page===1)}<span class="text-light">Page ${gamesState.page}/${pages}</span>${btn('›',gamesState.page+1,gamesState.page===pages)}${btn('»',pages,gamesState.page===pages)}`;
    qsa('button[data-page]', pager).forEach(b => b.addEventListener('click', () => pagerGo(parseInt(b.getAttribute('data-page'),10))));
  };
  const pagerGo = (p) => {
    const filtered = getFilteredSorted();
    const pages = gamesState.pageSize >= 9999 ? 1 : Math.max(1, Math.ceil(filtered.length / gamesState.pageSize));
    const clamped = Math.min(Math.max(1, p), pages);
    if (clamped !== gamesState.page) { gamesState.page = clamped; saveGames(); renderFiltered(); }
  };

  const getFilteredSorted = () => {
    let arr = gamesState.gamesAll.slice();
    arr = arr.filter(g => String(g.hidden) !== 'true');
    const q = norm(gamesState.query);
    if (q) arr = arr.filter(g => norm(g.name).includes(q) || norm(g.genre).includes(q));
    if (gamesState.favOnly) arr = arr.filter(isFavGame);
    if (gamesState.unplayedOnly) arr = arr.filter(g => playCount(g) === 0);
    if (gamesState.cheevosOnly) arr = arr.filter(hasCheevos);
    const cmp = {
      'name-asc': (a,b)=> norm(a.name).localeCompare(norm(b.name)),
      'name-desc': (a,b)=> norm(b.name).localeCompare(norm(a.name)),
      'year-desc': (a,b)=> (getYear(b)||-1)-(getYear(a)||-1) || norm(a.name).localeCompare(norm(b.name)),
      'year-asc': (a,b)=> (getYear(a)||99999)-(getYear(b)||99999) || norm(a.name).localeCompare(norm(b.name)),
      'playcount-desc': (a,b)=> playCount(b)-playCount(a) || norm(a.name).localeCompare(norm(b.name)),
      'playcount-asc': (a,b)=> playCount(a)-playCount(b) || norm(a.name).localeCompare(norm(b.name)),
      'favorite-first': (a,b)=> (isFavGame(b)-isFavGame(a)) || norm(a.name).localeCompare(norm(b.name)),
    }[gamesState.sort] || ((a,b)=> norm(a.name).localeCompare(norm(b.name)));
    arr.sort(cmp);
    return arr;
  };

  // ------------------ Hooks + rendu ------------------
  let origShowGames = null;
  let origDetailFill = null;

  const renderFiltered = () => {
    if (!origShowGames) return;
    const filtered = getFilteredSorted();
    const total = filtered.length;

    const pages = gamesState.pageSize >= 9999 ? 1 : Math.max(1, Math.ceil(Math.max(1, total) / gamesState.pageSize));
    if (gamesState.page < 1) gamesState.page = 1;
    if (gamesState.page > pages) gamesState.page = pages;

    let pageItems = filtered;
    if (gamesState.pageSize < 9999) {
      const start = (gamesState.page - 1) * gamesState.pageSize;
      pageItems = filtered.slice(start, start + gamesState.pageSize);
    }
    const safe = forceVisibleGames(pageItems);
    origShowGames(safe);

    if (total === 0) {
      const gl = document.getElementById('gameList');
      if (gl) gl.innerHTML = '<div class="text-center text-muted" style="padding:24px">Aucun jeu ne correspond aux filtres/recherche.</div>';
    }

    try {
      const cards = qsa('.card.card-game');
      safe.forEach((g,i) => { const c = cards[i]; if (c && isFavGame(g)) c.classList.add('bwe-fav'); });
    } catch {}

    updateSummary(pageItems.length, total);
    renderPager(total);
    requestAnimationFrame(recalcTopPads);
  };

  // ------------------ Dock systèmes ------------------
  const sysContainer = document.getElementById('systemList');
  const clearChildren = (el) => { while (el && el.firstChild) el.removeChild(el.firstChild); };

  const buildDockSkeleton = () => {
    if (!sysContainer) return;
    clearChildren(sysContainer);
    const wrap = document.createElement('div');
    wrap.id = 'bwe-sysbar';
    wrap.innerHTML = `
      <div class="bwe-sys-toolbar">
        <input id="bwe-sys-filter" type="search" placeholder="Filtrer les systèmes…" />
        <select id="bwe-sys-sort" title="Tri systèmes">
          <option value="pinned-recent-alpha">Favoris + Récents + A→Z</option>
          <option value="pinned-first">Favoris d’abord</option>
          <option value="recent-first">Récents d’abord</option>
          <option value="alpha">Alphabétique</option>
          <option value="original">Ordre original</option>
        </select>
        <div class="spacer"></div>
        <label for="bwe-sb-mode" style="margin:0 4px 0 0;">Barres:</label>
        <select id="bwe-sb-mode" title="Mode barres">
          <option value="auto">Auto</option>
          <option value="hide">Masquer</option>
          <option value="thin">Fines</option>
        </select>
        <button id="bwe-sys-zoom-dec" title="Zoom –">–</button>
        <button id="bwe-sys-zoom-inc" title="Zoom +">+</button>
      </div>
      <div class="bwe-sys-clip">
        <div class="bwe-sys-strip" id="bwe-sys-strip" tabindex="0" aria-label="Systèmes"></div>
      </div>
      <button class="bwe-sys-arrow left" id="bwe-sys-left" title="Défiler à gauche">‹</button>
      <button class="bwe-sys-arrow right" id="bwe-sys-right" title="Défiler à droite">›</button>
    `;
    sysContainer.appendChild(wrap);

    qs('#bwe-sys-filter').value = sysState.filter;
    qs('#bwe-sys-sort').value = sysState.sort;
    qs('#bwe-sb-mode').value = sysState.scrollbars;
    document.documentElement.style.setProperty('--bwe-sys-h', `${Math.round(64 * sysState.zoom)}px`);
    applyScrollbarMode();

    qs('#bwe-sys-filter').addEventListener('input', (e)=>{ sysState.filter = e.target.value.trim().toLowerCase(); saveSys(); renderSystemDock(); });
    qs('#bwe-sys-sort').addEventListener('change', (e)=>{ sysState.sort = e.target.value; saveSys(); renderSystemDock(true); });
    qs('#bwe-sb-mode').addEventListener('change', (e)=>{ sysState.scrollbars = e.target.value; saveSys(); applyScrollbarMode(); });

    const zoomTo = (z)=>{ sysState.zoom = Math.min(1.8, Math.max(0.6, z)); document.documentElement.style.setProperty('--bwe-sys-h', `${Math.round(64 * sysState.zoom)}px`); saveSys(); };
    qs('#bwe-sys-zoom-dec').addEventListener('click', ()=> zoomTo(sysState.zoom - 0.1));
    qs('#bwe-sys-zoom-inc').addEventListener('click', ()=> zoomTo(sysState.zoom + 0.1));

    const strip = qs('#bwe-sys-strip');
    const scrollBy = () => Math.max(240, Math.round(strip.clientWidth * 0.8));
    qs('#bwe-sys-left').addEventListener('click', ()=> strip.scrollBy({ left: -scrollBy(), behavior: 'smooth' }));
    qs('#bwe-sys-right').addEventListener('click', ()=> strip.scrollBy({ left: scrollBy(), behavior: 'smooth' }));

    strip.addEventListener('wheel', (e) => { const d = (e.deltaY || e.deltaX); if (Math.abs(d) >= Math.abs(e.deltaX)) { e.preventDefault(); strip.scrollLeft += d; } }, { passive:false });

    let drag = null;
    const onDown = (e) => { drag = { x: (e.touches ? e.touches[0].clientX : e.clientX), left: strip.scrollLeft }; strip.classList.add('dragging'); };
    const onMove = (e) => { if (!drag) return; const cx = (e.touches ? e.touches[0].clientX : e.clientX); strip.scrollLeft = drag.left - (cx - drag.x); };
    const onUp = () => { drag = null; strip.classList.remove('dragging'); };
    strip.addEventListener('mousedown', onDown); strip.addEventListener('mousemove', onMove); strip.addEventListener('mouseleave', onUp); strip.addEventListener('mouseup', onUp);
    strip.addEventListener('touchstart', onDown, { passive:true }); strip.addEventListener('touchmove', onMove, { passive:true }); strip.addEventListener('touchend', onUp);

    document.addEventListener('click', () => closeCtx());
    document.addEventListener('contextmenu', (e)=>{ if (!e.target.closest('.bwe-sys-item')) closeCtx(); });
  };

  const closeCtx = () => { qsa('.bwe-ctx').forEach(el => el.remove()); };

  const renderSystemDock = (keepScroll = false) => {
    const strip = qs('#bwe-sys-strip'); if (!strip) return;
    const prevScroll = strip.scrollLeft;
    while (strip.firstChild) strip.removeChild(strip.firstChild);

    let list = sysState.systems.filter(s => String(s.visible) === 'true');
    const filt = (sysState.filter || '').trim().toLowerCase();
    if (filt) list = list.filter(s => (s.fullname||s.name||'').toLowerCase().includes(filt));

    const alphaCmp = (a,b)=> String(a.fullname||a.name).localeCompare(String(b.fullname||b.name), undefined, { sensitivity:'base' });
    const pinScore = (s)=> sysState.pinned.has(s.name) ? 0 : 1;
    const recentScore = (s)=> { const i = sysState.recent.indexOf(s.name); return i < 0 ? 999 : i; };

    switch(sysState.sort){
      case 'alpha': list.sort(alphaCmp); break;
      case 'pinned-first': list.sort((a,b)=> pinScore(a)-pinScore(b) || alphaCmp(a,b)); break;
      case 'recent-first': list.sort((a,b)=> recentScore(a)-recentScore(b) || alphaCmp(a,b)); break;
      case 'pinned-recent-alpha': list.sort((a,b)=> pinScore(a)-pinScore(b) || recentScore(a)-recentScore(b) || alphaCmp(a,b)); break;
      case 'original': default: break;
    }

    for (const s of list) {
      const item = document.createElement('div');
      item.className = 'bwe-sys-item';
      item.dataset.name = s.name;
      item.title = s.fullname || s.name || '';
      if (sysState.selected === s.name) item.classList.add('active');
      if (sysState.running === s.name) item.classList.add('running');

      if (s.logo) { const img = document.createElement('img'); img.loading='lazy'; img.src=s.logo; item.appendChild(img); }
      else { const fb = document.createElement('div'); fb.className='fallback'; fb.textContent=s.fullname||s.name; item.appendChild(fb); }

      if (sysState.pinned.has(s.name)) { const star = document.createElement('span'); star.className='bwe-pin'; star.textContent='★'; item.appendChild(star); }

      const countEl = document.createElement('span');
      countEl.className='bwe-count'; countEl.textContent='…'; countEl.style.visibility='hidden'; item.appendChild(countEl);
      item.addEventListener('mouseenter', async ()=> {
        if (countEl.dataset.done) return;
        try {
          const res = await fetch(`/systems/${s.name}/games`);
          const arr = await res.json();
          const nb = (arr || []).filter(g => String(g.hidden) !== 'true').length;
          countEl.textContent = `${nb}`;
        } catch { countEl.textContent = '0'; }
        countEl.style.visibility='visible';
        countEl.dataset.done='1';
      });

      item.addEventListener('click', ()=> {
        sysState.selected=s.name;
        sysState.recent = [s.name, ...sysState.recent.filter(n=>n!==s.name)].slice(0,24);
        // Reset page pour éviter “page vide” en changeant de système
        gamesState.page = 1; saveGames(); saveSys();
        unsafeWindow.loadGames?.(s.name);
        renderSystemDock(true);
      });

      item.addEventListener('auxclick', (e)=>{ if (e.button===1){ e.preventDefault(); (async ()=> {
        try {
          const res = await fetch(`/systems/${s.name}/games`);
          const arr = await res.json();
          const pool = (arr || []).filter(g => String(g.hidden) !== 'true');
          if (!pool.length) return;
          const g = pool[Math.floor(Math.random() * pool.length)];
          unsafeWindow.launchGame?.(String(g.path || '').replace(/'/g,''));
        } catch {}
      })(); }});

      item.addEventListener('contextmenu', (e)=> {
        e.preventDefault(); closeCtx();
        const m = document.createElement('div');
        m.className='bwe-ctx';
        m.style.left=`${e.clientX}px`; m.style.top=`${e.clientY}px`;
        m.innerHTML = `
          <button data-act="open">Ouvrir</button>
          <button data-act="random">Lancer un jeu aléatoire</button>
          <button data-act="reload">Recharger la gamelist</button>
          <button data-act="pin">${sysState.pinned.has(s.name)?'Retirer des favoris':'Épingler en favoris'}</button>
        `;
        document.body.appendChild(m);
        const doAct = (act) => {
          switch(act){
            case 'open':
              unsafeWindow.loadGames?.(s.name);
              sysState.selected=s.name;
              sysState.recent = [s.name, ...sysState.recent.filter(n=>n!==s.name)].slice(0,24);
              gamesState.page = 1; saveGames(); saveSys();
              renderSystemDock(true);
              break;
            case 'random':
              (async ()=> {
                try {
                  const res = await fetch(`/systems/${s.name}/games`);
                  const arr = await res.json();
                  const pool = (arr || []).filter(g => String(g.hidden) !== 'true');
                  if (!pool.length) return;
                  const g = pool[Math.floor(Math.random() * pool.length)];
                  unsafeWindow.launchGame?.(String(g.path || '').replace(/'/g,''));
                } catch {}
              })();
              break;
            case 'reload': fetch('/reloadgames'); break;
            case 'pin':
              if (sysState.pinned.has(s.name)) sysState.pinned.delete(s.name);
              else sysState.pinned.add(s.name);
              saveSys(); renderSystemDock();
              break;
          }
          closeCtx();
        };
        qsa('button', m).forEach(b => b.addEventListener('click', ()=> doAct(b.dataset.act)));
      });

      strip.appendChild(item);
    }

    if (keepScroll) strip.scrollLeft = prevScroll;
  };

  const observeCurrentSystem = () => {
    const jumbo = document.getElementById('jumbo'); if (!jumbo) return;
    const mo = new MutationObserver(() => {
      const sysEl = document.getElementById('sysName');
      const txt = sysEl?.textContent?.trim();
      if (txt) { sysState.running = txt; renderSystemDock(true); }
    });
    mo.observe(jumbo, { childList:true, subtree:true });
  };

  // ------------------ Hook Batocera ------------------
  const installSystemsHook = () => {
    if (!unsafeWindow || typeof unsafeWindow.showSystems !== 'function' || unsafeWindow.__bwe_sys_hooked) return;
    const origShowSystems = unsafeWindow.showSystems;
    unsafeWindow.showSystems = function (arr) {
      sysState.systems = Array.isArray(arr) ? arr.slice() : [];
      buildDockSkeleton();
      renderSystemDock();
      recalcTopPads();
    };
    unsafeWindow.__bwe_sys_hooked = true;
  };

  const installGameHooks = () => {
    if (!unsafeWindow || unsafeWindow.__bwe_games_hooked) return;

    if (typeof unsafeWindow.detailFill === 'function') {
      const origDetail = unsafeWindow.detailFill;
      unsafeWindow.detailFill = function (ev) {
        try {
          const t = ev?.target || window.event?.target;
          const title = t?.getAttribute('data-name') || '';
          const desc = t?.getAttribute('data-desc') || '';
          const thumb = t?.getAttribute('data-thumb') || '';
          const img = t?.getAttribute('data-image') || '';
          const mtitle = document.getElementById('detailModalLabel');
          const marg = document.getElementById('detailModalBody');
          const pic = document.getElementById('detailModalImg');
          if (mtitle) mtitle.textContent = title;
          if (marg) marg.innerHTML = desc;
          if (pic) pic.src = img || thumb || '';
        } catch { try { origDetail?.(ev); } catch {} }
      };
    }

    if (typeof unsafeWindow.showGames === 'function') {
      const origShow = unsafeWindow.showGames;
      // IMPORTANT: conserver la référence d’origine pour le rendu
      origShowGames = origShow;
      unsafeWindow.showGames = function (arr) {
        gamesState.gamesAll = Array.isArray(arr) ? arr.slice() : [];
        if (!gamesState.uiReady) addToolbar();
        renderFiltered();
      };
    }

    if (typeof unsafeWindow.loadGames === 'function') {
      const origLoad = unsafeWindow.loadGames;
      unsafeWindow.loadGames = function (name) {
        sysState.selected = name || '';
        if (name) {
          sysState.recent = [name, ...sysState.recent.filter(n => n !== name)].slice(0,24);
          gamesState.page = 1; saveGames(); saveSys();
        }
        renderSystemDock();
        return origLoad.apply(this, arguments);
      };
    }

    unsafeWindow.__bwe_games_hooked = true;
  };

  // ------------------ Boot ------------------
  const ready = () => {
    installSystemsHook();
    installGameHooks();
    observeCurrentSystem();
    applyScrollbarMode();
    recalcTopPads();

    setTimeout(() => {
      const hasCards = !!qs('#gameList .card.card-game');
      if (!hasCards) qs('.bwe-sys-item')?.click();
    }, 600);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
