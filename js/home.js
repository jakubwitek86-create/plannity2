'use strict';
/* ================= Strona startowa ================= */
const MODULES = [
  { r: 'tasks', name: 'Do zrobienia', ic: 'tasks' },
  { r: 'goals', name: 'Plan roczny', ic: 'goals' },
  { r: 'habits', name: 'Nawyki', ic: 'habits' },
  { r: 'counters', name: 'Licznik dni', ic: 'counters' },
  { r: 'calendar', name: 'Kalendarz', ic: 'calendar' },
  { r: 'schedule', name: 'Harmonogram dnia', ic: 'schedule' },
  { r: 'chores', name: 'Obowiązki domowe', ic: 'chores' },
  { r: 'notes', name: 'Notatki', ic: 'notes' },
  { r: 'stats', name: 'Statystyki', ic: 'stats' },
];
function moduleBadge(r) {
  const t = today();
  switch (r) {
    case 'tasks': {
      const open = S.tasks.filter(k => !k.done && k.date <= t);
      const late = open.some(k => k.origDate && k.origDate < t);
      return open.length ? { n: open.length, warn: late } : null;
    }
    case 'habits': { const n = S.habits.filter(h => habitActive(h, t) && isDue(h.freq, t, h.start) && !h.log[t]).length; return n ? { n } : null; }
    case 'chores': { const due = S.chores.filter(c => c.nextDate && c.nextDate <= t); return due.length ? { n: due.length, warn: due.some(c => c.nextDate < t) } : null; }
    case 'goals': { const g = S.goals.filter(x => !x.done).length; return g ? { n: g } : null; }
    case 'notes': return S.notes.length ? { n: S.notes.length } : null;
  }
  return null;
}
function tileHTML(m) {
  const b = moduleBadge(m.r);
  return `<button type="button" class="tile" data-act="go" data-r="${m.r}">${b ? `<span class="badge ${b.warn ? 'warn' : ''}">${b.n}</span>` : ''}<span class="ic">${icon(m.ic)}</span>${m.name}</button>`;
}
function greeting() { const h = new Date().getHours(); return h < 5 ? 'Dobranoc' : h < 12 ? 'Dzień dobry' : h < 18 ? 'Cześć' : 'Dobry wieczór'; }

V.home = {
  title: 'Plannity',
  render() {
    return `
    <section class="hero"><div class="hero-date">${fmtLong(today())}</div><h1 class="hero-title">${greeting()}, Kuba</h1></section>
    <section class="tiles">${MODULES.map(tileHTML).join('')}</section>
    <section class="card" id="weather">${weatherHTML()}</section>
    <section class="card sun" id="sun">${sunHTML()}</section>`;
  },
  after() { scrollHoursToNow(); bindSunSwipe(); fetchWeather(false); },
};

/* ---------- pogoda ---------- */
function weatherHTML() {
  const W = S.weather && S.weather.data;
  if (!W) {
    return `<h2>Pogoda · ${LOC.name}</h2><p class="muted">${S.weather && S.weather.err ? 'Nie udało się pobrać pogody – sprawdź internet.' : 'Pobieram prognozę…'}</p>
      <button class="btn small" data-act="wx-refresh">${icon('refresh', 'sm')} Odśwież</button>`;
  }
  const c = W.current || {};
  const now = wx(c.weather_code, c.is_day);
  const t = today();
  const curH = new Date().getHours();
  const hours = [];
  (W.hourly.time || []).forEach((tm, i) => {
    if (tm.slice(0, 10) !== t) return;
    hours.push({ h: +tm.slice(11, 13), temp: W.hourly.temperature_2m[i], code: W.hourly.weather_code[i], p: W.hourly.precipitation_probability[i], day: W.hourly.is_day[i] });
  });
  const days = [];
  (W.daily.time || []).forEach((d, i) => { if (d > t && days.length < 5) days.push({ d, code: W.daily.weather_code[i], max: W.daily.temperature_2m_max[i], min: W.daily.temperature_2m_min[i], p: W.daily.precipitation_probability_max[i] }); });
  const upd = new Date(S.weather.at);
  return `
    <div class="row"><h2 style="margin:0;flex:1">Pogoda</h2>
      <button class="icon-btn" style="width:36px;height:36px" data-act="wx-refresh" aria-label="Odśwież pogodę">${icon('refresh', 'sm')}</button></div>
    <div class="wx-loc">${LOC.name} · aktualizacja ${pad(upd.getHours())}:${pad(upd.getMinutes())}${S.weather.err ? ' · offline' : ''}</div>
    <div class="wx-now" style="margin-top:10px">
      <div class="emo">${now.emo}</div>
      <div class="big">${Math.round(c.temperature_2m)}°</div>
      <div><b>${now.label}</b><div class="muted small">Odczuwalna ${Math.round(c.apparent_temperature)}° · wiatr ${Math.round(c.wind_speed_10m)} km/h · wilg. ${c.relative_humidity_2m}%</div></div>
    </div>
    <div class="wx-hours" id="wxHours">${hours.map(h => {
      const w = wx(h.code, h.day);
      return `<div class="wx-h ${h.h === curH ? 'now' : h.h < curH ? 'past' : ''}" data-h="${h.h}"><span class="dim">${h.h === curH ? 'Teraz' : pad(h.h) + ':00'}</span><span class="e">${w.emo}</span><b>${Math.round(h.temp)}°</b><span class="dim">💧${h.p ?? 0}%</span></div>`;
    }).join('')}</div>
    <div class="wx-days">${days.map(d => {
      const w = wx(d.code);
      return `<div class="wx-d"><span><b>${DAYS_FULL[dow(d.d)]}</b> <span class="dim small">${fmtShort(d.d)}</span></span><span class="e" title="${w.label}">${w.emo}</span><span class="dim small">💧${d.p ?? 0}%</span><span class="rng">${Math.round(d.max)}° <span>/ ${Math.round(d.min)}°</span></span></div>`;
    }).join('')}</div>`;
}
function scrollHoursToNow() {
  const box = $('#wxHours'); if (!box) return;
  const now = $('.wx-h.now', box); if (now) box.scrollLeft = Math.max(0, now.offsetLeft - box.offsetLeft - 64);
}
A['wx-refresh'] = () => { const el = $('#weather'); if (el) el.style.opacity = .6; fetchWeather(true).then(() => { const e = $('#weather'); if (e) e.style.opacity = 1; }); };

