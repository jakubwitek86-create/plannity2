'use strict';
/* ================= 5) Kalendarz ================= */
const TYPES = {
  task: ['Zadanie', '#4fb3ff'], goal: ['Cel', '#b18cff'], ms: ['Krok milowy', '#d6c2ff'],
  habit: ['Nawyk', '#34d27b'], counter: ['Licznik', '#ffb547'], chore: ['Obowiązek', '#ff8fb1'],
};
const SRC = [['task', 'Zadania'], ['goal', 'Cele'], ['habit', 'Nawyki'], ['counter', 'Liczniki'], ['chore', 'Obowiązki']];
const srcOn = k => S.ui.calSrc.includes(k);

function pointsFor(d) {
  const t = today(), out = [];
  if (srcOn('task')) S.tasks.forEach(k => {
    const day = k.done ? (k.doneDate || k.date) : k.date;
    if (day === d) out.push({ type: 'task', title: k.title, sub: `${PRIO[k.prio]} priorytet${isOverdue(k) ? ` · przeniesione z ${fmtShort(k.origDate)}` : ''}`, done: k.done, overdue: isOverdue(k), act: `data-act="task-toggle" data-id="${k.id}"` });
  });
  if (srcOn('goal')) S.goals.forEach(g => {
    const add = (o, type, extra) => {
      if (o.end === d) out.push({ type, title: o.title, sub: `termin${extra}`, done: o.done, act: type === 'goal' ? `data-act="goal-toggle" data-id="${g.id}"` : `data-act="ms-toggle" data-g="${g.id}" data-m="${o.id}"` });
      else if (o.start === d && !o.end) out.push({ type, title: o.title, sub: `start${extra}`, done: o.done, act: type === 'goal' ? `data-act="goal-toggle" data-id="${g.id}"` : `data-act="ms-toggle" data-g="${g.id}" data-m="${o.id}"` });
      else if (o.start === d && o.end) out.push({ type, title: o.title, sub: `start (do ${fmt(o.end)})${extra}`, done: o.done, act: type === 'goal' ? `data-act="goal-toggle" data-id="${g.id}"` : `data-act="ms-toggle" data-g="${g.id}" data-m="${o.id}"` });
    };
    add(g, 'goal', ` · ${catName(g.cat)}`);
    (g.ms || []).forEach(m => add(m, 'ms', ` · ${g.title}`));
  });
  if (srcOn('habit')) S.habits.forEach(h => {
    if (habitDue(h, d)) out.push({ type: 'habit', title: h.name, sub: freqLabel(h.freq), habit: h, d });
  });
  if (srcOn('counter')) S.counters.forEach(c => { if (c.date === d) out.push({ type: 'counter', title: c.title, sub: 'licznik dni', act: `data-act="go" data-r="counters"` }); });
  if (srcOn('chore')) S.chores.forEach(c => {
    if (!c.nextDate) return;
    if (c.nextDate === d || (d === t && c.nextDate < t)) out.push({ type: 'chore', title: c.title, sub: `${c.area} · ${freqLabel(c.freq)}${c.nextDate < t ? ` · zaległe od ${fmtShort(c.nextDate)}` : ''}`, overdue: c.nextDate < t, act: `data-act="chore-done" data-id="${c.id}"` });
    (c.history || []).forEach(hh => { if (hh.d === d && d < t) out.push({ type: 'chore', title: c.title, sub: 'wykonane', done: true }); });
  });
  return out;
}
function spansAll() {
  const out = [];
  if (srcOn('goal')) S.goals.forEach(g => {
    if (g.start) out.push({ type: 'goal', title: g.title, start: g.start, end: g.end, done: g.done });
    (g.ms || []).forEach(m => { if (m.start) out.push({ type: 'ms', title: m.title, start: m.start, end: m.end, done: m.done }); });
  });
  if (srcOn('habit')) S.habits.forEach(h => out.push({ type: 'habit', title: h.name, start: h.start, end: h.end, done: false }));
  if (srcOn('task')) { /* zadania nie mają zakresu */ }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}
const spanOn = (s, d) => s.start <= d && (!s.end || d <= s.end);

function evRow(e) {
  const c = TYPES[e.type][1];
  let ctl = '';
  if (e.type === 'habit') { const s = e.habit.log[e.d] || ''; ctl = e.d <= today() ? `<button class="tri ${s}" data-act="habit-mark" data-id="${e.habit.id}" data-d="${e.d}">${s === 'v' ? '✓' : s === 'x' ? '✗' : '?'}</button>` : `<span class="dim small">plan</span>`; }
  else if (e.act && e.type !== 'counter' && !(e.type === 'chore' && e.done)) ctl = `<button class="check ${e.done ? 'on' : ''}" ${e.act} aria-label="Odhacz"></button>`;
  return `<div class="ev ${e.done ? 'done' : ''} ${e.overdue ? 'overdue' : ''}" style="--ec:${c}">
    ${ctl}<div class="et"><b>${esc(e.title)}</b><small>${TYPES[e.type][0]} · ${esc(e.sub || '')}</small></div></div>`;
}
function spanRow(s, d) {
  const n = diffDays(s.start, d) + 1;
  const tot = s.end ? diffDays(s.start, s.end) + 1 : null;
  return `<div class="ev span ${s.done ? 'done' : ''}" style="--ec:${TYPES[s.type][1]}"><div class="et"><b>${esc(s.title)}</b><small>${TYPES[s.type][0]} · trwa: dzień ${n}${tot ? ` z ${tot} (do ${fmt(s.end)})` : ` (od ${fmt(s.start)})`}</small></div></div>`;
}
function agendaHTML(d, spans) {
  const pts = pointsFor(d);
  const sp = spans.filter(s => spanOn(s, d) && s.start !== d && s.end !== d && s.type !== 'habit');
  const hd = `<h3 class="${d === today() ? 'today' : ''}">${fmtLong(d)}</h3>`;
  if (!pts.length && !sp.length) return `<div class="ag-day">${hd}<div class="dim small" style="padding:4px 2px 6px">Brak wpisów</div></div>`;
  return `<div class="ag-day">${hd}${pts.map(evRow).join('')}${sp.map(s => spanRow(s, d)).join('')}</div>`;
}

