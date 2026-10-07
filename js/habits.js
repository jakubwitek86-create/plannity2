'use strict';
/* ================= 3) Nawyki ================= */
const habitActive = (h, d) => d >= h.start && (!h.end || d <= h.end);
const habitDue = (h, d) => habitActive(h, d) && isDue(h.freq, d, h.start);
const cycle = s => (!s ? 'v' : s === 'v' ? 'x' : '');

function habitStats(h) {
  const t = today();
  const last = h.end && h.end < t ? h.end : t;
  const f = normFreq(h.freq);
  let v = 0, x = 0, q = 0, due = 0;
  if (f.t === 'perweek') {
    const n = f.n || 1;
    let w = startOfWeek(h.start), streak = 0, best = 0, run = 0, weeks = 0, okWeeks = 0;
    const res = [];
    for (let i = 0; i < 260 && w <= last; i++, w = addDays(w, 7)) {
      let cnt = 0;
      for (let k = 0; k < 7; k++) { const d = addDays(w, k); if (d < h.start || d > last) continue; const s = h.log[d]; if (s === 'v') { cnt++; v++; } else if (s === 'x') x++; }
      const current = w === startOfWeek(t);
      const ok = cnt >= n;
      if (current && !ok) { res.push(null); continue; }
      weeks++; if (ok) okWeeks++;
      res.push(ok);
    }
    res.forEach(r => { if (r === null) return; if (r) { run++; best = Math.max(best, run); } else run = 0; });
    for (let i = res.length - 1; i >= 0; i--) { if (res[i] === null) continue; if (res[i]) streak++; else break; }
    return { v, x, q: Math.max(0, weeks - okWeeks), due: weeks, rate: weeks ? Math.round(okWeeks / weeks * 100) : 0, streak, best, unit: 'tyg.', unitLong: n => `${n} ${plural(n, 'tydzień', 'tygodnie', 'tygodni')}` };
  }
  const days = [];
  for (let d = h.start, i = 0; d <= last && i < 1200; d = addDays(d, 1), i++) {
    if (!isDue(h.freq, d, h.start)) continue;
    const s = h.log[d] || '';
    if (d === t && !s) continue; // dziś jeszcze nieoznaczone – nie liczymy
    days.push(s); due++;
    if (s === 'v') v++; else if (s === 'x') x++; else q++;
  }
  let best = 0, run = 0; days.forEach(s => { if (s === 'v') { run++; best = Math.max(best, run); } else run = 0; });
  let streak = 0; for (let i = days.length - 1; i >= 0; i--) { if (days[i] === 'v') streak++; else break; }
  return { v, x, q, due, rate: due ? Math.round(v / due * 100) : 0, streak, best, unit: 'dni', unitLong: n => dni(n) };
}

function habitCard(h) {
  const t = today(), st = habitStats(h);
  const ended = h.end && h.end < t;
  const info = [];
  if (h.mode === 'until') {
    const left = diffDays(t, h.end);
    info.push(ended ? `<span class="remain">✔ zakończony ${fmt(h.end)}</span>` : `<span class="remain">⏳ zostało ${dni(left)}</span>`);
    info.push(`<span>do ${fmt(h.end)}</span>`);
  } else {
    info.push(`<span class="streak">🔥 passa: ${st.unitLong(st.streak)}</span>`);
    info.push(`<span>od ${fmt(h.start)}</span>`);
  }
  if (h.mode === 'until' && st.streak) info.push(`<span>🔥 ${st.streak} ${st.unit}</span>`);
  const strip = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(t, -i);
    const due = habitDue(h, d);
    const s = h.log[d] || '';
    strip.push(`<div class="c ${d === t ? 'today' : ''}"><span>${d === t ? 'Dziś' : DAYS_SHORT[dow(d)]}</span>
      ${due ? `<button class="tri ${s}" data-act="habit-mark" data-id="${h.id}" data-d="${d}" aria-label="${fmt(d)}: ${s === 'v' ? 'zrealizowane' : s === 'x' ? 'niezrealizowane' : 'brak danych'}">${s === 'v' ? '✓' : s === 'x' ? '✗' : '?'}</button>`
        : `<button class="tri na" disabled aria-label="${fmt(d)}: nie dotyczy">–</button>`}
      <span>${parse(d).getDate()}</span></div>`);
  }
  return `<article class="habit">
    <div class="hh" data-act="habit-open" data-id="${h.id}">
      <div style="flex:1;min-width:0"><div class="hn">${esc(h.name)}</div>
        <div class="hm"><span>🔁 ${freqLabel(h.freq)}</span>${info.join('')}</div></div>
      <span class="dim small" style="white-space:nowrap">${st.rate}% ›</span>
    </div>
    <div class="strip">${strip.join('')}</div>
  </article>`;
}

