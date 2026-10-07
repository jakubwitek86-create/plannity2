'use strict';
/* ================= 7) Obowiązki domowe ================= */
const AREAS = ['Kuchnia', 'Łazienka', 'Henio', 'Dom'];

function choreRow(c) {
  const t = today();
  const late = c.nextDate && c.nextDate < t;
  const lateN = late ? diffDays(c.nextDate, t) : 0;
  const hist = c.history || [];
  return `<div class="item ${late ? 'overdue' : ''}">
    <button class="check" data-act="chore-done" data-id="${c.id}" aria-label="Zrobione"></button>
    <div class="body">
      <div class="title" data-act="chore-edit" data-id="${c.id}">${esc(c.title)}</div>
      <div class="meta">
        <span class="pill area">${c.area}</span>
        <span>🔁 ${freqLabel(c.freq)}</span>
        <button class="pill ${late ? '' : c.nextDate === t ? 'ok' : 'p3'}" style="border:0" data-act="chore-date" data-id="${c.id}">📅 ${c.nextDate ? (late ? `zaległe ${dni(lateN)} (${fmtShort(c.nextDate)})` : relShort(c.nextDate)) : 'ustaw datę'}</button>
      </div>
      <details class="more" data-key="ch-${c.id}"><summary>Historia (${hist.length})</summary>
        ${hist.length ? `<ul class="hist">${hist.map((h, i) => `<li><span>${fmtLong(h.d)} ${fmt(h.d).slice(6)}</span><span>${h.due && h.d > h.due ? `<span class="pill bad">+${dni(diffDays(h.due, h.d))}</span>` : '<span class="pill ok">w terminie</span>'}
          <button class="icon-btn" style="width:28px;height:28px;display:inline-grid;vertical-align:middle" data-act="chore-hdel" data-id="${c.id}" data-i="${i}" aria-label="Usuń wpis">✕</button></span></li>`).join('')}</ul>` : '<div class="small dim" style="margin-top:6px">Jeszcze nie wykonano.</div>'}
      </details>
    </div>
    <button class="icon-btn" data-act="chore-edit" data-id="${c.id}" aria-label="Edytuj">${icon('edit', 'sm')}</button>
  </div>`;
}

V.chores = {
  title: 'Obowiązki domowe',
  render() {
    const t = today(), area = S.ui.choreArea;
    const list = S.chores.filter(c => area === 'all' || c.area === area);
    const sortD = (a, b) => (a.nextDate || '9999').localeCompare(b.nextDate || '9999') || a.title.localeCompare(b.title, 'pl');
    const groups = [
      ['Zaległe', list.filter(c => c.nextDate && c.nextDate < t)],
      ['Dziś', list.filter(c => c.nextDate === t)],
      ['Najbliższe 7 dni', list.filter(c => c.nextDate && c.nextDate > t && c.nextDate <= addDays(t, 7))],
      ['Później', list.filter(c => c.nextDate && c.nextDate > addDays(t, 7))],
      ['Ad hoc / bez terminu', list.filter(c => !c.nextDate)],
    ];
    const doneToday = S.chores.filter(c => (c.history || []).some(h => h.d === t)).length;
    return `
    <div class="card"><h2 style="margin-bottom:4px">Moje obowiązki (Kuba)</h2>
      <div class="muted small">Z pliku „podział obowiązków” – pozycje oznaczone na żółto. Po odhaczeniu obowiązek dostaje nową datę wg harmonogramu.</div>
      <div class="muted small" style="margin-top:6px">Dziś zrobione: <b style="color:#fff">${doneToday}</b> · do zrobienia dziś: <b style="color:#fff">${groups[0][1].length + groups[1][1].length}</b></div>
    </div>
    ${chips('chore-area', [['all', 'Wszystkie'], ...AREAS.map(a => [a, a])], area)}
    ${groups.map(([h, arr]) => arr.length ? `<div class="sec-title"><span>${h}</span><span class="dim">${arr.length}</span></div><div class="list">${arr.sort(sortD).map(choreRow).join('')}</div>` : '').join('')}
    ${list.length ? '' : '<div class="empty" style="margin-top:12px"><b>Brak obowiązków</b>Dodaj obowiązek przyciskiem +.</div>'}
    ${fab('chore-new', 'Nowy obowiązek')}`;
  },
};

function choreForm(c) {
  return field('Obowiązek', inText('title', c ? c.title : '', 'np. Umycie lodówki')) +
    field('Obszar', sel('area', AREAS.map(a => [a, a]), c ? c.area : 'Dom')) +
    freqFields(c ? c.freq : { t: 'every', n: 7 }, 'chore') +
    field('Najbliższa data realizacji', inDate('next', c ? (c.nextDate || '') : today()), 'Możesz ją zmienić w dowolnym momencie. Puste = bez terminu (ad hoc).');
}
function saveChore(c, fd, form) {
  if (!fd.title.trim()) { toast('Wpisz nazwę'); return false; }
  const n = c || { id: uid(), history: [], createdAt: today() };
  n.title = fd.title.trim(); n.area = fd.area; n.freq = readFreq(form);
  n.nextDate = fd.next || null;
  n.anchor = n.nextDate || today();
  if (!c) S.chores.push(n);
  save(); render();
}
A['chore-new'] = () => openSheet({ title: 'Nowy obowiązek', body: choreForm(null), onSave: (fd, f) => saveChore(null, fd, f) });
A['chore-edit'] = el => {
  const c = S.chores.find(x => x.id === el.dataset.id); if (!c) return;
  openSheet({
    title: 'Edytuj obowiązek', body: choreForm(c), onSave: (fd, f) => saveChore(c, fd, f),
    onDelete: () => confirmSheet(`Usunąć obowiązek „${c.title}” z historią?`, () => { S.chores = S.chores.filter(x => x !== c); save(); render(); }),
  });
};
A['chore-date'] = el => {
  const c = S.chores.find(x => x.id === el.dataset.id); if (!c) return;
  openSheet({
    title: 'Data realizacji', body: `<p class="muted small" style="margin-top:0">${esc(c.title)}</p>` + field('Najbliższa data', inDate('next', c.nextDate || today())),
    onSave: fd => { c.nextDate = fd.next || null; if (c.nextDate) c.anchor = c.nextDate; save(); render(); },
  });
};
A['chore-done'] = el => {
  const c = S.chores.find(x => x.id === el.dataset.id); if (!c) return;
  const t = today(), prev = { next: c.nextDate, hist: (c.history || []).slice() };
  (c.history = c.history || []).unshift({ d: t, due: c.nextDate || t });
  const f = normFreq(c.freq);
  if (f.t === 'once') c.nextDate = null;
  else {
    const anchor = (f.t === 'weekdays' || f.t === 'biweekly' || f.t === 'monthly') ? (c.anchor || t) : t;
    c.nextDate = nextDue(c.freq, t, anchor);
  }
  save(); render();
  toast(c.nextDate ? `Zrobione ✓ Następny raz: ${relShort(c.nextDate)}` : 'Zrobione ✓', 'Cofnij', () => { c.nextDate = prev.next; c.history = prev.hist; save(); render(); });
};
A['chore-hdel'] = el => { const c = S.chores.find(x => x.id === el.dataset.id); if (!c) return; c.history.splice(+el.dataset.i, 1); save(); render(); };
A['chore-area'] = el => { S.ui.choreArea = el.dataset.v; save(); render(); };
