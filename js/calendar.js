'use strict';
/* ================= 5) Kalendarz (v1.2 – czytelny układ) =================
   Siatka miesiąca pokazuje tylko KONKRETNE wpisy (zadania, terminy celów, liczniki, rzadkie obowiązki).
   Rutyny (nawyki, codzienne obowiązki) są zwinięte w podsumowanie dnia, żeby nie zagłuszały reszty. */
const TYPES = {
  task: ['Zadanie', '#4fb3ff'], goal: ['Cel', '#b18cff'], ms: ['Krok milowy', '#c9b3ff'],
  habit: ['Nawyk', '#34d27b'], counter: ['Licznik', '#ffb547'], chore: ['Obowiązek', '#ff8fb1'],
};
const SRC = [['task', 'Zadania'], ['goal', 'Cele'], ['counter', 'Liczniki'], ['chore', 'Obowiązki'], ['habit', 'Nawyki']];
const srcOn = k => S.ui.calSrc.includes(k);

// obowiązek „częsty” = rutyna (codziennie, co 2–6 dni, kilka dni w tygodniu) – nie trafia do siatki
function choreFrequent(c) {
  const f = normFreq(c.freq);
  return f.t === 'daily' || f.t === 'perweek' || (f.t === 'every' && f.n < 7) || (f.t === 'weekdays' && (f.days || []).length > 1);
}
// czy obowiązek wypada w dniu d (projekcja w przód od najbliższego terminu)
function choreOn(c, d) {
  const t = today();
  if (d < t) return false;
  if (!c.nextDate) return false;
  if (d === t) return c.nextDate <= t;
  if (d < c.nextDate) return false;
  if (d === c.nextDate) return true;
  if (normFreq(c.freq).t === 'once') return false;
  return isDue(c.freq, d, c.nextDate);
}
const choreDoneOn = (c, d) => (c.history || []).some(h => h.d === d);

/* ---------- konkretne wpisy dnia ---------- */
function eventsFor(d) {
  const out = [];
  if (srcOn('task')) S.tasks.forEach(k => {
    const day = k.done ? (k.doneDate || k.date) : k.date;
    if (day === d) out.push({ type: 'task', title: k.title, sub: `${PRIO[k.prio]} priorytet${isOverdue(k) ? ` · przeniesione z ${fmtShort(k.origDate)}` : ''}`, done: k.done, overdue: isOverdue(k), prio: k.prio, act: `data-act="task-toggle" data-id="${k.id}"` });
  });
  if (srcOn('goal')) S.goals.forEach(g => {
    const add = (o, type, ctx) => {
      const act = type === 'goal' ? `data-act="goal-toggle" data-id="${g.id}"` : `data-act="ms-toggle" data-g="${g.id}" data-m="${o.id}"`;
      if (o.end === d) out.push({ type, title: o.title, sub: `termin${ctx}`, done: o.done, act, tag: 'termin' });
      else if (o.start === d) out.push({ type, title: o.title, sub: `start${o.end ? ` (do ${fmt(o.end)})` : ''}${ctx}`, done: o.done, act, tag: 'start' });
    };
    add(g, 'goal', ` · ${catName(g.cat)}`);
    (g.ms || []).forEach(m => add(m, 'ms', ` · ${g.title}`));
  });
  if (srcOn('counter')) S.counters.forEach(c => { if (c.date === d) out.push({ type: 'counter', title: c.title, sub: 'licznik dni', act: 'data-act="go" data-r="counters"' }); });
  if (srcOn('chore')) S.chores.forEach(c => {
    if (choreFrequent(c)) return;
    if (choreOn(c, d)) out.push({ type: 'chore', title: c.title, sub: `${c.area} · ${freqLabel(c.freq)}${c.nextDate < today() ? ` · zaległe od ${fmtShort(c.nextDate)}` : ''}`, overdue: c.nextDate < today(), act: d === today() ? `data-act="chore-done" data-id="${c.id}"` : '' });
    else if (choreDoneOn(c, d)) out.push({ type: 'chore', title: c.title, sub: `${c.area} · wykonane`, done: true });
  });
  const rank = { task: 0, goal: 1, ms: 2, counter: 3, chore: 4 };
  return out.sort((a, b) => (a.done - b.done) || (rank[a.type] - rank[b.type]) || ((a.prio || 9) - (b.prio || 9)));
}
/* ---------- rutyny dnia (zwijane) ---------- */
function routinesFor(d) {
  const t = today();
  const habits = srcOn('habit') ? S.habits.filter(h => habitDue(h, d)) : [];
  const chores = srcOn('chore') ? S.chores.filter(c => choreFrequent(c) && (choreOn(c, d) || choreDoneOn(c, d))) : [];
  return {
    habits, chores,
    hDone: habits.filter(h => h.log[d] === 'v').length,
    hFail: habits.filter(h => h.log[d] === 'x').length,
    cDone: chores.filter(c => choreDoneOn(c, d)).length,
    past: d < t,
  };
}
/* ---------- cele trwające (ciągłość) ---------- */
function ongoingFor(d) {
  if (!srcOn('goal')) return [];
  const out = [];
  S.goals.forEach(g => {
    const add = (o, type) => { if (o.start && o.start < d && (!o.end || d < o.end) && !o.done) out.push({ type, title: o.title, start: o.start, end: o.end }); };
    add(g, 'goal'); (g.ms || []).forEach(m => add(m, 'ms'));
  });
  return out;
}