V.habits = {
  title: 'Nawyki',
  render() {
    const t = today();
    const act = S.habits.filter(h => !(h.end && h.end < t));
    const ended = S.habits.filter(h => h.end && h.end < t);
    const todo = act.filter(h => habitDue(h, t) && !h.log[t]).length;
    return `
    <div class="card"><h2 style="margin-bottom:4px">Dziś</h2>
      <div class="muted small">${act.length ? (todo ? `Do oznaczenia: <b style="color:#fff">${todo}</b> ${plural(todo, 'nawyk', 'nawyki', 'nawyków')}` : 'Wszystkie dzisiejsze nawyki oznaczone 👏') : 'Brak aktywnych nawyków'}</div>
      <div class="legend"><span><i style="background:var(--green)"></i>✓ zrealizowane</span><span><i style="background:var(--red)"></i>✗ niezrealizowane</span><span><i style="background:rgba(255,211,77,.5)"></i>? brak danych</span></div>
      <div class="small dim" style="margin-top:6px">Dotknij kwadrat, aby zmienić stan. Dotknij nazwę, aby zobaczyć kalendarz historii.</div>
    </div>
    ${act.length ? act.map(habitCard).join('') : `<div class="empty"><b>Brak nawyków</b>Dodaj nawyk przyciskiem +.</div>`}
    ${ended.length ? `<details class="more"><summary>Zakończone (${ended.length})</summary><div style="margin-top:10px">${ended.map(habitCard).join('')}</div></details>` : ''}
    ${fab('habit-new', 'Nowy nawyk')}`;
  },
};

function habitForm(h) {
  const mode = h ? h.mode : 'from';
  const date = h ? (h.mode === 'until' ? h.end : h.start) : today();
  return field('Nawyk', inText('name', h ? h.name : '', 'np. 10 000 kroków')) +
    `<div class="grid2">${field('Tryb', sel('mode', [['from', 'Od dnia (passa)'], ['until', 'Do dnia (odliczanie)']], mode))}${field('Data', inDate('date', date))}</div>` +
    `<p class="hint small dim" style="margin:-6px 0 14px">„Od dnia” – nawyk bez końca, liczona jest passa. „Do dnia” – nawyk realizowany od dziś do wskazanej daty, pokazuje ile dni zostało.</p>` +
    freqFields(h ? h.freq : { t: 'daily' }, 'habit');
}
function saveHabit(h, fd, form) {
  if (!fd.name.trim()) { toast('Wpisz nazwę nawyku'); return false; }
  const date = fd.date || today();
  const freq = readFreq(form);
  const n = h || { id: uid(), log: {}, createdAt: today() };
  n.name = fd.name.trim(); n.freq = freq; n.mode = fd.mode;
  if (fd.mode === 'until') {
    if (date < today() && !h) { toast('Data „do dnia” jest w przeszłości'); return false; }
    n.start = (h && h.mode === 'until') ? h.start : (h ? h.start : today());
    if (n.start > date) n.start = date;
    n.end = date;
  } else { n.start = date; n.end = null; }
  if (!h) S.habits.push(n);
  save(); render();
}
A['habit-new'] = () => openSheet({ title: 'Nowy nawyk', body: habitForm(null), onSave: (fd, f) => saveHabit(null, fd, f) });
A['habit-edit'] = el => {
  const h = S.habits.find(x => x.id === el.dataset.id); if (!h) return;
  openSheet({
    title: 'Edytuj nawyk', body: habitForm(h), onSave: (fd, f) => saveHabit(h, fd, f),
    onDelete: () => confirmSheet(`Usunąć nawyk „${h.name}” wraz z historią?`, () => { S.habits = S.habits.filter(x => x !== h); save(); render(); }),
  });
};
A['habit-mark'] = el => {
  const h = S.habits.find(x => x.id === el.dataset.id); if (!h) return;
  const d = el.dataset.d; const n = cycle(h.log[d]);
  if (n) h.log[d] = n; else delete h.log[d];
  save();
  if (sheetCtx && sheetCtx.refresh) refreshSheet();
  render();
};
A['freq-change'] = el => syncFreqFields(el.closest('form'));

