/**
 * Batocera Web Interface - JavaScript Application
 * Separated and cleaned from inline HTML
 */

// ==================== UTILITY FUNCTIONS ====================
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const norm = (s) => (s || '').toString().toLowerCase();
const isFavGame = (g) => String(g?.favorite) === 'true';
const hasCheevos = (g) => g && g.cheevosHash && parseInt(g.cheevosHash, 10) !== 0;
const playCount = (g) => (g && g.playcount ? parseInt(g.playcount, 10) || 0 : 0);
const getYear = (g) => { const m = String(g?.releasedate || '').match(/^\d{4}/); return m ? parseInt(m[0], 10) : null; };
const forceVisibleGames = (arr) => (Array.isArray(arr) ? arr.map(g => ({ ...g, hidden: 'false' })) : []);
const debounce = (fn, wait = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; };
const clearChildren = (el) => { while (el && el.firstChild) el.removeChild(el.firstChild); };

// Cache for URL existence checks to avoid repeated requests
const urlExistsCache = new Map();

// Utility function to check if a URL exists (with caching and timeout)
const checkUrlExists = async (url) => {
    // Check cache first
    if (urlExistsCache.has(url)) {
        return urlExistsCache.get(url);
    }
    
    try { 
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout
        
        const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const exists = response.ok;
        urlExistsCache.set(url, exists);
        return exists;
    } catch {
        // Cache negative result to avoid retrying
        urlExistsCache.set(url, false);
        return false;
    }
};

const escapeHtml = (unsafe) => unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const escapeRom = (unsafe) => unsafe.replace(/'/g, "");

// ==================== LAYOUT & RESPONSIVE ====================
const recalcTopPads = () => {
    const top = qs('.navbar.fixed-top');
    const tb = qs('.toolbar');
    const bottom = qs('.navbar.fixed-bottom');
    const jumbo = qs('#jumbo');

    // The fixed-top navbar's height already includes the jumbo (when shown) because #jumbo lives inside it.
    // So we set the toolbar directly below the navbar without adding jumbo height again.
    const topH = top ? Math.ceil(top.getBoundingClientRect().height) : 56;
    const tbH = tb && !tb.classList.contains('hidden') ? Math.ceil(tb.getBoundingClientRect().height) : 0;
    const bottomH = bottom ? Math.ceil(bottom.getBoundingClientRect().height) : 56;

    document.documentElement.style.setProperty('--toolbar-top', `${topH}px`);
    document.body.classList.add('padded');
    document.body.style.setProperty('--total-top-pad', `${topH + tbH}px`);
    document.body.style.setProperty('--bottom-pad', `${bottomH + 12}px`);
};

window.addEventListener('resize', () => requestAnimationFrame(recalcTopPads));

// ==================== STORAGE MANAGEMENT ====================
const LS_SYS_KEY = 'sys-settings-v1';
const LS_GAMES_KEY = 'games-settings-v4';

// Systems state
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

// Games state  
const gamesState = {
    query: '',
    sort: 'name-asc',
    favOnly: false,
    unplayedOnly: false,
    cheevosOnly: false,
    pageSize: 100,
    page: 1,
    gamesAll: [],
    view: 'grid',
    uiReady: false,
};

const saveSys = () => {
    const data = {
        filter: sysState.filter, 
        sort: sysState.sort, 
        zoom: sysState.zoom,
        pinned: [...sysState.pinned], 
        recent: sysState.recent.slice(0,12),
        scrollbars: sysState.scrollbars
    };
    localStorage.setItem(LS_SYS_KEY, JSON.stringify(data));
};

const loadSys = () => {
    try {
        const raw = localStorage.getItem(LS_SYS_KEY); 
        if (!raw) return;
        const d = JSON.parse(raw);
        sysState.filter = d.filter || '';
        sysState.sort = d.sort || 'pinned-recent-alpha';
        sysState.zoom = Math.min(1.8, Math.max(0.6, d.zoom || 1));
        sysState.pinned = new Set(d.pinned || []);
        sysState.recent = Array.isArray(d.recent) ? d.recent : [];
        sysState.scrollbars = d.scrollbars || 'hide';
    } catch(e) {
        console.warn('Failed to load system settings:', e);
    }
};

const saveGames = () => {
    const d = { 
        query: gamesState.query, 
        sort: gamesState.sort, 
        favOnly: gamesState.favOnly,
        unplayedOnly: gamesState.unplayedOnly, 
        cheevosOnly: gamesState.cheevosOnly,
        pageSize: gamesState.pageSize, 
        page: gamesState.page, 
        view: gamesState.view 
    };
    localStorage.setItem(LS_GAMES_KEY, JSON.stringify(d));
};

const loadGamesPrefs = () => {
    try {
        const raw = localStorage.getItem(LS_GAMES_KEY); 
        if (!raw) return;
        const d = JSON.parse(raw);
        gamesState.query = d.query || '';
        gamesState.sort = d.sort || 'name-asc';
        gamesState.favOnly = !!d.favOnly;
        gamesState.unplayedOnly = !!d.unplayedOnly;
        gamesState.cheevosOnly = !!d.cheevosOnly;
        gamesState.pageSize = parseInt(d.pageSize || 100, 10);
        gamesState.page = parseInt(d.page || 1, 10);
        gamesState.view = d.view === 'list' ? 'list' : 'grid';
    } catch(e) {
        console.warn('Failed to load games preferences:', e);
    }
};

// ==================== API CALLS ====================
const reloadGamelists = () => fetch('/reloadgames');
const emuKill = () => fetch('/emukill');

const launchGame = (game) => {
    fetch('/launch', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: game
    });
};

// ==================== SCROLLBAR MANAGEMENT ====================
const applyScrollbarMode = () => {
    document.documentElement.classList.remove('hide-scrollbars','thin-scrollbars');
    if (sysState.scrollbars === 'hide') document.documentElement.classList.add('hide-scrollbars');
    else if (sysState.scrollbars === 'thin') document.documentElement.classList.add('thin-scrollbars');
};