/* ---------- elementy ---------- */
function evRow(e) {
  const c = TYPES[e.type][1];
  const ctl = e.act && e.type !== 'counter' && !(e.type === 'chore' && e.done) ? `<button class="check ${e.done ? 'on' : ''}" ${e.act} aria-label="Odhacz"></button>` : '';
  return `<div class="ev ${e.done ? 'done' : ''} ${e.overdue ? 'overdue' : ''}" style="--ec:${c}">
    ${ctl}<div class="et"><b>${esc(e.title)}</b><small>${TYPES[e.type][0]}${e.sub ? ' · ' + esc(e.sub) : ''}</small></div></div>`;
}
function habitRow(h, d) {
  const s = h.log[d] || '';
  const ctl = d <= today() ? `<button class="tri ${s}" data-act="habit-mark" data-id="${h.id}" data-d="${d}">${s === 'v' ? '✓' : s === 'x' ? '✗' : '?'}</button>` : '';
  return `<div class="ev" style="--ec:${TYPES.habit[1]}">${ctl}<div class="et"><b>${esc(h.name)}</b><small>${freqLabel(h.freq)}</small></div></div>`;
}
function choreRowCal(c, d) {
  const done = choreDoneOn(c, d), late = !done && d === today() && c.nextDate < d;
  const ctl = d === today() && !done ? `<button class="check" data-act="chore-done" data-id="${c.id}" aria-label="Zrobione"></button>` : done ? '<span class="okmark">✓</span>' : '';
  return `<div class="ev ${done ? 'done' : ''} ${late ? 'overdue' : ''}" style="--ec:${TYPES.chore[1]}">${ctl}<div class="et"><b>${esc(c.title)}</b><small>${c.area}${late ? ` · zaległe od ${fmtShort(c.nextDate)}` : ''}</small></div></div>`;
}
function routineSummary(r) {
  const parts = [];
  if (r.habits.length) parts.push(`🔁 nawyki ${r.hDone}/${r.habits.length}${r.hFail ? ` · ✗${r.hFail}` : ''}`);
  if (r.chores.length) parts.push(`🏠 obowiązki ${r.cDone}/${r.chores.length}`);
  return parts.join('  ·  ');
}