/* ---------- kalendarz historii nawyku ---------- */
let habitCal = null;
function habitCalHTML() {
  const h = S.habits.find(x => x.id === habitCal.id); if (!h) return '';
  const t = today(), m = habitCal.month, st = habitStats(h);
  const first = parse(m), y = first.getFullYear(), mo = first.getMonth();
  const offset = dow(m), nDays = lastDom(y, mo);
  let cells = DAYS_SHORT.map(d => `<div class="dn">${d}</div>`).join('');
  for (let i = 0; i < offset; i++) cells += '<div></div>';
  for (let i = 1; i <= nDays; i++) {
    const d = `${y}-${pad(mo + 1)}-${pad(i)}`;
    const due = habitDue(h, d), s = h.log[d] || '';
    const fut = d > t;
    let cls = 'dc';
    if (!due) cls += ' off'; else if (s === 'v') cls += ' v'; else if (s === 'x') cls += ' x'; else if (!fut) cls += ' q';
    if (d === t) cls += ' today';
    cells += (due && !fut) ? `<button type="button" class="${cls}" data-act="habit-mark" data-id="${h.id}" data-d="${d}" aria-label="${fmt(d)}">${i}</button>` : `<div class="${cls}">${i}</div>`;
  }
  return `
    <div class="muted small" style="margin-bottom:10px">🔁 ${freqLabel(h.freq)} · ${h.mode === 'until' ? `${fmt(h.start)} – ${fmt(h.end)}` : `od ${fmt(h.start)}`}</div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi"><b style="color:var(--green)">${st.v}</b><small>✓</small></div>
      <div class="kpi"><b style="color:var(--red)">${st.x}</b><small>✗</small></div>
      <div class="kpi"><b style="color:var(--yellow)">${st.q}</b><small>${st.unit === 'tyg.' ? 'tyg. poniżej' : '?'}</small></div>
      <div class="kpi"><b>${st.rate}%</b><small>realizacja</small></div>
    </div>
    <div class="muted small" style="margin:8px 0">🔥 Passa: <b style="color:#fff">${st.unitLong(st.streak)}</b> · rekord: <b style="color:#fff">${st.unitLong(st.best)}</b></div>
    <div class="mcal">
      <div class="mh"><button type="button" class="icon-btn" data-act="hcal-move" data-v="-1" aria-label="Poprzedni miesiąc">${icon('left')}</button>
        <b>${cap(MONTHS[mo])} ${y}</b>
        <button type="button" class="icon-btn" data-act="hcal-move" data-v="1" aria-label="Następny miesiąc">${icon('right')}</button></div>
      <div class="grid">${cells}</div>
      <div class="legend"><span><i style="background:var(--green)"></i>zrealizowane</span><span><i style="background:var(--red)"></i>niezrealizowane</span><span><i style="background:rgba(255,211,77,.5)"></i>brak danych</span><span><i style="background:rgba(150,200,255,.1)"></i>nie dotyczy</span></div>
    </div>
    <div class="row" style="margin-top:16px"><button type="button" class="btn outline" style="flex:1" data-act="habit-edit" data-id="${h.id}">${icon('edit', 'sm')} Edytuj nawyk</button></div>`;
}
A['habit-open'] = el => {
  const h = S.habits.find(x => x.id === el.dataset.id); if (!h) return;
  habitCal = { id: h.id, month: startOfMonth(today()) };
  openSheet({ title: h.name, body: habitCalHTML(), refresh: habitCalHTML });
};
A['hcal-move'] = el => { habitCal.month = startOfMonth(addMonths(habitCal.month, +el.dataset.v)); refreshSheet(); };