V.calendar = {
  title: 'Kalendarz',
  render() {
    const u = S.ui, d = u.calDate || today(), mode = u.calMode;
    const spans = spansAll();
    let title = '', body = '';
    if (mode === 'month') {
      const first = startOfMonth(d), p = parse(first);
      title = `${cap(MONTHS[p.getMonth()])} ${p.getFullYear()}`;
      const gStart = startOfWeek(first);
      const endM = `${first.slice(0, 8)}${pad(lastDom(p.getFullYear(), p.getMonth()))}`;
      const weeks = Math.ceil((diffDays(gStart, endM) + 1) / 7);
      const gEnd = addDays(gStart, weeks * 7 - 1);
      const vis = spans.filter(s => s.start <= gEnd && (!s.end || s.end >= gStart)).slice(0, 3);
      let cells = DAYS_SHORT.map(x => `<div class="dn">${x}</div>`).join('');
      for (let i = 0; i < weeks * 7; i++) {
        const day = addDays(gStart, i);
        const pts = pointsFor(day);
        const types = [...new Set(pts.map(e => e.type))];
        const bars = vis.map(s => spanOn(s, day) ? `<div class="span-bar ${s.start === day ? 's' : ''} ${s.end === day ? 'e' : ''}" style="--sc:${TYPES[s.type][1]}" title="${esc(s.title)}"></div>` : '<div style="height:5px"></div>').join('');
        cells += `<button class="ccell ${day.slice(0, 7) !== first.slice(0, 7) ? 'out' : ''} ${day === today() ? 'today' : ''} ${day === d ? 'sel' : ''}" data-act="cal-pick" data-d="${day}">
          <span class="n">${parse(day).getDate()}</span>${bars}
          <span class="dots">${types.slice(0, 5).map(t => `<i style="background:${TYPES[t][1]}"></i>`).join('')}</span>
          ${pts.length > 3 ? `<span class="more">${pts.length}</span>` : ''}</button>`;
      }
      body = `<div class="cgrid">${cells}</div>
        ${vis.length ? `<div class="small muted" style="margin:8px 2px 0">Paski = ciągłość: ${vis.map(s => `<span style="color:${TYPES[s.type][1]}">■</span> ${esc(s.title)}`).join(' · ')}</div>` : ''}
        ${agendaHTML(d, spans)}
        <button class="btn small outline" style="margin-top:6px" data-act="cal-mode" data-v="day">Otwórz widok dnia</button>`;
    } else if (mode === 'week') {
      const ws = startOfWeek(d), we = addDays(ws, 6);
      title = `${parse(ws).getDate()} ${MONTHS_GEN[parse(ws).getMonth()]} – ${parse(we).getDate()} ${MONTHS_GEN[parse(we).getMonth()]}`;
      for (let i = 0; i < 7; i++) body += agendaHTML(addDays(ws, i), spans);
    } else {
      title = relDay(d) === fmtLong(d) ? fmtDM(d) : `${relDay(d)} · ${fmtDM(d)}`;
      const ongoing = spans.filter(s => spanOn(s, d));
      body = agendaHTML(d, spans) + (ongoing.length ? `<div class="sec-title"><span>Trwające (ciągłość)</span><span class="dim">${ongoing.length}</span></div>${ongoing.map(s => spanRow(s, d)).join('')}` : '');
    }
    return `
    <div class="toolbar">${seg('cal-mode', [['day', 'Dzień'], ['week', 'Tydzień'], ['month', 'Miesiąc']], mode)}
      <button class="btn small outline" data-act="cal-today">Dziś</button></div>
    <div class="legend-types">${SRC.map(([k, l]) => `<button class="chip ${srcOn(k) ? 'on' : ''}" data-act="cal-src" data-v="${k}" style="${srcOn(k) ? `background:${TYPES[k][1]};border-color:${TYPES[k][1]}` : ''}">${l}</button>`).join('')}</div>
    <div class="calhead">
      <button class="icon-btn" data-act="cal-move" data-v="-1" aria-label="Wstecz">${icon('left')}</button>
      <h2>${title}</h2>
      <button class="icon-btn" data-act="cal-move" data-v="1" aria-label="Dalej">${icon('right')}</button>
    </div>
    ${body}`;
  },
  after() {
    const v = $('#view'); if (!v) return;
    let x0 = null, y0 = null;
    const zone = $('.cgrid', v) || $('.calhead', v);
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
A['cal-src'] = el => { const k = el.dataset.v, s = S.ui.calSrc; S.ui.calSrc = s.includes(k) ? s.filter(x => x !== k) : [...s, k]; save(); render(); };