// ==================== TOOLBAR (GAMES) ====================
const addToolbar = () => {
    if (gamesState.uiReady) return;
    
    const bar = document.createElement('div');
    bar.className = 'toolbar hidden';
    bar.innerHTML = `
        <div class="tools">
            <span class="label">Recherche</span>
            <input id="search" class="form-control form-control-sm input" type="search" placeholder="Nom/genre…" aria-label="Recherche jeux">

            <span class="label">Tri</span>
            <select id="sort" class="custom-select custom-select-sm" title="Tri">
                <option value="name-asc">Nom A→Z</option>
                <option value="name-desc">Nom Z→A</option>
                <option value="year-desc">Année ↓</option>
                <option value="year-asc">Année ↑</option>
                <option value="playcount-desc">Sessions ↓</option>
                <option value="playcount-asc">Sessions ↑</option>
                <option value="favorite-first">Favoris d'abord</option>
            </select>

            <div class="ck-group">
                <label><input type="checkbox" id="fav"> Favoris</label>
                <label><input type="checkbox" id="unplayed"> Jamais joués</label>
                <label><input type="checkbox" id="cheevos"> Succès</label>
            </div>

            <span class="spacer"></span>
        </div>
    `;
    
    const row = document.querySelector('body > div.row') || document.querySelector('.main-content');
    if (row && row.parentElement) row.parentElement.insertBefore(bar, row);
    else document.body.insertBefore(bar, document.body.firstChild);

    setupToolbarEvents(bar);
    gamesState.uiReady = true;
    requestAnimationFrame(recalcTopPads);
};

const setupToolbarEvents = (bar) => {
    const search = qs('#search', bar);
    const sort = qs('#sort', bar);
    const fav = qs('#fav', bar);
    const unplayed = qs('#unplayed', bar);
    const cheevos = qs('#cheevos', bar);

    // Set initial values
    search.value = gamesState.query;
    sort.value = gamesState.sort;
    fav.checked = gamesState.favOnly;
    unplayed.checked = gamesState.unplayedOnly;
    cheevos.checked = gamesState.cheevosOnly;

    // Event listeners
    search.addEventListener('input', (e) => { 
        gamesState.query = e.target.value; 
        gamesState.page = 1; 
        saveGames(); 
        renderFiltered(); 
    });
    
    sort.addEventListener('change', (e) => { 
        gamesState.sort = e.target.value; 
        gamesState.page = 1; 
        saveGames(); 
        renderFiltered(); 
    });
    
    fav.addEventListener('change', (e) => { 
        gamesState.favOnly = e.target.checked; 
        gamesState.page = 1; 
        saveGames(); 
        renderFiltered(); 
    });
    
    unplayed.addEventListener('change', (e) => { 
        gamesState.unplayedOnly = e.target.checked; 
        gamesState.page = 1; 
        saveGames(); 
        renderFiltered(); 
    });
    
    cheevos.addEventListener('change', (e) => { 
        gamesState.cheevosOnly = e.target.checked; 
        gamesState.page = 1; 
        saveGames(); 
        renderFiltered(); 
    });
};

// ==================== FILTERING & SORTING ====================
const getFilteredSorted = () => {
    let arr = gamesState.gamesAll.slice();
    arr = arr.filter(g => String(g.hidden) !== 'true');
    
    const q = norm(gamesState.query);
    if (q) arr = arr.filter(g => norm(g.name).includes(q) || norm(g.genre).includes(q));
    if (gamesState.favOnly) arr = arr.filter(isFavGame);
    if (gamesState.unplayedOnly) arr = arr.filter(g => playCount(g) === 0);
    if (gamesState.cheevosOnly) arr = arr.filter(hasCheevos);
    
    const compareFunctions = {
        'name-asc': (a,b) => norm(a.name).localeCompare(norm(b.name)),
        'name-desc': (a,b) => norm(b.name).localeCompare(norm(a.name)),
        'year-desc': (a,b) => (getYear(b) || -1) - (getYear(a) || -1) || norm(a.name).localeCompare(norm(b.name)),
        'year-asc': (a,b) => (getYear(a) || 99999) - (getYear(b) || 99999) || norm(a.name).localeCompare(norm(b.name)),
        'playcount-desc': (a,b) => playCount(b) - playCount(a) || norm(a.name).localeCompare(norm(b.name)),
        'playcount-asc': (a,b) => playCount(a) - playCount(b) || norm(a.name).localeCompare(norm(b.name)),
        'favorite-first': (a,b) => (isFavGame(b) - isFavGame(a)) || norm(a.name).localeCompare(norm(b.name)),
    };
    
    const cmp = compareFunctions[gamesState.sort] || compareFunctions['name-asc'];
    arr.sort(cmp);
    return arr;
};

// ==================== PAGINATION ====================
const updateSummary = (pageCount, total) => {
    const s = qs('#bottom-summary'); 
    if (!s) return;
    const start = total ? ((gamesState.page - 1) * gamesState.pageSize + 1) : 0;
    const end = Math.min(gamesState.page * gamesState.pageSize, total);
    s.textContent = `${total ? `${start}-${end}` : '0-0'}`;
};

const renderPager = (filteredCount) => {
    const pager = qs('#bottom-pager'); 
    if (!pager) return;
    
    const pages = gamesState.pageSize >= 9999 ? 1 : Math.max(1, Math.ceil(filteredCount / gamesState.pageSize));
    gamesState.page = Math.min(Math.max(1, gamesState.page), pages);
    
    const btn = (label, page, disabled = false) =>
        `<button class="btn btn-sm btn-outline-info${disabled ? ' disabled' : ''}" data-page="${page}" title="${label}">${label}</button>`;
    
    pager.innerHTML = `${btn('«',1,gamesState.page===1)}${btn('‹',gamesState.page-1,gamesState.page===1)}<span class="text-light">Page ${gamesState.page}/${pages}</span>${btn('›',gamesState.page+1,gamesState.page===pages)}${btn('»',pages,gamesState.page===pages)}`;
    
    qsa('button[data-page]', pager).forEach(b => 
        b.addEventListener('click', () => pagerGo(parseInt(b.getAttribute('data-page'), 10)))
    );
};

const pagerGo = (p) => {
    const filtered = getFilteredSorted();
    const pages = gamesState.pageSize >= 9999 ? 1 : Math.max(1, Math.ceil(filtered.length / gamesState.pageSize));
    const clamped = Math.min(Math.max(1, p), pages);
    if (clamped !== gamesState.page) { 
        gamesState.page = clamped; 
        saveGames(); 
        renderFiltered(); 
    }
};