/* ---------- słońce ---------- */
let sunDate = null;
function sunHTML() {
  const t = today();
  const d = sunDate || t;
  const st = sunTimes(d);
  const y = +d.slice(0, 4);
  // najdłuższy i najkrótszy dzień roku
  let best = null, worst = null;
  for (let i = -6; i <= 6; i++) {
    const a = addDays(`${y}-06-21`, i), la = sunTimes(a).len; if (!best || la > best.len) best = { d: a, len: la };
    const b = addDays(`${y}-12-21`, i), lb = sunTimes(b).len; if (!worst || lb < worst.len) worst = { d: b, len: lb };
  }
  const prev = sunTimes(addDays(d, -1)).len;
  const delta = st.len - prev;
  const dsec = Math.round(Math.abs(delta) * 60);
  const deltaTxt = `${delta >= 0 ? '+' : '−'}${Math.floor(dsec / 60)} min ${dsec % 60} s`;
  // pozycja słońca na łuku
  let f = 0.5, up = true;
  if (d === t) {
    const now = Date.now();
    f = (now - st.rise) / (st.set - st.rise);
    up = f >= 0 && f <= 1; f = clamp(f, 0, 1);
  }
  const X0 = 16, X1 = 304, Y0 = 118, H = 98;
  const pts = [];
  for (let i = 0; i <= 60; i++) { const p = i / 60; pts.push(`${(X0 + (X1 - X0) * p).toFixed(1)},${(Y0 - H * Math.sin(Math.PI * p)).toFixed(1)}`); }
  const sx = X0 + (X1 - X0) * f, sy = Y0 - H * Math.sin(Math.PI * f);
  const dd = parse(d);
  const sunLabel = `${DAYS_MED[dow(d)]}, ${dd.getDate()} ${MONTHS_GEN[dd.getMonth()]}`;
  const longer = st.len >= best.len - 0.5;
  return `
    <div class="sun-nav">
      <button class="navb" data-act="sun-move" data-v="-1" aria-label="Poprzedni dzień">${icon('left', 'sm')}</button>
      <span class="d">${sunLabel}</span>
      <button class="navb" data-act="sun-move" data-v="1" aria-label="Następny dzień">${icon('right', 'sm')}</button>
      <button class="today" data-act="sun-today" ${d === t ? 'disabled' : ''}>DZIŚ</button>
    </div>
    <div class="label">SŁOŃCE</div>
    <div class="ttl">Wschód i zachód słońca</div>
    <svg class="arc" viewBox="0 0 320 132" role="img" aria-label="Łuk słońca">
      <line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="rgba(255,255,255,.5)" stroke-width="1.5" stroke-dasharray="3 4"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${X0}" cy="${Y0}" r="4.5" fill="#fff"/><circle cx="${X1}" cy="${Y0}" r="4.5" fill="#fff"/>
      <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="11" fill="${up ? '#ffc21a' : '#9fb4d9'}" stroke="${up ? '#ffe28a' : '#c9d6ee'}" stroke-width="2.5"/>
    </svg>
    <div class="sun-times">
      <div><small>WSCHÓD</small><b>${fmtTime(st.rise)}</b></div>
      <div><small>ZACHÓD</small><b>${fmtTime(st.set)}</b></div>
    </div>
    <div class="sun-stats">
      <div class="r"><span>Ten dzień trwa</span><b>${fmtDur(st.len)}</b></div>
      <div class="r"><span>Zmiana względem poprzedniego dnia</span><b>${deltaTxt}</b></div>
      ${longer ? `<div class="r"><span>Najdłuższy dzień roku</span><b class="gold">${fmtDM(best.d)}</b></div>` :
      `<div class="r"><span>Krócej niż najdłuższy dzień roku</span><b class="gold">${fmtDur(best.len - st.len)} (najdłuższy: ${fmtDM(best.d)})</b></div>`}
      <div class="r"><span>Dłużej niż najkrótszy dzień roku</span><b>${fmtDur(st.len - worst.len)} (${fmtDM(worst.d)})</b></div>
    </div>
    <div class="sun-hint">← przesuń, by zobaczyć inne dni →</div>`;
}
function rerenderSun() { const el = $('#sun'); if (el) el.innerHTML = sunHTML(); }
A['sun-move'] = el => { sunDate = addDays(sunDate || today(), +el.dataset.v); rerenderSun(); };
A['sun-today'] = () => { sunDate = null; rerenderSun(); };
function bindSunSwipe() {
  const el = $('#sun'); if (!el) return;
  let x0 = null, y0 = null;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { sunDate = addDays(sunDate || today(), dx < 0 ? 1 : -1); rerenderSun(); }
    x0 = null;
  }, { passive: true });
}
