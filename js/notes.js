'use strict';
/* ================= 8) Notatki ================= */
const NCOLORS = ['#10265a', '#1d4a8a', '#0f4d5c', '#3b2f6b', '#5a3a1a', '#5c2440'];
V.notes = {
  title: 'Notatki',
  render() {
    const q = (S.ui.noteQ || '').toLowerCase();
    const list = S.notes.filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q))
      .sort((a, b) => (b.pinned - a.pinned) || b.updatedAt - a.updatedAt);
    return `
    <div class="quick"><input type="search" placeholder="Szukaj w notatkach…" value="${esc(S.ui.noteQ || '')}" data-input="note-q" aria-label="Szukaj"></div>
    ${list.length ? `<div class="notes">${list.map(n => {
      const d = new Date(n.updatedAt);
      return `<button class="note" style="--nc:${n.color}" data-act="note-edit" data-id="${n.id}">
        <b>${n.pinned ? '📌 ' : ''}${esc(n.title || 'Bez tytułu')}</b><p>${esc(n.body)}</p>
        <small>${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}</small></button>`;
    }).join('')}</div>` : `<div class="empty"><b>${S.notes.length ? 'Nic nie znaleziono' : 'Brak notatek'}</b>${S.notes.length ? '' : 'Dodaj notatkę przyciskiem +.'}</div>`}
    ${fab('note-new', 'Nowa notatka')}`;
  },
};
function noteForm(n) {
  return field('Tytuł', inText('title', n ? n.title : '', 'Tytuł')) +
    `<label class="field"><span>Treść</span><textarea name="body" placeholder="Pisz…">${esc(n ? n.body : '')}</textarea></label>` +
    `<div class="field"><span>Kolor</span>${colorPicker('color', NCOLORS, n ? n.color : NCOLORS[0])}</div>` +
    `<label class="checkline"><input type="checkbox" name="pinned" ${n && n.pinned ? 'checked' : ''}> Przypnij na górze</label>`;
}
function saveNote(n, fd) {
  if (!fd.title.trim() && !fd.body.trim()) { toast('Notatka jest pusta'); return false; }
  const x = n || { id: uid() };
  Object.assign(x, { title: fd.title.trim(), body: fd.body, color: fd.color || NCOLORS[0], pinned: !!fd.pinned, updatedAt: Date.now() });
  if (!n) S.notes.push(x);
  save(); render();
}
A['note-new'] = () => openSheet({ title: 'Nowa notatka', body: noteForm(null), onSave: fd => saveNote(null, fd) });
A['note-edit'] = el => {
  const n = S.notes.find(x => x.id === el.dataset.id); if (!n) return;
  openSheet({
    title: 'Notatka', body: noteForm(n), onSave: fd => saveNote(n, fd),
    onDelete: () => { S.notes = S.notes.filter(x => x !== n); save(); closeSheet(); render(); toast('Usunięto notatkę'); },
  });
};
const INPUTS = {};
INPUTS['note-q'] = el => {
  S.ui.noteQ = el.value; save();
  const pos = el.selectionStart; render();
  const inp = $('[data-input="note-q"]'); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (e) { } }
};
