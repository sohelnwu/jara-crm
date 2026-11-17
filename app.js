/* জারা মাঠ — field CRM for জারা ইলেকট্রিক ও ইলেকট্রনিক্স */
'use strict';

/* ══════════ ১. তালিকা ও ওজন ══════════ */

const TYPES = [
  'নতুন বাড়ির মালিক',
  'ইলেকট্রিশিয়ান',
  'ঠিকাদার',
  'পাইকারি দোকানদার',
  'সাধারণ ক্রেতা',
];

/* construction stage → how close the building is to its wiring work */
const STAGES = [
  ['জমি/সাইট প্রস্তুতি', 3],
  ['মাটি খোঁড়া/ফাউন্ডেশন', 5],
  ['গ্রাউন্ড ফ্লোরের কাজ', 9],
  ['১ম তলার কাজ', 10],
  ['২য় তলার কাজ', 11],
  ['৩য় তলার কাজ', 12],
  ['৪র্থ তলার কাজ', 12],
  ['৫ম তলার কাজ', 12],
  ['৬ষ্ঠ তলার কাজ', 12],
  ['ছাদ সম্পন্ন', 18],
  ['প্লাস্টার/ফিনিশিং', 16],
  ['নির্মাণ সম্পন্ন', 5],
];

/* electrical status → how open the opportunity still is */
const ELEC = [
  ['কথা হয়নি', 22],
  ['ইলেকট্রিক কাজ শুরু হয়নি', 38],
  ['ইলেকট্রিক কাজের কথা হয়েছে', 40],
  ['ওয়্যারিং শুরু হয়েছে', 30],
  ['ওয়্যারিং চলছে', 16],
  ['ওয়্যারিং শেষ', 4],
  ['পণ্য কেনা সম্পন্ন', 0],
];

const NEED = [
  ['', 8], ['7', 30], ['15', 26], ['30', 20],
  ['45', 15], ['60', 11], ['90', 6], ['120', 3], ['180', 1],
];
const NEED_LABEL = {
  '': 'জানা নেই', '7': '৭ দিনের মধ্যে', '15': '১৫ দিনের মধ্যে',
  '30': '১ মাসের মধ্যে', '45': '৪৫ দিনের মধ্যে', '60': '২ মাসের মধ্যে',
  '90': '৩ মাসের মধ্যে', '120': '৪ মাসের মধ্যে', '180': '৬ মাসের মধ্যে',
};

const EVENT_LABEL = {
  created: 'রেকর্ড খোলা হয়েছে', visit: 'মাঠে ভিজিট', call: 'ফোনে কথা',
  wa: 'WhatsApp-এ কথা', tea: 'দোকানে এসেছেন', sale: 'বিক্রি', won: 'কাজ পেয়েছি',
  lost: 'কাজ হাতছাড়া', note: 'নোট', stage: 'অবস্থা বদল', pin: 'ম্যাপে পিন',
  invite: 'চা-দাওয়াত দেওয়া হয়েছে', promise: 'আসার তারিখ দিয়েছেন',
  noshow: 'আসেননি', reschedule: 'তারিখ পিছিয়েছে',
};

/* চা-দাওয়াতের ধাপ — মাঠ থেকে দোকান পর্যন্ত পুরো পথ */
const TEA = [
  ['none',    'দাওয়াত দেওয়া হয়নি'],
  ['invited', 'দাওয়াত দেওয়া হয়েছে'],
  ['promised','আসবেন বলেছেন'],
  ['came',    'দোকানে এসেছেন'],
  ['noshow',  'আসেননি — আবার বলতে হবে'],
];
const TEA_LABEL = Object.fromEntries(TEA);
const TEA_CHIP  = { none:'idle', invited:'gold', promised:'warm', came:'ok', noshow:'bad' };

/* যোগাযোগের মাধ্যম ও ফলাফল */
const METHODS = [
  ['visit','সরাসরি দেখা'], ['call','ফোনে'], ['wa','WhatsApp-এ'], ['tea','দোকানে এসেছেন'],
];
const OUTCOMES = [
  ['good',    'আগ্রহ দেখিয়েছেন'],
  ['promise', 'দোকানে আসবেন বলেছেন'],
  ['later',   'পরে জানাবেন'],
  ['busy',    'ধরতে পারিনি / ব্যস্ত'],
  ['nointerest','আগ্রহ নেই'],
];
const OUTCOME_LABEL = Object.fromEntries(OUTCOMES);

/* ══════════ ২. ছোট সহায়ক ══════════ */

const $  = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const BN = '০১২৩৪৫৬৭৮৯';
const bn = v => String(v == null ? '' : v).replace(/\d/g, d => BN[+d]);
const money = n => '৳' + bn(Math.round(n || 0).toLocaleString('en-US'));

const DAY = 864e5;
/* সব তারিখ ফোনের নিজের সময় ধরে — UTC নয়। বাংলাদেশ UTC+৬, তাই রাত ১২টার পর
   UTC ধরলে আগের দিন দেখাত। */
function isoLocal(d){
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}
const todayISO = () => isoLocal(new Date());
const midnight = iso => new Date(iso + 'T00:00:00').getTime();
const daysSince = iso => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : 999;

function banglaDate(iso){
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const m = ['জানু','ফেব','মার্চ','এপ্রি','মে','জুন','জুলা','আগ','সেপ','অক্টো','নভে','ডিসে'];
  return bn(d.getDate()) + ' ' + m[d.getMonth()] + ' ' + bn(d.getFullYear());
}
function agoText(iso){
  if (!iso) return 'কখনো না';
  const d = daysSince(iso);
  if (d <= 0) return 'আজ';
  if (d === 1) return 'গতকাল';
  if (d < 30) return bn(d) + ' দিন আগে';
  if (d < 365) return bn(Math.floor(d / 30)) + ' মাস আগে';
  return bn(Math.floor(d / 365)) + ' বছর আগে';
}

function phoneDigits(p){ return String(p || '').replace(/\D/g, ''); }
function waNumber(p){
  const n = phoneDigits(p);
  if (!n) return '';
  if (n.startsWith('88')) return n;
  if (n.startsWith('0')) return '88' + n;
  return '88' + n;
}