function dayAgenda(d, opts = {}) {
  const ev = eventsFor(d), r = routinesFor(d), on = ongoingFor(d);
  const open = opts.open ? 'open' : '';
  let html = '';
  html += ev.length ? ev.map(evRow).join('') : `<div class="cal-empty">Brak zaplanowanych wpisów</div>`;
  if (r.habits.length) html += `<details class="cal-group" data-key="cgh-${d}" ${open}><summary><span>🔁 Nawyki</span><b>${r.hDone}/${r.habits.length}</b></summary>${r.habits.map(h => habitRow(h, d)).join('')}</details>`;
  if (r.chores.length) html += `<details class="cal-group" data-key="cgc-${d}" ${open}><summary><span>🏠 Obowiązki codzienne</span><b>${r.cDone}/${r.chores.length}</b></summary>${r.chores.map(c => choreRowCal(c, d)).join('')}</details>`;
  if (on.length) html += `<details class="cal-group" data-key="cgo-${d}"><summary><span>⏳ Cele w trakcie</span><b>${on.length}</b></summary>${on.map(s => {
    const n = diffDays(s.start, d) + 1, tot = s.end ? diffDays(s.start, s.end) + 1 : null;
    return `<div class="ev span" style="--ec:${TYPES[s.type][1]}"><div class="et"><b>${esc(s.title)}</b><small>dzień ${n}${tot ? ` z ${tot} · do ${fmt(s.end)}` : ` · od ${fmt(s.start)}`}</small></div></div>`;
  }).join('')}</details>`;
  return html;
}

