'use strict';
/* ================= Router, nawigacja, zdarzenia ================= */
const currentRoute = () => { const r = (location.hash || '').replace(/^#\/?/, ''); return V[r] ? r : 'home'; };
function go(r) { if (currentRoute() === r) { render(); window.scrollTo(0, 0); return; } location.hash = '#/' + r; }

let lastRoute = null;
function render() {
  const r = currentRoute(), view = V[r], main = $('#view');
  const same = r === lastRoute;
  const y = window.scrollY;
  const openKeys = same ? $$('details[open][data-key]', main).map(d => d.dataset.key) : [];
  try { main.innerHTML = view.render(); }
  catch (err) {
    console.error(err);
    main.innerHTML = `<div class="card bk warn"><h2>Coś poszło nie tak w tej zakładce</h2>
      <p class="small">Twoje dane są bezpieczne. Zapisz kopię i wyślij mi ten komunikat:</p>
      <pre style="white-space:pre-wrap;font-size:12px;color:var(--muted)">${esc(String(err && err.stack || err)).slice(0, 600)}</pre>
      <div class="row wrap"><button class="btn primary small" data-act="backup-export">Zapisz kopię</button><button class="btn outline small" data-act="go" data-r="home">Start</button></div></div>`;
  }
  openKeys.forEach(k => { const d = $(`details[data-key="${k}"]`, main); if (d) d.open = true; });
  $('#pageTitle').textContent = view.title;
  $('#backBtn').innerHTML = r === 'home' ? icon('home') : icon('back');
  $('#backBtn').classList.toggle('ghost', r === 'home');
  try { if (view.after) view.after(); } catch (err) { console.error(err); }
  if (same) window.scrollTo(0, y); else window.scrollTo(0, 0);
  lastRoute = r;
}
window.addEventListener('hashchange', () => { if (currentRoute() !== 'schedule') schedScrolled = false; closeSheet(); render(); });

/* ---------- delegacja zdarzeń ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { closeSheet(); return; }
  if (e.target.closest('[data-sheet-del]')) { if (sheetCtx && sheetCtx.onDelete) sheetCtx.onDelete(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'freq-change') return; // obsługiwane przez 'change'
  if (el.tagName === 'SELECT') return;
  const fn = A[act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.act === 'freq-change') { syncFreqFields(el.closest('form')); return; }
  const k = el.dataset && el.dataset.change; if (k && CH[k]) CH[k](el);
});
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.input; if (k && INPUTS[k]) INPUTS[k](e.target); });
document.addEventListener('submit', e => {
  const form = e.target; e.preventDefault();
  if (form.closest('#sheet')) {
    if (!sheetCtx || !sheetCtx.onSave) return;
    const fd = {}; new FormData(form).forEach((v, k) => { fd[k] = v; });
    const res = sheetCtx.onSave(fd, form);
    if (res !== false && sheetCtx && sheetCtx.form === form) closeSheet();
    return;
  }
  const k = form.dataset.form; if (k && FORMS[k]) FORMS[k](form);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet').classList.contains('open')) closeSheet(); });

A.go = el => { closeSheet(); go(el.dataset.r); };

/* ---------- menu + kopia zapasowa ---------- */
A.menu = () => openSheet({
  title: 'Menu',
  body: `<div class="menu-list">${MODULES.map(tileHTML).join('')}</div>
    <h2 class="sec-title" style="margin-top:6px">Kopia zapasowa</h2>
    <p class="small muted" style="margin-top:0">Dane są tylko w pamięci tego telefonu. Ostatnia kopia: <b style="color:#fff">${S.meta.lastBackup ? fmt(S.meta.lastBackup) : 'brak'}</b>. Ochrona przed automatycznym usunięciem: <b style="color:#fff">${S.meta.persisted ? 'włączona' : 'niedostępna'}</b>.</p>
    <div class="row wrap">
      ${canShareFile() ? `<button type="button" class="btn outline" data-act="backup-share">${icon('send', 'sm')} Wyślij kopię (Dysk)</button>` : ''}<button type="button" class="btn outline" data-act="backup-export">${icon('download', 'sm')} Eksportuj dane</button>
      <button type="button" class="btn outline" data-act="backup-import">${icon('upload', 'sm')} Importuj dane</button>
    </div>
    <h2 class="sec-title">Inne</h2>
    <div class="row wrap">
      <button type="button" class="btn outline" data-act="reset-chores">Przywróć obowiązki z pliku</button>
      <button type="button" class="btn danger" data-act="reset-all">Wyczyść wszystkie dane</button>
    </div>
    <p class="small dim" style="margin-top:16px">Plannity ${APP_VERSION} · pogoda: Open-Meteo.com · wschody/zachody liczone lokalnie dla Warszawy (Ochota/Włochy)</p>`,
});
A['backup-export'] = () => {
  S.meta.lastBackup = today(); save();
  const blob = new Blob([backupJSON()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = backupName();
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('Zapisano kopię w Pobranych'); if (currentRoute() === 'home') render();
};
A['backup-share'] = async () => {
  try {
    const file = new File([backupJSON()], backupName(), { type: 'application/json' });
    await navigator.share({ files: [file], title: 'Plannity – kopia danych' });
    S.meta.lastBackup = today(); save(); toast('Kopia wysłana ✓'); if (currentRoute() === 'home') render();
  } catch (e) { if (e && e.name !== 'AbortError') A['backup-export'](); }
};
A['backup-import'] = () => {
  const inp = $('#importFile'); if (!inp) return;
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.tasks) || !Array.isArray(d.habits)) throw new Error('format');
      const def = defaultState();
      S = { ...def, ...d, ui: { ...def.ui, ...(d.ui || {}) }, meta: { ...def.meta, ...(d.meta || {}), lastBackup: today() } };
      save(); closeSheet(); render(); toast('Zaimportowano dane');
    } catch (err) { toast('To nie jest plik kopii Plannity'); }
  };
  inp.click();
};
A['reset-chores'] = () => confirmSheet('Zastąpić listę obowiązków listą z pliku? Historia wykonań obowiązków zostanie usunięta.', () => { S.chores = seedChores(); save(); go('chores'); }, 'Przywróć');
A['reset-all'] = () => confirmSheet('Usunąć wszystkie dane Plannity z tego telefonu? Tej operacji nie da się cofnąć.', () => { S = defaultState(); save(); go('home'); render(); }, 'Wyczyść');

/* ---------- start ---------- */
function init() {
  S = loadState();
  S.ui.calDate = today(); S.ui.schedWeek = startOfWeek(today()); S.ui.habitReorder = false; S.ui.giftReorder = false;
  rolloverTasks();
  requestPersist();
  save();
  $('#menuBtn').innerHTML = icon('menu');
  render();
  // zmiana dnia przy otwartej aplikacji
  let day = today();
  const tick = () => { if (today() !== day) { day = today(); rolloverTasks(); render(); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); if (currentRoute() === 'home') fetchWeather(false); } });
  setInterval(tick, 60000);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
  }
}
init();
