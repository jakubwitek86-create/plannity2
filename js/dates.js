'use strict';
/* ================= 11) Randki i gesty dla Oli ================= */
function seedDates() {
  return ['Kwiaty', 'Prezent', 'Wyjście na miasto', 'Masaż', 'Ugotować coś dla niej', 'Czas tylko dla niej',
    'Pytanie „Co cię teraz najbardziej obciąża? Co mogę wziąć?”']
    .map(title => ({ id: uid(), title, history: [] }));
}
function dateRow(x) {
  const t = today(), h = x.history || [];
  const last = h[0];
  const ago = last ? diffDays(last, t) : null;
  const doneToday = last === t;
  const n30 = h.filter(d => d > addDays(t, -30)).length;
  return `<div class="item">
    <button class="check ${doneToday ? 'on' : ''}" data-act="date-done" data-id="${x.id}" aria-label="Zrealizowane"></button>
    <div class="body">
      <div class="title" data-act="date-edit" data-id="${x.id}">${esc(x.title)}</div>
      <div class="meta">
        <span class="pill ${h.length ? 'p2' : 'p3'}">razem: ${h.length}</span>
        <span>30 dni: <b style="color:#fff">${n30}</b></span>
        <span>${last ? (ago === 0 ? 'ostatnio: dziś' : `ostatnio: ${dni(ago)} temu (${fmtShort(last)})`) : 'jeszcze nie było'}</span>
      </div>
      <details class="more" data-key="dt-${x.id}"><summary>Historia (${h.length})</summary>
        ${h.length ? `<ul class="hist">${h.map((d, i) => `<li><span>${fmtLong(d)} ${d.slice(0, 4)}</span><button class="icon-btn" style="width:28px;height:28px" data-act="date-hdel" data-id="${x.id}" data-i="${i}" aria-label="Usuń wpis">✕</button></li>`).join('')}</ul>` : '<div class="small dim" style="margin-top:6px">Brak wpisów.</div>'}
      </details>
    </div>
    <button class="icon-btn" data-act="date-edit" data-id="${x.id}" aria-label="Edytuj">${icon('edit', 'sm')}</button>
  </div>`;
}
V.dates = {
  title: 'Randki i gesty dla Oli',
  render() {
    const t = today();
    const all = S.dates.flatMap(x => x.history || []);
    const m30 = all.filter(d => d > addDays(t, -30)).length;
    const lastAny = all.sort().slice(-1)[0];
    return `<div class="card"><h2 style="margin-bottom:4px">Ostatnie 30 dni</h2>
      <div class="muted small">Zrealizowane gesty: <b style="color:#fff">${m30}</b>${lastAny ? ` · ostatni: ${relShort(lastAny)}` : ''}</div>
      <div class="small dim" style="margin-top:6px">Odhacz, kiedy coś zrobisz – zapisze się data. Możesz odhaczyć tę samą rzecz kilka razy (np. inny dzień); wpis z dziś cofniesz w historii.</div></div>
      <div class="list">${S.dates.map(dateRow).join('')}</div>
      ${fab('date-new', 'Nowy pomysł')}`;
  },
};
A['date-done'] = el => {
  const x = S.dates.find(y => y.id === el.dataset.id); if (!x) return;
  const t = today();
  if ((x.history || [])[0] === t) { toast('Dziś już odhaczone – wpis możesz usunąć w historii'); return; }
  openSheet({
    title: x.title, body: field('Kiedy?', inDate('d', t)),
    saveLabel: 'Zapisz w historii',
    onSave: fd => {
      const d = fd.d || t; x.history = [...(x.history || []), d].sort().reverse(); save(); render();
      toast(`Zapisano ✓ (${relShort(d)})`, 'Cofnij', () => { const i = x.history.indexOf(d); if (i > -1) x.history.splice(i, 1); save(); render(); });
    },
  });
};
A['date-hdel'] = el => { const x = S.dates.find(y => y.id === el.dataset.id); if (!x) return; x.history.splice(+el.dataset.i, 1); save(); render(); };
A['date-edit'] = el => {
  const x = S.dates.find(y => y.id === el.dataset.id); if (!x) return;
  openSheet({
    title: 'Edytuj pomysł', body: field('Pomysł', inText('title', x.title)),
    onSave: fd => { if (!fd.title.trim()) return false; x.title = fd.title.trim(); save(); render(); },
    onDelete: () => confirmSheet(`Usunąć „${x.title}” razem z historią?`, () => { S.dates = S.dates.filter(y => y !== x); save(); render(); }),
  });
};
A['date-new'] = () => openSheet({
  title: 'Nowy pomysł', body: field('Pomysł', inText('title', '', 'np. Śniadanie do łóżka')),
  onSave: fd => { if (!fd.title.trim()) return false; S.dates.push({ id: uid(), title: fd.title.trim(), history: [] }); save(); render(); },
});
