'use strict';
/* ================= 6) Harmonogram dnia ================= */
const BCOLORS = ['#8fd3ff', '#4fb3ff', '#7ee2a8', '#ffd34d', '#ffb38a', '#ff9db8', '#c9b3ff', '#e6eefc'];
const HOUR_H = 52;
const POINT_MIN = 40; // wysokość (w min) kafelka bez godziny końca
let schedScrolled = false;

function blocksFor(d) {
  const wd = dow(d);
  return S.blocks.filter(b => b.repeat ? (b.wd === wd && d >= b.from && !(b.skip || []).includes(d)) : b.date === d);
}
function layoutDay(list) {
  // dłuższe kafelki pod spodem, krótsze/później dodane – nad nimi (nadpisują)
  const items = list.map(b => {
    const s = hmToMin(b.start), e = b.end ? hmToMin(b.end) : null;
    const end = e !== null && e > s ? e : (e !== null && e <= s ? 24 * 60 : s + POINT_MIN);
    return { b, s, e: end, pt: !b.end, dur: end - s };
  }).sort((a, c) => (c.dur - a.dur) || (a.s - c.s));
  items.forEach((it, i) => {
    let depth = 0;
    for (let j = 0; j < i; j++) { const o = items[j]; if (o.s < it.e && it.s < o.e) depth = Math.max(depth, (o.depth || 0) + 1); }
    it.depth = depth; it.z = 2 + i;
  });
  return items;
}

V.schedule = {
  title: 'Harmonogram dnia',
  render() {
    const ws = S.ui.schedWeek || startOfWeek(today());
    const we = addDays(ws, 6), t = today();
    const p0 = parse(ws), p1 = parse(we);
    let head = '<div class="corner"></div>', cols = '';
    let times = '';
    for (let h = 0; h < 24; h++) times += `<div>${h ? pad(h) + ':00' : ''}</div>`;
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      head += `<div class="hd ${d === t ? 'today' : ''}">${DAYS_MED[i]}<b>${parse(d).getDate()}</b></div>`;
    }
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      const items = layoutDay(blocksFor(d));
      let inner = items.map(it => {
        const top = it.s / 60 * HOUR_H, h = Math.max(24, (it.e - it.s) / 60 * HOUR_H - 2);
        const left = Math.min(it.depth * 14, 42);
        return `<button class="blk ${it.pt ? 'pt' : ''}" style="top:${top}px;height:${h}px;left:calc(${left}% + 3px);z-index:${it.z};background:${it.b.color}" data-act="blk-edit" data-id="${it.b.id}" data-d="${d}">
          ${esc(it.b.title)}<small>${it.b.start}${it.b.end ? '–' + it.b.end : ''}${it.b.repeat ? ' ↻' : ''}</small></button>`;
      }).join('');
      if (d === t) { const n = new Date(); inner += `<div class="nowline" style="top:${(n.getHours() * 60 + n.getMinutes()) / 60 * HOUR_H}px"></div>`; }
      cols += `<div class="col ${d === t ? 'today' : ''}" data-act="blk-slot" data-d="${d}" style="grid-column:${i + 2};grid-row:2;height:${24 * HOUR_H}px">${inner}</div>`;
    }
    return `
    <div class="calhead">
      <button class="icon-btn" data-act="sched-move" data-v="-1" aria-label="Poprzedni tydzień">${icon('left')}</button>
      <h2>${p0.getDate()} ${MONTHS_GEN[p0.getMonth()]} – ${p1.getDate()} ${MONTHS_GEN[p1.getMonth()]}</h2>
      <button class="icon-btn" data-act="sched-move" data-v="1" aria-label="Następny tydzień">${icon('right')}</button>
    </div>
    <div class="toolbar">
      <button class="btn small outline" data-act="sched-today">Ten tydzień</button>
      <button class="btn small outline" data-act="sched-copy">${icon('copy', 'sm')} Kopiuj z poprz. tygodnia</button>
    </div>
    <div class="sched-wrap" id="schedWrap" style="--hh:${HOUR_H}px">
      <div class="sched" style="grid-template-rows:auto ${24 * HOUR_H}px">
        ${head}
        <div class="times" style="grid-column:1;grid-row:2">${times}</div>
        ${cols}
      </div>
    </div>
    <p class="small dim" style="margin:8px 2px">Dotknij puste pole, aby dodać kafelek o tej godzinie. Kafelek bez godziny końca (np. „Obiad 13:00”) nakłada się na dłuższe bloki.</p>
    ${fab('blk-new', 'Nowy kafelek')}`;
  },
  after() {
    const w = $('#schedWrap'); if (!w) return;
    if (!schedScrolled) {
      const h = (S.ui.schedWeek === startOfWeek(today())) ? Math.max(0, new Date().getHours() - 2) : 7;
      w.scrollTop = Math.min(h, 7) * HOUR_H;
      const ti = dow(today());
      if (S.ui.schedWeek === startOfWeek(today()) && ti > 2) w.scrollLeft = (ti - 2) * 92;
      schedScrolled = true;
    } else if (window._schedPos) { w.scrollTop = window._schedPos[0]; w.scrollLeft = window._schedPos[1]; }
    w.addEventListener('scroll', () => { window._schedPos = [w.scrollTop, w.scrollLeft]; }, { passive: true });
  },
};

