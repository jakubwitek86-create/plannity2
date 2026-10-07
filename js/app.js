'use strict';
/* ================= Router, nawigacja, zdarzenia ================= */
const NAV = [['home', 'Start', 'home'], ['tasks', 'Zadania', 'tasks'], ['calendar', 'Kalendarz', 'calendar'], ['habits', 'Nawyki', 'habits'], ['menu', 'Więcej', 'menu']];
const currentRoute = () => { const r = (location.hash || '').replace(/^#\/?/, ''); return V[r] ? r : 'home'; };
function go(r) { if (currentRoute() === r) { render(); window.scrollTo(0, 0); return; } location.hash = '#/' + r; }

let lastRoute = null;
function render() {
  const r = currentRoute(), view = V[r], main = $('#view');
  const same = r === lastRoute;
  const y = window.scrollY;
  const openKeys = same ? $$('details[open][data-key]', main).map(d => d.dataset.key) : [];
  main.innerHTML = view.render();
  openKeys.forEach(k => { const d = $(`details[data-key="${k}"]`, main); if (d) d.open = true; });
  $('#pageTitle').textContent = view.title;
  $('#backBtn').innerHTML = r === 'home' ? icon('home') : icon('back');
  $('#backBtn').classList.toggle('ghost', r === 'home');
  $('#bottomnav').innerHTML = NAV.map(([k, l, ic]) => `<button class="${k === r ? 'on' : ''}" data-act="${k === 'menu' ? 'menu' : 'go'}" data-r="${k}">${icon(ic)}<span>${l}</span></button>`).join('');
  if (view.after) view.after();
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
    <p class="small muted" style="margin-top:0">Dane zapisują się w pamięci telefonu (w tej przeglądarce). Zrób kopię przed zmianą telefonu lub czyszczeniem przeglądarki.</p>
    <div class="row wrap">
      <button type="button" class="btn outline" data-act="backup-export">${icon('download', 'sm')} Eksportuj dane</button>
      <button type="button" class="btn outline" data-act="backup-import">${icon('upload', 'sm')} Importuj dane</button>
    </div>
    <input type="file" id="importFile" accept="application/json,.json" class="hidden">
    <h2 class="sec-title">Inne</h2>
    <div class="row wrap">
      <button type="button" class="btn outline" data-act="reset-chores">Przywróć obowiązki z pliku</button>
      <button type="button" class="btn danger" data-act="reset-all">Wyczyść wszystkie dane</button>
    </div>
    <p class="small dim" style="margin-top:16px">Plannity ${APP_VERSION} · pogoda: Open-Meteo.com · wschody/zachody liczone lokalnie dla Warszawy (Ochota/Włochy)</p>`,
});
A['backup-export'] = () => {
  const data = { ...S, weather: null, exportedAt: new Date().toISOString(), app: 'Plannity' };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `plannity-kopia-${today()}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('Zapisano plik kopii');
};
A['backup-import'] = () => {
  const inp = $('#importFile'); if (!inp) return;
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.tasks) || !Array.isArray(d.habits)) throw new Error('format');
      const def = defaultState();
      S = { ...def, ...d, ui: { ...def.ui, ...(d.ui || {}) } };
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
  S.ui.calDate = today(); S.ui.schedWeek = startOfWeek(today());
  rolloverTasks();
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
