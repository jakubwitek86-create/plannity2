'use strict';
/* ================= 9) Statystyki ================= */
function choreStats(c) {
  const t = today(), h = c.history || [];
  const onTime = h.filter(x => !x.due || x.d <= x.due).length;
  const last30 = h.filter(x => x.d > addDays(t, -30)).length;
  const f = normFreq(c.freq);
  let expected30 = null;
  if (f.t === 'daily') expected30 = 30;
  else if (f.t === 'every') expected30 = Math.floor(30 / f.n);
  else if (f.t === 'weekdays') expected30 = Math.round(30 / 7 * f.days.length);
  else if (f.t === 'biweekly') expected30 = 2;
  else if (f.t === 'monthly') expected30 = 1;
  // ograniczenie do okresu, od kiedy obowiązek istnieje
  const age = Math.min(30, diffDays(c.createdAt || t, t) + 1);
  if (expected30 !== null) expected30 = Math.max(1, Math.round(expected30 * age / 30));
  const lateNow = c.nextDate && c.nextDate < t ? diffDays(c.nextDate, t) : 0;
  return { n: h.length, onTime, onTimePct: h.length ? Math.round(onTime / h.length * 100) : null, last30, expected30, lateNow };
}
const bar = (pct, color = 'var(--accent)') => `<div class="progress" title="${pct}%"><i style="width:${clamp(pct, 0, 100)}%;background:${color}"></i></div>`;