/* great-circle distance in km */
function distKm(a, b, c, d){
  if ([a, b, c, d].some(v => typeof v !== 'number' || isNaN(v))) return null;
  const R = 6371, r = Math.PI / 180;
  const dLat = (c - a) * r, dLng = (d - b) * r;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const distText = km => km == null ? '' :
  (km < 1 ? bn(Math.round(km * 1000)) + ' মি' : bn(km.toFixed(1)) + ' কিমি');

function mapsDir(lat, lng){
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&travelmode=driving';
}

/* ══════════ ৩. তাগিদ স্কোর ══════════ */

function weightOf(table, value, fallback){
  const row = table.find(r => r[0] === value);
  return row ? row[1] : fallback;
}

function score(c){
  if (c.status === 'won' || c.status === 'lost') return 0;

  const last = c.lastContact || c.createdAt;
  const stale = Math.min(15, daysSince(last) * 1.2);

  let s;
  if (c.type === 'নতুন বাড়ির মালিক'){
    s = weightOf(ELEC, c.elecStatus, 22)
      + weightOf(NEED, String(c.needDays || ''), 8)
      + weightOf(STAGES, c.stage, 8)
      + stale;
  } else {
    // মিস্ত্রি, ঠিকাদার, পাইকার — সম্পর্ক ধরে রাখার তাগিদ
    const base = { 'ইলেকট্রিশিয়ান': 26, 'ঠিকাদার': 24, 'পাইকারি দোকানদার': 20 };
    s = (base[c.type] || 12) + stale * 1.6;
  }

  const t = todayISO();
  if (dueDate(c) && dueDate(c) <= t) s += 25;
  if (c.teaStatus === 'promised') s += 10;   // কথা দিয়েছেন — ফেলে রাখা যাবে না
  if (c.teaStatus === 'noshow')   s += 6;    // আসেননি, আবার ধরতে হবে
  return Math.round(s);
}

/* কবে ধরতে হবে — চা-দাওয়াতের তারিখ ও পরের যোগাযোগের মধ্যে যেটা আগে */
function dueDate(c){
  const a = (c.teaStatus === 'promised' || c.teaStatus === 'invited') && c.teaDate ? c.teaDate : '';
  const b = c.nextDate || '';
  if (a && b) return a < b ? a : b;
  return a || b || '';
}
function dueKind(c){
  const d = dueDate(c);
  if (!d) return '';
  if (d === (c.teaDate || '') && (c.teaStatus === 'promised' || c.teaStatus === 'invited')) return 'tea';
  return 'call';
}

/* ফলো-আপ ভাগ: overdue | today | week | later | none */
function bucket(c){
  if (c.status === 'won' || c.status === 'lost') return 'none';
  const d = dueDate(c);
  if (!d) return 'none';
  const t = todayISO();
  if (d < t) return 'overdue';
  if (d === t) return 'today';
  return d <= plusDays(7) ? 'week' : 'later';
}
function overdueDays(c){
  const d = dueDate(c);
  if (!d) return 0;
  return Math.max(0, Math.round((midnight(todayISO()) - midnight(d)) / DAY));
}
function plusDays(n){ return isoLocal(new Date(Date.now() + n * DAY)); }

function band(n){
  if (n >= 60) return { k: 'hot',  t: 'এখনই ধরুন' };
  if (n >= 40) return { k: 'warm', t: 'শীঘ্রই' };
  if (n >= 20) return { k: 'cool', t: 'নজরে রাখুন' };
  return { k: 'idle', t: 'ঠান্ডা' };
}
const BAND_COLOR = { hot:'#C62828', warm:'#E09F03', cool:'#1E6B5C', idle:'#5C6E85' };

function pipelineValue(c, perFloor){
  if (!perFloor || c.type !== 'নতুন বাড়ির মালিক') return 0;
  if (c.status === 'won' || c.status === 'lost') return 0;
  return (Number(c.floors) || 1) * perFloor;
}

/* ══════════ ৪. অবস্থা ══════════ */

const S = {
  list: [],
  settings: null,
  view: 'today',
  q: '',
  filter: 'all',
  here: null,          // current GPS, when granted
  map: null,
  layer: null,
  routeIds: [],
};

async function load(){
  S.list     = await Store.all();
  S.settings = await Store.getSettings();
}
async function persist(){
  try { await Store.saveAll(S.list); }
  catch(e){ toast('সংরক্ষণে সমস্যা হয়েছে'); }
}
function byId(id){ return S.list.find(x => x.id === id); }

function addEvent(c, type, text){
  c.events = c.events || [];
  c.events.unshift({ t: new Date().toISOString(), type, text: text || '' });
  if (c.events.length > 250) c.events.length = 250;
  if (['visit','call','tea','sale','note'].includes(type)) c.lastContact = new Date().toISOString();
  c.updatedAt = new Date().toISOString();
}

/* ══════════ ৫. ছোট UI ══════════ */

let toastTimer;
function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

function openSheet(title, bodyHTML, footHTML){
  $('#sheet').innerHTML =
    '<div class="sheet-head"><h2>' + esc(title) + '</h2>' +
    '<button class="x" data-close aria-label="বন্ধ">✕</button></div>' +
    '<div class="sheet-body">' + bodyHTML + '</div>' +
    (footHTML ? '<div class="sheet-foot">' + footHTML + '</div>' : '');
  $('#sheetWrap').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSheet(){
  $('#sheetWrap').hidden = true;
  $('#sheet').innerHTML = '';
  document.body.style.overflow = '';
}

/* ══════════ ৬. পর্দা: আজ ══════════ */

function viewToday(){
  const t = todayISO();
  const open = S.list.filter(c => c.status !== 'won' && c.status !== 'lost');
  const ranked = open.map(c => ({ c, s: score(c) })).sort((a, b) => b.s - a.s);

  const due = ranked.filter(x => ['overdue','today'].includes(bucket(x.c)));
  const hot = ranked.filter(x => !due.includes(x)).slice(0, 8);

  const pipeline = open.reduce((n, c) => n + pipelineValue(c, S.settings.perFloorValue), 0);
  const pinless  = S.list.filter(c => c.lat == null).length;
  const won = S.list.filter(c => c.status === 'won');
  const sales = won.reduce((n, c) => n + (Number(c.saleAmount) || 0), 0);

  let h = '';

  h += '<section class="hero">' +
       '<span class="hl">পাইপলাইনে আছে</span>' +
       '<div class="hv">' + (S.settings.perFloorValue ? money(pipeline) : bn(open.length) + ' জন') + '</div>' +
       '<div class="hs">' + (S.settings.perFloorValue
          ? bn(open.length) + ' জন সম্ভাব্য ক্রেতা — আপনার নিজের অনুমান অনুযায়ী'
          : 'প্রতি তলার আনুমানিক মালের দাম সেট করলে টাকার হিসাব দেখাব') + '</div>' +
       '<div class="hero-row">' +
         '<div><span class="k">আজ ধরতে হবে</span><span class="v">' + bn(due.length) + '</span></div>' +
         '<div><span class="k">কাজ পেয়েছি</span><span class="v">' + (sales ? money(sales) : bn(won.length) + ' টি') + '</span></div>' +
       '</div></section>';

  h += '<div class="quick">' +
       '<button class="qa" data-q="add"><span class="qi">＋</span>নতুন</button>' +
       '<button class="qa" data-q="route"><span class="qi">➤</span>আজকের রুট</button>' +
       '<button class="qa" data-q="pin"><span class="qi">◈</span>পিন বাকি' + (pinless ? ' (' + bn(pinless) + ')' : '') + '</button>' +
       '<button class="qa" data-q="settings"><span class="qi">⚙</span>সেটিংস</button>' +
       '</div>';

  if (!S.list.length){
    h += '<div class="card"><div class="empty"><strong>এখনো কোনো রেকর্ড নেই</strong>' +
         'মাঠে গিয়ে প্রথম নির্মাণাধীন বাড়িটা তুলুন। উপরের ＋ বাটনে চাপুন।</div></div>';
    return h;
  }

  if (due.length){
    h += '<div class="sec-h"><h2>আজ যোগাযোগ করতে হবে</h2><span class="more">' + bn(due.length) + ' জন</span></div>';
    h += '<div class="card pad0"><div class="plist">' + due.map(x => personRow(x.c, x.s)).join('') + '</div></div>';
  }

  h += '<div class="sec-h"><h2>সবচেয়ে জরুরি</h2><span class="more">তাগিদ অনুযায়ী</span></div>';
  h += hot.length
    ? '<div class="card pad0"><div class="plist">' + hot.map(x => personRow(x.c, x.s)).join('') + '</div></div>'
    : '<div class="card"><div class="empty">সব ধরা হয়ে গেছে।</div></div>';

  return h;
}

function personRow(c, s){
  const sc = s == null ? score(c) : s;
  const b  = band(sc);
  const km = distKm(S.settings.shopLat, S.settings.shopLng, c.lat, c.lng);

  const bits = [];
  if (c.village) bits.push(c.village);
  if (c.type === 'নতুন বাড়ির মালিক'){
    if (c.floors) bits.push(bn(c.floors) + ' তলা');
    if (c.elecStatus) bits.push(c.elecStatus);
  } else if (c.type) bits.push(c.type);

  let chip = '';
  if (c.status === 'won')      chip = '<span class="chip ok">পেয়েছি</span>';
  else if (c.status === 'lost') chip = '<span class="chip bad">হাতছাড়া</span>';
  else chip = '<span class="chip ' + b.k + '">' + b.t + '</span>';

  const flags = (c.lat == null ? '<span class="chip idle">পিন নেই</span>' : '') +
                (c.teaDate && !c.teaDone ? '<span class="chip gold">চা-দাওয়াত</span>' : '');

  return '<button class="prow" data-open="' + esc(c.id) + '">' +
    '<span class="pstripe" style="background:' + (c.status === 'won' ? '#1E7A4D' : c.status === 'lost' ? '#B3261E' : BAND_COLOR[b.k]) + '"></span>' +
    '<span class="pbody">' +
      '<span class="pname">' + esc(c.name || 'নামহীন') + chip + flags + '</span>' +
      '<span class="pmeta">' + esc(bits.join(' · ') || 'বিস্তারিত নেই') + '</span>' +
    '</span>' +
    '<span class="pside">' +
      (km != null ? '<span class="pdist">' + distText(km) + '</span>' : '') +
      '<span class="muted" style="font-size:11px">' + agoText(c.lastContact || c.createdAt) + '</span>' +
    '</span></button>';
}

/* ══════════ ৬ক. পর্দা: ফলো-আপ ══════════ */

function followRow(c){
  const b = band(score(c));
  const kind = dueKind(c);
  const d = dueDate(c);
  const od = overdueDays(c);
  const wa = waNumber(c.phone);

  const when = od > 0
    ? '<span class="chip hot">' + bn(od) + ' দিন পার</span>'
    : d === todayISO() ? '<span class="chip warm">আজ</span>'
    : '<span class="chip cool">' + banglaDate(d) + '</span>';

  const why = kind === 'tea'
    ? '<span class="chip gold">' + (c.teaStatus === 'promised' ? 'আসবেন বলেছেন' : 'চা-দাওয়াত') + '</span>'
    : '';

  return '<div class="frow">' +
    '<button class="fmain" data-open="' + esc(c.id) + '">' +
      '<span class="pstripe" style="background:' + BAND_COLOR[b.k] + '"></span>' +
      '<span class="pbody">' +
        '<span class="pname">' + esc(c.name || 'নামহীন') + when + why + '</span>' +
        '<span class="pmeta">' + esc([c.village, c.type, c.elecStatus].filter(Boolean).join(' · ') || '—') +
        ' · শেষ কথা ' + agoText(c.lastContact || c.createdAt) + '</span>' +
      '</span>' +
    '</button>' +
    '<span class="facts">' +
      '<a class="fact" href="tel:' + esc(c.phone) + '" aria-label="ফোন">✆</a>' +
      (wa ? '<a class="fact wa" href="https://wa.me/' + wa + '" target="_blank" rel="noopener" aria-label="WhatsApp">✆</a>' : '') +
      '<button class="fact done" data-fup="' + esc(c.id) + '" aria-label="ফলো-আপ লিখুন">✓</button>' +
    '</span></div>';
}

function viewFollow(){
  const live = S.list.filter(c => c.status !== 'won' && c.status !== 'lost');
  const g = { overdue: [], today: [], week: [], later: [], none: [] };
  live.forEach(c => g[bucket(c)].push(c));
  const bySoon = (a, b) => (dueDate(a) || '9') < (dueDate(b) || '9') ? -1 : 1;
  ['overdue','today','week','later'].forEach(k => g[k].sort(bySoon));

  const coming = live.filter(c => c.teaStatus === 'promised' && c.teaDate);
  const noshow = live.filter(c => c.teaStatus === 'noshow');
  const noplan = live.filter(c => !dueDate(c));

  let h = '<div class="stats">' +
    '<div class="stat"><div class="k">বাকি পড়েছে</div><div class="v" style="color:var(--hot)">' + bn(g.overdue.length) + '</div></div>' +
    '<div class="stat"><div class="k">আজ</div><div class="v">' + bn(g.today.length) + '</div></div>' +
    '<div class="stat"><div class="k">আগামী ৭ দিন</div><div class="v">' + bn(g.week.length) + '</div></div>' +
    '<div class="stat"><div class="k">দোকানে আসার কথা</div><div class="v">' + bn(coming.length) + '</div></div>' +
    '</div>';

  const block = (title, arr, note) => arr.length
    ? '<div class="sec-h"><h2>' + title + '</h2><span class="more">' + bn(arr.length) + ' জন</span></div>' +
      (note ? '<p class="muted" style="margin:0 2px">' + note + '</p>' : '') +
      '<div class="card pad0">' + arr.map(followRow).join('') + '</div>'
    : '';

  h += block('বাকি পড়েছে', g.overdue, 'এগুলো তারিখ পেরিয়ে গেছে — আজই ধরুন।');
  h += block('আজ ধরতে হবে', g.today);
  h += block('আগামী ৭ দিন', g.week);

  /* দোকানে আসার তারিখ অনুযায়ী */
  if (coming.length){
    const byDate = {};
    coming.forEach(c => { (byDate[c.teaDate] = byDate[c.teaDate] || []).push(c); });
    h += '<div class="sec-h"><h2>দোকানে আসার তারিখ</h2><span class="more">তারিখে চাপুন</span></div><div class="card pad0">' +
      Object.keys(byDate).sort().map(d => {
        const ov = d < todayISO();
        return '<details class="dgroup"' + (ov || d === todayISO() ? ' open' : '') + '>' +
          '<summary><span>' + banglaDate(d) + '</span>' +
          '<span class="chip ' + (ov ? 'hot' : d === todayISO() ? 'warm' : 'cool') + '">' +
          bn(byDate[d].length) + ' জন</span></summary>' +
          byDate[d].map(followRow).join('') + '</details>';
      }).join('') + '</div>';
  }

  if (noshow.length) h += block('আসেননি — আবার দাওয়াত দিন', noshow);

  if (noplan.length){
    h += '<div class="sec-h"><h2>তারিখ বসানো নেই</h2><span class="more">' + bn(noplan.length) + ' জন</span></div>' +
      '<p class="muted" style="margin:0 2px">এদের পরের যোগাযোগের তারিখ দেওয়া নেই, তাই কেউ মনে করিয়ে দেবে না।</p>' +
      '<div class="card pad0">' + noplan.slice(0, 15).map(followRow).join('') + '</div>';
  }

  if (!live.length)
    h += '<div class="card"><div class="empty"><strong>এখনো কেউ নেই</strong>কাস্টমার যোগ করলে এখানে ফলো-আপের তালিকা তৈরি হবে।</div></div>';
  else if (!g.overdue.length && !g.today.length && !g.week.length && !coming.length && !noplan.length)
    h += '<div class="card"><div class="empty"><strong>আজ সব পরিষ্কার</strong>কোনো ফলো-আপ বাকি নেই।</div></div>';

  return h;
}

/* ══════════ ৭. পর্দা: কাস্টমার ══════════ */

const FILTERS = [
  ['all', 'সব'],
  ['নতুন বাড়ির মালিক', 'নির্মাণাধীন বাড়ি'],
  ['ইলেকট্রিশিয়ান', 'ইলেকট্রিশিয়ান'],
  ['ঠিকাদার', 'ঠিকাদার'],
  ['পাইকারি দোকানদার', 'পাইকার'],
  ['won', 'পেয়েছি'],
  ['lost', 'হাতছাড়া'],
  ['nopin', 'পিন নেই'],
];

function filtered(){
  const q = S.q.trim().toLowerCase();
  return S.list.filter(c => {
    if (S.filter === 'won'   && c.status !== 'won')  return false;
    if (S.filter === 'lost'  && c.status !== 'lost') return false;
    if (S.filter === 'nopin' && c.lat != null)       return false;
    if (!['all','won','lost','nopin'].includes(S.filter) && c.type !== S.filter) return false;
    if (!q) return true;
    return [c.name, c.phone, c.village, c.address, c.type, c.supplierName, c.notes]
      .join(' ').toLowerCase().includes(q);
  });
}

function viewPeople(){
  const rows = filtered().map(c => ({ c, s: score(c) })).sort((a, b) => b.s - a.s);
  let h = '<div class="search"><span class="muted">খুঁজুন</span>' +
          '<input id="q" type="search" placeholder="নাম, ফোন বা গ্রাম" value="' + esc(S.q) + '"></div>';
  h += '<div class="filters">' + FILTERS.map(([k, l]) =>
        '<button class="fchip' + (S.filter === k ? ' on' : '') + '" data-f="' + k + '">' + l + '</button>').join('') + '</div>';
  h += '<div class="sec-h"><h2>' + bn(rows.length) + ' জন</h2></div>';
  h += rows.length
    ? '<div class="card pad0"><div class="plist">' + rows.map(x => personRow(x.c, x.s)).join('') + '</div></div>'
    : '<div class="card"><div class="empty"><strong>কিছু পাওয়া যায়নি</strong>অন্য শব্দ দিয়ে খুঁজুন বা ফিল্টার বদলান।</div></div>';
  return h;
}

/* ══════════ ৮. পর্দা: ম্যাপ ══════════ */

function viewMap(){
  return '<div style="position:relative"><div id="mapbox"></div>' +
         '<div class="mapnote" id="mapnote">পিন চাপলে বিস্তারিত ও দূরত্ব দেখাবে।</div></div>';
}

function paintMap(){
  const box = $('#mapbox');
  if (!box || typeof L === 'undefined') return;

  const pins = S.list.filter(c => typeof c.lat === 'number');
  const sLat = S.settings.shopLat, sLng = S.settings.shopLng;

  if (S.map){ S.map.remove(); S.map = null; }
  S.map = L.map(box, { zoomControl: true, attributionControl: true })
           .setView([sLat, sLng], pins.length ? 13 : 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(S.map);

  // shop
  L.marker([sLat, sLng], {
    icon: L.divIcon({ className: '', html:
      '<div class="pinmark" style="background:#0B2545"></div>', iconSize: [26, 26], iconAnchor: [13, 24] })
  }).addTo(S.map).bindPopup('<div class="maptip"><b>জারা ইলেকট্রিক ও ইলেকট্রনিক্স</b><br><small>দোকান</small></div>');

  const group = [[sLat, sLng]];
  pins.forEach(c => {
    const b = band(score(c));
    const col = c.status === 'won' ? '#1E7A4D' : c.status === 'lost' ? '#B3261E' : BAND_COLOR[b.k];
    const km = distKm(sLat, sLng, c.lat, c.lng);
    const m = L.marker([c.lat, c.lng], {
      icon: L.divIcon({ className: '', html:
        '<div class="pinmark" style="background:' + col + '"></div>', iconSize: [26, 26], iconAnchor: [13, 24] })
    }).addTo(S.map);
    m.bindPopup(
      '<div class="maptip"><b>' + esc(c.name || 'নামহীন') + '</b><br>' +
      '<small>' + esc([c.village, c.type].filter(Boolean).join(' · ')) + '</small><br>' +
      '<small>দোকান থেকে ' + distText(km) + '</small><br>' +
      '<a href="' + mapsDir(c.lat, c.lng) + '" target="_blank" rel="noopener">রাস্তা দেখুন ↗</a> · ' +
      '<a href="#" data-pop="' + esc(c.id) + '">বিস্তারিত</a></div>');
    group.push([c.lat, c.lng]);
  });

  if (group.length > 1) S.map.fitBounds(group, { padding: [40, 40], maxZoom: 15 });

  const note = $('#mapnote');
  if (note){
    const miss = S.list.length - pins.length;
    note.innerHTML = bn(pins.length) + ' টি পিন দেখাচ্ছে' +
      (miss > 0 ? ' · <b>' + bn(miss) + ' টির পিন বাকি</b>' : '') +
      '<br><span class="muted">লাল = এখনই ধরুন · হলুদ = শীঘ্রই · সবুজ = নজরে · নেভি = আপনার দোকান</span>';
  }
  setTimeout(() => S.map && S.map.invalidateSize(), 120);
}

/* ══════════ ৯. পর্দা: রুট ══════════ */

function viewRoute(){
  const origin = S.here || { lat: S.settings.shopLat, lng: S.settings.shopLng };
  const open = S.list
    .filter(c => typeof c.lat === 'number' && c.status !== 'won' && c.status !== 'lost')
    .map(c => ({ c, km: distKm(origin.lat, origin.lng, c.lat, c.lng), s: score(c) }))
    .sort((a, b) => a.km - b.km);

  let h = '<div class="card"><h2 style="margin:0 0 6px;font-size:15px">আজকের ঘোরার রুট</h2>' +
    '<p class="muted" style="margin:0 0 12px">' +
    (S.here ? 'আপনার এখনকার অবস্থান থেকে হিসাব করা হয়েছে।' : 'দোকান থেকে হিসাব করা হয়েছে।') +
    ' যাদের নেবেন টিক দিন, তারপর Google Maps-এ একসাথে খুলুন।</p>' +
    '<div class="btnrow"><button class="btn sec" id="useHere">◎ আমার অবস্থান নিন</button>' +
    '<button class="btn sec" id="pickTop">⚡ জরুরি ৫ জন</button></div></div>';

  if (!open.length){
    h += '<div class="card"><div class="empty"><strong>পিন করা কেউ নেই</strong>' +
         'কাস্টমার যোগ করার সময় ম্যাপে পিন দিলে এখানে দেখাবে।</div></div>';
    return h;
  }

  h += '<div class="sec-h"><h2>কাছের থেকে দূরে</h2><span class="more" id="selCount">' +
       bn(S.routeIds.length) + ' জন বাছাই</span></div>';
  h += '<div class="card pad0"><div class="plist">' + open.map(x => {
    const b = band(x.s);
    return '<label class="prow" style="cursor:pointer">' +
      '<input type="checkbox" class="rsel" value="' + esc(x.c.id) + '"' +
      (S.routeIds.includes(x.c.id) ? ' checked' : '') +
      ' style="width:20px;height:20px;flex:0 0 auto;margin-top:3px;accent-color:#0B2545">' +
      '<span class="pbody"><span class="pname">' + esc(x.c.name || 'নামহীন') +
      '<span class="chip ' + b.k + '">' + b.t + '</span></span>' +
      '<span class="pmeta">' + esc([x.c.village, x.c.address].filter(Boolean).join(' · ') || '—') + '</span></span>' +
      '<span class="pside"><span class="pdist">' + distText(x.km) + '</span></span></label>';
  }).join('') + '</div></div>';

  h += '<button class="btn gold block" id="goRoute">Google Maps-এ রুট খুলুন</button>' +
       '<p class="muted" style="text-align:center">একবারে সর্বোচ্চ ৯ জন নেওয়া যায়।</p>';
  return h;
}

function openRoute(){
  const picked = S.routeIds.map(byId).filter(c => c && typeof c.lat === 'number');
  if (!picked.length){ toast('আগে কাউকে বাছাই করুন'); return; }
  const o = S.here || { lat: S.settings.shopLat, lng: S.settings.shopLng };
  const ordered = picked
    .map(c => ({ c, km: distKm(o.lat, o.lng, c.lat, c.lng) }))
    .sort((a, b) => a.km - b.km).map(x => x.c).slice(0, 9);

  const dest = ordered[ordered.length - 1];
  const mid  = ordered.slice(0, -1).map(c => c.lat + ',' + c.lng).join('|');
  let url = 'https://www.google.com/maps/dir/?api=1&travelmode=driving' +
            '&origin=' + o.lat + ',' + o.lng +
            '&destination=' + dest.lat + ',' + dest.lng;
  if (mid) url += '&waypoints=' + encodeURIComponent(mid);
  window.open(url, '_blank', 'noopener');
}

/* ══════════ ১০. পর্দা: রিপোর্ট ══════════ */

function viewReport(){
  const all = S.list;
  const won = all.filter(c => c.status === 'won');
  const lost = all.filter(c => c.status === 'lost');
  const closed = won.length + lost.length;
  const rate = closed ? Math.round(won.length / closed * 100) : 0;
  const sales = won.reduce((n, c) => n + (Number(c.saleAmount) || 0), 0);

  let h = '<div class="stats">' +
    '<div class="stat"><div class="k">মোট রেকর্ড</div><div class="v">' + bn(all.length) + '</div></div>' +
    '<div class="stat"><div class="k">কাজ পেয়েছি</div><div class="v">' + bn(won.length) + '</div></div>' +
    '<div class="stat"><div class="k">হাতছাড়া</div><div class="v">' + bn(lost.length) + '</div></div>' +
    '<div class="stat"><div class="k">সফলতার হার</div><div class="v">' + bn(rate) + '%</div></div>' +
    '</div>';

  if (sales) h += '<div class="card"><div class="k muted">মোট বিক্রি (রেকর্ড করা)</div>' +
                  '<div class="v num" style="font-size:26px;font-weight:700">' + money(sales) + '</div></div>';

  // village breakdown
  const byVillage = {};
  all.forEach(c => {
    const v = c.village || 'গ্রাম লেখা নেই';
    byVillage[v] = byVillage[v] || { n: 0, w: 0 };
    byVillage[v].n++;
    if (c.status === 'won') byVillage[v].w++;
  });
  const vs = Object.entries(byVillage).sort((a, b) => b[1].n - a[1].n).slice(0, 12);
  const vmax = vs.length ? vs[0][1].n : 1;
  h += '<div class="sec-h"><h2>কোন গ্রামে কত</h2></div><div class="card">' +
    (vs.length ? vs.map(([v, d]) =>
      '<div style="padding:9px 0;border-bottom:1px solid var(--line-soft)">' +
      '<div class="rrow" style="border:0;padding:0 0 6px"><span>' + esc(v) + '</span>' +
      '<span class="rn">' + bn(d.n) + (d.w ? ' · ' + bn(d.w) + ' পেয়েছি' : '') + '</span></div>' +
      '<div class="bar"><i style="width:' + (d.n / vmax * 100) + '%"></i></div></div>').join('')
      : '<div class="empty">তথ্য নেই</div>') + '</div>';

  // competitors
  const comp = {};
  all.forEach(c => {
    const name = (c.status === 'lost' && c.lostTo) || c.supplierName;
    if (!name) return;
    comp[name] = comp[name] || { seen: 0, won: 0 };
    comp[name].seen++;
    if (c.status === 'lost') comp[name].won++;
  });
  const cs = Object.entries(comp).sort((a, b) => b[1].won - a[1].won || b[1].seen - a[1].seen).slice(0, 10);
  h += '<div class="sec-h"><h2>প্রতিদ্বন্দ্বী দোকান</h2><span class="more">কে কোথায় এগিয়ে</span></div><div class="card">' +
    (cs.length ? cs.map(([n, d]) =>
      '<div class="rrow"><span>' + esc(n) + '</span><span class="rn">' +
      (d.won ? bn(d.won) + ' টি নিয়ে গেছে · ' : '') + bn(d.seen) + ' জায়গায় আছে</span></div>').join('')
      : '<div class="empty">কারা মাল দিচ্ছে সেটা ফর্মে লিখলে এখানে হিসাব দেখাব</div>') + '</div>';

  // electrical funnel
  h += '<div class="sec-h"><h2>ইলেকট্রিক কাজের ধাপ</h2></div><div class="card">' +
    ELEC.map(([label]) => {
      const n = all.filter(c => c.type === 'নতুন বাড়ির মালিক' && c.elecStatus === label).length;
      return n ? '<div class="rrow"><span>' + esc(label) + '</span><span class="rn">' + bn(n) + '</span></div>' : '';
    }).join('') || '<div class="empty">তথ্য নেই</div>';
  h += '</div>';

  /* চা-দাওয়াতের ফানেল — মাঠ থেকে দোকান পর্যন্ত */
  const teaOf = k => all.filter(c => (c.teaStatus || 'none') === k).length;
  const invited = all.filter(c => c.teaStatus && c.teaStatus !== 'none').length;
  const came = teaOf('came');
  h += '<div class="sec-h"><h2>চা-দাওয়াত কতদূর গেল</h2>' +
       '<span class="more">' + (invited ? bn(Math.round(came / invited * 100)) + '% এসেছেন' : '—') + '</span></div><div class="card">' +
    TEA.filter(([k]) => k !== 'none').map(([k, l]) => {
      const n = teaOf(k);
      return '<div style="padding:8px 0"><div class="rrow" style="border:0;padding:0 0 6px">' +
        '<span>' + l + '</span><span class="rn">' + bn(n) + '</span></div>' +
        '<div class="bar"><i style="width:' + (invited ? n / invited * 100 : 0) + '%"></i></div></div>';
    }).join('') + (invited ? '' : '<div class="empty">এখনো কাউকে দাওয়াত দেওয়া হয়নি</div>') + '</div>';

  /* কে কী এনেছে */
  const byStaff = {};
  all.forEach(c => {
    const n = (c.by || '').trim() || 'নাম লেখা নেই';
    byStaff[n] = byStaff[n] || { n: 0, tea: 0, won: 0, amt: 0 };
    byStaff[n].n++;
    if (c.teaStatus === 'came') byStaff[n].tea++;
    if (c.status === 'won'){ byStaff[n].won++; byStaff[n].amt += Number(c.saleAmount) || 0; }
  });
  const ss = Object.entries(byStaff).sort((a, b) => b[1].n - a[1].n);
  h += '<div class="sec-h"><h2>কে কতটা এনেছে</h2><span class="more">MDE অনুযায়ী</span></div><div class="card">' +
    (ss.length ? ss.map(([n, d]) =>
      '<div class="rrow"><span>' + esc(n) + '</span><span class="rn">' +
      bn(d.n) + ' জন · ' + bn(d.tea) + ' দোকানে · ' + bn(d.won) + ' বিক্রি' +
      (d.amt ? ' · ' + money(d.amt) : '') + '</span></div>').join('')
      : '<div class="empty">সেটিংসে নিজের নাম দিলে এখানে হিসাব আলাদা হবে</div>') + '</div>';

  h += '<div class="sec-h"><h2>ব্যাকআপ ও সেটিংস</h2></div>' +
       '<div class="btnrow"><button class="btn sec" id="xls">Excel ব্যাকআপ</button>' +
       '<button class="btn sec" id="jsonb">ফাইল ব্যাকআপ</button></div>' +
       '<button class="btn sec block" id="openSettings" style="margin-top:9px">⚙ সেটিংস</button>';
  return h;
}

/* ══════════ ১১. ফর্ম ══════════ */

function formHTML(c){
  const v = c || {};
  const isNew = !c;
  const opt = (arr, cur) => arr.map(x => {
    const val = Array.isArray(x) ? x[0] : x;
    return '<option value="' + esc(val) + '"' + (cur === val ? ' selected' : '') + '>' + esc(val) + '</option>';
  }).join('');

  return '' +
  '<div id="dupWarn"></div>' +

  '<label class="field"><span>নাম <b class="req">*</b></span>' +
  '<input id="f_name" value="' + esc(v.name || '') + '" placeholder="যেমন: আব্দুল কাদের মন্ডল" required></label>' +

  '<label class="field"><span>ধরন</span><select id="f_type">' + opt(TYPES, v.type || TYPES[0]) + '</select></label>' +

  '<div class="grid2">' +
  '<label class="field"><span>মোবাইল <b class="req">*</b></span>' +
  '<input id="f_phone" type="tel" inputmode="numeric" value="' + esc(v.phone || '') + '" placeholder="০১৭…" required></label>' +
  '<label class="field"><span>গ্রাম / এলাকা</span>' +
  '<input id="f_village" value="' + esc(v.village || '') + '" placeholder="যেমন: জিগরা উত্তরপাড়া"></label>' +
  '</div>' +

  '<label class="field"><span>ঠিকানার বর্ণনা</span>' +
  '<input id="f_address" value="' + esc(v.address || '') + '" placeholder="মন্ডল বাড়ি, মসজিদের পাশে"></label>' +

  /* ---- location ---- */
  '<div class="field"><span>ম্যাপের পিন</span>' +
    '<div id="pinState" class="card" style="padding:11px;margin-bottom:8px">' + pinStateHTML(v) + '</div>' +
    '<div class="btnrow"><button type="button" class="btn sec" id="btnGps">◎ এখানেই আছি</button>' +
    '<button type="button" class="btn sec" id="btnClearPin">পিন মুছুন</button></div>' +
    '<div class="hint">বিল্ডিংয়ের নিচে নেটওয়ার্ক না পেলে পিন না দিয়েই সেভ করুন। পরে “পিন বাকি” তালিকা থেকে নেটওয়ার্কে গিয়ে পিন করা যাবে।</div>' +
    '<input type="hidden" id="f_lat" value="' + (v.lat != null ? v.lat : '') + '">' +
    '<input type="hidden" id="f_lng" value="' + (v.lng != null ? v.lng : '') + '">' +
  '</div>' +

  /* ---- construction block ---- */
  '<div id="cblock"' + ((v.type || TYPES[0]) !== TYPES[0] ? ' hidden' : '') + '>' +
    '<div class="grid2">' +
    '<label class="field"><span>কয় তলা</span><select id="f_floors">' +
      '<option value="">জানা নেই</option>' +
      [1,2,3,4,5,6,7,8,9,10].map(n => '<option value="' + n + '"' + (String(v.floors) === String(n) ? ' selected' : '') + '>' + bn(n) + ' তলা</option>').join('') +
    '</select></label>' +
    '<label class="field"><span>কত দিনে মাল লাগবে</span><select id="f_need">' +
      NEED.map(([k]) => '<option value="' + k + '"' + (String(v.needDays || '') === k ? ' selected' : '') + '>' + NEED_LABEL[k] + '</option>').join('') +
    '</select></label></div>' +

    '<label class="field"><span>নির্মাণের অবস্থা</span><select id="f_stage">' + opt(STAGES, v.stage || STAGES[0][0]) + '</select></label>' +
    '<label class="field"><span>ইলেকট্রিক কাজের অবস্থা</span><select id="f_elec">' + opt(ELEC, v.elecStatus || ELEC[0][0]) + '</select></label>' +
  '</div>' +

  '<div class="grid2">' +
  '<label class="field"><span>এখন কার কাছ থেকে মাল নেয়</span>' +
  '<input id="f_supplier" value="' + esc(v.supplierName || '') + '" placeholder="দোকানের নাম"></label>' +
  '<label class="field"><span>সেই দোকান কোথায়</span>' +
  '<input id="f_supshop" value="' + esc(v.supplierShop || '') + '" placeholder="এলাকা"></label>' +
  '</div>' +

  '<div class="grid2">' +
  '<label class="field"><span>চা-দাওয়াতের অবস্থা</span><select id="f_teastat">' +
    TEA.map(([k, l]) => '<option value="' + k + '"' + ((v.teaStatus || 'none') === k ? ' selected' : '') + '>' + l + '</option>').join('') +
  '</select></label>' +
  '<label class="field"><span>কবে আসবেন বলেছেন</span>' +
  '<input id="f_tea" type="date" value="' + esc(v.teaDate || '') + '"></label>' +
  '</div>' +

  '<label class="field"><span>পরের বার কবে ধরব</span>' +
  '<input id="f_next" type="date" value="' + esc(v.nextDate || (c ? '' : plusDays(7))) + '">' +
  '<span class="hint">তারিখ না দিলে ফলো-আপের তালিকায় উঠবে না।</span></label>' +

  '<label class="field"><span>নোট</span>' +
  '<textarea id="f_notes" placeholder="যা মনে রাখা দরকার">' + esc(v.notes || '') + '</textarea></label>' +

  (isNew ? '' : '<button class="btn danger block" id="delC" type="button" style="margin-top:6px">এই রেকর্ড মুছে ফেলুন</button>');
}

function pinStateHTML(v){
  if (v.lat == null)
    return '<span class="chip idle">পিন নেই</span> <span class="muted">সেভ করলে “পিন বাকি” তালিকায় থাকবে</span>';
  const km = distKm(S.settings.shopLat, S.settings.shopLng, v.lat, v.lng);
  return '<span class="chip cool">পিন আছে</span> <span class="muted num">' +
         esc(Number(v.lat).toFixed(5)) + ', ' + esc(Number(v.lng).toFixed(5)) +
         '</span><br><span class="muted">দোকান থেকে ' + distText(km) + '</span>';
}

function openForm(c){
  openSheet(c ? 'তথ্য সম্পাদনা' : 'নতুন কাস্টমার', formHTML(c),
    '<button class="btn gold block" id="saveC">সংরক্ষণ করুন</button>');

  const typeSel = $('#f_type');
  typeSel.addEventListener('change', () => {
    $('#cblock').hidden = typeSel.value !== TYPES[0];
  });

  $('#btnGps').addEventListener('click', grabGps);
  $('#btnClearPin').addEventListener('click', () => {
    $('#f_lat').value = ''; $('#f_lng').value = '';
    $('#pinState').innerHTML = pinStateHTML({});
  });
  $('#f_phone').addEventListener('blur', () => dupCheck(c));
  $('#saveC').addEventListener('click', () => saveForm(c));
  const del = $('#delC');
  if (del) del.addEventListener('click', () => removeCustomer(c));
}

function grabGps(){
  if (!navigator.geolocation){ toast('এই ফোনে লোকেশন সুবিধা নেই'); return; }
  const st = $('#pinState');
  if (st) st.innerHTML = '<span class="muted">লোকেশন নেওয়া হচ্ছে…</span>';
  navigator.geolocation.getCurrentPosition(p => {
    const lat = +p.coords.latitude.toFixed(6), lng = +p.coords.longitude.toFixed(6);
    $('#f_lat').value = lat; $('#f_lng').value = lng;
    S.here = { lat, lng };
    if (st) st.innerHTML = pinStateHTML({ lat, lng }) +
      '<br><span class="muted">নির্ভুলতা প্রায় ' + bn(Math.round(p.coords.accuracy)) + ' মিটার</span>';
    toast('পিন নেওয়া হয়েছে');
  }, err => {
    if (st) st.innerHTML = '<span class="chip idle">পিন নেই</span> <span class="muted">' +
      (err.code === 1 ? 'লোকেশনের অনুমতি দেওয়া হয়নি' : 'লোকেশন পাওয়া যায়নি — নেটওয়ার্ক আছে এমন জায়গায় আবার চেষ্টা করুন') + '</span>';
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

function dupCheck(cur){
  const box = $('#dupWarn'); if (!box) return;
  const digits = phoneDigits($('#f_phone').value);
  const lat = parseFloat($('#f_lat').value), lng = parseFloat($('#f_lng').value);
  const hits = S.list.filter(x => {
    if (cur && x.id === cur.id) return false;
    if (digits.length >= 10 && phoneDigits(x.phone).endsWith(digits.slice(-10))) return true;
    if (!isNaN(lat) && typeof x.lat === 'number'){
      const d = distKm(lat, lng, x.lat, x.lng);
      if (d != null && d < 0.06) return true;
    }
    return false;
  });
  box.innerHTML = hits.length
    ? '<div class="warnbox"><b>এটা কি আগেই তোলা হয়েছে?</b>' +
      hits.map(x => esc(x.name || 'নামহীন') + ' — ' + esc(x.village || x.phone || '')).join('<br>') +
      '<br>একই বাড়ি দুইবার না তোলাই ভালো।</div>'
    : '';
}

async function saveForm(c){
  const name = $('#f_name').value.trim();
  const phone = $('#f_phone').value.trim();
  if (!name){ toast('নাম লিখুন'); $('#f_name').focus(); return; }
  if (!phone){ toast('মোবাইল নম্বর লিখুন'); $('#f_phone').focus(); return; }

  const lat = parseFloat($('#f_lat').value), lng = parseFloat($('#f_lng').value);
  const type = $('#f_type').value;
  const isNew = !c;
  const rec = c || { id: uid(), createdAt: new Date().toISOString(), events: [], status: 'open' };

  const oldElec = rec.elecStatus, oldStage = rec.stage;

  rec.name = name;
  rec.type = type;
  rec.phone = phone;
  rec.whatsapp = phone;
  rec.village = $('#f_village').value.trim();
  rec.address = $('#f_address').value.trim();
  rec.lat = isNaN(lat) ? null : lat;
  rec.lng = isNaN(lng) ? null : lng;
  rec.supplierName = $('#f_supplier').value.trim();
  rec.supplierShop = $('#f_supshop').value.trim();
  rec.teaStatus = $('#f_teastat').value;
  rec.teaDate = $('#f_tea').value || '';
  rec.nextDate = $('#f_next').value || '';
  if (!rec.by) rec.by = (S.settings.myName || '').trim();
  rec.notes = $('#f_notes').value.trim();

  if (type === TYPES[0]){
    rec.floors = $('#f_floors').value;
    rec.needDays = $('#f_need').value;
    rec.stage = $('#f_stage').value;
    rec.elecStatus = $('#f_elec').value;
  }
  rec.updatedAt = new Date().toISOString();

  if (isNew){
    addEvent(rec, 'created', '');
    if (rec.lat != null) addEvent(rec, 'pin', '');
    S.list.unshift(rec);
  } else {
    if (oldElec && rec.elecStatus && oldElec !== rec.elecStatus)
      addEvent(rec, 'stage', oldElec + ' → ' + rec.elecStatus);
    else if (oldStage && rec.stage && oldStage !== rec.stage)
      addEvent(rec, 'stage', oldStage + ' → ' + rec.stage);
  }

  await persist();
  closeSheet();
  toast(isNew ? 'যোগ হয়েছে' : 'সংরক্ষিত হয়েছে');
  render();
}

async function removeCustomer(c){
  openSheet('মুছে ফেলবেন?',
    '<p>“' + esc(c.name || 'নামহীন') + '” রেকর্ডটি ও তার সব ইতিহাস মুছে যাবে। এটা আর ফেরানো যাবে না।</p>',
    '<div class="btnrow"><button class="btn sec" data-close>থাক</button>' +
    '<button class="btn danger" id="delYes">হ্যাঁ, মুছুন</button></div>');
  $('#delYes').addEventListener('click', async () => {
    S.list = S.list.filter(x => x.id !== c.id);
    await persist(); closeSheet(); toast('মুছে ফেলা হয়েছে'); render();
  });
}

/* ══════════ ১২. বিস্তারিত ══════════ */

function openDetail(id){
  const c = byId(id); if (!c) return;
  const sc = score(c), b = band(sc);
  const km = distKm(S.settings.shopLat, S.settings.shopLng, c.lat, c.lng);
  const wa = waNumber(c.phone);

  const kv = (k, v) => v ? '<div class="kv"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>' : '';

  let body = '<div class="dhead"><h3>' + esc(c.name || 'নামহীন') + '</h3>' +
    '<div class="dsub">' + esc([c.type, c.village].filter(Boolean).join(' · ')) + '</div>' +
    '<div class="drow">' +
      (c.status === 'won' ? '<span class="chip ok">কাজ পেয়েছি</span>'
       : c.status === 'lost' ? '<span class="chip bad">হাতছাড়া' + (c.lostTo ? ' — ' + esc(c.lostTo) : '') + '</span>'
       : '<span class="chip ' + b.k + '">' + b.t + ' · তাগিদ ' + bn(sc) + '</span>') +
      (km != null ? '<span class="chip gold">দোকান থেকে ' + distText(km) + '</span>' : '<span class="chip idle">পিন নেই</span>') +
    '</div></div>';

  body += '<div class="btnrow three" style="margin:12px 0">' +
    '<a class="btn pri" href="tel:' + esc(c.phone) + '">ফোন</a>' +
    (wa ? '<a class="btn sec" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">WhatsApp</a>'
        : '<button class="btn sec" disabled>WhatsApp</button>') +
    (c.lat != null ? '<a class="btn sec" href="' + mapsDir(c.lat, c.lng) + '" target="_blank" rel="noopener">রাস্তা</a>'
        : '<button class="btn sec" id="pinNow">পিন দিন</button>') +
    '</div>';

  body += '<div class="card">' +
    kv('মোবাইল', '<span class="num">' + esc(c.phone) + '</span>') +
    kv('ঠিকানা', esc(c.address)) +
    kv('কয় তলা', c.floors ? bn(c.floors) + ' তলা' : '') +
    kv('নির্মাণের অবস্থা', esc(c.stage)) +
    kv('ইলেকট্রিক কাজ', esc(c.elecStatus)) +
    kv('মাল লাগবে', c.needDays ? NEED_LABEL[String(c.needDays)] : '') +
    kv('এখন মাল নেয়', esc([c.supplierName, c.supplierShop].filter(Boolean).join(', '))) +
    kv('চা-দাওয়াতের তারিখ', c.teaDate ? banglaDate(c.teaDate) + (c.teaDone ? ' (এসেছেন)' : '') : '') +
    kv('পরের যোগাযোগ', c.nextDate ? banglaDate(c.nextDate) : '') +
    kv('শেষ যোগাযোগ', agoText(c.lastContact || c.createdAt)) +
    kv('নোট', esc(c.notes)) +
  '</div>';

  const ts = c.teaStatus || 'none';
  body += '<div class="sec-h" style="margin-top:14px"><h2>ফলো-আপ</h2>' +
    '<span class="chip ' + TEA_CHIP[ts] + '">' + TEA_LABEL[ts] + '</span></div>' +
    '<div class="card" style="margin-bottom:10px">' +
      (dueDate(c)
        ? '<div class="kv"><span class="k">পরের যোগাযোগ</span><span class="v">' + banglaDate(dueDate(c)) +
          (overdueDays(c) ? ' <span class="chip hot">' + bn(overdueDays(c)) + ' দিন পার</span>' : '') + '</span></div>'
        : '<div class="empty" style="padding:10px">তারিখ বসানো নেই — এই কাস্টমার তালিকায় উঠবে না</div>') +
      (c.lastOutcome ? '<div class="kv"><span class="k">শেষ ফল</span><span class="v">' + OUTCOME_LABEL[c.lastOutcome] + '</span></div>' : '') +
    '</div>' +
    '<button class="btn gold block" data-log="call" style="margin-bottom:9px">ফলো-আপ লিখুন</button>' +
    '<div class="btnrow" style="margin-bottom:9px">' +
    '<button class="btn sec" data-log="visit">মাঠে দেখা হলো</button>' +
    '<button class="btn sec" data-log="tea">দোকানে এসেছেন</button></div>';

  if (c.status !== 'won' && c.status !== 'lost'){
    body += '<div class="btnrow"><button class="btn gold" id="mWon">কাজ পেয়েছি</button>' +
            '<button class="btn sec" id="mLost">হাতছাড়া হয়েছে</button></div>';
  } else {
    body += '<button class="btn sec block" id="mReopen">আবার চালু করুন</button>';
  }

  const ev = c.events || [];
  body += '<div class="sec-h" style="margin-top:16px"><h2>ইতিহাস</h2><span class="more">' + bn(ev.length) + ' টি</span></div>' +
    '<div class="card">' + (ev.length ? '<div class="tl">' + ev.slice(0, 40).map(e =>
      '<div class="tli"><div class="tt">' + esc(EVENT_LABEL[e.type] || e.type) +
      (e.text ? ' — ' + esc(e.text) : '') + '</div>' +
      '<div class="td">' + banglaDate(e.t) + '</div></div>').join('') + '</div>'
      : '<div class="empty">এখনো কিছু নেই</div>') + '</div>';

  openSheet(c.name || 'বিস্তারিত', body,
    '<div class="btnrow"><button class="btn sec" data-close>বন্ধ</button>' +
    '<button class="btn pri" id="editC">সম্পাদনা</button></div>');

  $('#editC').addEventListener('click', () => { closeSheet(); setTimeout(() => openForm(c), 60); });
  const pn = $('#pinNow');
  if (pn) pn.addEventListener('click', () => { closeSheet(); setTimeout(() => openForm(c), 60); });

  $('#sheet').querySelectorAll('[data-log]').forEach(btn =>
    btn.addEventListener('click', () => logAction(c, btn.dataset.log)));

  const won = $('#mWon'), lost = $('#mLost'), re = $('#mReopen');
  if (won)  won.addEventListener('click', () => markWon(c));
  if (lost) lost.addEventListener('click', () => markLost(c));
  if (re)   re.addEventListener('click', async () => {
    c.status = 'open'; c.lostTo = ''; addEvent(c, 'note', 'আবার চালু');
    await persist(); closeSheet(); render(); toast('আবার চালু হয়েছে');
  });
}



function logAction(c, preset){
  const method = preset && METHODS.some(m => m[0] === preset) ? preset : 'call';
  const teaPre = preset === 'tea' ? 'came' : (c.teaStatus || 'none');

  openSheet('ফলো-আপ লিখুন — ' + (c.name || 'নামহীন'),
    '<label class="field"><span>কীভাবে যোগাযোগ হলো</span><select id="lgHow">' +
      METHODS.map(([k, l]) => '<option value="' + k + '"' + (k === method ? ' selected' : '') + '>' + l + '</option>').join('') +
    '</select></label>' +

    '<label class="field"><span>কী ফল হলো</span><select id="lgOut">' +
      '<option value="">বেছে নিন</option>' +
      OUTCOMES.map(([k, l]) => '<option value="' + k + '">' + l + '</option>').join('') +
    '</select></label>' +

    '<label class="field"><span>কী কথা হলো</span>' +
    '<textarea id="lgTxt" placeholder="সংক্ষেপে লিখুন"></textarea></label>' +

    '<label class="field"><span>চা-দাওয়াতের অবস্থা</span><select id="lgTea">' +
      TEA.map(([k, l]) => '<option value="' + k + '"' + (teaPre === k ? ' selected' : '') + '>' + l + '</option>').join('') +
    '</select></label>' +

    '<label class="field" id="teaDateWrap"><span>কবে আসবেন বলেছেন</span>' +
    '<input id="lgTeaDate" type="date" value="' + esc(c.teaDate || '') + '"></label>' +

    '<label class="field"><span>পরের বার কবে ধরব <b class="req">*</b></span>' +
    '<input id="lgNext" type="date" value="' + esc(c.nextDate || plusDays(7)) + '"></label>' +
    '<div class="qd" style="margin-top:-6px;margin-bottom:14px">' +
      [[2,'২ দিন'],[7,'৭ দিন'],[15,'১৫ দিন'],[30,'১ মাস']].map(([n, l]) =>
        '<button type="button" class="fchip" data-nd="' + n + '">' + l + '</button>').join('') +
    '</div>' +
    '<div class="hint">তারিখ না দিলে এই কাস্টমার ফলো-আপের তালিকা থেকে হারিয়ে যাবে — কেউ মনে করিয়ে দেবে না।</div>',

    '<button class="btn gold block" id="lgSave">সংরক্ষণ</button>');

  const teaSel = $('#lgTea');
  const syncTea = () => { $('#teaDateWrap').hidden = !['invited','promised','noshow'].includes(teaSel.value); };
  teaSel.addEventListener('change', syncTea); syncTea();

  $('#sheet').querySelectorAll('[data-nd]').forEach(b =>
    b.addEventListener('click', () => { $('#lgNext').value = plusDays(+b.dataset.nd); }));

  $('#lgSave').addEventListener('click', async () => {
    const how = $('#lgHow').value;
    const out = $('#lgOut').value;
    const txt = $('#lgTxt').value.trim();
    const oldTea = c.teaStatus || 'none';
    const newTea = teaSel.value;

    addEvent(c, how, [out ? OUTCOME_LABEL[out] : '', txt].filter(Boolean).join(' — '));
    if (out) c.lastOutcome = out;

    if (newTea !== oldTea){
      c.teaStatus = newTea;
      const map = { invited:'invite', promised:'promise', came:'tea', noshow:'noshow' };
      if (map[newTea]) addEvent(c, map[newTea], newTea === 'promised' ? banglaDate($('#lgTeaDate').value) : '');
      if (newTea === 'came'){ c.teaDone = true; c.teaCameOn = todayISO(); }
    }
    if (['invited','promised','noshow'].includes(newTea)) c.teaDate = $('#lgTeaDate').value || '';

    c.nextDate = $('#lgNext').value || '';
    await persist(); closeSheet();
    toast(c.nextDate ? 'লেখা হয়েছে — পরের তারিখ ' + banglaDate(c.nextDate) : 'লেখা হয়েছে');
    render();

    if (newTea === 'came' && c.status !== 'won') setTimeout(() => askPurchase(c), 350);
  });
}

/* দোকানে আসার পর — কিছু কিনেছেন কি না */
function askPurchase(c){
  openSheet('দোকানে এসেছেন',
    '<p style="margin-top:0">' + esc(c.name || 'নামহীন') + ' দোকানে এসেছেন বলে লেখা হয়েছে। কিছু কিনেছেন?</p>' +
    '<div class="hint">না কিনলেও সমস্যা নেই — সম্পর্কটাই আসল। পরে আবার ধরা যাবে।</div>',
    '<div class="btnrow"><button class="btn sec" data-close>শুধু চা খেয়েছেন</button>' +
    '<button class="btn gold" id="apYes">মাল কিনেছেন</button></div>');
  $('#apYes').addEventListener('click', () => { closeSheet(); setTimeout(() => markWon(c), 250); });
}

function markWon(c){
  openSheet('কাজ পেয়েছি',
    '<label class="field"><span>কত টাকার মাল গেছে</span>' +
    '<input id="wAmt" type="number" inputmode="numeric" min="0" placeholder="যেমন ৪৫০০০" value="' + esc(c.saleAmount || '') + '"></label>' +
    '<label class="field"><span>কী কী নিয়েছে</span>' +
    '<textarea id="wItems" placeholder="তার, সুইচ, MCB…">' + esc(c.saleItems || '') + '</textarea></label>',
    '<button class="btn gold block" id="wSave">সংরক্ষণ</button>');
  $('#wSave').addEventListener('click', async () => {
    c.status = 'won';
    c.saleAmount = $('#wAmt').value;
    c.saleItems = $('#wItems').value.trim();
    addEvent(c, 'won', c.saleAmount ? money(c.saleAmount) : '');
    await persist(); closeSheet(); toast('অভিনন্দন!'); render();
  });
}

function markLost(c){
  openSheet('হাতছাড়া হয়েছে',
    '<label class="field"><span>কোন দোকান নিয়ে গেল</span>' +
    '<input id="lTo" value="' + esc(c.lostTo || c.supplierName || '') + '" placeholder="দোকানের নাম"></label>' +
    '<label class="field"><span>কেন — সৎভাবে লিখুন</span>' +
    '<textarea id="lWhy" placeholder="দাম বেশি ছিল / মাল ছিল না / সম্পর্ক ভালো"></textarea></label>' +
    '<div class="hint">এই কারণগুলোই পরে সবচেয়ে কাজে লাগবে। রিপোর্টে দেখাব কোন দোকান কোথায় এগিয়ে।</div>',
    '<button class="btn sec block" id="lSave">সংরক্ষণ</button>');
  $('#lSave').addEventListener('click', async () => {
    c.status = 'lost';
    c.lostTo = $('#lTo').value.trim();
    addEvent(c, 'lost', [c.lostTo, $('#lWhy').value.trim()].filter(Boolean).join(' — '));
    await persist(); closeSheet(); render();
  });
}

/* ══════════ ১৩. সেটিংস ও ব্যাকআপ ══════════ */

function openSettings(){
  const s = S.settings;
  openSheet('সেটিংস',
    '<label class="field"><span>আপনার নাম</span>' +
    '<input id="s_name" value="' + esc(s.myName || '') + '" placeholder="রেকর্ডে কার তোলা বোঝা যাবে"></label>' +

    '<div class="field"><span>দোকানের অবস্থান</span>' +
    '<div class="card" style="padding:11px;margin-bottom:8px" id="shopState">' +
      '<span class="num muted">' + esc(s.shopLat.toFixed(5)) + ', ' + esc(s.shopLng.toFixed(5)) + '</span>' +
      (s.shopPinned ? ' <span class="chip cool">আপনার দেওয়া</span>' : ' <span class="chip idle">আনুমানিক</span>') +
    '</div>' +
    '<button type="button" class="btn sec block" id="s_pin">◎ দোকানে দাঁড়িয়ে এখানে চাপুন</button>' +
    '<div class="hint">সব দূরত্ব এই বিন্দু থেকে মাপা হয়। একবার দোকানে দাঁড়িয়ে সেট করে নিলে হিসাব নির্ভুল হবে।</div></div>' +

    '<label class="field"><span>প্রতি তলায় আনুমানিক মালের দাম (টাকা)</span>' +
    '<input id="s_floor" type="number" inputmode="numeric" min="0" value="' + esc(s.perFloorValue || '') + '" placeholder="যেমন ২৫০০০"></label>' +
    '<div class="hint" style="margin-top:-8px;margin-bottom:14px">এটা আপনার নিজের অনুমান — আমি কোনো দাম বসাইনি। দিলে পাইপলাইনে কত টাকার কাজ আছে সেটা হিসাব করে দেখাব।</div>' +

    '<div class="sec-h"><h2>ডেটা</h2></div>' +
    '<div class="btnrow" style="margin:9px 0"><button class="btn sec" id="s_xls">Excel ব্যাকআপ</button>' +
    '<button class="btn sec" id="s_json">ফাইল ব্যাকআপ</button></div>' +
    '<label class="btn sec block" style="margin-bottom:9px">ফাইল থেকে ফেরান' +
    '<input type="file" id="s_restore" accept=".json" hidden></label>' +
    '<div class="hint">এখন ডেটা শুধু এই ফোনে আছে। নিয়মিত ব্যাকআপ নিয়ে রাখুন — ফোন হারালে বা ব্রাউজারের ডেটা মুছলে সব চলে যাবে।</div>',

    '<button class="btn gold block" id="s_save">সংরক্ষণ</button>');

  $('#s_pin').addEventListener('click', () => {
    if (!navigator.geolocation){ toast('লোকেশন সুবিধা নেই'); return; }
    $('#shopState').innerHTML = '<span class="muted">নেওয়া হচ্ছে…</span>';
    navigator.geolocation.getCurrentPosition(p => {
      S.settings.shopLat = +p.coords.latitude.toFixed(6);
      S.settings.shopLng = +p.coords.longitude.toFixed(6);
      S.settings.shopPinned = true;
      $('#shopState').innerHTML = '<span class="num muted">' +
        S.settings.shopLat.toFixed(5) + ', ' + S.settings.shopLng.toFixed(5) +
        '</span> <span class="chip cool">আপনার দেওয়া</span>';
      toast('দোকানের অবস্থান সেট হয়েছে');
    }, () => { $('#shopState').innerHTML = '<span class="muted">লোকেশন পাওয়া যায়নি</span>'; },
       { enableHighAccuracy: true, timeout: 15000 });
  });

  $('#s_xls').addEventListener('click', exportXlsx);
  $('#s_json').addEventListener('click', exportJson);
  $('#s_restore').addEventListener('change', e => { if (e.target.files[0]) importJson(e.target.files[0]); });
  $('#s_save').addEventListener('click', async () => {
    S.settings.myName = $('#s_name').value.trim();
    S.settings.perFloorValue = Number($('#s_floor').value) || 0;
    await Store.setSettings(S.settings);
    closeSheet(); toast('সেটিংস সংরক্ষিত'); render();
  });
}

function download(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportJson(){
  const payload = { app: 'jara-maath', version: 1, at: new Date().toISOString(),
                    settings: S.settings, customers: S.list };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
           'jara-maath-backup-' + todayISO() + '.json');
  toast('ব্যাকআপ নামছে');
}

function importJson(file){
  const r = new FileReader();
  r.onload = async () => {
    try{
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.customers)) throw new Error('ভুল ফাইল');
      const have = new Set(S.list.map(x => x.id));
      let added = 0;
      d.customers.forEach(x => { if (x && x.id && !have.has(x.id)){ S.list.push(x); added++; } });
      if (d.settings) S.settings = Object.assign({}, S.settings, d.settings);
      await persist(); await Store.setSettings(S.settings);
      closeSheet(); render();
      toast(bn(added) + ' টি নতুন রেকর্ড যোগ হয়েছে');
    }catch(e){ toast('ফাইলটি পড়া গেল না'); }
  };
  r.readAsText(file);
}

function exportXlsx(){
  if (typeof XLSX === 'undefined'){ toast('Excel সুবিধা লোড হয়নি'); return; }
  const rows = S.list.map(c => ({
    'নাম': c.name || '', 'ধরন': c.type || '', 'মোবাইল': c.phone || '',
    'গ্রাম': c.village || '', 'ঠিকানা': c.address || '',
    'তলা': c.floors || '', 'নির্মাণের অবস্থা': c.stage || '',
    'ইলেকট্রিক কাজ': c.elecStatus || '', 'মাল লাগবে': NEED_LABEL[String(c.needDays || '')] || '',
    'এখন মাল নেয়': c.supplierName || '', 'সেই দোকান': c.supplierShop || '',
    'অবস্থা': c.status === 'won' ? 'পেয়েছি' : c.status === 'lost' ? 'হাতছাড়া' : 'চলমান',
    'হাতছাড়া হয়েছে যার কাছে': c.lostTo || '',
    'বিক্রি': c.saleAmount || '',
    'ল্যাটিটিউড': c.lat == null ? '' : c.lat, 'লংগিটিউড': c.lng == null ? '' : c.lng,
    'চা-দাওয়াত': c.teaDate || '', 'পরের যোগাযোগ': c.nextDate || '',
    'শেষ যোগাযোগ': (c.lastContact || c.createdAt || '').slice(0, 10),
    'নোট': c.notes || '',
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'কাস্টমার');
  const ev = [];
  S.list.forEach(c => (c.events || []).forEach(e => ev.push({
    'নাম': c.name || '', 'কাজ': EVENT_LABEL[e.type] || e.type,
    'বিবরণ': e.text || '', 'তারিখ': (e.t || '').slice(0, 10),
  })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ev), 'ইতিহাস');
  XLSX.writeFile(wb, 'জারা-মাঠ-' + todayISO() + '.xlsx');
  toast('Excel নামছে');
}

/* ══════════ ১৪. রাউটার ══════════ */

const TITLES = { today:'আজকের কাজ', follow:'ফলো-আপ', people:'কাস্টমার', map:'ম্যাপ', route:'আজকের রুট', report:'রিপোর্ট' };

function render(){
  const main = $('#app');
  $('#viewTitle').textContent = TITLES[S.view] || '';
  main.classList.toggle('flush', S.view === 'map');

  if (S.view === 'today')      main.innerHTML = viewToday();
  else if (S.view === 'follow') main.innerHTML = viewFollow();
  else if (S.view === 'people') main.innerHTML = viewPeople();
  else if (S.view === 'map')    { main.innerHTML = viewMap(); paintMap(); }
  else if (S.view === 'route')  main.innerHTML = viewRoute();
  else                          main.innerHTML = viewReport();

  wireView();
  document.querySelectorAll('.tabbar button').forEach(b =>
    b.classList.toggle('on', b.dataset.view === S.view));
}

function wireView(){
  const main = $('#app');

  main.querySelectorAll('[data-open]').forEach(el =>
    el.addEventListener('click', () => openDetail(el.dataset.open)));

  main.querySelectorAll('[data-q]').forEach(el => el.addEventListener('click', () => {
    const k = el.dataset.q;
    if (k === 'add') openForm(null);
    else if (k === 'settings') openSettings();
    else if (k === 'pin'){ S.view = 'people'; S.filter = 'nopin'; S.q = ''; render(); }
    else if (k === 'route'){ S.view = 'route'; render(); }
    else if (k === 'near'){ S.view = 'route'; render(); useHere(); }
  }));

  main.querySelectorAll('[data-fup]').forEach(el => el.addEventListener('click', ev => {
    ev.stopPropagation();
    const c = byId(el.dataset.fup);
    if (c) logAction(c);
  }));

  const q = $('#q');
  if (q) q.addEventListener('input', () => {
    S.q = q.value;
    const pos = q.selectionStart;
    render();
    const nq = $('#q');
    if (nq){ nq.focus(); try{ nq.setSelectionRange(pos, pos); }catch(e){} }
  });

  main.querySelectorAll('[data-f]').forEach(el => el.addEventListener('click', () => {
    S.filter = el.dataset.f; render();
  }));

  main.querySelectorAll('.rsel').forEach(el => el.addEventListener('change', () => {
    S.routeIds = Array.from(main.querySelectorAll('.rsel:checked')).map(x => x.value);
    const n = $('#selCount'); if (n) n.textContent = bn(S.routeIds.length) + ' জন বাছাই';
  }));

  const go = $('#goRoute');   if (go) go.addEventListener('click', openRoute);
  const uh = $('#useHere');   if (uh) uh.addEventListener('click', useHere);
  const pt = $('#pickTop');   if (pt) pt.addEventListener('click', () => {
    const o = S.here || { lat: S.settings.shopLat, lng: S.settings.shopLng };
    S.routeIds = S.list
      .filter(c => typeof c.lat === 'number' && c.status !== 'won' && c.status !== 'lost')
      .map(c => ({ c, s: score(c) })).sort((a, b) => b.s - a.s).slice(0, 5)
      .map(x => x.c.id);
    render(); toast('জরুরি ' + bn(S.routeIds.length) + ' জন বাছাই হয়েছে');
  });

  const xls = $('#xls');     if (xls) xls.addEventListener('click', exportXlsx);
  const jb  = $('#jsonb');   if (jb)  jb.addEventListener('click', exportJson);
  const os  = $('#openSettings'); if (os) os.addEventListener('click', openSettings);

  main.querySelectorAll('[data-pop]').forEach(el => el.addEventListener('click', ev => {
    ev.preventDefault(); openDetail(el.dataset.pop);
  }));
}

function useHere(){
  if (!navigator.geolocation){ toast('লোকেশন সুবিধা নেই'); return; }
  toast('অবস্থান নেওয়া হচ্ছে…');
  navigator.geolocation.getCurrentPosition(p => {
    S.here = { lat: p.coords.latitude, lng: p.coords.longitude };
    toast('আপনার অবস্থান থেকে হিসাব করা হলো');
    render();
  }, err => toast(err.code === 1 ? 'লোকেশনের অনুমতি দেওয়া হয়নি' : 'অবস্থান পাওয়া যায়নি'),
     { enableHighAccuracy: true, timeout: 15000 });
}

/* ══════════ ১৫. চালু ══════════ */

document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) closeSheet();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#sheetWrap').hidden) closeSheet();
});

(async function boot(){
  try{ await load(); }
  catch(e){ S.list = []; S.settings = Object.assign({}, DEFAULT_SETTINGS); }

  document.querySelectorAll('.tabbar button').forEach(b =>
    b.addEventListener('click', () => { S.view = b.dataset.view; render(); }));
  $('#btnAdd').addEventListener('click', () => openForm(null));

  $('#boot').hidden = true;
  $('#topbar').hidden = false;
  $('#app').hidden = false;
  $('#tabbar').hidden = false;
  render();

  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