// ==================== GAME CARD RENDERING ====================
const createGameCardElement = (game) => {
    const regex = /^\d\d\d\d/;
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card text-white bg-dark card-game';

    let cardHtml = '';

    // Image handling
    if (game.thumbnail) {
        cardHtml += `<img class="card-img-top card-img-150" loading="lazy" src="${game.thumbnail}">`;
    } else if (game.image) {
        cardHtml += `<img class="card-img-top card-img-150" loading="lazy" src="${game.image}">`;
    }

    // Title/Marquee
    if (game.marquee) {
        cardHtml += `<img class="card-img card-title-50" loading="lazy" src="${game.marquee}">`;
    }

    cardHtml += '<div class="card-text align-items-center">';

    // Game name (always show, even with marquee for consistency)
    cardHtml += `<p class="game-name">${escapeHtml(game.name)}</p>`;

    // Genre
    if (game.genre) {
        cardHtml += `<p class="game-genre">${game.genre}</p>`;
    }

    // Release date
    if (game.releasedate && regex.test(game.releasedate)) {
        cardHtml += `<p>${game.releasedate.match(regex)}</p>`;
    }

    // Icons
    if (hasCheevos(game)) {
        cardHtml += '<i class="fa fa-trophy" style="margin-left:2px; margin-right:2px"></i>';
    }
    if (isFavGame(game)) {
        cardHtml += '<i class="fa fa-star" style="margin-left:2px; margin-right:2px"></i>';
    }
    
    // Add manual/map icons (will be shown/hidden via async check)
    const currentSys = sysState?.selected || currentSystemName || '';
    const currentGameId = game?.id || '';
    if (currentSys && currentGameId) {
        cardHtml += `<i class="fa fa-book manual-icon" style="margin-left:2px; margin-right:2px; display:none;" title="Manuel disponible"></i>`;
        cardHtml += `<i class="fa fa-map map-icon" style="margin-left:2px; margin-right:2px; display:none;" title="Carte disponible"></i>`;
    }

    // Play count
    const pc = playCount(game);
    if (pc > 0) {
        cardHtml += `<p>Played ${pc} time${pc > 1 ? 's' : ''}</p>`;
    } else {
        cardHtml += '<p>Never played</p>';
    }

    cardHtml += '</div><div class="card-footer mx-auto">';
    cardHtml += `<input type="button" class="btn btn-primary" onClick="launchGame('${escapeRom(game.path)}')" value="Play">`;
    cardHtml += `<input type="button" class="btn btn-info" data-toggle="modal" data-target="#detailModal"` +
        ` data-desc="${escapeHtml(game.desc || '')}"` +
        ` data-name="${escapeHtml(game.name || '')}"` +
        ` data-thumb="${game.thumbnail || ''}"` +
        ` data-image="${game.image || ''}"` +
        ` data-genre="${escapeHtml(game.genre || '')}"` +
        ` data-releasedate="${escapeHtml(game.releasedate || '')}"` +
        ` data-cheevos="${hasCheevos(game)}"` +
        ` data-path="${escapeHtml(String(game.path || ''))}"` +
        ` data-playcount="${playCount(game)}"` +
        ` data-players="${escapeHtml(String(game.players || ''))}"` +
        ` data-developer="${escapeHtml(game.developer || '')}"` +
        ` data-publisher="${escapeHtml(game.publisher || '')}"` +
        ` data-rating="${escapeHtml(String(game.rating || ''))}"` +
        ` data-lastplayed="${escapeHtml(String(game.lastplayed || ''))}"` +
        ` data-favorite="${isFavGame(game)}"` +
        ` data-cheevosid="${escapeHtml(String(game.cheevosId || ''))}"` +
        ` data-id="${escapeHtml(String(game.id || ''))}"` +
        ` value="Infos" onClick="detailFill()">`;
    cardHtml += '</div>';

    cardDiv.innerHTML = cardHtml;
    
    // Async check for manual/map availability (debounced to reduce server load)
    const systemName = sysState?.selected || currentSystemName || '';
    const gameId = game?.id || '';
    if (systemName && gameId) {
        const manualIcon = cardDiv.querySelector('.manual-icon');
        const mapIcon = cardDiv.querySelector('.map-icon');
        
        // Use setTimeout to batch requests and avoid overwhelming the server
        setTimeout(async () => {
            try {
                if (manualIcon) {
                    const manualUrl = buildMediaUrl(systemName, gameId, 'manual');
                    const exists = await checkUrlExists(manualUrl);
                    if (exists) manualIcon.style.display = 'inline';
                }
                
                if (mapIcon) {
                    const mapUrl = buildMediaUrl(systemName, gameId, 'map');
                    const exists = await checkUrlExists(mapUrl);
                    if (exists) mapIcon.style.display = 'inline';
                }
            } catch {}
        }, Math.random() * 500); // Random delay to spread requests over time
    }
    
    return cardDiv;
};

