'use strict';
/* ================= 4) Licznik dni ================= */
const CCOLORS = ['#4fb3ff', '#34d27b', '#ffb547', '#ff8fb1', '#b18cff', '#ffd34d'];
function counterInfo(c) {
  const t = today(), n = diffDays(t, c.date);
  const a = Math.abs(n);
  const w = Math.floor(a / 7), r = a % 7;
  // miesiące i dni
  let mFrom = n >= 0 ? t : c.date, mTo = n >= 0 ? c.date : t, months = 0;
  while (addMonths(mFrom, months + 1) <= mTo) months++;
  const restD = diffDays(addMonths(mFrom, months), mTo);
  const parts = [];
  if (a >= 7) parts.push(`${w} ${plural(w, 'tydzień', 'tygodnie', 'tygodni')}${r ? ` i ${dni(r)}` : ''}`);
  if (months >= 1) parts.push(`${months} ${plural(months, 'miesiąc', 'miesiące', 'miesięcy')}${restD ? ` i ${dni(restD)}` : ''}`);
  return { n, a, parts, label: n > 0 ? 'zostało' : n < 0 ? 'minęło' : 'to dziś!' };
}
V.counters = {
  title: 'Licznik dni',
  render() {
    const list = S.counters.slice().sort((a, b) => {
      const na = diffDays(today(), a.date), nb = diffDays(today(), b.date);
      if ((na >= 0) !== (nb >= 0)) return na >= 0 ? -1 : 1;
      return Math.abs(na) - Math.abs(nb);
    });
    return `${list.length ? list.map(c => {
      const i = counterInfo(c);
      let prog = '';
      if (i.n > 0 && c.createdAt && c.createdAt < c.date) { const tot = diffDays(c.createdAt, c.date), done = diffDays(c.createdAt, today()); prog = `<div class="progress" style="margin-top:8px"><i style="width:${clamp(done / tot * 100, 0, 100)}%;background:${c.color}"></i></div>`; }
      return `<article class="counter" style="--cc:${c.color}" data-act="counter-edit" data-id="${c.id}">
        <div class="num"><b>${i.a}</b><small>${i.n === 0 ? 'dziś' : plural(i.a, 'dzień', 'dni', 'dni')}</small></div>
        <div style="flex:1;min-width:0"><div class="ct">${esc(c.title)}</div>
          <div class="cm">${i.n > 0 ? `⏳ zostało do ${fmt(c.date)}` : i.n < 0 ? `⏱ minęło od ${fmt(c.date)}` : `🎉 ${fmt(c.date)} – to dziś!`}</div>
          ${i.parts.length ? `<div class="cm">${i.parts.join(' · ')}</div>` : ''}${prog}</div>
      </article>`;
    }).join('') : `<div class="empty"><b>Brak liczników</b>Dodaj datę – np. urodziny, wyjazd, „dni bez słodyczy” – a policzę, ile zostało lub ile minęło.</div>`}
    ${fab('counter-new', 'Nowy licznik')}`;
  },
};
function counterForm(c) {
  return field('Nazwa', inText('title', c ? c.title : '', 'np. Wyjazd na wakacje')) +
    field('Data', inDate('date', c ? c.date : today()), 'Data w przyszłości → ile zostało. Data w przeszłości → ile minęło.') +
    `<div class="field"><span>Kolor</span>${colorPicker('color', CCOLORS, c ? c.color : CCOLORS[0])}</div>`;
}
A['counter-new'] = () => openSheet({
  title: 'Nowy licznik', body: counterForm(null),
  onSave: fd => { if (!fd.title.trim() || !fd.date) { toast('Uzupełnij nazwę i datę'); return false; } S.counters.push({ id: uid(), title: fd.title.trim(), date: fd.date, color: fd.color || CCOLORS[0], createdAt: today() }); save(); render(); },
});
A['counter-edit'] = el => {
  const c = S.counters.find(x => x.id === el.dataset.id); if (!c) return;
  openSheet({
    title: 'Edytuj licznik', body: counterForm(c),
    onSave: fd => { if (!fd.title.trim() || !fd.date) return false; Object.assign(c, { title: fd.title.trim(), date: fd.date, color: fd.color || c.color }); save(); render(); },
    onDelete: () => { S.counters = S.counters.filter(x => x !== c); save(); closeSheet(); render(); },
  });
};
