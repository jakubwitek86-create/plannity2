'use strict';
/* ================= 1) Do zrobienia ================= */
const PRIO = { 1: 'Wysoki', 2: 'Średni', 3: 'Niski' };

// Niezrealizowane zadania z przeszłych dni przechodzą na dziś i zostają oznaczone (żółte)
function rolloverTasks() {
  const t = today(); let ch = false;
  S.tasks.forEach(k => {
    if (!k.done && k.date && k.date < t) { if (!k.origDate) k.origDate = k.date; k.date = t; ch = true; }
  });
  if (ch) save();
}
const isOverdue = k => !k.done && k.origDate && k.origDate < k.date;

function addTask(title, prio = 2, date = today(), link = null) {
  const k = { id: uid(), title: title.trim(), prio: +prio, date, origDate: null, done: false, doneDate: null, createdAt: today(), link };
  S.tasks.push(k); save(); return k;
}
function setTaskDone(k, done) {
  k.done = done; k.doneDate = done ? today() : null;
  if (done && k.origDate) k.lateDays = diffDays(k.origDate, today());
  if (k.link) {
    const g = S.goals.find(x => x.id === k.link.g);
    if (g) {
      if (k.link.m) { const m = (g.ms || []).find(x => x.id === k.link.m); if (m) { m.done = done; m.doneDate = done ? today() : null; } }
      else { g.done = done; g.doneDate = done ? today() : null; }
    }
  }
  save();
}

function taskRow(k) {
  const late = isOverdue(k);
  const lateN = late ? diffDays(k.origDate, today()) : 0;
  return `<div class="item ${k.done ? 'done' : ''} ${late ? 'overdue' : ''}">
    <button class="check round ${k.done ? 'on' : ''}" data-act="task-toggle" data-id="${k.id}" aria-label="Oznacz jako zrobione"></button>
    <div class="body" data-act="task-edit" data-id="${k.id}">
      <div class="title">${esc(k.title)}</div>
      <div class="meta">
        <span>📅 ${k.done ? 'zrobione ' + relShort(k.doneDate) : relShort(k.date)}</span>
        <span class="pill p${k.prio}">${PRIO[k.prio]}</span>
        ${late ? `<span>⏩ przeniesione z ${fmtShort(k.origDate)} (${dni(lateN)})</span>` : ''}
        ${k.link ? '<span>🎯 z planu rocznego</span>' : ''}
      </div>
    </div>
    <button class="icon-btn" data-act="task-edit" data-id="${k.id}" aria-label="Edytuj">${icon('edit', 'sm')}</button>
  </div>`;
}

