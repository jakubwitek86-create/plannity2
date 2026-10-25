'use strict';
/* ================= 10) Pomysły na prezent ================= */
function seedGifts() {
  const people = ['Ja', 'Ola', 'Henio', 'Edek', 'Mama', 'Tata', 'Maciek', 'Małgosia', 'Zbyszek', 'Kinga', 'Basia'];
  const ideas = { Ja: ['laptop', 'kamerka GoPro 360 na rower'] };
  return people.map(name => ({ id: uid(), name, ideas: (ideas[name] || []).map(text => ({ id: uid(), text, done: false, doneDate: null })) }));
}
function giftCard(p) {
  const open = p.ideas.filter(i => !i.done), done = p.ideas.filter(i => i.done);
  const row = i => `<li class="${i.done ? 'done' : ''}">
      <button class="check ${i.done ? 'on' : ''}" data-act="gift-toggle" data-p="${p.id}" data-i="${i.id}" aria-label="Kupione / podarowane"></button>
      <div class="mt" data-act="gift-edit" data-p="${p.id}" data-i="${i.id}"><span>${esc(i.text)}</span>${i.done ? `<small>podarowane ${fmt(i.doneDate)}</small>` : ''}</div>
    </li>`;
  return `<article class="goal">
    <div class="gh" style="align-items:center">
      <div style="flex:1;min-width:0" data-act="gift-person" data-p="${p.id}"><div class="gt">🎁 ${esc(p.name)}</div>
        <div class="gm"><span>${open.length ? `${open.length} ${plural(open.length, 'pomysł', 'pomysły', 'pomysłów')}` : 'brak pomysłów'}</span>${done.length ? `<span>✓ podarowane: ${done.length}</span>` : ''}</div></div>
      <button class="icon-btn" data-act="gift-person" data-p="${p.id}" aria-label="Edytuj osobę">${icon('edit', 'sm')}</button>
    </div>
    ${open.length ? `<ul class="ms">${open.map(row).join('')}</ul>` : ''}
    <form class="quick" data-form="gift-add" data-p="${p.id}" style="margin:10px 0 0">
      <input name="text" type="text" placeholder="Dodaj pomysł dla: ${esc(p.name)}…" autocomplete="off" enterkeyhint="done">
      <button class="btn primary" aria-label="Dodaj">${icon('plus')}</button>
    </form>
    ${done.length ? `<details class="more" data-key="gd-${p.id}"><summary>Podarowane (${done.length})</summary><ul class="ms">${done.map(row).join('')}</ul></details>` : ''}
  </article>`;
}
V.gifts = {
  title: 'Pomysły na prezent',
  render() {
    return `<p class="small muted" style="margin:0 2px 12px">Zapisuj pomysły od razu, kiedy przyjdą do głowy. Odhacz, kiedy prezent zostanie kupiony lub wręczony.</p>
      ${S.gifts.map(giftCard).join('')}
      <button class="btn outline" style="width:100%" data-act="gift-person-new">${icon('plus', 'sm')} Dodaj osobę</button>`;
  },
};
const findGift = el => { const p = S.gifts.find(x => x.id === el.dataset.p); return { p, i: p && el.dataset.i ? p.ideas.find(x => x.id === el.dataset.i) : null }; };
FORMS['gift-add'] = form => {
  const p = S.gifts.find(x => x.id === form.dataset.p); const v = form.elements.text.value.trim(); if (!p || !v) return;
  p.ideas.push({ id: uid(), text: v, done: false, doneDate: null }); save(); render();
  const inp = $(`form[data-form="gift-add"][data-p="${p.id}"] input`); if (inp) inp.focus();
};
A['gift-toggle'] = el => {
  const { i } = findGift(el); if (!i) return;
  i.done = !i.done; i.doneDate = i.done ? today() : null; save(); render();
  if (i.done) toast('Podarowane ✓', 'Cofnij', () => { i.done = false; i.doneDate = null; save(); render(); });
};
A['gift-edit'] = el => {
  const { p, i } = findGift(el); if (!i) return;
  openSheet({
    title: `Pomysł dla: ${p.name}`, body: field('Pomysł', inText('text', i.text)) + (i.done ? field('Data wręczenia', inDate('doneDate', i.doneDate)) : ''),
    onSave: fd => { if (!fd.text.trim()) return false; i.text = fd.text.trim(); if (i.done && fd.doneDate) i.doneDate = fd.doneDate; save(); render(); },
    onDelete: () => { p.ideas = p.ideas.filter(x => x !== i); save(); closeSheet(); render(); },
  });
};
A['gift-person'] = el => {
  const { p } = findGift(el); if (!p) return;
  openSheet({
    title: 'Osoba', body: field('Imię', inText('name', p.name)),
    onSave: fd => { if (!fd.name.trim()) return false; p.name = fd.name.trim(); save(); render(); },
    onDelete: () => confirmSheet(`Usunąć osobę „${p.name}” razem z pomysłami?`, () => { S.gifts = S.gifts.filter(x => x !== p); save(); render(); }),
  });
};
A['gift-person-new'] = () => openSheet({
  title: 'Nowa osoba', body: field('Imię', inText('name', '', 'np. Wujek Rysiek')),
  onSave: fd => { if (!fd.name.trim()) return false; S.gifts.push({ id: uid(), name: fd.name.trim(), ideas: [] }); save(); render(); },
});
