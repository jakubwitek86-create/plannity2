'use strict';
/* ================= Plannity – rdzeń ================= */
const APP_VERSION = '1.2.0';
const V = {};            // widoki
const A = {};            // akcje (data-act)
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- daty (YYYY-MM-DD, czas lokalny) ---------- */
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000); // b - a
const dow = s => (parse(s).getDay() + 6) % 7; // 0 = poniedziałek
const startOfWeek = s => addDays(s, -dow(s));
const lastDom = (y, m) => new Date(y, m + 1, 0).getDate();
const addMonths = (s, n) => { const d = parse(s); const day = d.getDate(); const t = new Date(d.getFullYear(), d.getMonth() + n, 1); t.setDate(Math.min(day, lastDom(t.getFullYear(), t.getMonth()))); return ymd(t); };
const startOfMonth = s => s.slice(0, 8) + '01';
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hmToMin = s => { if (!s) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const minToHm = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

const DAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const DAYS_MED = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const DAYS_FULL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
const DAYS_ACC = ['poniedziałek', 'wtorek', 'środę', 'czwartek', 'piątek', 'sobotę', 'niedzielę'];
const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const MONTHS_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
const fmtShort = s => { if (!s) return ''; const [, m, d] = s.split('-'); return `${d}.${m}`; };
const fmtLong = s => { const d = parse(s); return `${DAYS_FULL[dow(s)]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
const fmtDM = s => { const d = parse(s); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
function plural(n, one, few, many) { n = Math.abs(n); if (n === 1) return one; const d = n % 10, t = n % 100; if (d >= 2 && d <= 4 && !(t >= 12 && t <= 14)) return few; return many; }
const dni = n => `${n} ${plural(n, 'dzień', 'dni', 'dni')}`;
function relDay(s) {
  const n = diffDays(today(), s);
  if (n === 0) return 'Dziś'; if (n === 1) return 'Jutro'; if (n === -1) return 'Wczoraj';
  return fmtLong(s);
}
function relShort(s) {
  const n = diffDays(today(), s);
  if (n === 0) return 'dziś'; if (n === 1) return 'jutro'; if (n === -1) return 'wczoraj';
  if (n > 1 && n < 7) return DAYS_FULL[dow(s)].toLowerCase();
  return fmt(s);
}

/* ---------- ikony ---------- */
const IC = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  tasks: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>',
  goals: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
  habits: '<path d="M12 3c.8 3 5 5.2 5 10a5 5 0 0 1-10 0c0-2.6 1.4-3.8 2.2-6 1.4 1 2.3 2.4 2.6 4 .7-2.2.6-5.3.2-8z"/>',
  counters: '<path d="M7 3h10M7 21h10M8 3v3l4 6-4 6v3M16 3v3l-4 6 4 6v3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  schedule: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  chores: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
  stats: '<path d="M3 21h18"/><path d="M6 17v-5M11 17V6M16 17v-8M21 17v-3"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8c-1-3-5-5-6-2.5S9 8 12 8zM12 8c1-3 5-5 6-2.5S15 8 12 8z"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  send: '<path d="M5 12h12M13 6l6 6-6 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  pin: '<path d="M9 4h6l-1 6 4 3H6l4-3z"/><path d="M12 13v8"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;

/* ---------- stan ---------- */
const KEY = 'plannity_v1';
let S;
function defaultState() {
  return {
    v: 1, tasks: [], goals: [], habits: [], counters: [], blocks: [], chores: seedChores(), notes: [], gifts: seedGifts(), dates: seedDates(), weather: null,
    ui: { taskGroup: 'date', taskPrio: 'all', taskRange: 'all', taskDay: today(), goalSort: 'date', goalCat: 'all', calMode: 'month', calDate: today(), calSrc: ['task', 'goal', 'habit', 'counter', 'chore'], choreArea: 'all', schedWeek: startOfWeek(today()), noteQ: '' },
  };
}
function loadState() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
  const d = defaultState();
  if (!s || typeof s !== 'object') return d;
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  s.ui = { ...d.ui, ...s.ui };
  s.habits.forEach(h => { if (!h.notes) h.notes = {}; });
  return s;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('Zapis nieudany', e); } }

/* ---------- częstotliwości (nawyki + obowiązki) ---------- */
// {t:'daily'} {t:'weekdays',days:[0..6]} {t:'perweek',n} {t:'every',n} {t:'biweekly',days:[d]} {t:'monthly',n:dzień} {t:'once'}
const FREQ_HABIT = [['daily', 'Codziennie'], ['weekdays', 'Wybrane dni tygodnia'], ['perweek', 'X razy w tygodniu (dowolne dni)'], ['every', 'Co N dni'], ['biweekly', 'Raz na dwa tygodnie'], ['monthly', 'Raz w miesiącu']];
const FREQ_CHORE = [['daily', 'Codziennie'], ['every2', 'Co dwa dni'], ['weekdays', 'Wybrane dni tygodnia'], ['weekly', 'Raz w tygodniu'], ['biweekly', 'Raz na dwa tygodnie'], ['every', 'Co N dni'], ['monthly', 'Raz w miesiącu'], ['once', 'Konkretna data / ad hoc']];
function normFreq(f) {
  if (!f) return { t: 'daily' };
  if (f.t === 'every2') return { t: 'every', n: 2 };
  if (f.t === 'weekly') return { t: 'every', n: 7 };
  return f;
}
function freqLabel(f) {
  f = normFreq(f);
  switch (f.t) {
    case 'daily': return 'Codziennie';
    case 'weekdays': {
      const d = [...(f.days || [])].sort();
      if (d.length === 7) return 'Codziennie';
      if (d.length === 1) return `Co tydzień w ${DAYS_ACC[d[0]]}`;
      if (!d.length) return 'Brak dni';
      return d.map(x => DAYS_SHORT[x]).join(', ');
    }
    case 'perweek': return `${f.n}× w tygodniu`;
    case 'every': return f.n === 1 ? 'Codziennie' : f.n === 2 ? 'Co dwa dni' : f.n === 7 ? 'Raz w tygodniu' : f.n === 14 ? 'Raz na dwa tygodnie' : `Co ${f.n} dni`;
    case 'biweekly': return 'Raz na dwa tygodnie' + (f.days && f.days.length ? ` (${DAYS_SHORT[f.days[0]]})` : '');
    case 'monthly': return 'Raz w miesiącu' + (f.n ? ` (${f.n}. dnia)` : '');
    case 'once': return 'Ad hoc / jednorazowo';
  }
  return '';
}
function isDue(f, date, anchor) {
  f = normFreq(f);
  if (anchor && date < anchor) return false;
  switch (f.t) {
    case 'daily': case 'perweek': return true;
    case 'weekdays': return (f.days || []).includes(dow(date));
    case 'every': return diffDays(anchor, date) % (f.n || 1) === 0;
    case 'biweekly': {
      const wd = f.days && f.days.length ? f.days[0] : dow(anchor);
      if (dow(date) !== wd) return false;
      return Math.floor(diffDays(startOfWeek(anchor), startOfWeek(date)) / 7) % 2 === 0;
    }
    case 'monthly': {
      const d = parse(date); const dom = f.n || parse(anchor).getDate();
      return d.getDate() === Math.min(dom, lastDom(d.getFullYear(), d.getMonth()));
    }
    case 'once': return date === anchor;
  }
  return true;
}
// pierwszy termin ŚCIŚLE po dacie `from`
function nextDue(f, from, anchor) {
  f = normFreq(f);
  if (f.t === 'once') return null;
  if (f.t === 'daily') return addDays(from, 1);
  if (f.t === 'every') return addDays(from, f.n || 1);
  if (f.t === 'perweek') return addDays(from, Math.max(1, Math.round(7 / (f.n || 1))));
  if (f.t === 'biweekly' && !(f.days && f.days.length)) return addDays(from, 14);
  let d = addDays(from, 1);
  for (let i = 0; i < 800; i++) { if (isDue(f, d, anchor || from)) return d; d = addDays(d, 1); }
  return null;
}
// pierwszy termin w dniu `d` lub później
function dueOnOrAfter(f, d, anchor) {
  f = normFreq(f);
  if (f.t === 'once') return d;
  if (f.t === 'every' || f.t === 'perweek' || f.t === 'daily') return d;
  if (f.t === 'biweekly' && !(f.days && f.days.length)) return d;
  return isDue(f, d, anchor || d) ? d : nextDue(f, d, anchor || d);
}
function freqFields(f, kind) {
  f = f || { t: 'daily' };
  const opts = kind === 'chore' ? FREQ_CHORE : FREQ_HABIT;
  let cur = f.t;
  if (kind === 'chore' && f.t === 'every') cur = f.n === 2 ? 'every2' : f.n === 7 ? 'weekly' : 'every';
  const days = f.days || [];
  return `
  <label class="field"><span>Harmonogram</span>
    <select name="ft" data-act="freq-change">${opts.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`).join('')}</select>
  </label>
  <div class="field" data-fx="days"><span>Dni tygodnia</span>
    <div class="daychips">${DAYS_SHORT.map((d, i) => `<label><input type="checkbox" name="fdays" value="${i}" ${days.includes(i) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div>
    <div class="hint" data-fx="bwhint">Przy „raz na dwa tygodnie” zaznacz jeden dzień.</div>
  </div>
  <label class="field" data-fx="n"><span data-fx="nlabel">Ile</span>
    <input type="number" name="fn" min="1" max="31" value="${f.n || (f.t === 'monthly' ? '' : 3)}">
  </label>`;
}
function syncFreqFields(form) {
  const t = form.elements.ft.value;
  const show = (k, on) => $$(`[data-fx="${k}"]`, form).forEach(e => e.classList.toggle('hidden', !on));
  show('days', t === 'weekdays' || t === 'biweekly');
  show('bwhint', t === 'biweekly');
  show('n', t === 'perweek' || t === 'every' || t === 'monthly');
  const nl = $('[data-fx="nlabel"]', form);
  if (nl) nl.textContent = t === 'perweek' ? 'Ile razy w tygodniu' : t === 'every' ? 'Co ile dni' : 'Który dzień miesiąca (puste = wg daty startu)';
}
function readFreq(form) {
  const t = form.elements.ft.value;
  const n = parseInt(form.elements.fn.value, 10);
  const days = new FormData(form).getAll('fdays').map(Number).sort();
  switch (t) {
    case 'weekdays': return { t, days: days.length ? days : [dow(today())] };
    case 'biweekly': return { t, days: days.length ? [days[0]] : [dow(today())] };
    case 'perweek': return { t, n: clamp(n || 3, 1, 7) };
    case 'every': return { t, n: clamp(n || 3, 1, 365) };
    case 'every2': return { t: 'every', n: 2 };
    case 'weekly': return { t: 'every', n: 7 };
    case 'monthly': return n ? { t, n: clamp(n, 1, 31) } : { t };
    default: return { t };
  }
}

/* ---------- obowiązki z pliku „podział obowiązków” (pozycje Kuby – żółte) ---------- */
function seedChores() {
  const t = today();
  const list = [
    ['opróżnienie i naładowanie zmywarki wieczorem', 'Kuchnia', { t: 'daily' }],
    ['umycie naczyń wieczorem', 'Kuchnia', { t: 'daily' }],
    ['umycie butelek wieczorem', 'Kuchnia', { t: 'daily' }],
    ['kładzenie spać', 'Henio', { t: 'daily' }],
    ['witamina rano', 'Henio', { t: 'daily' }],
    ['zęby rano', 'Henio', { t: 'daily' }],
    ['zaprowadzanie do żłobka', 'Henio', { t: 'weekdays', days: [0, 1, 2, 3, 4] }],
    ['organizacja torby do wózka (pieluszki, mokre chusteczki, woda, smoczki, suche chusteczki, chrupki, tubka, zabawki, gryzaki, body/bluzka na zmianę, śliniak, buty)', 'Henio', { t: 'daily' }],
    ['odkładanie zabawek i książek', 'Henio', { t: 'daily' }],
    ['przegląd podstawowego jedzenia dla Henia (banany, jabłka, jogurty naturalne, serek Bieluch, pieczywo, chrupki, tubki, pomidory/ogórki, makaron, jajka)', 'Henio', { t: 'weekdays', days: [0, 3] }],
    ['umycie zlewu i lustra', 'Łazienka', { t: 'every', n: 14 }, 0],
    ['umycie WC', 'Łazienka', { t: 'every', n: 14 }, 3],
    ['umycie prysznica i parapetów', 'Łazienka', { t: 'every', n: 14 }, 7],
    ['czyszczenie zmywarki', 'Kuchnia', { t: 'monthly' }, 2],
    ['wymiana filtra w Dafi', 'Kuchnia', { t: 'monthly' }, 9],
    ['czyszczenie ekspresu do kawy', 'Kuchnia', { t: 'monthly' }, 16],
    ['planowanie i organizacja randki', 'Dom', { t: 'monthly' }, 5],
    ['podstawowe zakupy w Biedronce/Żabce etc', 'Kuchnia', { t: 'once' }, null],
    ['naprawa ubrań/butów/sprzętu', 'Dom', { t: 'once' }, null],
    ['wynoszenie rzeczy na strych/do piwnicy', 'Henio', { t: 'once' }, null],
    ['naprawy i remonty', 'Dom', { t: 'once' }, null],
  ];
  return list.map(([title, area, freq, off]) => {
    let next = t;
    if (off === null) next = null;
    else if (typeof off === 'number') next = addDays(t, off);
    const anchor = next || t;
    if (next && freq.t === 'weekdays') next = dueOnOrAfter(freq, next, anchor);
    return { id: uid(), title, area, freq, anchor, nextDate: next, history: [], createdAt: t };
  });
}

/* ---------- wschód / zachód słońca (równanie wschodu Słońca, dokładność ~1 min) ---------- */
const LOC = { lat: 52.205, lon: 20.94, name: 'Warszawa · Ochota / Włochy' };
function sunTimes(dateStr, lat = LOC.lat, lng = LOC.lon) {
  const rad = Math.PI / 180;
  const [y, m, d] = dateStr.split('-').map(Number);
  const jd = Date.UTC(y, m - 1, d, 12) / 86400000 + 2440587.5;
  const n = Math.round(jd - 2451545.0 + 0.0008);
  const Js = n - lng / 360;
  const M = ((357.5291 + 0.98560028 * Js) % 360 + 360) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const L = ((M + C + 180 + 102.9372) % 360 + 360) % 360;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
  const sd = Math.sin(L * rad) * Math.sin(23.4397 * rad);
  const cd = Math.cos(Math.asin(sd));
  const cw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sd) / (Math.cos(lat * rad) * cd);
  const w = Math.acos(clamp(cw, -1, 1)) / rad;
  const toD = J => new Date((J - 2440587.5) * 86400000);
  const rise = toD(Jt - w / 360), set = toD(Jt + w / 360);
  return { rise, set, len: (set - rise) / 60000 };
}
const fmtTime = d => d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
const fmtDur = min => { min = Math.round(Math.abs(min)); return `${Math.floor(min / 60)} godz ${min % 60} min`; };

/* ---------- pogoda (Open-Meteo, bez klucza) ---------- */
const WMO = {
  0: ['Bezchmurnie', '☀️', '🌙'], 1: ['Przeważnie słonecznie', '🌤️', '🌙'], 2: ['Częściowe zachmurzenie', '⛅', '☁️'], 3: ['Pochmurno', '☁️', '☁️'],
  45: ['Mgła', '🌫️'], 48: ['Szadź i mgła', '🌫️'], 51: ['Lekka mżawka', '🌦️'], 53: ['Mżawka', '🌦️'], 55: ['Gęsta mżawka', '🌧️'],
  56: ['Marznąca mżawka', '🌧️'], 57: ['Marznąca mżawka', '🌧️'], 61: ['Słaby deszcz', '🌦️'], 63: ['Deszcz', '🌧️'], 65: ['Ulewa', '🌧️'],
  66: ['Marznący deszcz', '🌧️'], 67: ['Marznący deszcz', '🌧️'], 71: ['Słaby śnieg', '🌨️'], 73: ['Śnieg', '🌨️'], 75: ['Intensywny śnieg', '❄️'],
  77: ['Krupa śnieżna', '🌨️'], 80: ['Przelotny deszcz', '🌦️'], 81: ['Przelotne opady', '🌧️'], 82: ['Gwałtowne ulewy', '⛈️'],
  85: ['Przelotny śnieg', '🌨️'], 86: ['Śnieżyca', '❄️'], 95: ['Burza', '⛈️'], 96: ['Burza z gradem', '⛈️'], 99: ['Burza z gradem', '⛈️'],
};
const wx = (code, isDay = 1) => { const w = WMO[code] || ['—', '🌡️']; return { label: w[0], emo: (!isDay && w[2]) ? w[2] : w[1] }; };
let wxLoading = false;
async function fetchWeather(force) {
  if (wxLoading) return;
  if (!force && S.weather && Date.now() - S.weather.at < 30 * 60000) return;
  wxLoading = true;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOC.lat}&longitude=${LOC.lon}` +
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day' +
    '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&timezone=Europe%2FWarsaw&forecast_days=7&wind_speed_unit=kmh';
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    S.weather = { at: Date.now(), data: await r.json() };
    save();
  } catch (e) {
    if (S.weather) S.weather.err = true; else S.weather = { at: 0, err: true, data: null };
  } finally {
    wxLoading = false;
    if (currentRoute() === 'home') { const el = $('#weather'); if (el) { el.innerHTML = weatherHTML(); scrollHoursToNow(); } }
  }
}

/* ---------- UI: arkusz (bottom sheet), toast ---------- */
let sheetCtx = null;
function openSheet({ title, body, onSave, onDelete, saveLabel = 'Zapisz', deleteLabel = 'Usuń', onOpen, refresh }) {
  const root = $('#sheet');
  $('#toast').classList.remove('show');
  root.innerHTML = `<div class="sheet-backdrop" data-close></div>
  <div class="sheet-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Zamknij">✕</button></div>
    <form class="sheet-body" novalidate autocomplete="off">
      <div class="sheet-content">${body}</div>
      ${(onSave || onDelete) ? `<div class="sheet-actions">
        ${onDelete ? `<button type="button" class="btn danger" data-sheet-del>${deleteLabel}</button>` : ''}
        ${onSave ? `<button type="submit" class="btn primary">${saveLabel}</button>` : ''}
      </div>` : ''}
    </form>
  </div>`;
  root.classList.add('open'); root.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const form = $('form', root);
  sheetCtx = { onSave, onDelete, form, refresh };
  if (form.elements.ft) syncFreqFields(form);
  if (onOpen) onOpen(form);
  const first = $('input[type=text],textarea', form);
  if (first && !first.value && !('ontouchstart' in window)) setTimeout(() => first.focus(), 60);
  return form;
}
function closeSheet() {
  const root = $('#sheet');
  root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); root.innerHTML = '';
  document.body.style.overflow = '';
  sheetCtx = null;
}
function refreshSheet() { if (sheetCtx && sheetCtx.refresh) { const c = $('.sheet-content'); if (c) c.innerHTML = sheetCtx.refresh(); } }

let toastTimer;
function toast(msg, actionLabel, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ''}`;
  el.classList.add('show');
  if (actionLabel) $('button', el).onclick = () => { action(); el.classList.remove('show'); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), actionLabel ? 5000 : 2600);
}
function confirmSheet(text, onYes, yesLabel = 'Usuń') {
  openSheet({ title: 'Potwierdź', body: `<p style="margin:4px 0 12px">${esc(text)}</p>`, onSave: () => { onYes(); }, saveLabel: yesLabel });
}

/* ---------- elementy wspólne ---------- */
const field = (label, inner, hint) => `<label class="field"><span>${label}</span>${inner}${hint ? `<div class="hint">${hint}</div>` : ''}</label>`;
const inText = (name, val = '', ph = '') => `<input type="text" name="${name}" value="${esc(val)}" placeholder="${esc(ph)}">`;
const inDate = (name, val = '') => `<input type="date" name="${name}" value="${esc(val || '')}">`;
const inTime = (name, val = '') => `<input type="time" name="${name}" value="${esc(val || '')}" step="300">`;
const sel = (name, opts, val) => `<select name="${name}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const seg = (act, opts, val) => `<div class="seg" role="tablist">${opts.map(([v, l]) => `<button type="button" class="${v === val ? 'on' : ''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
const chips = (act, opts, val) => `<div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip ${v === val ? 'on' : ''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
const fab = (act, label) => `<button class="fab" data-act="${act}" aria-label="${label}">${icon('plus')}</button>`;
const colorPicker = (name, colors, val) => `<div class="colors">${colors.map(c => `<label><input type="radio" name="${name}" value="${c}" ${c === val ? 'checked' : ''}><span style="--c:${c}"></span></label>`).join('')}</div>`;
function dateRangeLabel(o) {
  if (o.start && o.end) return `${fmt(o.start)} – ${fmt(o.end)}`;
  if (o.end) return `do ${fmt(o.end)}`;
  if (o.start) return `od ${fmt(o.start)}`;
  return 'bez terminu';
}
function dateRangeStatus(o) {
  const t = today();
  if (o.done) return '';
  if (o.end) { const n = diffDays(t, o.end); return n > 0 ? `zostało ${dni(n)}` : n === 0 ? 'termin dziś' : `po terminie ${dni(-n)}`; }
  if (o.start) { const n = diffDays(o.start, t); return n > 0 ? `trwa ${dni(n)}` : n === 0 ? 'start dziś' : `start za ${dni(-n)}`; }
  return '';
}