const createListItemElement = (game) => {
    const row = document.createElement('div');
    row.className = 'list-item';
    const thumb = game.thumbnail || game.image || '';
    const year = getYear(game);
    const genre = (game.genre || '').split(',')[0];
    const chee = hasCheevos(game);
    const fav = isFavGame(game);
    
    row.innerHTML = `
        <div class="li-thumb">${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : ''}</div>
        <div class="li-main">
            <div class="li-title" title="${escapeHtml(game.name||'')}">${escapeHtml(game.name||'')}</div>
            <div class="li-meta">${year ? year : ''}${year && genre ? ' · ' : ''}${genre ? escapeHtml(genre) : ''}${(fav||chee) ? ' · ' : ''}${fav ? '★' : ''}${fav && chee ? ' ' : ''}${chee ? '🏆' : ''}<span class="manual-icon" style="display:none;" title="Manuel disponible"> 📖</span><span class="map-icon" style="display:none;" title="Carte disponible"> 🗺️</span></div>
        </div>
        <div class="li-actions">
            <button class="btn btn-sm btn-primary" title="Jouer">Play</button>
            <button class="btn btn-sm btn-info" title="Infos" data-toggle="modal" data-target="#detailModal"
                data-name="${escapeHtml(game.name||'')}"
                data-desc="${escapeHtml(game.desc||'')}"
                data-thumb="${game.thumbnail||''}"
                data-image="${game.image||''}"
                data-genre="${escapeHtml(game.genre||'')}"
                data-releasedate="${escapeHtml(game.releasedate||'')}"
                data-cheevos="${hasCheevos(game)}"
                data-path="${escapeHtml(String(game.path||''))}"
                data-playcount="${playCount(game)}"
                data-players="${escapeHtml(String(game.players||''))}"
                data-developer="${escapeHtml(game.developer||'')}"
                data-publisher="${escapeHtml(game.publisher||'')}"
                data-rating="${escapeHtml(String(game.rating||''))}"
                data-lastplayed="${escapeHtml(String(game.lastplayed||''))}"
                data-favorite="${isFavGame(game)}"
                data-cheevosid="${escapeHtml(String(game.cheevosId||''))}"
                data-id="${escapeHtml(String(game.id||''))}"
            >Infos</button>
        </div>
    `;
    
    const playBtn = row.querySelector('.li-actions .btn.btn-primary');
    playBtn?.addEventListener('click', () => launchGame(String(game.path||'').replace(/'/g,'')));
    
    const infoBtn = row.querySelector('.li-actions .btn.btn-info');
    infoBtn?.addEventListener('click', detailFill);
    
    // Async check for manual/map availability in list view
    const listSys = sysState?.selected || currentSystemName || '';
    const listGameId = game?.id || '';
    if (listSys && listGameId) {
        const manualIcon = row.querySelector('.manual-icon');
        const mapIcon = row.querySelector('.map-icon');
        
        if (manualIcon) {
            const manualUrl = buildMediaUrl(listSys, listGameId, 'manual');
            checkUrlExists(manualUrl).then(exists => {
                if (exists) manualIcon.style.display = 'inline';
            }).catch(() => {});
        }
        
        if (mapIcon) {
            const mapUrl = buildMediaUrl(listSys, listGameId, 'map');
            checkUrlExists(mapUrl).then(exists => {
                if (exists) mapIcon.style.display = 'inline';
            }).catch(() => {});
        }
    }
    
    return row;
};

// ==================== RENDERING ====================
const renderCards = (list) => {
    if (gamesState.view === 'list') { 
        return renderListView(list); 
    }
    
    const gameList = document.getElementById('gameList');
    if (!gameList) return;
    
    if (!list || list.length === 0) {
        gameList.innerHTML = '<div class="text-center text-muted" style="padding:24px">Aucun jeu ne correspond aux filtres/recherche.</div>';
        return;
    }
    
    gameList.innerHTML = '<div class="row" id="gameContainer"></div>';
    const gameContainer = document.getElementById('gameContainer');
    const frag = document.createDocumentFragment();
    
    list.forEach(g => { 
        frag.appendChild(createGameCardElement(g)); 
    });
    
    gameContainer.appendChild(frag);
    
    // Mark favorites
    try {
        const cards = qsa('.card.card-game', gameContainer);
        list.forEach((g, i) => { 
            const c = cards[i]; 
            if (c && isFavGame(g)) c.classList.add('fav'); 
        });
    } catch(e) {
        console.warn('Failed to mark favorites:', e);
    }
};

const renderListView = (list) => {
    const gameList = document.getElementById('gameList');
    if (!gameList) return;
    
    if (!list || list.length === 0) {
        gameList.innerHTML = '<div class="text-center text-muted" style="padding:16px">Aucun jeu ne correspond aux filtres/recherche.</div>';
        return;
    }
    
    gameList.innerHTML = '<div class="list-container" id="gameContainer"></div>';
    const gameContainer = document.getElementById('gameContainer');
    const frag = document.createDocumentFragment();
    
    list.forEach(g => { 
        frag.appendChild(createListItemElement(g)); 
    });
    
    gameContainer.appendChild(frag);
};

const renderFiltered = () => {
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
    renderCards(safe);

    updateSummary(pageItems.length, total);
    renderPager(total);
    requestAnimationFrame(recalcTopPads);
};

// ==================== MODAL MANAGEMENT ====================
const formatEsDate = (val) => {
    if (!val) return '';
    const s = String(val);
    const y = s.slice(0,4), m = s.slice(4,6), d = s.slice(6,8);
    if (/^\d{4}$/.test(y) && /^\d{2}$/.test(m) && /^\d{2}$/.test(d)) return `${y}-${m}-${d}`;
    return '';
};

const buildMediaUrl = (systemName, gameId, mediaType) => {
    const s = encodeURIComponent(systemName);
    const id = encodeURIComponent(gameId);
    const mt = encodeURIComponent(mediaType);
    return `/systems/${s}/games/${id}/media/${mt}`;
};

const setDetailModal = (game) => {
    const mtitle = document.getElementById('detailModalLabel');
    const marg = document.getElementById('detailModalBody');
    const pic = document.getElementById('detailModalImg');
    const facts = document.getElementById('detailFacts');
    const media = document.getElementById('detailMediaLinks');
    const mediaFooter = document.getElementById('detailMediaLinksFooter');
    
    if (mtitle) mtitle.textContent = game?.name || '';
    if (marg) marg.innerHTML = game?.desc || '';
    if (pic) pic.src = game?.image || game?.thumbnail || '';
    
    if (facts) {
        const rows = [];
        const year = getYear(game);
        const genre = (game?.genre || '').trim();
        const pth = game?.path || '';
        const pc = playCount(game);
        const last = formatEsDate(game?.lastplayed || '');
        const players = (game?.players || '').toString();
        const dev = game?.developer || '';
        const pub = game?.publisher || '';
        const fav = isFavGame(game);
        const rating = game?.rating !== undefined && game?.rating !== null && game?.rating !== '' ? Number(game.rating) : null;
        
        if (year) rows.push({ label: 'Année', value: String(year) });
        if (genre) rows.push({ label: 'Genre', value: escapeHtml(genre) });
        if (pth) rows.push({ label: 'Chemin', value: `<code class="path">${escapeHtml(pth)}</code>` });
        rows.push({ label: 'Sessions', value: pc > 0 ? `${pc} fois` : 'Jamais' });
        if (last) rows.push({ label: 'Dernière session', value: last });
        if (players) rows.push({ label: 'Joueurs', value: escapeHtml(players) });
        if (dev) rows.push({ label: 'Développeur', value: escapeHtml(dev) });
        if (pub) rows.push({ label: 'Éditeur', value: escapeHtml(pub) });
        rows.push({ label: 'Favori', value: fav ? '<i class="fa fa-star" aria-hidden="true"></i> Oui' : 'Non' });
        if (rating !== null && !isNaN(rating)) rows.push({ label: 'Note', value: `${Math.round(Math.min(Math.max(rating, 0), 1)*100)}%` });
        
        facts.innerHTML = rows.map(r => `
            <div class="df-row">
                <div class="df-label">${r.label}</div>
                <div class="df-value">${r.value}</div>
            </div>
        `).join('');
    }
    
    const kb = document.getElementById('detailKillBtn');
    if (kb) { kb.style.display = 'none'; kb.onclick = null; }
    
    const pb = document.getElementById('detailPlayBtn');
    if (pb) {
        const pth = game?.path || '';
        if (pth) {
            pb.style.display = 'inline-block';
            pb.disabled = false;
            pb.onclick = function(){ 
                launchGame(String(pth).replace(/'/g,'')); 
                try { $('#detailModal').modal('hide'); } catch {} 
            };
        } else {
            pb.style.display = 'none';
            pb.onclick = null;
        }
    }

    // Build media links
    const mediaTarget = mediaFooter || media;
    if (mediaTarget) {
        mediaTarget.innerHTML = '';
        const sys = sysState?.selected || currentSystemName || '';
        const gid = game?.id || '';
        
        if (sys && gid) {
            const manualUrl = buildMediaUrl(sys, gid, 'manual');
            const mapUrl = buildMediaUrl(sys, gid, 'map');
            const raId = (game?.cheevosId || '').toString().trim();
            const raUrl = raId ? `https://retroachievements.org/game/${encodeURIComponent(raId)}` : '';
            const frag = document.createDocumentFragment();

            const createMediaBtn = (url, title, icon) => {
                const a = document.createElement('a');
                a.href = url; 
                a.target = '_blank'; 
                a.rel = 'noreferrer';
                a.className = 'btn btn-outline-info media-btn'; 
                a.title = title; 
                a.style.display = 'none';
                a.innerHTML = `<i class="fa ${icon}" aria-hidden="true"></i><span class="ml-2 d-none d-sm-inline">${title}</span>`;
                frag.appendChild(a); 
                return a;
            };
            
            const mBtn = createMediaBtn(manualUrl, 'Manuel', 'fa-book');
            const mapBtn = createMediaBtn(mapUrl, 'Carte/Map', 'fa-map');
            let raBtn = null;
            
            if (raUrl) {
                raBtn = createMediaBtn(raUrl, 'RetroAchievements', 'fa-trophy');
                raBtn.style.display = 'inline-flex';
            }
            
            mediaTarget.appendChild(frag);

            // Probe availability
            
            (async () => {
                try { if (await checkUrlExists(manualUrl)) mBtn.style.display = 'inline-flex'; } catch {}
                try { if (await checkUrlExists(mapUrl)) mapBtn.style.display = 'inline-flex'; } catch {}
            })();
        }
    }
};

const detailFill = (ev) => {
    try {
        const t = ev?.target || window.event?.target;
        const d = t?.dataset || {};
        const game = {
            name: t?.getAttribute('data-name') || '',
            desc: t?.getAttribute('data-desc') || '',
            thumbnail: t?.getAttribute('data-thumb') || '',
            image: t?.getAttribute('data-image') || '',
            genre: d.genre || '',
            releasedate: d.releasedate || '',
            cheevosHash: d.cheevos === 'true' ? '1' : (d.cheevos || ''),
            path: d.path || '',
            playcount: d.playcount || '',
            players: d.players || '',
            developer: d.developer || '',
            publisher: d.publisher || '',
            rating: d.rating || '',
            lastplayed: d.lastplayed || '',
            favorite: d.favorite || 'false',
            cheevosId: d.cheevosid || '',
            id: d.id || ''
        };
        setDetailModal(game);
    } catch { 
        // Fallback
        console.warn('Failed to fill detail modal, using fallback');
    }
};

// ==================== SYSTEMS MANAGEMENT ====================
let currentSystemName = null;

const showGames = (arr) => {
    gamesState.gamesAll = Array.isArray(arr) ? arr.slice() : [];
    addToolbar();
    renderFiltered();
};

const loadGames = (name) => {
    sysState.selected = name || '';
    if (name) {
        sysState.recent = [name, ...sysState.recent.filter(n => n !== name)].slice(0, 24);
        gamesState.page = 1; 
        saveGames(); 
        saveSys();
    }
    currentSystemName = name;
    
    const gl = document.getElementById('gameList');
    if (gl) gl.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-light" role="status"><span class="sr-only">Loading...</span></div><p class="mt-3">Loading games...</p></div>';

    const xhr = new XMLHttpRequest();
    xhr.timeout = 10000;
    
    xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                if (currentSystemName === name) {
                    try {
                        const myArr = JSON.parse(this.responseText);
                        myArr.sort(getOrder('name'));
                        showGames(myArr);
                        
                        // Update navbar title
                        const navTitle = document.getElementById('navSystemTitle');
                        if (navTitle) {
                            const sys = sysState.systems.find(s => s.name === name);
                            const title = (sys && (sys.fullname || sys.name)) || name || '';
                            const count = Array.isArray(myArr) ? myArr.filter(g => String(g.hidden) !== 'true').length : 0;
                            navTitle.textContent = `${title} - ${count} games`;
                        }
                    } catch (e) {
                        renderLoadError(name, 'Invalid response');
                    }
                }
            } else {
                renderLoadError(name, `HTTP ${this.status}`);
            }
        }
    };
    
    xhr.ontimeout = () => renderLoadError(name, 'Timeout');
    xhr.onerror = () => renderLoadError(name, 'Network error');
    xhr.open('GET', '/systems/' + encodeURIComponent(name) + '/games');
    xhr.send();
};

const renderLoadError = (name, reason) => {
    if (currentSystemName !== name) return;
    
    const gl = document.getElementById('gameList');
    if (gl) gl.innerHTML = `<div class="text-center p-5 text-warning">Impossible de charger les jeux (${escapeHtml(reason||'')}).</div>`;
    
    showGames([]);
    const navTitle = document.getElementById('navSystemTitle');
    if (navTitle) {
        const sys = sysState.systems.find(s => s.name === name);
        const title = (sys && (sys.fullname || s.name)) || name || '';
        navTitle.textContent = `${title} - 0 games`;
    }
};

const getOrder = (prop) => {
    return function(a, b) {
        if (a[prop] > b[prop]) return 1;
        else if (a[prop] < b[prop]) return -1;
        return 0;
    };
};

// ==================== SYSTEMS DOCK ====================
const buildDockSkeleton = () => {
    const sysContainer = document.getElementById('systemList');
    if (!sysContainer) return;
    
    clearChildren(sysContainer);
    const wrap = document.createElement('div');
    wrap.id = 'sysbar';
    wrap.innerHTML = `
        <div class="sys-toolbar">
            <input id="sys-filter" type="search" placeholder="Filtrer les systèmes…" />
            <button id="sys-picker-open" class="btn btn-sm btn-outline-info" title="Liste des systèmes">
                <i class="fa fa-list" aria-hidden="true"></i>
                <span class="sr-only">Liste des systèmes</span>
            </button>
            <div class="spacer"></div>
            <div class="zoom-group">
                <button id="sys-zoom-dec" title="Zoom –">–</button>
                <button id="sys-zoom-inc" title="Zoom +">+</button>
            </div>
        </div>
        <div class="sys-clip">
            <div class="sys-strip" id="sys-strip" tabindex="0" aria-label="Systèmes"></div>
            <div style="height:1px;width:44px;position:absolute;right:0;bottom:0;"></div>
        </div>
        <button class="sys-arrow left" id="sys-left" title="Défiler à gauche">‹</button>
        <button class="sys-arrow right" id="sys-right" title="Défiler à droite">›</button>
    `;
    sysContainer.appendChild(wrap);

    setupDockEvents(wrap);
};

const setupDockEvents = (wrap) => {
    qs('#sys-filter').value = sysState.filter;
    document.documentElement.style.setProperty('--sys-h', `${Math.round(64 * sysState.zoom)}px`);
    applyScrollbarMode();

    qs('#sys-filter').addEventListener('input', (e) => { 
        sysState.filter = e.target.value.trim().toLowerCase(); 
        saveSys(); 
        renderSystemDock(); 
    });

    const zoomTo = (z) => { 
        sysState.zoom = Math.min(1.8, Math.max(0.6, z)); 
        document.documentElement.style.setProperty('--sys-h', `${Math.round(64 * sysState.zoom)}px`); 
        saveSys(); 
    };
    
    qs('#sys-zoom-dec').addEventListener('click', () => zoomTo(sysState.zoom - 0.1));
    qs('#sys-zoom-inc').addEventListener('click', () => zoomTo(sysState.zoom + 0.1));

    const strip = qs('#sys-strip');
    const scrollBy = () => Math.max(240, Math.round(strip.clientWidth * 0.8));
    
    qs('#sys-left').addEventListener('click', () => {
        const currentScroll = strip.scrollLeft;
        const scrollAmount = scrollBy();
        const newPosition = Math.max(0, currentScroll - scrollAmount);
        strip.scrollTo({ left: newPosition, behavior: 'smooth' });
    });
    qs('#sys-right').addEventListener('click', () => {
        const currentScroll = strip.scrollLeft;
        const scrollAmount = scrollBy();
        const maxScroll = strip.scrollWidth - strip.clientWidth;
        const newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
        strip.scrollTo({ left: newPosition, behavior: 'smooth' });
    });

    strip.addEventListener('wheel', (e) => { 
        const d = (e.deltaY || e.deltaX); 
        if (Math.abs(d) >= Math.abs(e.deltaX)) { 
            e.preventDefault(); 
            strip.scrollLeft += d; 
        } 
    }, { passive: false });

    // Touch/drag support
    let drag = null;
    const onDown = (e) => { 
        drag = { x: (e.touches ? e.touches[0].clientX : e.clientX), left: strip.scrollLeft }; 
        strip.classList.add('dragging'); 
    };
    const onMove = (e) => { 
        if (!drag) return; 
        const cx = (e.touches ? e.touches[0].clientX : e.clientX); 
        strip.scrollLeft = drag.left - (cx - drag.x); 
    };
    const onUp = () => { 
        drag = null; 
        strip.classList.remove('dragging'); 
    };
    
    strip.addEventListener('mousedown', onDown); 
    strip.addEventListener('mousemove', onMove); 
    strip.addEventListener('mouseleave', onUp); 
    strip.addEventListener('mouseup', onUp);
    strip.addEventListener('touchstart', onDown, { passive: true }); 
    strip.addEventListener('touchmove', onMove, { passive: true }); 
    strip.addEventListener('touchend', onUp);

    const sysPickerBtn = qs('#sys-picker-open', wrap);
    if (sysPickerBtn) sysPickerBtn.addEventListener('click', () => { 
        try { $('#systemsModal').modal('show'); } catch(e) {} 
    });
};

const renderSystemDock = (keepScroll = false) => {
    const strip = qs('#sys-strip'); 
    if (!strip) return;
    
    const prevScroll = strip.scrollLeft;
    clearChildren(strip);

    let list = sysState.systems.filter(s => String(s.visible) === 'true');
    const filt = (sysState.filter || '').trim().toLowerCase();
    if (filt) list = list.filter(s => (s.fullname || s.name || '').toLowerCase().includes(filt));

    for (const s of list) {
        const item = document.createElement('div');
        item.className = 'sys-item';
        item.dataset.name = s.name;
        item.title = s.fullname || s.name || '';
        
        if (sysState.selected === s.name) item.classList.add('active');
        if (sysState.running === s.name) item.classList.add('running');

        if (s.logo) { 
            const img = document.createElement('img'); 
            img.loading = 'lazy'; 
            img.src = s.logo; 
            item.appendChild(img); 
        } else { 
            const fb = document.createElement('div'); 
            fb.className = 'fallback'; 
            fb.textContent = s.fullname || s.name; 
            item.appendChild(fb); 
        }

        if (sysState.pinned.has(s.name)) { 
            const star = document.createElement('span'); 
            star.className = 'pin'; 
            star.textContent = '★'; 
            item.appendChild(star); 
        }

        const countEl = document.createElement('span');
        countEl.className = 'count'; 
        countEl.textContent = '…'; 
        countEl.style.visibility = 'hidden'; 
        item.appendChild(countEl);
        
        item.addEventListener('mouseenter', async () => {
            if (countEl.dataset.done) return;
            try {
                const res = await fetch(`/systems/${s.name}/games`);
                const arr = await res.json();
                const nb = (arr || []).filter(g => String(g.hidden) !== 'true').length;
                countEl.textContent = `${nb}`;
            } catch { 
                countEl.textContent = '0'; 
            }
            countEl.style.visibility = 'visible';
            countEl.dataset.done = '1';
        });

        item.addEventListener('click', () => {
            sysState.selected = s.name;
            sysState.recent = [s.name, ...sysState.recent.filter(n => n !== s.name)].slice(0, 24);
            gamesState.page = 1; 
            saveGames(); 
            saveSys();
            loadGames(s.name);
            renderSystemDock(true);
        });

        // Middle-click for random game
        item.addEventListener('auxclick', (e) => { 
            if (e.button === 1) { 
                e.preventDefault(); 
                (async () => {
                    try {
                        const res = await fetch(`/systems/${s.name}/games`);
                        const arr = await res.json();
                        const pool = (arr || []).filter(g => String(g.hidden) !== 'true');
                        if (!pool.length) return;
                        const g = pool[Math.floor(Math.random() * pool.length)];
                        launchGame(String(g.path || '').replace(/'/g, ''));
                    } catch {}
                })(); 
            }
        });

        strip.appendChild(item);
    }

    if (keepScroll) strip.scrollLeft = prevScroll;
};

const showSystems = (arr) => {
    sysState.systems = Array.isArray(arr) ? arr.slice() : [];
    buildDockSkeleton();
    renderSystemDock();
    recalcTopPads();
};

// ==================== WEBSOCKET & CURRENT GAME ====================
const describe = (d) => {
    let out = "";

    if (d.msg) {
        if (d.msg === "NO GAME RUNNING") {
            // Hide the entire current game section when no game is running
            return "";
        }
        if (d.msg === "ERROR") {
            out += '<div class="gameName" id="gameName">Notification service unreachable</div>';
            return out;
        }
    }
    
    out += '<div class="row mx-auto">';
    
    if (d.image) {
        out += `<div class="col-4 float-right imgCont"><img src="${d.image}" class="imgArt" id="imgArt" width="64"></div>`;
    } else if (d.thumbnail) {
        out += `<div class="col-4 float-right imgCont"><img src="${d.thumbnail}" class="imgArt" id="imgArt" width="64"></div>`;
    }
    
    out += '<div class="col-8 sysCont">';
    
    if (d.systemName) {
        const url = "/systems/" + d.systemName + "/logo";
        fetch(url).then(response => response.blob())
            .then((blob) => {
                const imgE = document.createElement('img');
                const imgUrl = URL.createObjectURL(blob);
                imgE.src = imgUrl;
                imgE.style.height = "24pt";
                const container = document.getElementById("sysName");
                if (container) {
                    container.innerHTML = '';
                    container.appendChild(imgE);
                }
            });
        out += `<div class="row no-gutters"><div class="col-12 sysName" id="sysName" title="">${d.systemName}</div></div>`;
    }
    
    if (d.name) {
        out += `<div class="row no-gutters"><div class="col-12 gameName" id="gameName" title="">${d.name}</div></div>`;
    }
    
    out += '</div></div>';
    return out;
};

const observeCurrentSystem = () => {
    const jumbo = document.getElementById('jumbo'); 
    if (!jumbo) return;
    
    const mo = new MutationObserver(() => {
        const sysEl = document.getElementById('sysName');
        const txt = sysEl?.textContent?.trim();
        if (txt) { 
            sysState.running = txt; 
            renderSystemDock(true); 
        }
    });
    mo.observe(jumbo, { childList: true, subtree: true });
};

// ==================== KEYBOARD SHORTCUTS ====================
const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { 
            e.preventDefault(); 
            const search = document.getElementById('search');
            if (search) search.focus(); 
        }
        if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) { 
            e.preventDefault(); 
            reloadGamelists(); 
        }
        if (e.key === 'ArrowRight') pagerGo(gamesState.page + 1);
        if (e.key === 'ArrowLeft') pagerGo(gamesState.page - 1);
    });
};

