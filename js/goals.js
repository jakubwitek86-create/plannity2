'use strict';
/* ================= 2) Plan roczny ================= */
const CATS = [['zdrowie', 'Zdrowie', '#34d27b'], ['rozwoj', 'Rozwój', '#b18cff'], ['finanse', 'Finanse', '#ffd34d'], ['relacje', 'Relacje', '#ff8fb1']];
const catName = c => (CATS.find(x => x[0] === c) || [, 'Inne'])[1];
const catColor = c => (CATS.find(x => x[0] === c) || [, , '#8fd3ff'])[2];
function goalPct(g) {
  if (g.done) return 100;
  const ms = g.ms || [];
  if (!ms.length) return 0;
  return Math.round(ms.filter(m => m.done).length / ms.length * 100);
}
const goalKey = o => o.end || o.start || '9999-12-31';
const linkedHabit = (gid, mid) => S.habits.find(h => h.link && h.link.g === gid && (h.link.m || null) === (mid || null));
const moveLabel = (gid, mid) => { const t = linkedTask(gid, mid), h = linkedHabit(gid, mid); return t && h ? '✓ zadanie + nawyk' : t ? '✓ w zadaniach' : h ? '✓ w nawykach' : null; };
const linkedTask = (gid, mid) => S.tasks.find(k => k.link && k.link.g === gid && (k.link.m || null) === (mid || null));

function msRow(g, m) {
  const st = dateRangeStatus(m);
  return `<li class="${m.done ? 'done' : ''}">
    <button class="check ${m.done ? 'on' : ''}" data-act="ms-toggle" data-g="${g.id}" data-m="${m.id}" aria-label="Krok zrealizowany"></button>
    <div class="mt" data-act="ms-edit" data-g="${g.id}" data-m="${m.id}"><span>${esc(m.title)}</span><small>${dateRangeLabel(m)}${st ? ' · ' + st : ''}</small></div>
    ${m.done ? '' : `<button class="totask ${moveLabel(g.id, m.id) ? 'in' : ''}" data-act="goal-move" data-g="${g.id}" data-m="${m.id}">${moveLabel(g.id, m.id) || icon('send', 'sm') + 'Przenieś'}</button>`}
  </li>`;
}
function goalCard(g) {
  const pct = goalPct(g), st = dateRangeStatus(g);
  return `<article class="goal ${g.done ? 'done' : ''}">
    <div class="gh">
      <button class="check ${g.done ? 'on' : ''}" data-act="goal-toggle" data-id="${g.id}" aria-label="Cel zrealizowany"></button>
      <div style="flex:1;min-width:0" data-act="goal-edit" data-id="${g.id}">
        <div class="gt">${esc(g.title)}</div>
        <div class="gm"><span class="pill cat-${g.cat}">${catName(g.cat)}</span><span>📅 ${dateRangeLabel(g)}</span>${st ? `<span>${st}</span>` : ''}</div>
      </div>
      <button class="icon-btn" data-act="goal-edit" data-id="${g.id}" aria-label="Edytuj cel">${icon('edit', 'sm')}</button>
    </div>
    <div class="bar"><div class="progress"><i style="width:${pct}%;background:${catColor(g.cat)}"></i></div><b>${pct}%</b></div>
    ${(g.ms || []).length ? `<ul class="ms">${[...g.ms].sort((a, b) => goalKey(a).localeCompare(goalKey(b))).map(m => msRow(g, m)).join('')}</ul>` : ''}
    <div class="actions">
      <button class="btn small outline" data-act="ms-new" data-g="${g.id}">${icon('plus', 'sm')} Krok milowy</button>
      ${g.done ? '' : `<button class="btn small outline" data-act="goal-move" data-g="${g.id}">${icon('send', 'sm')} ${moveLabel(g.id, null) ? 'Cel: ' + moveLabel(g.id, null) : 'Przenieś cel do zadań / nawyków'}</button>`}
    </div>
  </article>`;
}