V.stats = {
  title: 'Statystyki',
  render() {
    const t = today();
    // KPI
    const goalAvg = S.goals.length ? Math.round(S.goals.reduce((s, g) => s + goalPct(g), 0) / S.goals.length) : 0;
    const hs = S.habits.filter(h => !h.group).map(h => ({ h, s: habitStats(h) }));
    const bestStreak = hs.reduce((m, x) => Math.max(m, x.s.streak), 0);
    const cs = S.chores.map(c => ({ c, s: choreStats(c) }));
    const allH = cs.reduce((a, x) => a + x.s.n, 0), allOn = cs.reduce((a, x) => a + x.s.onTime, 0);
    const tasks30 = S.tasks.filter(k => k.done && k.doneDate > addDays(t, -30)).length;

    // zadania – 14 dni
    const days14 = []; for (let i = 13; i >= 0; i--) { const d = addDays(t, -i); days14.push({ d, n: S.tasks.filter(k => k.done && k.doneDate === d).length }); }
    const max14 = Math.max(1, ...days14.map(x => x.n));
    const lateTasks = S.tasks.filter(isOverdue).length;
    const openTasks = S.tasks.filter(k => !k.done).length;

    // cele wg kategorii
    const catRows = CATS.map(([c, n, col]) => {
      const g = S.goals.filter(x => x.cat === c);
      if (!g.length) return '';
      const p = Math.round(g.reduce((s, x) => s + goalPct(x), 0) / g.length);
      return `<div class="srow"><div class="top"><span><span style="color:${col}">●</span> ${n} <span class="dim small">(${g.length})</span></span><b>${p}%</b></div>${bar(p, col)}</div>`;
    }).join('');

    return `
    <div class="kpis">
      <div class="kpi"><b>${goalAvg}%</b><small>średnia realizacja celów</small></div>
      <div class="kpi"><b>🔥 ${bestStreak}</b><small>najdłuższa obecna passa</small></div>
      <div class="kpi"><b>${allH ? Math.round(allOn / allH * 100) + '%' : '–'}</b><small>obowiązków w terminie</small></div>
      <div class="kpi"><b>${tasks30}</b><small>zadań zrobionych (30 dni)</small></div>
    </div>

    <div class="sec-title"><span>Cele roczne</span><span class="dim">${S.goals.filter(g => g.done).length}/${S.goals.length}</span></div>
    <div class="card">
      ${S.goals.length ? S.goals.slice().sort((a, b) => goalPct(b) - goalPct(a)).map(g => {
        const p = goalPct(g), ms = g.ms || [];
        return `<div class="srow"><div class="top"><span>${esc(g.title)}</span><b>${p}%</b></div>${bar(p, catColor(g.cat))}
          <div class="sub"><span>${catName(g.cat)}</span><span>${ms.length ? `kroki: ${ms.filter(m => m.done).length}/${ms.length}` : 'bez kroków milowych'}</span><span>${dateRangeLabel(g)}</span>${dateRangeStatus(g) ? `<span>${dateRangeStatus(g)}</span>` : ''}</div></div>`;
      }).join('') : '<div class="muted small">Brak celów w planie rocznym.</div>'}
      ${catRows ? `<h2 style="margin-top:16px">Wg kategorii</h2>${catRows}` : ''}
    </div>

    <div class="sec-title"><span>Nawyki</span><span class="dim">${hs.length}</span></div>
    <div class="card">
      ${hs.length ? hs.map(({ h, s }) => {
        let heat = '';
        for (let i = 29; i >= 0; i--) {
          const d = addDays(t, -i), due = habitDue(h, d), st = h.log[d] || '';
          const cls = !due ? '' : st === 'v' ? 'v' : st === 'x' ? 'x' : d < t ? 'q' : '';
          heat += `<i class="${cls}" title="${fmt(d)}: ${!due ? 'nie dotyczy' : st === 'v' ? 'zrealizowane' : st === 'x' ? 'niezrealizowane' : 'brak danych'}"></i>`;
        }
        return `<div class="srow" data-act="habit-open" data-id="${h.id}"><div class="top"><span>${esc(h.name)}</span><b>${s.rate}%</b></div>${bar(s.rate, 'var(--green)')}
          <div class="sub"><span>🔥 passa ${s.streak} ${s.unit}</span><span>🏆 rekord ${s.best}</span><span>✓ ${s.v}</span><span>✗ nie zrealizowano: ${s.x}</span><span>? brak danych: ${s.q}</span></div>
          <div class="heat" aria-label="Ostatnie 30 dni">${heat}</div></div>`;
      }).join('') + `<div class="legend"><span><i style="background:var(--green)"></i>✓ zrealizowane</span><span><i style="background:var(--red)"></i>✗ niezrealizowane</span><span><i style="background:rgba(255,211,77,.45)"></i>? brak danych</span><span class="dim">ostatnie 30 dni</span></div>`
      : '<div class="muted small">Brak nawyków.</div>'}
    </div>

    <div class="sec-title"><span>Obowiązki domowe</span><span class="dim">${allH} wykonań</span></div>
    <div class="card">
      ${cs.filter(x => normFreq(x.c.freq).t !== 'once' || x.s.n).sort((a, b) => b.s.lateNow - a.s.lateNow || (a.s.onTimePct ?? 101) - (b.s.onTimePct ?? 101)).map(({ c, s }) => {
        const exp = s.expected30;
        const pct = exp ? Math.round(Math.min(s.last30 / exp, 1) * 100) : (s.n ? 100 : 0);
        return `<div class="srow"><div class="top"><span>${esc(c.title.length > 60 ? c.title.slice(0, 58) + '…' : c.title)}</span><b>${exp ? `${s.last30}/${exp}` : s.n}</b></div>${bar(pct, s.lateNow ? 'var(--yellow)' : 'var(--accent)')}
          <div class="sub"><span>${c.area} · ${freqLabel(c.freq)}</span>${s.lateNow ? `<span class="pill warn">⚠ zaległe ${dni(s.lateNow)}</span>` : `<span class="pill ok">✓ zgodnie z harmonogramem</span>`}
          ${s.onTimePct !== null ? `<span>w terminie: ${s.onTimePct}%</span>` : '<span>brak wykonań</span>'}<span>łącznie: ${s.n}</span></div></div>`;
      }).join('') || '<div class="muted small">Brak obowiązków.</div>'}
      <div class="small dim" style="margin-top:10px">Pasek = wykonania z ostatnich 30 dni względem liczby wynikającej z harmonogramu.</div>
    </div>

    <div class="sec-title"><span>Zadania – ostatnie 14 dni</span><span class="dim">otwarte: ${openTasks}${lateTasks ? ` · przeniesione: ${lateTasks}` : ''}</span></div>
    <div class="card">
      <div class="bars14">${days14.map(x => `<div title="${fmt(x.d)}: ${x.n} zrobionych">${x.n ? `<b>${x.n}</b>` : ''}<i style="height:${x.n / max14 * 85}%"></i><span>${parse(x.d).getDate()}</span></div>`).join('')}</div>
      <div class="small dim" style="margin-top:6px">Liczba zadań oznaczonych jako zrobione danego dnia.</div>
    </div>

    <div class="sec-title"><span>Randki i gesty dla Oli</span><span class="dim">30 dni: ${S.dates.reduce((a, x) => a + (x.history || []).filter(d => d > addDays(t, -30)).length, 0)}</span></div>
    <div class="card">
      ${S.dates.length ? S.dates.map(x => { const h = x.history || [], n30 = h.filter(d => d > addDays(t, -30)).length, max = Math.max(1, ...S.dates.map(y => (y.history || []).length));
        return `<div class="srow"><div class="top"><span>${esc(x.title)}</span><b>${h.length}×</b></div>${bar(h.length / max * 100, 'var(--pink)')}
          <div class="sub"><span>ostatnie 30 dni: ${n30}</span><span>${h[0] ? `ostatnio ${relShort(h[0])}` : 'jeszcze nie było'}</span></div></div>`; }).join('') : '<div class="muted small">Brak pomysłów.</div>'}
    </div>`;
  },
};