// ==================== INITIALIZATION ====================
let PREVDATA = null;

const initializeWebSocket = () => {
    const latestOutput = document.getElementById("jumbo");
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost = location.host;
    wsHost = wsHost.split(':')[0] + ":8080";
    const wsUrl = wsProtocol + '//' + wsHost + '/';
    
    const ws = new WebSocket(wsUrl);
    ws.onmessage = function(event) {
        const d = event.data;
        if (PREVDATA !== d) {
            const dd = JSON.parse(d);
            const content = describe(dd);
            latestOutput.innerHTML = content;
            // Hide the current game section if no content
            if (content === "") {
                latestOutput.style.display = "none";
            } else {
                latestOutput.style.display = "block";
            }
            PREVDATA = d;
            // Recalculate layout when visibility changes
            requestAnimationFrame(recalcTopPads);
        }
    };
    ws.onclose = function() {
        const message = { "msg": "ERROR" };
        const content = describe(message);
        latestOutput.innerHTML = content;
        latestOutput.style.display = content === "" ? "none" : "block";
        requestAnimationFrame(recalcTopPads);
    };
};

const setupEventListeners = () => {
    // Top Random button
    const randTop = document.getElementById('bwe-random-top') || document.getElementById('random-top');
    if (randTop) {
        randTop.addEventListener('click', function(){
            const arr = getFilteredSorted();
            if (!arr.length) return;
            const g = arr[Math.floor(Math.random() * arr.length)];
            launchGame(String(g.path || '').replace(/'/g,''));
        });
    }

    // Bottom pager: page size control
    const ps = document.getElementById('bottom-page-size');
    if (ps) {
        ps.value = String(gamesState.pageSize);
        ps.addEventListener('change', function(e){
            gamesState.pageSize = parseInt(e.target.value, 10);
            gamesState.page = 1; 
            saveGames(); 
            renderFiltered();
        });
    }

    // Current section click
    const jumbo = document.getElementById('jumbo');
    if (jumbo) {
        jumbo.addEventListener('click', function(){
            try {
                if (!PREVDATA) return;
                const dd = JSON.parse(PREVDATA);
                if (dd && dd.name) {
                    const game = {
                        name: dd.name || '',
                        desc: dd.desc || '',
                        image: dd.image || '',
                        thumbnail: dd.thumbnail || '',
                        genre: dd.genre || '',
                        releasedate: dd.releasedate || '',
                        cheevosHash: dd.cheevosHash || '',
                        path: dd.path || '',
                        playcount: dd.playcount || '',
                        players: dd.players || '',
                        developer: dd.developer || '',
                        publisher: dd.publisher || '',
                        rating: dd.rating || '',
                        lastplayed: dd.lastplayed || '',
                        favorite: dd.favorite || 'false',
                    };
                    setDetailModal(game);
                    
                    // Show Kill button when game is running
                    const killBtn = document.getElementById('detailKillBtn');
                    if (killBtn) {
                        killBtn.style.display = 'inline-block';
                        killBtn.onclick = function(){ 
                            emuKill(); 
                            $('#detailModal').modal('hide'); 
                        };
                    }
                    $('#detailModal').modal('show');
                }
            } catch {}
        });
    }

    // Recalc when navbar collapses/expands (hamburger)
    try {
        $('#topNav').on('shown.bs.collapse hidden.bs.collapse', function(){
            requestAnimationFrame(recalcTopPads);
        });
    } catch {}

    // Toggle toolbar
    const tgl = document.getElementById('toggleToolbar');
    if (tgl) {
        tgl.addEventListener('click', function(){
            const tb = document.querySelector('.toolbar');
            if (!tb) return;
            tb.classList.toggle('hidden');
            // Double recalc to handle animation
            requestAnimationFrame(() => {
                setTimeout(recalcTopPads, 100);
            });
        });
    }

    // Systems dock toggle label and layout recalc
    const sysBtn = document.getElementById('showSystems');
    const sysList = document.getElementById('systemList');
    const applySysBtnLabel = () => {
        if (!sysBtn || !sysList) return;
        sysBtn.value = sysList.classList.contains('show') ? 'Hide systems' : 'Show Systems';
    };
    applySysBtnLabel();
    try {
        $('#systemList').on('shown.bs.collapse hidden.bs.collapse', function(){
            applySysBtnLabel();
            requestAnimationFrame(recalcTopPads);
        });
    } catch {}

    // View mode buttons
    const viewGridBtn = document.getElementById('view-grid');
    const viewListBtn = document.getElementById('view-list');
    
    const applyViewButtons = () => {
        viewGridBtn?.classList.remove('is-current');
        viewListBtn?.classList.remove('is-current');
        if (gamesState.view === 'list') {
            viewListBtn?.classList.add('is-current');
        } else {
            viewGridBtn?.classList.add('is-current');
        }
    };
    
    applyViewButtons();
    
    viewGridBtn?.addEventListener('click', () => { 
        gamesState.view = 'grid'; 
        saveGames(); 
        applyViewButtons(); 
        renderFiltered(); 
    });
    
    viewListBtn?.addEventListener('click', () => { 
        gamesState.view = 'list'; 
        saveGames(); 
        applyViewButtons(); 
        renderFiltered(); 
    });

    // Systems modal
    $('#systemsModal').on('shown.bs.modal', function(){
        const listEl = document.getElementById('systemsModalList');
        const filterEl = document.getElementById('systemsModalFilter');
        if (!listEl || !filterEl) return;
        
        const all = (sysState.systems || []).filter(s => String(s.visible) === 'true');
        
        const render = (q = '') => {
            const qq = (q || '').trim().toLowerCase();
            listEl.innerHTML = '';
            
            all.forEach(async s => {
                const label = s.fullname || s.name || '';
                if (qq && !label.toLowerCase().includes(qq)) return;
                
                const item = document.createElement('a');
                item.className = 'list-group-item list-group-item-action';
                
                let count = '';
                try {
                    const res = await fetch(`/systems/${s.name}/games`);
                    const arr = await res.json();
                    const nb = (arr || []).filter(g => String(g.hidden) !== 'true').length;
                    count = ` <span class="badge badge-secondary">${nb}</span>`;
                } catch {}
                
                item.innerHTML = `
                    ${s.logo ? `<img class="sys-logo" src="${s.logo}" alt="">` : ''}
                    <div class="sys-text">${label}${count}</div>
                `;
                
                item.addEventListener('click', function(){
                    $('#systemsModal').modal('hide');
                    sysState.selected = s.name;
                    sysState.recent = [s.name, ...sysState.recent.filter(n => n !== s.name)].slice(0, 24);
                    gamesState.page = 1; 
                    saveGames(); 
                    saveSys();
                    loadGames(s.name);
                    renderSystemDock(true);
                });
                listEl.appendChild(item);
            });
        };
        
        render('');
        filterEl.value = sysState.filter || '';
        filterEl.oninput = (e) => render(e.target.value);
    });
};

const ready = () => {
    loadSys();
    loadGamesPrefs();
    observeCurrentSystem();
    applyScrollbarMode();
    recalcTopPads();
    setupKeyboardShortcuts();
    setupEventListeners();
    initializeWebSocket();

    // Load systems
    fetch('/systems')
    .then(response => response.json())
    .then(data => {
        showSystems(data);
    })
    .catch(error => {
        console.error('Failed to load systems:', error);
    });

    // Auto-select first system if no games are loaded
    setTimeout(() => {
        const hasCards = !!qs('#gameList .card.card-game');
        if (!hasCards) qs('.sys-item')?.click();
    }, 600);
};

// ==================== ENTRY POINT ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

// Expose necessary functions to global scope for onclick handlers
window.launchGame = launchGame;
window.detailFill = detailFill;
window.reloadGamelists = reloadGamelists;
window.emuKill = emuKill;