V.goals = {
  title: 'Plan roczny',
  render() {
    const u = S.ui;
    let list = S.goals.slice();
    if (u.goalCat !== 'all') list = list.filter(g => g.cat === u.goalCat);
    const open = list.filter(g => !g.done), done = list.filter(g => g.done);
    const avg = S.goals.length ? Math.round(S.goals.reduce((s, g) => s + goalPct(g), 0) / S.goals.length) : 0;
    let body = '';
    if (u.goalSort === 'date') {
      open.sort((a, b) => goalKey(a).localeCompare(goalKey(b)));
      body = open.map(goalCard).join('');
    } else {
      CATS.forEach(([c, n]) => { const arr = open.filter(g => g.cat === c).sort((a, b) => goalKey(a).localeCompare(goalKey(b))); if (arr.length) body += `<div class="sec-title"><span>${n}</span><span class="dim">${arr.length}</span></div>` + arr.map(goalCard).join(''); });
    }
    return `
    <div class="card" style="display:flex;gap:16px;align-items:center">
      <div style="flex:1"><h2 style="margin-bottom:4px">Postęp roku ${today().slice(0, 4)}</h2>
        <div class="muted small">${S.goals.filter(g => g.done).length} z ${S.goals.length} celów zrealizowanych · średnio ${avg}%</div>
        <div class="progress" style="margin-top:10px"><i style="width:${avg}%"></i></div></div>
    </div>
    <div class="toolbar">${seg('goal-sort', [['date', 'Wg daty'], ['cat', 'Wg kategorii']], u.goalSort)}</div>
    ${chips('goal-cat', [['all', 'Wszystkie'], ...CATS.map(c => [c[0], c[1]])], u.goalCat)}
    <div style="margin-top:12px">${body || `<div class="empty"><b>Brak celów</b>Dodaj cel, np. „do 12.2026 ważę 65 kg” albo „od dziś nie jem słodyczy”.</div>`}</div>
    ${done.length ? `<details class="more"><summary>Zrealizowane (${done.length})</summary><div style="margin-top:10px">${done.map(goalCard).join('')}</div></details>` : ''}
    ${fab('goal-new', 'Nowy cel')}`;
  },
};

const datesHint = 'Wpisz „Do kiedy” (np. do 31.12.2026 ważę 65 kg), „Od kiedy” (np. od dziś nie jem słodyczy) albo obie daty.';
function goalForm(g) {
  return field('Cel', inText('title', g ? g.title : '', 'np. Ważę 65 kg')) +
    field('Kategoria', sel('cat', CATS.map(c => [c[0], c[1]]), g ? g.cat : 'zdrowie')) +
    `<div class="grid2">${field('Od kiedy', inDate('start', g ? g.start : ''))}${field('Do kiedy', inDate('end', g ? g.end : ''))}</div>` +
    `<p class="hint small dim" style="margin:-6px 0 14px">${datesHint} <button type="button" class="chip" data-act="fill-today" style="padding:2px 8px">Od dziś</button></p>`;
}
A['fill-today'] = el => { const f = el.closest('form'); if (f && f.elements.start) f.elements.start.value = today(); };
function readRange(fd) { return { start: fd.start || null, end: fd.end || null }; }
A['goal-new'] = () => openSheet({
  title: 'Nowy cel', body: goalForm(null),
  onSave: fd => {
    if (!fd.title.trim()) { toast('Wpisz cel'); return false; }
    const r = readRange(fd); if (r.start && r.end && r.end < r.start) { toast('Data „do” jest przed „od”'); return false; }
    S.goals.push({ id: uid(), title: fd.title.trim(), cat: fd.cat, ...r, done: false, doneDate: null, ms: [], createdAt: today() }); save(); render();
  },
});
A['goal-edit'] = el => {
  const g = S.goals.find(x => x.id === el.dataset.id); if (!g) return;
  openSheet({
    title: 'Edytuj cel', body: goalForm(g),
    onSave: fd => {
      if (!fd.title.trim()) return false;
      const r = readRange(fd); if (r.start && r.end && r.end < r.start) { toast('Data „do” jest przed „od”'); return false; }
      Object.assign(g, { title: fd.title.trim(), cat: fd.cat, ...r }); save(); render();
    },
    onDelete: () => confirmSheet(`Usunąć cel „${g.title}” razem z krokami milowymi?`, () => { S.goals = S.goals.filter(x => x !== g); save(); render(); }),
  });
};
A['goal-toggle'] = el => {
  const g = S.goals.find(x => x.id === el.dataset.id); if (!g) return;
  g.done = !g.done; g.doneDate = g.done ? today() : null;
  const lt = linkedTask(g.id, null); if (lt && lt.done !== g.done) { lt.done = g.done; lt.doneDate = g.doneDate; }
  save(); render(); if (g.done) toast('Cel zrealizowany 🎉');
};
A['goal-sort'] = el => { S.ui.goalSort = el.dataset.v; save(); render(); };
A['goal-cat'] = el => { S.ui.goalCat = el.dataset.v; save(); render(); };