function blkForm(b, d, start) {
  const ws = S.ui.schedWeek || startOfWeek(today());
  const dayOpts = []; for (let i = 0; i < 7; i++) { const x = addDays(ws, i); dayOpts.push([x, `${DAYS_FULL[i]} ${fmtShort(x)}`]); }
  const curD = d || (b && (b.repeat ? addDays(ws, b.wd) : b.date)) || today();
  if (!dayOpts.some(o => o[0] === curD)) dayOpts.unshift([curD, `${DAYS_FULL[dow(curD)]} ${fmtShort(curD)}`]);
  return field('Co', inText('title', b ? b.title : '', 'np. Praca, Obiad, Trening')) +
    field('Dzień', sel('date', dayOpts, curD)) +
    `<div class="grid2">${field('Od', inTime('start', b ? b.start : (start || '08:00')))}${field('Do (opcjonalnie)', inTime('end', b ? b.end : ''))}</div>` +
    `<div class="field"><span>Kolor</span>${colorPicker('color', BCOLORS, b ? b.color : BCOLORS[0])}</div>` +
    `<label class="checkline"><input type="checkbox" name="repeat" ${b && b.repeat ? 'checked' : ''}> Powtarzaj co tydzień w ten dzień</label>`;
}
function saveBlk(b, fd) {
  if (!fd.title.trim() || !fd.start) { toast('Uzupełnij nazwę i godzinę'); return false; }
  if (fd.end && hmToMin(fd.end) <= hmToMin(fd.start)) { toast('Godzina końca musi być po godzinie startu'); return false; }
  const n = b || { id: uid() };
  n.title = fd.title.trim(); n.start = fd.start; n.end = fd.end || ''; n.color = fd.color || BCOLORS[0];
  n.repeat = !!fd.repeat;
  if (n.repeat) { n.wd = dow(fd.date); n.from = b && b.repeat && b.from <= fd.date ? b.from : fd.date; n.skip = n.skip || []; delete n.date; }
  else { n.date = fd.date; delete n.wd; delete n.from; }
  if (!b) S.blocks.push(n);
  save(); render();
}
A['blk-new'] = () => openSheet({ title: 'Nowy kafelek', body: blkForm(null, today() >= S.ui.schedWeek && today() <= addDays(S.ui.schedWeek, 6) ? today() : S.ui.schedWeek), onSave: fd => saveBlk(null, fd) });
A['blk-slot'] = (el, ev) => {
  if (ev.target !== el) return;
  const r = el.getBoundingClientRect();
  const min = Math.floor(((ev.clientY - r.top) / HOUR_H * 60) / 30) * 30;
  openSheet({ title: 'Nowy kafelek', body: blkForm(null, el.dataset.d, minToHm(clamp(min, 0, 23 * 60 + 30))), onSave: fd => saveBlk(null, fd) });
};
A['blk-edit'] = el => {
  const b = S.blocks.find(x => x.id === el.dataset.id); if (!b) return;
  const d = el.dataset.d;
  openSheet({
    title: 'Edytuj kafelek', body: blkForm(b, d), onSave: fd => saveBlk(b, fd),
    deleteLabel: b.repeat ? 'Usuń…' : 'Usuń',
    onDelete: () => {
      if (!b.repeat) { S.blocks = S.blocks.filter(x => x !== b); save(); closeSheet(); render(); return; }
      openSheet({
        title: 'Usuń powtarzający się kafelek',
        body: `<p>„${esc(b.title)}” powtarza się co tydzień.</p><div class="row wrap" style="margin-top:12px">
          <button type="button" class="btn outline" data-act="blk-skip" data-id="${b.id}" data-d="${d}">Tylko ${fmtShort(d)}</button>
          <button type="button" class="btn danger" data-act="blk-del-all" data-id="${b.id}">Wszystkie</button></div>`,
      });
    },
  });
};
A['blk-skip'] = el => { const b = S.blocks.find(x => x.id === el.dataset.id); if (b) { (b.skip = b.skip || []).push(el.dataset.d); save(); } closeSheet(); render(); };
A['blk-del-all'] = el => { S.blocks = S.blocks.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render(); };
A['sched-move'] = el => { S.ui.schedWeek = addDays(S.ui.schedWeek, 7 * el.dataset.v); window._schedPos = null; save(); render(); };
A['sched-today'] = () => { S.ui.schedWeek = startOfWeek(today()); schedScrolled = false; save(); render(); };
A['sched-copy'] = () => {
  const ws = S.ui.schedWeek, prev = addDays(ws, -7);
  const src = S.blocks.filter(b => !b.repeat && b.date >= prev && b.date < ws);
  if (!src.length) { toast('Poprzedni tydzień nie ma jednorazowych kafelków'); return; }
  src.forEach(b => S.blocks.push({ ...b, id: uid(), date: addDays(b.date, 7) }));
  save(); render(); toast(`Skopiowano ${src.length} ${plural(src.length, 'kafelek', 'kafelki', 'kafelków')}`);
};