V.calendar = {
  title: 'Kalendarz',
  render() {
    const u = S.ui, d = u.calDate || today(), mode = u.calMode, t = today();
    let title = '', body = '';
    if (mode === 'month') {
      const first = startOfMonth(d), p = parse(first);
      title = `${cap(MONTHS[p.getMonth()])} ${p.getFullYear()}`;
      const gStart = startOfWeek(first);
      const endM = `${first.slice(0, 8)}${pad(lastDom(p.getFullYear(), p.getMonth()))}`;
      const weeks = Math.ceil((diffDays(gStart, endM) + 1) / 7);
      let cells = DAYS_SHORT.map((x, i) => `<div class="dn ${i > 4 ? 'we' : ''}">${x}</div>`).join('');
      for (let i = 0; i < weeks * 7; i++) {
        const day = addDays(gStart, i);
        const ev = eventsFor(day).filter(e => !e.done);
        const r = routinesFor(day);
        const out = day.slice(0, 7) !== first.slice(0, 7);
        let rmark = '';
        if (r.habits.length && day <= t) {
          const ratio = r.hDone / r.habits.length;
          rmark = `<i class="hbar" style="--p:${Math.round(ratio * 100)}%" title="Nawyki ${r.hDone}/${r.habits.length}"></i>`;
        }
        cells += `<button class="mc ${out ? 'out' : ''} ${day === t ? 'today' : ''} ${day === d ? 'sel' : ''} ${i % 7 > 4 ? 'we' : ''}" data-act="cal-pick" data-d="${day}">
          <span class="n">${parse(day).getDate()}</span>
          ${ev.slice(0, 2).map(e => `<span class="lbl ${e.overdue ? 'late' : ''}" style="--ec:${TYPES[e.type][1]}">${esc(e.title)}</span>`).join('')}
          ${ev.length > 2 ? `<span class="plus">+${ev.length - 2}</span>` : ''}
          ${rmark}
        </button>`;
      }
      body = `<div class="mgrid">${cells}</div>
        <div class="cal-legend"><span><i style="background:${TYPES.task[1]}"></i>zadanie</span><span><i style="background:${TYPES.goal[1]}"></i>cel / krok</span><span><i style="background:${TYPES.counter[1]}"></i>licznik</span><span><i style="background:${TYPES.chore[1]}"></i>obowiązek</span><span><i class="hb"></i>nawyki dnia</span></div>
        <div class="dayhead"><h3>${fmtLong(d)}${d === t ? ' · <em>dziś</em>' : ''}</h3><button class="btn small outline" data-act="cal-mode" data-v="day">Widok dnia ›</button></div>
        ${dayAgenda(d)}`;
    } else if (mode === 'week') {
      const ws = startOfWeek(d), we = addDays(ws, 6);
      const p0 = parse(ws), p1 = parse(we);
      title = `${p0.getDate()} ${MONTHS_GEN[p0.getMonth()]} – ${p1.getDate()} ${MONTHS_GEN[p1.getMonth()]}`;
      for (let i = 0; i < 7; i++) {
        const day = addDays(ws, i), ev = eventsFor(day), r = routinesFor(day), sum = routineSummary(r);
        body += `<section class="wday ${day === t ? 'today' : ''} ${i > 4 ? 'we' : ''}">
          <button class="wdh" data-act="cal-open-day" data-d="${day}"><span class="wd">${DAYS_MED[i]}</span><span class="wn">${parse(day).getDate()}</span><span class="wm">${day === t ? 'dziś' : MONTHS_GEN[parse(day).getMonth()]}</span><span class="wgo">›</span></button>
          <div class="wbody">${ev.length ? ev.map(evRow).join('') : '<div class="cal-empty">—</div>'}
          ${sum ? `<button class="wsum" data-act="cal-open-day" data-d="${day}">${sum}</button>` : ''}</div>
        </section>`;
      }
    } else {
      title = `${relDay(d) === fmtLong(d) ? DAYS_FULL[dow(d)] : relDay(d)}, ${fmtDM(d)}`;
      body = `<div class="dayview">${dayAgenda(d, { open: true })}</div>`;
    }
    return `
    <div class="toolbar">${seg('cal-mode', [['day', 'Dzień'], ['week', 'Tydzień'], ['month', 'Miesiąc']], mode)}
      <button class="btn small outline" data-act="cal-today">Dziś</button></div>
    <div class="calhead">
      <button class="icon-btn" data-act="cal-move" data-v="-1" aria-label="Wstecz">${icon('left')}</button>
      <h2>${title}</h2>
      <button class="icon-btn" data-act="cal-move" data-v="1" aria-label="Dalej">${icon('right')}</button>
    </div>
    ${body}
    <details class="cal-filter" data-key="calfilter"><summary>Pokaż w kalendarzu…</summary>
      <div class="legend-types">${SRC.map(([k, l]) => `<button class="chip ${srcOn(k) ? 'on' : ''}" data-act="cal-src" data-v="${k}">${l}</button>`).join('')}</div>
    </details>`;
  },
  after() {
    const v = $('#view'); if (!v) return;
    let x0 = null, y0 = null;
    const zone = $('.mgrid', v) || $('.calhead', v);
    if (!zone) return;
    zone.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    zone.addEventListener('touchend', e => {
      if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) calMove(dx < 0 ? 1 : -1); x0 = null;
    }, { passive: true });
  },
};
function calMove(n) {
  const u = S.ui, d = u.calDate || today();
  u.calDate = u.calMode === 'month' ? addMonths(startOfMonth(d), n) : u.calMode === 'week' ? addDays(d, 7 * n) : addDays(d, n);
  save(); render();
}
A['cal-move'] = el => calMove(+el.dataset.v);
A['cal-mode'] = el => { S.ui.calMode = el.dataset.v; save(); render(); window.scrollTo(0, 0); };
A['cal-today'] = () => { S.ui.calDate = today(); save(); render(); };
A['cal-pick'] = el => { S.ui.calDate = el.dataset.d; save(); render(); };
A['cal-open-day'] = el => { S.ui.calDate = el.dataset.d; S.ui.calMode = 'day'; save(); render(); window.scrollTo(0, 0); };
A['cal-src'] = el => { const k = el.dataset.v, s = S.ui.calSrc; S.ui.calSrc = s.includes(k) ? s.filter(x => x !== k) : [...s, k]; save(); render(); };