function msForm(m) {
  return field('Krok milowy', inText('title', m ? m.title : '', 'np. −3 kg do końca listopada')) +
    `<div class="grid2">${field('Od kiedy', inDate('start', m ? m.start : ''))}${field('Do kiedy', inDate('end', m ? m.end : ''))}</div>`;
}
A['ms-new'] = el => {
  const g = S.goals.find(x => x.id === el.dataset.g); if (!g) return;
  openSheet({
    title: 'Nowy krok milowy', body: msForm(null),
    onSave: fd => { if (!fd.title.trim()) return false; (g.ms = g.ms || []).push({ id: uid(), title: fd.title.trim(), ...readRange(fd), done: false, doneDate: null }); save(); render(); },
  });
};
A['ms-edit'] = el => {
  const g = S.goals.find(x => x.id === el.dataset.g); const m = g && g.ms.find(x => x.id === el.dataset.m); if (!m) return;
  openSheet({
    title: 'Edytuj krok milowy', body: msForm(m),
    onSave: fd => { if (!fd.title.trim()) return false; Object.assign(m, { title: fd.title.trim(), ...readRange(fd) }); save(); render(); },
    onDelete: () => { g.ms = g.ms.filter(x => x !== m); save(); closeSheet(); render(); },
  });
};
A['ms-toggle'] = el => {
  const g = S.goals.find(x => x.id === el.dataset.g); const m = g && g.ms.find(x => x.id === el.dataset.m); if (!m) return;
  m.done = !m.done; m.doneDate = m.done ? today() : null;
  const lt = linkedTask(g.id, m.id); if (lt && lt.done !== m.done) { lt.done = m.done; lt.doneDate = m.doneDate; }
  save(); render();
  if (m.done && g.ms.every(x => x.done) && !g.done) toast('Wszystkie kroki zrobione – odhacz cel?', 'Odhacz', () => { g.done = true; g.doneDate = today(); save(); render(); });
};
A['to-task'] = el => {
  closeSheet();
  const g = S.goals.find(x => x.id === el.dataset.g); if (!g) return;
  const m = el.dataset.m ? g.ms.find(x => x.id === el.dataset.m) : null;
  const title = m ? `${m.title} (${g.title})` : g.title;
  addTask(title, 1, today(), { g: g.id, m: m ? m.id : null });
  render(); toast('Dodano do „Do zrobienia” na dziś', 'Pokaż', () => go('tasks'));
};

/* ---------- przeniesienie celu / kroku do zadań lub nawyków ---------- */
A['goal-move'] = el => {
  const g = S.goals.find(x => x.id === el.dataset.g); if (!g) return;
  const m = el.dataset.m ? g.ms.find(x => x.id === el.dataset.m) : null;
  const o = m || g, lt = linkedTask(g.id, m && m.id), lh = linkedHabit(g.id, m && m.id);
  const ds = `data-g="${g.id}" ${m ? `data-m="${m.id}"` : ''}`;
  openSheet({
    title: 'Przenieś', body: `<p class="muted" style="margin-top:0">„${esc(o.title)}”</p>
      <div class="choice">
        <button type="button" class="btn outline" data-act="to-task" ${ds}>📋 <span>Jako zadanie – jednorazowe<small>${lt ? `już jest w zadaniach (${lt.done ? 'zrobione' : relShort(lt.date)}) – dodam drugie` : 'trafi do „Do zrobienia” na dziś, odhaczenie zadania odhaczy też ' + (m ? 'krok milowy' : 'cel')}</small></span></button>
        <button type="button" class="btn outline" data-act="to-habit" ${ds}>🔁 <span>Jako nawyk – powtarzalny<small>${lh ? `już jest nawyk „${esc(lh.name)}” – dodam kolejny` : 'np. codziennie, 3× w tygodniu – ustawisz harmonogram'}</small></span></button>
      </div>`,
  });
};
A['to-habit'] = el => {
  const g = S.goals.find(x => x.id === el.dataset.g); if (!g) return;
  const m = el.dataset.m ? g.ms.find(x => x.id === el.dataset.m) : null;
  const o = m || g, t = today();
  const pre = o.end && o.end >= t ? { name: o.title, mode: 'until', start: t, end: o.end, freq: { t: 'daily' } } : { name: o.title, mode: 'from', start: o.start || t, end: null, freq: { t: 'daily' } };
  openSheet({
    title: 'Nowy nawyk z planu rocznego', body: habitForm(pre),
    onSave: (fd, f) => {
      const n = S.habits.length;
      if (saveHabit(null, fd, f) === false) return false;
      if (S.habits.length > n) { S.habits[S.habits.length - 1].link = { g: g.id, m: m ? m.id : null }; save(); render(); }
      toast('Dodano do nawyków', 'Pokaż', () => go('habits'));
    },
  });
};