V.tasks = {
  title: 'Do zrobienia',
  render() {
    const u = S.ui, t = today();
    let open = S.tasks.filter(k => !k.done);
    if (u.taskPrio !== 'all') open = open.filter(k => String(k.prio) === u.taskPrio);
    if (u.taskRange === 'today') open = open.filter(k => k.date <= t);
    if (u.taskRange === 'week') { const e = addDays(startOfWeek(t), 6); open = open.filter(k => k.date <= e); }
    if (u.taskRange === 'day') open = open.filter(k => k.date === u.taskDay);
    const byDate = (a, b) => a.date.localeCompare(b.date) || a.prio - b.prio || (isOverdue(b) - isOverdue(a));
    const byPrio = (a, b) => a.prio - b.prio || a.date.localeCompare(b.date);
    let groups = [];
    if (u.taskGroup === 'date') {
      open.sort(byDate);
      const m = new Map();
      open.forEach(k => { const key = k.date; if (!m.has(key)) m.set(key, []); m.get(key).push(k); });
      groups = [...m].map(([d, arr]) => [relDay(d), arr]);
    } else {
      open.sort(byPrio);
      [1, 2, 3].forEach(p => { const arr = open.filter(k => k.prio === p); if (arr.length) groups.push([`Priorytet: ${PRIO[p].toLowerCase()}`, arr]); });
    }
    const done = S.tasks.filter(k => k.done).sort((a, b) => (b.doneDate || '').localeCompare(a.doneDate || ''));
    const lateCount = S.tasks.filter(isOverdue).length;
    return `
    <form class="quick" data-form="task-quick">
      <input name="title" type="text" placeholder="Dodaj zadanie na dziś…" enterkeyhint="done" autocomplete="off">
      <button class="btn primary" aria-label="Dodaj">${icon('plus')}</button>
    </form>
    <div class="toolbar">
      ${seg('task-group', [['date', 'Wg daty'], ['prio', 'Wg priorytetu']], u.taskGroup)}
    </div>
    <div class="toolbar">
      <select data-change="task-prio" aria-label="Filtr priorytetu">
        ${[['all', 'Każdy priorytet'], ['1', 'Wysoki'], ['2', 'Średni'], ['3', 'Niski']].map(([v, l]) => `<option value="${v}" ${u.taskPrio === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select data-change="task-range" aria-label="Filtr daty">
        ${[['all', 'Wszystkie daty'], ['today', 'Na dziś'], ['week', 'Ten tydzień'], ['day', 'Wybrany dzień…']].map(([v, l]) => `<option value="${v}" ${u.taskRange === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      ${u.taskRange === 'day' ? `<input type="date" value="${u.taskDay}" data-change="task-day" aria-label="Dzień">` : ''}
    </div>
    ${lateCount ? `<p class="small muted" style="margin:0 2px 10px">🟨 Żółte = niezrealizowane w terminie, przenoszone na kolejny dzień aż do wykonania (${lateCount}).</p>` : ''}
    ${groups.length ? groups.map(([h, arr]) => `<div class="sec-title"><span>${h}</span><span class="dim">${arr.length}</span></div><div class="list">${arr.map(taskRow).join('')}</div>`).join('')
      : `<div class="empty"><b>Brak zadań</b>${S.tasks.length ? 'Nic nie pasuje do filtrów.' : 'Dodaj pierwsze zadanie powyżej albo przyciskiem +.'}</div>`}
    ${done.length ? `<details class="more" data-key="tdone" style="margin-top:20px"><summary>Zrobione (${done.length})</summary><div class="list" style="margin-top:10px">${done.slice(0, 100).map(taskRow).join('')}</div>
      <button class="btn small outline" style="margin-top:10px" data-act="task-clear-done">Usuń zrobione</button></details>` : ''}
    ${fab('task-new', 'Nowe zadanie')}`;
  },
};

function taskForm(k) {
  return field('Nazwa', inText('title', k ? k.title : '', 'np. Zadzwonić do ubezpieczyciela')) +
    `<div class="grid2">${field('Data realizacji', inDate('date', k ? k.date : today()))}${field('Priorytet', sel('prio', [[1, 'Wysoki'], [2, 'Średni'], [3, 'Niski']], k ? k.prio : 2))}</div>` +
    (k && isOverdue(k) ? `<p class="small muted">Zadanie przenoszone od ${fmt(k.origDate)}. Zmiana daty zdejmie oznaczenie.</p>` : '');
}
A['task-new'] = () => openSheet({
  title: 'Nowe zadanie', body: taskForm(null),
  onSave: (fd) => { if (!fd.title.trim()) { toast('Wpisz nazwę zadania'); return false; } addTask(fd.title, fd.prio, fd.date || today()); render(); toast('Dodano zadanie'); },
});
A['task-edit'] = el => {
  const k = S.tasks.find(x => x.id === el.dataset.id); if (!k) return;
  openSheet({
    title: 'Edytuj zadanie', body: taskForm(k),
    onSave: fd => {
      if (!fd.title.trim()) { toast('Wpisz nazwę zadania'); return false; }
      const nd = fd.date || today();
      if (nd !== k.date) { k.origDate = null; }
      k.title = fd.title.trim(); k.prio = +fd.prio; k.date = nd;
      if (!k.done) rolloverTasks();
      save(); render();
    },
    onDelete: () => { S.tasks = S.tasks.filter(x => x !== k); save(); closeSheet(); render(); toast('Usunięto zadanie'); },
  });
};
A['task-toggle'] = el => {
  const k = S.tasks.find(x => x.id === el.dataset.id); if (!k) return;
  setTaskDone(k, !k.done); render();
  if (k.done) toast('Zrobione ✓', 'Cofnij', () => { setTaskDone(k, false); rolloverTasks(); render(); });
};
A['task-group'] = el => { S.ui.taskGroup = el.dataset.v; save(); render(); };
A['task-clear-done'] = () => confirmSheet('Usunąć wszystkie zrobione zadania? Statystyki stracą te dane.', () => { S.tasks = S.tasks.filter(k => !k.done); save(); render(); });
const CH = {}; // handlery 'change'
CH['task-prio'] = el => { S.ui.taskPrio = el.value; save(); render(); };
CH['task-range'] = el => { S.ui.taskRange = el.value; save(); render(); };
CH['task-day'] = el => { S.ui.taskDay = el.value || today(); save(); render(); };
const FORMS = {};
FORMS['task-quick'] = form => {
  const v = form.elements.title.value.trim(); if (!v) return;
  addTask(v, 2, S.ui.taskRange === 'day' ? S.ui.taskDay : today()); render();
  const inp = $('form[data-form="task-quick"] input'); if (inp) inp.focus();
  toast('Dodano zadanie');
};
