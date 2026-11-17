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

/* উল্লাপাড়া উপজেলার ১৪টি ইউনিয়ন ও পৌরসভা — সরকারি তালিকা মিলিয়ে নেওয়া।
   গ্রাম ও পাড়ার নাম বানিয়ে বসানো হয়নি; ব্যবহারের সাথে সাথে তালিকা নিজেই তৈরি হয়। */
const UNIONS = [
  'উল্লাপাড়া পৌরসভা',
  'উল্লাপাড়া সদর',
  'উধুনিয়া',
  'কয়ড়া',
  'দুর্গানগর',
  'পঞ্চক্রোশী',
  'পূর্ণিমাগাঁতী',
  'বড়পাঙ্গাসী',
  'বড়হর',
  'বাঙ্গালা',
  'রামকৃষ্ণপুর',
  'লাহিড়ী মোহনপুর',
  'সলঙ্গা',
  'সলপ',
  'হাটিকুমরুল',
  'উপজেলার বাইরে',
];

/* বাংলা বানানভেদ মিলিয়ে খোঁজা — ী/ি, ণ/ন, শ/স/ষ, ড়/র সব এক ধরা হয় */
function fold(x){
  let t = String(x || '').normalize('NFC');
  // বাংলায় ড়/ঢ়/য় NFC-তে নুক্তা আলাদা থাকে — দুই চেহারাই এক করে নিই
  t = t.replace(/\u09A1\u09BC|\u09DC/g, '\u09B0')   // ড় → র
       .replace(/\u09A2\u09BC|\u09DD/g, '\u09B0')   // ঢ় → র
       .replace(/\u09AF\u09BC|\u09DF/g, '\u09AF')   // য় → য
       .replace(/\u09BC/g, '');                        // বাকি নুক্তা
  const map = { 'ী':'ি','ূ':'ু','ণ':'ন','ষ':'স','শ':'স','ঁ':'','্':'' };
  t = t.replace(/[ীূণষশঁ্]/g, c => map[c]);
  return t.replace(/\s+/g, '');
}

/* আগে যত গ্রাম/পাড়া লেখা হয়েছে সেগুলোই পরের বার তালিকায় আসে */
function learned(field, union){
  const set = new Set();
  S.list.forEach(c => {
    if (union && c.union && c.union !== union) return;
    const v = (c[field] || '').trim();
    if (v) set.add(v);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
}
function dataListHTML(id, items){
  return '<datalist id="' + id + '">' +
    items.map(v => '<option value="' + esc(v) + '"></option>').join('') + '</datalist>';
}

const EVENT_LABEL = {
  created: 'রেকর্ড খোলা হয়েছে', visit: 'মাঠে ভিজিট', call: 'ফোনে কথা',
  wa: 'WhatsApp-এ কথা', tea: 'দোকানে এসেছেন', sale: 'বিক্রি', won: 'কাজ পেয়েছি',
  lost: 'কাজ হাতছাড়া', note: 'নোট', stage: 'অবস্থা বদল', pin: 'ম্যাপে পিন',
  invite: 'চা-কফির দাওয়াত দেওয়া হয়েছে', promise: 'আসার তারিখ দিয়েছেন',
  noshow: 'আসেননি', reschedule: 'তারিখ পিছিয়েছে',
};

/* চা-কফির দাওয়াতের ধাপ — মাঠ থেকে দোকান পর্যন্ত পুরো পথ */
const TEA = [
  ['none',    'দাওয়াত দেওয়া হয়নি'],
  ['invited', 'দাওয়াত দেওয়া হয়েছে'],
  ['promised','আসবেন বলেছেন'],
  ['came',    'দোকানে এসেছেন'],
  ['noshow',  'আসেননি — আবার বলতে হবে'],
];
const TEA_LABEL = Object.fromEntries(TEA);
const TEA_CHIP  = { none:'idle', invited:'gold', promised:'warm', came:'ok', noshow:'bad' };

/* মাঠকর্মীর পদবি — সেটিংস থেকে বদলানো যায় */
const TITLES_OPT = [
  ['TSO', 'টিএসও', 'Territory Sales Officer — এলাকা বিক্রয় কর্মকর্তা'],
  ['SR',  'এসআর',  'Sales Representative — গ্রামে সবচেয়ে পরিচিত ডাক'],
  ['FO',  'এফও',   'Field Officer — মাঠ কর্মকর্তা'],
  ['ME',  'এমই',   'Marketing Executive — বিপণন নির্বাহী'],
];
function roleLabel(){
  const k = (S.settings && S.settings.roleTitle) || 'TSO';
  const r = TITLES_OPT.find(x => x[0] === k);
  return r ? r[1] : k;
}

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

/* এলাকা একভাবে দেখানো: পাড়া, গ্রাম, ইউনিয়ন */
function placeText(c, full){
  const bits = [c.para, c.village].filter(Boolean);
  if (full && c.union) bits.push(c.union);
  return bits.join(', ');
}

function phoneDigits(p){ return String(p || '').replace(/\D/g, ''); }
function waOf(c){ return waNumber(c.waSame === false && c.whatsapp ? c.whatsapp : (c.whatsapp || c.phone)); }
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

/* কবে ধরতে হবে — চা-কফির দাওয়াতের তারিখ ও পরের যোগাযোগের মধ্যে যেটা আগে */
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
  period: 'week',
  here: null,          // current GPS, when granted
  map: null,
  layer: null,
  routeIds: [],
  me: null,
};

async function load(){
  S.list     = await Store.all();
  S.settings = await Store.getSettings();
  // ক্লাউডে না পৌঁছালেও যেন শেষ অবস্থাটা হাতে থাকে
  if (Store.mode === 'cloud'){
    try{ localStorage.setItem('jara.snapshot',
      JSON.stringify({ at: new Date().toISOString(), customers: S.list })); }catch(e){}
  }
}
async function saveRec(rec){
  try{
    await Store.put(rec);
    if (!S.list.some(x => x.id === rec.id)) S.list.unshift(rec);
    return true;
  }catch(e){
    toast(e.message || 'সংরক্ষণ করা গেল না');
    return false;
  }
}
async function delRec(id){
  try{
    await Store.del(id);
    S.list = S.list.filter(x => x.id !== id);
    return true;
  }catch(e){
    toast(e.message || 'মোছা গেল না');
    return false;
  }
}
/* কর্মী এখনো এই রেকর্ড বদলাতে পারবে কি না */
function canEdit(c){
  if (!c) return true;
  if (S.me && S.me.role === 'admin') return true;
  if (Store.mode !== 'cloud') return true;
  if (c._by && S.me && c._by !== S.me.id) return false;
  if (c._editUntil) return Date.now() < new Date(c._editUntil).getTime();
  return true;
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
  const sales = won.reduce((n, c) => n + salesTotal(c), 0);

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

  if (!standalone())
    h += '<div class="installbar" id="installBar"' + (INSTALL_EVT ? '' : ' hidden') + '>' +
         '<span class="ib-ic">জ</span>' +
         '<span class="ib-t"><b>ফোনে অ্যাপ হিসেবে বসান</b>' +
         '<small>হোম স্ক্রিন থেকে এক চাপে খুলবে</small></span>' +
         '<button class="btn gold" id="ibGo">বসান</button></div>';

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
  const pl = placeText(c); if (pl) bits.push(pl);
  if (c.type === 'নতুন বাড়ির মালিক'){
    if (c.floors) bits.push(bn(c.floors) + ' তলা');
    if (c.elecStatus) bits.push(c.elecStatus);
  } else if (c.type) bits.push(c.type);

  let chip = '';
  if (c.status === 'won')      chip = '<span class="chip ok">পেয়েছি</span>';
  else if (c.status === 'lost') chip = '<span class="chip bad">হাতছাড়া</span>';
  else chip = '<span class="chip ' + b.k + '">' + b.t + '</span>';

  const flags = (c.lat == null ? '<span class="chip idle">পিন নেই</span>' : '') +
                (c.teaDate && !c.teaDone ? '<span class="chip gold">চা-কফির দাওয়াত</span>' : '');

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
  const wa = waOf(c);

  const when = od > 0
    ? '<span class="chip hot">' + bn(od) + ' দিন পার</span>'
    : d === todayISO() ? '<span class="chip warm">আজ</span>'
    : '<span class="chip cool">' + banglaDate(d) + '</span>';

  const why = kind === 'tea'
    ? '<span class="chip gold">' + (c.teaStatus === 'promised' ? 'আসবেন বলেছেন' : 'চা-কফির দাওয়াত') + '</span>'
    : '';

  return '<div class="frow">' +
    '<button class="fmain" data-open="' + esc(c.id) + '">' +
      '<span class="pstripe" style="background:' + BAND_COLOR[b.k] + '"></span>' +
      '<span class="pbody">' +
        '<span class="pname">' + esc(c.name || 'নামহীন') + when + why + '</span>' +
        '<span class="pmeta">' + esc([placeText(c), c.type, c.elecStatus].filter(Boolean).join(' · ') || '—') +
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

  /* ───── চা-কফির দাওয়াত: মাঠ থেকে দোকান পর্যন্ত ───── */
  const invited = live.filter(c => c.teaStatus === 'invited');
  const came    = S.list.filter(c => c.teaStatus === 'came');
  const asked   = S.list.filter(c => c.teaStatus && c.teaStatus !== 'none').length;
  const rate    = asked ? Math.round(came.length / asked * 100) : 0;

  h += '<div class="sec-h" style="margin-top:4px"><h2>চা-কফির দাওয়াত</h2>' +
       '<span class="more">' + (asked ? bn(rate) + '% এসেছেন' : 'এখনো শুরু হয়নি') + '</span></div>';
  h += '<div class="stats">' +
    '<div class="stat"><div class="k">দাওয়াত দেওয়া</div><div class="v">' + bn(invited.length) + '</div></div>' +
    '<div class="stat"><div class="k">আসবেন বলেছেন</div><div class="v" style="color:var(--warm)">' + bn(coming.length) + '</div></div>' +
    '<div class="stat"><div class="k">দোকানে এসেছেন</div><div class="v" style="color:var(--ok)">' + bn(came.length) + '</div></div>' +
    '<div class="stat"><div class="k">আসেননি</div><div class="v" style="color:var(--bad)">' + bn(noshow.length) + '</div></div>' +
    '</div>';

  if (coming.length){
    const byDate = {};
    coming.forEach(c => { (byDate[c.teaDate] = byDate[c.teaDate] || []).push(c); });
    h += '<div class="sec-h"><h2>কবে কে আসবেন</h2><span class="more">তারিখে চাপুন</span></div><div class="card pad0">' +
      Object.keys(byDate).sort().map(d => {
        const ov = d < todayISO();
        return '<details class="dgroup"' + (ov || d === todayISO() ? ' open' : '') + '>' +
          '<summary><span>' + banglaDate(d) +
          (ov ? ' — আসার কথা ছিল' : d === todayISO() ? ' — আজ' : '') + '</span>' +
          '<span class="chip ' + (ov ? 'hot' : d === todayISO() ? 'warm' : 'cool') + '">' +
          bn(byDate[d].length) + ' জন</span></summary>' +
          byDate[d].map(followRow).join('') + '</details>';
      }).join('') + '</div>';
  }

  if (invited.length)
    h += block('দাওয়াত দেওয়া হয়েছে — তারিখ নেননি', invited,
               'এদের কাছে জেনে নিন কবে আসতে পারবেন, তারিখটা বসিয়ে দিন।');

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
    return [c.name, c.phone, c.village, c.para, c.union, c.landmark, c.address, c.type, c.supplierName, c.notes]
      .concat(' ', c.union || '', ' ', c.para || '').join(' ').toLowerCase().includes(q);
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
      '<small>' + esc([placeText(c, true), c.type].filter(Boolean).join(' · ')) + '</small><br>' +
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
      '<span class="pmeta">' + esc([placeText(x.c), x.c.address].filter(Boolean).join(' · ') || '—') + '</span></span>' +
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

const PERIODS = [['today','আজ',1],['week','৭ দিন',7],['month','৩০ দিন',30]];

function inLast(iso, days){
  if (!iso) return false;
  const d = String(iso).slice(0, 10);
  return d >= plusDays(-(days - 1)) && d <= todayISO();
}

function staffPeriod(days){
  const m = {};
  const row = n => m[n] || (m[n] = { fresh: 0, touch: 0, tea: 0, won: 0, amt: 0 });
  S.list.forEach(c => {
    const who = (c.by || '').trim() || 'নাম লেখা নেই';
    if (inLast(c.createdAt, days)) row(who).fresh++;
    (c.events || []).forEach(e => {
      if (!inLast(e.t, days)) return;
      if (['visit','call','wa'].includes(e.type)) row(who).touch++;
      if (e.type === 'tea') row(who).tea++;
      if (e.type === 'won' || e.type === 'sale'){ row(who).won++; row(who).amt += Number(c.saleAmount) || 0; }
    });
  });
  return Object.entries(m).sort((a, b) =>
    (b[1].won - a[1].won) || (b[1].tea - a[1].tea) || (b[1].fresh - a[1].fresh));
}

function periodStats(days){
  const s = { fresh: 0, touch: 0, tea: 0, won: 0, amount: 0, places: new Set() };
  S.list.forEach(c => {
    if (inLast(c.createdAt, days)){ s.fresh++; const pl = placeText(c); if (pl) s.places.add(pl); }
    (c.events || []).forEach(e => {
      if (!inLast(e.t, days)) return;
      if (['visit','call','wa'].includes(e.type)) s.touch++;
      if (e.type === 'tea') s.tea++;
      if (e.type === 'won' || e.type === 'sale'){ s.won++; s.amount += Number(c.saleAmount) || 0; }
    });
  });
  return s;
}

function viewReport(){
  const all = S.list;
  const pk = S.period || 'week';
  const days = (PERIODS.find(p => p[0] === pk) || PERIODS[1])[2];
  const ps = periodStats(days);

  let h0 = '<div class="filters">' + PERIODS.map(([k, l]) =>
    '<button class="fchip' + (pk === k ? ' on' : '') + '" data-p="' + k + '">' + l + '</button>').join('') + '</div>';
  h0 += '<div class="stats">' +
    '<div class="stat"><div class="k">নতুন কাস্টমার</div><div class="v">' + bn(ps.fresh) + '</div></div>' +
    '<div class="stat"><div class="k">যোগাযোগ হয়েছে</div><div class="v">' + bn(ps.touch) + '</div></div>' +
    '<div class="stat"><div class="k">দোকানে এসেছেন</div><div class="v">' + bn(ps.tea) + '</div></div>' +
    '<div class="stat"><div class="k">বিক্রি</div><div class="v">' + (ps.amount ? money(ps.amount) : bn(ps.won) + ' টি') + '</div></div>' +
    '</div>';
  if (ps.places.size)
    h0 += '<p class="muted" style="margin:0 2px">' + bn(ps.places.size) + ' টি গ্রামে নতুন কাস্টমার উঠেছে।</p>';
  const won = all.filter(c => c.status === 'won');
  const lost = all.filter(c => c.status === 'lost');
  const closed = won.length + lost.length;
  const rate = closed ? Math.round(won.length / closed * 100) : 0;
  const sales = won.reduce((n, c) => n + salesTotal(c), 0);

  let h = h0 + '<div class="sec-h"><h2>সব মিলিয়ে</h2></div><div class="stats">' +
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
    const v = placeText(c) || c.union || 'এলাকা লেখা নেই';
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

  /* চা-কফির দাওয়াতের ফানেল — মাঠ থেকে দোকান পর্যন্ত */
  const teaOf = k => all.filter(c => (c.teaStatus || 'none') === k).length;
  const invited = all.filter(c => c.teaStatus && c.teaStatus !== 'none').length;
  const came = teaOf('came');
  h += '<div class="sec-h"><h2>চা-কফির দাওয়াত কতদূর গেল</h2>' +
       '<span class="more">' + (invited ? bn(Math.round(came / invited * 100)) + '% এসেছেন' : '—') + '</span></div><div class="card">' +
    TEA.filter(([k]) => k !== 'none').map(([k, l]) => {
      const n = teaOf(k);
      return '<div style="padding:8px 0"><div class="rrow" style="border:0;padding:0 0 6px">' +
        '<span>' + l + '</span><span class="rn">' + bn(n) + '</span></div>' +
        '<div class="bar"><i style="width:' + (invited ? n / invited * 100 : 0) + '%"></i></div></div>';
    }).join('') + (invited ? '' : '<div class="empty">এখনো কাউকে দাওয়াত দেওয়া হয়নি</div>') + '</div>';

  /* কে কী এনেছে — বাছাই করা মেয়াদে */
  const sp = staffPeriod(days);
  const plabel = (PERIODS.find(x => x[0] === pk) || PERIODS[1])[1];
  h += '<div class="sec-h"><h2>কর্মীর কাজ — ' + plabel + '</h2></div><div class="card">' +
    (sp.length ? '<div class="tablewrap"><table><thead><tr><th>নাম</th><th>নতুন</th><th>যোগাযোগ</th><th>দোকানে</th><th>বিক্রি</th></tr></thead><tbody>' +
      sp.map(([n, d]) => '<tr><td><b>' + esc(n) + '</b></td><td class="num">' + bn(d.fresh) +
        '</td><td class="num">' + bn(d.touch) + '</td><td class="num">' + bn(d.tea) +
        '</td><td class="num">' + (d.amt ? money(d.amt) : bn(d.won)) + '</td></tr>').join('') +
      '</tbody></table></div>'
      : '<div class="empty">এই সময়ে কারও কোনো কাজ লেখা হয়নি</div>') + '</div>';

  /* সব সময় মিলিয়ে */
  const byStaff = {};
  all.forEach(c => {
    const n = (c.by || '').trim() || 'নাম লেখা নেই';
    byStaff[n] = byStaff[n] || { n: 0, tea: 0, won: 0, amt: 0 };
    byStaff[n].n++;
    if (c.teaStatus === 'came') byStaff[n].tea++;
    if (c.status === 'won'){ byStaff[n].won++; byStaff[n].amt += Number(c.saleAmount) || 0; }
  });
  const ss = Object.entries(byStaff).sort((a, b) => b[1].n - a[1].n);
  h += '<div class="sec-h"><h2>কে কতটা এনেছে</h2><span class="more">শুরু থেকে এ পর্যন্ত</span></div><div class="card">' +
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

  '<label class="field"><span>ব্যক্তিগত মোবাইল <b class="req">*</b></span>' +
  '<input id="f_phone" type="tel" inputmode="numeric" value="' + esc(v.phone || '') + '" placeholder="০১৭…" required></label>' +

  '<div class="checkline"><input type="checkbox" id="f_wasame"' + (v.waSame === false ? '' : ' checked') + '>' +
  '<span>WhatsApp নম্বরও এটাই</span></div>' +
  '<label class="field" id="waWrap"' + (v.waSame === false ? '' : ' hidden') + '>' +
  '<span>WhatsApp নম্বর</span>' +
  '<input id="f_wa" type="tel" inputmode="numeric" value="' + esc(v.whatsapp || '') + '" placeholder="০১৮…"></label>' +

  '<label class="field"><span>ইউনিয়ন / পৌরসভা</span><select id="f_union">' +
  '<option value="">বেছে নিন</option>' +
  UNIONS.map(u => '<option value="' + esc(u) + '"' + (v.union === u ? ' selected' : '') + '>' + esc(u) + '</option>').join('') +
  '</select></label>' +

  '<div class="grid2">' +
  '<div class="field"><span>গ্রাম</span>' +
  '<button type="button" class="pickbtn" id="f_village_b"><span id="f_village_t">' +
    (v.village ? esc(v.village) : '<i>বেছে নিন</i>') + '</span><em>খুঁজুন ▸</em></button>' +
  '<input type="hidden" id="f_village" value="' + esc(v.village || '') + '"></div>' +
  '<div class="field"><span>পাড়া / মহল্লা</span>' +
  '<button type="button" class="pickbtn" id="f_para_b"><span id="f_para_t">' +
    (v.para ? esc(v.para) : '<i>বেছে নিন</i>') + '</span><em>খুঁজুন ▸</em></button>' +
  '<input type="hidden" id="f_para" value="' + esc(v.para || '') + '"></div>' +
  '</div>' +
  '<div class="hint" style="margin-top:-6px;margin-bottom:14px">উল্লাপাড়ার ' + bn(VILLAGES.length) +
  'টি গ্রামের নাম তালিকায় আছে — নাম লিখে খুঁজুন। না পেলে নিজে লিখে দিন, পরের বার তালিকাতেই পাবেন।</div>' +

  '<label class="field"><span>কিসের পাশে — মসজিদ, স্কুল, বাজার, মোড়</span>' +
  '<input id="f_landmark" value="' + esc(v.landmark || '') + '" placeholder="যেমন: জামে মসজিদের পূর্ব পাশে"></label>' +

  '<label class="field"><span>বাড়ি চেনার মতো কিছু</span>' +
  '<input id="f_address" value="' + esc(v.address || '') + '" placeholder="মন্ডল বাড়ি, তিনতলা লাল বিল্ডিং, গেটে নীল দরজা"></label>' +

  /* ---- location ---- */
  '<div class="field"><span>ম্যাপের পিন</span>' +
    '<div id="pinState" class="card" style="padding:11px;margin-bottom:8px">' + pinStateHTML(v) + '</div>' +
    '<div class="btnrow"><button type="button" class="btn sec" id="btnGps">◎ এখানেই আছি</button>' +
    '<button type="button" class="btn sec" id="btnPickPin">◈ ম্যাপে বসাই</button></div>' +
    '<div class="btnrow" style="margin-top:8px">' +
    '<button type="button" class="btn sec" id="btnAddr">ঠিকানা বের করুন</button>' +
    '<button type="button" class="btn sec" id="btnClearPin">পিন মুছুন</button></div>' +
    '<div class="hint">বিল্ডিংয়ের নিচে নেটওয়ার্ক না পেলে পিন না দিয়েই সেভ করুন। পরে “পিন বাকি” তালিকা থেকে নেটওয়ার্কে গিয়ে পিন করা যাবে। ম্যাপে বসালে GPS লাগে না — বাড়িটা দেখে আঙুল দিয়ে চাপলেই হবে।</div>' +
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
  '<label class="field"><span>চা-কফির দাওয়াতের অবস্থা</span><select id="f_teastat">' +
    TEA.map(([k, l]) => '<option value="' + k + '"' + ((v.teaStatus || 'none') === k ? ' selected' : '') + '>' + l + '</option>').join('') +
  '</select></label>' +
  '<label class="field"><span>কবে আসবেন বলেছেন</span>' +
  '<input id="f_tea" type="date" value="' + esc(v.teaDate || '') + '"></label>' +
  '</div>' +

  '<label class="field"><span>পরের বার কবে ধরব</span>' +
  '<input id="f_next" type="date" value="' + esc(v.nextDate || (c ? '' : plusDays(7))) + '">' +
  '<span class="hint">তারিখ না দিলে ফলো-আপের তালিকায় উঠবে না।</span></label>' +

  photoBlockHTML(v) +

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

let FORMREC = null;

function openForm(c){
  if (c && !canEdit(c)){
    openSheet('সম্পাদনা করা যাবে না',
      '<div class="warnbox"><b>২৪ ঘণ্টার সময় পেরিয়ে গেছে</b>' +
      'নতুন রেকর্ড তোলার পর ২৪ ঘণ্টা পর্যন্ত নিজে ঠিক করা যায়। এরপর শুধু মালিক বদলাতে পারেন।' +
      (c._by && S.me && c._by !== S.me.id ? '<br><br>এই রেকর্ডটি অন্য কেউ তুলেছেন।' : '') +
      '</div><p class="muted">কিছু ভুল থাকলে মালিককে বলুন। ফলো-আপ লেখা ও ভিজিটের তথ্য যোগ করা যাবে — সেটা বন্ধ নয়।</p>',
      '<button class="btn sec block" data-close>বুঝেছি</button>');
    return;
  }
  FORMREC = c || { photos: [] };
  if (!FORMREC.photos) FORMREC.photos = [];
  openSheet(c ? 'তথ্য সম্পাদনা' : 'নতুন কাস্টমার', formHTML(c),
    '<button class="btn gold block" id="saveC">সংরক্ষণ করুন</button>');

  const typeSel = $('#f_type');
  typeSel.addEventListener('change', () => {
    $('#cblock').hidden = typeSel.value !== TYPES[0];
  });

  const unionSel = $('#f_union');
  const setPick = (key, val) => {
    $('#f_' + key).value = val;
    $('#f_' + key + '_t').innerHTML = val ? esc(val) : '<i>বেছে নিন</i>';
  };
  $('#f_village_b').addEventListener('click', () => openPicker({
    title: 'গ্রাম বাছুন',
    sub: unionSel.value ? unionSel.value + ' — আগে নেওয়া নামগুলো উপরে' : 'নাম লিখে খুঁজুন',
    used: learned('village', unionSel.value),
    all: VILLAGES,
    usedLabel: unionSel.value ? 'এই ইউনিয়নে আগে নেওয়া' : 'আগে নেওয়া',
    onPick: v2 => setPick('village', v2),
  }));
  $('#f_para_b').addEventListener('click', () => openPicker({
    title: 'পাড়া / মহল্লা',
    sub: ($('#f_village').value || 'গ্রাম') + ' — আগে লেখা নামগুলো',
    used: learned('para', unionSel.value),
    all: [],
    usedLabel: 'আগে লেখা পাড়া',
    onPick: v2 => setPick('para', v2),
  }));

  paintPhotos(FORMREC);
  $('#f_photo').addEventListener('change', async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (!$('#f_consent').checked){ toast('আগে অনুমতির ঘরে টিক দিন'); return; }
    toast('ছবি যোগ হচ্ছে…');
    for (const f of files){
      try{
        const b = await shrink(f);
        const key = 'ph' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        if (Store.mode === 'cloud') await Store.putPhoto(key, b);
        else await photoPut(key, b);
        FORMREC.photos.push(key);
      }catch(err){ toast('একটা ছবি নেওয়া গেল না'); }
    }
    await paintPhotos(FORMREC);
  });

  const waSame = $('#f_wasame');
  waSame.addEventListener('change', () => { $('#waWrap').hidden = waSame.checked; });

  $('#btnGps').addEventListener('click', grabGps);
  $('#btnPickPin').addEventListener('click', () => openPinPicker(c));
  const addr = $('#btnAddr');
  if (addr) addr.addEventListener('click', lookupAddress);
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

/* ══════════ ১১ক. বাড়ির ছবি ══════════
   ছবি ফোনের ভেতরের IndexedDB-তে থাকে, কাস্টমারের রেকর্ডে শুধু আইডি।
   ক্লাউড চালু হলে একই আইডি দিয়ে Supabase Storage-এ তোলা হবে। */

let IDB = null;
function idb(){
  if (IDB) return IDB;
  IDB = new Promise((res, rej) => {
    const r = indexedDB.open('jara-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('p');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return IDB;
}
async function photoPut(key, blob){
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('p', 'readwrite');
    tx.objectStore('p').put(blob, key);
    tx.oncomplete = () => res(key); tx.onerror = () => rej(tx.error);
  });
}
async function photoGet(key){
  const db = await idb();
  return new Promise(res => {
    const tx = db.transaction('p', 'readonly');
    const q = tx.objectStore('p').get(key);
    q.onsuccess = () => res(q.result || null); q.onerror = () => res(null);
  });
}
async function photoDel(key){
  const db = await idb();
  return new Promise(res => {
    const tx = db.transaction('p', 'readwrite');
    tx.objectStore('p').delete(key); tx.oncomplete = () => res();
  });
}

/* বড় ছবি ছোট করে নেওয়া — ফোনের জায়গা বাঁচাতে */
function shrink(file, max = 1280, q = 0.68){
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob(b => b ? res(b) : rej(new Error('ছবি তৈরি হয়নি')), 'image/jpeg', q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('ছবি পড়া গেল না')); };
    img.src = url;
  });
}

async function photoSrc(key){
  if (Store.mode === 'cloud'){
    try{ const u = await Store.photoUrl(key); if (u) return u; }catch(e){}
    return null;
  }
  const b = await photoGet(key);
  return b ? URL.createObjectURL(b) : null;
}

async function paintPhotos(rec){
  const box = $('#photoList');
  if (!box) return;
  const ids = rec.photos || [];
  if (!ids.length){ box.innerHTML = '<p class="muted" style="margin:0">এখনো কোনো ছবি নেই।</p>'; return; }
  box.innerHTML = '';
  for (const id of ids){
    const src = await photoSrc(id);
    const cell = document.createElement('div');
    cell.className = 'pcell';
    if (src){
      const im = document.createElement('img');
      im.src = src; im.alt = 'বাড়ির ছবি';
      cell.appendChild(im);
    } else {
      cell.innerHTML = '<span class="muted" style="font-size:11px">ছবি পাওয়া যায়নি</span>';
    }
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'pdel'; del.textContent = '✕';
    del.setAttribute('aria-label', 'ছবি মুছুন');
    del.onclick = async () => {
      rec.photos = (rec.photos || []).filter(x => x !== id);
      await photoDel(id); await paintPhotos(rec);
      if (rec.id && byId(rec.id)) await saveRec(rec);
    };
    cell.appendChild(del);
    box.appendChild(cell);
  }
}

function photoBlockHTML(v){
  return '<div class="field"><span>বাড়ির ছবি</span>' +
    '<div class="warnbox" style="margin-bottom:9px"><b>আগে অনুমতি নিন</b>' +
    'বাড়ির মালিকের অনুমতি ছাড়া ছবি তুলবেন না। মানুষের ছবি তোলা যাবে না — শুধু বাইরে থেকে বাড়ির ছবি, ' +
    'যাতে পরে জায়গাটা খুঁজে পাওয়া যায়।</div>' +
    '<div class="checkline"><input type="checkbox" id="f_consent"' + (v.consent ? ' checked' : '') + '>' +
    '<span>মালিক ছবি তোলার অনুমতি দিয়েছেন</span></div>' +
    '<div class="plist2" id="photoList"></div>' +
    '<label class="btn sec block" style="margin-top:9px">📷 বাড়ির ছবি যোগ করুন' +
    '<input type="file" id="f_photo" accept="image/*" capture="environment" multiple hidden></label>' +
    '<div class="hint">ছবি এখন এই ফোনেই থাকে। ক্লাউড চালু হলে সব ফোনে দেখা যাবে।</div></div>';
}

/* ══════════ ১১খ. গ্রাম / পাড়া বাছাই ══════════ */

let VP = { target: null, onPick: null };

function openPicker(opts){
  VP = opts;
  $('#vpTitle').textContent = opts.title;
  $('#vpSub').textContent   = opts.sub || 'নাম লিখে খুঁজুন';
  $('#vpQ').value = '';
  $('#vpick').hidden = false;
  paintPicker('');
  setTimeout(() => $('#vpQ').focus(), 150);
}
function closePicker(){ $('#vpick').hidden = true; VP = { target: null, onPick: null }; }

function paintPicker(q){
  const box = $('#vpList');
  const f = fold(q);
  const match = arr => f ? arr.filter(v => fold(v).includes(f)) : arr;

  const used = match(VP.used || []);
  const all  = match(VP.all || []).filter(v => !(VP.used || []).includes(v));
  const cap  = 60;

  let h = '';
  if (used.length)
    h += '<div class="vp-h">' + (VP.usedLabel || 'আগে ব্যবহার করা') + '</div>' +
         used.slice(0, cap).map(v => '<button class="vp-i on" data-v="' + esc(v) + '">' +
           esc(v) + '<span class="chip cool">আগে নেওয়া</span></button>').join('');
  if (all.length)
    h += '<div class="vp-h">' + (VP.allLabel || 'উল্লাপাড়ার গ্রাম') +
         ' <span class="muted">(' + bn(all.length) + ')</span></div>' +
         all.slice(0, cap).map(v => '<button class="vp-i" data-v="' + esc(v) + '">' + esc(v) + '</button>').join('') +
         (all.length > cap ? '<div class="vp-more">আরও ' + bn(all.length - cap) +
            ' টি আছে — নাম লিখে খুঁজুন</div>' : '');
  if (!used.length && !all.length)
    h = '<div class="empty"><strong>এই নামে কিছু নেই</strong>' +
        'নিচের বাটনে চেপে নিজে লিখে দিন — পরের বার তালিকাতেই পাবেন।</div>';

  box.innerHTML = h;
  box.querySelectorAll('[data-v]').forEach(b =>
    b.addEventListener('click', () => { VP.onPick(b.dataset.v); closePicker(); }));
}

/* ── ম্যাপে আঙুল দিয়ে পিন বসানো (GPS ছাড়াই চলে) ── */
let PK = { map: null, marker: null, lat: null, lng: null };

function openPinPicker(){
  const wrap = $('#picker');
  wrap.hidden = false;
  document.body.style.overflow = 'hidden';

  const cur = { lat: parseFloat($('#f_lat').value), lng: parseFloat($('#f_lng').value) };
  const start = !isNaN(cur.lat)
    ? [cur.lat, cur.lng]
    : (S.here ? [S.here.lat, S.here.lng] : [S.settings.shopLat, S.settings.shopLng]);

  if (PK.map){ PK.map.remove(); PK.map = null; PK.marker = null; }
  PK.lat = PK.lng = null;
  $('#pkRead').textContent = 'কোনো পিন বসানো হয়নি';

  PK.map = L.map('pkMap', { zoomControl: true }).setView(start, !isNaN(cur.lat) ? 18 : 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(PK.map);

  // দোকানটা দেখা যাক, যাতে দিক বোঝা যায়
  L.marker([S.settings.shopLat, S.settings.shopLng], {
    icon: L.divIcon({ className: '', html: '<div class="pinmark" style="background:#0B2545"></div>',
      iconSize: [26, 26], iconAnchor: [13, 24] })
  }).addTo(PK.map).bindPopup('আপনার দোকান');

  const place = (lat, lng) => {
    PK.lat = +lat.toFixed(6); PK.lng = +lng.toFixed(6);
    if (PK.marker) PK.marker.setLatLng([lat, lng]);
    else PK.marker = L.marker([lat, lng], { draggable: true,
      icon: L.divIcon({ className: '', html: '<div class="pinmark" style="background:#C62828"></div>',
        iconSize: [26, 26], iconAnchor: [13, 24] }) }).addTo(PK.map)
      .on('dragend', e => { const p = e.target.getLatLng(); place(p.lat, p.lng); });
    const km = distKm(S.settings.shopLat, S.settings.shopLng, PK.lat, PK.lng);
    $('#pkRead').textContent = PK.lat.toFixed(5) + ', ' + PK.lng.toFixed(5) + ' · দোকান থেকে ' + distText(km);
  };

  if (!isNaN(cur.lat)) place(cur.lat, cur.lng);
  PK.map.on('click', e => place(e.latlng.lat, e.latlng.lng));
  setTimeout(() => PK.map && PK.map.invalidateSize(), 150);

  $('#pkHere').onclick = () => {
    if (!navigator.geolocation){ toast('লোকেশন সুবিধা নেই'); return; }
    $('#pkHint').textContent = 'অবস্থান নেওয়া হচ্ছে…';
    navigator.geolocation.getCurrentPosition(p => {
      S.here = { lat: p.coords.latitude, lng: p.coords.longitude };
      PK.map.setView([p.coords.latitude, p.coords.longitude], 18);
      place(p.coords.latitude, p.coords.longitude);
      $('#pkHint').textContent = 'দরকার হলে সরিয়ে ঠিক জায়গায় বসান';
    }, () => { $('#pkHint').textContent = 'অবস্থান পাওয়া যায়নি — হাতে বসান'; },
       { enableHighAccuracy: true, timeout: 15000 });
  };
  $('#pkCancel').onclick = closePinPicker;
  $('#pkOk').onclick = () => {
    if (PK.lat == null){ toast('আগে ম্যাপে চাপ দিয়ে পিন বসান'); return; }
    $('#f_lat').value = PK.lat; $('#f_lng').value = PK.lng;
    $('#pinState').innerHTML = pinStateHTML({ lat: PK.lat, lng: PK.lng });
    closePinPicker(); toast('পিন বসানো হয়েছে');
  };
}
function closePinPicker(){
  $('#picker').hidden = true;
  document.body.style.overflow = 'hidden'; // ফর্মের শিট এখনো খোলা
  if (PK.map){ PK.map.remove(); PK.map = null; PK.marker = null; }
}

/* ── পিন থেকে ঠিকানা ── */
async function lookupAddress(){
  const lat = parseFloat($('#f_lat').value), lng = parseFloat($('#f_lng').value);
  if (isNaN(lat)){ toast('আগে পিন বসান'); return; }
  const st = $('#pinState');
  const keep = st.innerHTML;
  st.innerHTML = '<span class="muted">ঠিকানা খোঁজা হচ্ছে…</span>';
  try{
    const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=bn&lat=' + lat + '&lon=' + lng);
    const j = await r.json();
    const a = j && j.display_name ? j.display_name : '';
    st.innerHTML = keep;
    if (!a){ toast('এই জায়গার ঠিকানা ম্যাপে লেখা নেই'); return; }
    const box = $('#f_address');
    box.value = box.value ? box.value + ' — ' + a : a;
    toast('ঠিকানা বসানো হয়েছে — দেখে ঠিক করে নিন');
  }catch(e){
    st.innerHTML = keep;
    toast('ঠিকানা আনা গেল না');
  }
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
  rec.waSame = $('#f_wasame').checked;
  rec.whatsapp = rec.waSame ? phone : ($('#f_wa').value.trim() || phone);
  rec.union   = $('#f_union').value;
  rec.village = $('#f_village').value.trim();
  rec.para    = $('#f_para').value.trim();
  rec.landmark = $('#f_landmark').value.trim();
  rec.address = $('#f_address').value.trim();
  rec.lat = isNaN(lat) ? null : lat;
  rec.lng = isNaN(lng) ? null : lng;
  rec.supplierName = $('#f_supplier').value.trim();
  rec.supplierShop = $('#f_supshop').value.trim();
  rec.consent  = $('#f_consent').checked;
  rec.photos   = (FORMREC && FORMREC.photos) ? FORMREC.photos.slice() : (rec.photos || []);
  rec.teaStatus = $('#f_teastat').value;
  rec.teaDate = $('#f_tea').value || '';
  rec.nextDate = $('#f_next').value || '';
  if (!rec.by) rec.by = (S.me && S.me.name) || (S.settings.myName || '').trim();
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

  const ok = await saveRec(rec);
  if (!ok){ if (isNew) S.list = S.list.filter(x => x.id !== rec.id); return; }
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
    if (await delRec(c.id)){ closeSheet(); toast('মুছে ফেলা হয়েছে'); render(); }
  });
}

/* ══════════ ১২. বিস্তারিত ══════════ */

function openDetail(id){
  const c = byId(id); if (!c) return;
  const sc = score(c), b = band(sc);
  const km = distKm(S.settings.shopLat, S.settings.shopLng, c.lat, c.lng);
  const wa = waOf(c);

  const kv = (k, v) => v ? '<div class="kv"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>' : '';

  let body = '<div class="dhead"><h3>' + esc(c.name || 'নামহীন') + '</h3>' +
    '<div class="dsub">' + esc([c.type, placeText(c, true)].filter(Boolean).join(' · ')) + '</div>' +
    '<div class="drow">' +
      (c.status === 'won' ? '<span class="chip ok">কাজ পেয়েছি</span>'
       : c.status === 'lost' ? '<span class="chip bad">হাতছাড়া' + (c.lostTo ? ' — ' + esc(c.lostTo) : '') + '</span>'
       : '<button class="chip ' + b.k + '" id="whyScore" style="border:0;cursor:pointer">' +
         b.t + ' · তাগিদ ' + bn(sc) + ' ⓘ</button>') +
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
    (c.waSame === false && c.whatsapp && c.whatsapp !== c.phone
      ? kv('WhatsApp', '<span class="num">' + esc(c.whatsapp) + '</span>') : '') +
    kv('এলাকা', esc(placeText(c, true))) +
    kv('কিসের পাশে', esc(c.landmark)) +
    kv('বাড়ি চেনার মতো', esc(c.address)) +
    kv('কয় তলা', c.floors ? bn(c.floors) + ' তলা' : '') +
    kv('নির্মাণের অবস্থা', esc(c.stage)) +
    kv('ইলেকট্রিক কাজ', esc(c.elecStatus)) +
    kv('মাল লাগবে', c.needDays ? NEED_LABEL[String(c.needDays)] : '') +
    kv('এখন মাল নেয়', esc([c.supplierName, c.supplierShop].filter(Boolean).join(', '))) +
    kv('চা-কফির দাওয়াতের তারিখ', c.teaDate ? banglaDate(c.teaDate) + (c.teaDone ? ' (এসেছেন)' : '') : '') +
    kv('পরের যোগাযোগ', c.nextDate ? banglaDate(c.nextDate) : '') +
    kv('শেষ যোগাযোগ', agoText(c.lastContact || c.createdAt)) +
    kv('কে তুলেছে', c.by ? esc(c.by) + ' <span class="chip cool">' + roleLabel() + '</span>' : '') +
    kv('কবে তোলা হয়েছে', c.createdAt ? banglaDate(c.createdAt) : '') +
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

  const sl = salesOf(c);
  if (c.status === 'won'){
    body += '<div class="sec-h" style="margin-top:16px"><h2>বিক্রির খাতা</h2>' +
            '<span class="more num">মোট ' + money(salesTotal(c)) + '</span></div>' +
            '<div class="card"><div id="saleList"></div></div>' +
            '<button class="btn gold block" id="mMore" style="margin-top:9px">＋ আবার মাল নিয়েছেন</button>';
  } else if (c.status === 'lost'){
    body += '<button class="btn sec block" id="mReopen">আবার চালু করুন</button>';
  } else {
    body += '<div class="btnrow"><button class="btn gold" id="mWon">কাজ পেয়েছি</button>' +
            '<button class="btn sec" id="mLost">হাতছাড়া হয়েছে</button></div>';
  }

  if ((c.photos || []).length){
    body += '<div class="sec-h" style="margin-top:16px"><h2>বাড়ির ছবি</h2>' +
            '<span class="more">' + bn(c.photos.length) + ' টি</span></div>' +
            '<div class="card"><div class="plist2" id="detPhotos"></div></div>';
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

  const why = $('#whyScore');
  if (why) why.addEventListener('click', () => explainScore(c));
  if ((c.photos || []).length) paintDetailPhotos(c);
  $('#editC').addEventListener('click', () => { closeSheet(); setTimeout(() => openForm(c), 60); });
  const pn = $('#pinNow');
  if (pn) pn.addEventListener('click', () => { closeSheet(); setTimeout(() => openForm(c), 60); });

  $('#sheet').querySelectorAll('[data-log]').forEach(btn =>
    btn.addEventListener('click', () => logAction(c, btn.dataset.log)));

  if (c.status === 'won') paintSales(c);
  const won = $('#mWon'), lost = $('#mLost'), re = $('#mReopen'), more = $('#mMore');
  if (won)  won.addEventListener('click', () => addSale(c, true));
  if (more) more.addEventListener('click', () => addSale(c, false));
  if (lost) lost.addEventListener('click', () => markLost(c));
  if (re)   re.addEventListener('click', async () => {
    c.status = 'open'; c.lostTo = ''; addEvent(c, 'note', 'আবার চালু');
    await saveRec(c); closeSheet(); render(); toast('আবার চালু হয়েছে');
  });
}



async function paintDetailPhotos(c){
  const box = $('#detPhotos');
  if (!box) return;
  box.innerHTML = '';
  for (const id of c.photos){
    const src = await photoSrc(id);
    const cell = document.createElement('div');
    cell.className = 'pcell';
    if (src){
      const im = document.createElement('img');
      im.src = src; im.alt = 'বাড়ির ছবি';
      cell.appendChild(im);
    } else cell.innerHTML = '<span class="muted" style="font-size:11px">ছবি পাওয়া যায়নি</span>';
    box.appendChild(cell);
  }
}

/* তাগিদের সংখ্যাটা কোথা থেকে এলো — খুলে দেখানো */
function explainScore(c){
  const parts = [];
  const last = c.lastContact || c.createdAt;
  const stale = Math.min(15, daysSince(last) * 1.2);

  if (c.type === 'নতুন বাড়ির মালিক'){
    parts.push(['ইলেকট্রিক কাজের অবস্থা', c.elecStatus || '—', weightOf(ELEC, c.elecStatus, 22)]);
    parts.push(['কত দিনে মাল লাগবে', NEED_LABEL[String(c.needDays || '')] || 'জানা নেই', weightOf(NEED, String(c.needDays || ''), 8)]);
    parts.push(['নির্মাণ কতদূর', c.stage || '—', weightOf(STAGES, c.stage, 8)]);
  } else {
    const base = { 'ইলেকট্রিশিয়ান': 26, 'ঠিকাদার': 24, 'পাইকারি দোকানদার': 20 };
    parts.push(['সম্পর্কের গুরুত্ব', c.type || '—', base[c.type] || 12]);
  }
  parts.push(['কতদিন কথা হয়নি', agoText(last), Math.round(c.type === 'নতুন বাড়ির মালিক' ? stale : stale * 1.6)]);
  if (dueDate(c) && dueDate(c) <= todayISO())
    parts.push(['তারিখ পেরিয়ে গেছে / আজকের দিন', banglaDate(dueDate(c)), 25]);
  if (c.teaStatus === 'promised') parts.push(['আসবেন বলে কথা দিয়েছেন', '', 10]);
  if (c.teaStatus === 'noshow')   parts.push(['কথা দিয়ে আসেননি', '', 6]);

  const total = score(c), b = band(total);
  openSheet('তাগিদ কীভাবে হিসাব হয়',
    '<p style="margin-top:0" class="muted">অ্যাপ নিজে থেকেই ঠিক করে আজ কাকে আগে ধরা দরকার। ' +
    esc(c.name || 'এই কাস্টমার') + '-এর হিসাবটা এরকম:</p>' +
    '<div class="card">' + parts.map(([k, v, n]) =>
      '<div class="kv"><span class="k">' + k + (v ? '<br><small>' + esc(v) + '</small>' : '') +
      '</span><span class="v num">+' + bn(n) + '</span></div>').join('') +
    '<div class="kv" style="border-top:2px solid var(--line)"><span class="k"><b>মোট তাগিদ</b></span>' +
    '<span class="v num"><b>' + bn(total) + '</b> <span class="chip ' + b.k + '">' + b.t + '</span></span></div>' +
    '</div>' +
    '<div class="hint" style="margin-top:12px">৬০-এর উপরে হলে <b>এখনই ধরুন</b>, ৪০–৫৯ হলে <b>শীঘ্রই</b>, ' +
    '২০–৩৯ হলে <b>নজরে রাখুন</b>। সংখ্যা যত বড়, তালিকায় তত উপরে।<br><br>' +
    'ছাদ ঢালাই শেষ, ইলেকট্রিকের কথা হয়েছে অথচ ওয়্যারিং শুরু হয়নি — এমন বাড়ির তাগিদ সবচেয়ে বেশি হবে। ' +
    'কাজ পেয়ে গেলে বা হাতছাড়া হলে তাগিদ শূন্য হয়ে যায়।</div>',
    '<button class="btn sec block" data-close>বুঝেছি</button>');
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

    '<label class="field"><span>চা-কফির দাওয়াতের অবস্থা</span><select id="lgTea">' +
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
    await saveRec(c); closeSheet();
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
    '<div class="btnrow"><button class="btn sec" data-close>শুধু চা-কফি খেয়েছেন</button>' +
    '<button class="btn gold" id="apYes">মাল কিনেছেন</button></div>');
  $('#apYes').addEventListener('click', () => { closeSheet(); setTimeout(() => addSale(c, true), 250); });
}

/* পুরোনো এক-বিক্রির রেকর্ডকে খাতার চেহারা দেওয়া */
function salesOf(c){
  if (Array.isArray(c.sales)) return c.sales;
  if (c.saleAmount) return [{
    id: 's0', t: c.updatedAt || c.createdAt,
    amount: Number(c.saleAmount) || 0, note: c.saleItems || '', photo: null
  }];
  return [];
}
function salesTotal(c){ return salesOf(c).reduce((n, x) => n + (Number(x.amount) || 0), 0); }

function addSale(c, first){
  openSheet(first ? 'কাজ পেয়েছি' : 'আবার মাল নিয়েছেন',
    '<label class="field"><span>কত টাকার মাল গেছে</span>' +
    '<input id="sAmt" type="number" inputmode="numeric" min="0" placeholder="যেমন ৪৫০০০"></label>' +

    '<div class="field"><span>মেমোর ছবি</span>' +
    '<div id="memoPrev" class="plist2"></div>' +
    '<label class="btn sec block" style="margin-top:8px">📷 মেমোর ছবি তুলুন' +
    '<input type="file" id="sPhoto" accept="image/*" capture="environment" hidden></label>' +
    '<div class="hint">কী কী নিয়েছে টাইপ করার দরকার নেই — মেমোর ছবিটাই যথেষ্ট। পরে দেখলেই বোঝা যাবে।</div></div>' +

    '<label class="field"><span>নিজের নোট (ইচ্ছা হলে)</span>' +
    '<input id="sNote" placeholder="যেমন: তার আর সুইচ"></label>',

    '<button class="btn gold block" id="sSave">সংরক্ষণ</button>');

  let photoKey = null;
  $('#sPhoto').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    toast('ছবি যোগ হচ্ছে…');
    try{
      const b = await shrink(f, 1500, 0.72);
      photoKey = 'me' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      if (Store.mode === 'cloud') await Store.putPhoto(photoKey, b);
      else await photoPut(photoKey, b);
      const src = await photoSrc(photoKey);
      $('#memoPrev').innerHTML = src
        ? '<div class="pcell"><img src="' + src + '" alt="মেমো"></div>'
        : '<p class="muted" style="margin:0">ছবি যোগ হয়েছে</p>';
    }catch(err){ photoKey = null; toast('ছবিটা নেওয়া গেল না'); }
  });

  $('#sSave').addEventListener('click', async () => {
    const amt = Number($('#sAmt').value) || 0;
    if (!amt && !photoKey){ toast('টাকার অঙ্ক বা মেমোর ছবি — অন্তত একটা দিন'); return; }
    c.sales = salesOf(c).slice();
    c.sales.unshift({
      id: 'sl' + Date.now().toString(36),
      t: new Date().toISOString(),
      amount: amt, note: $('#sNote').value.trim(), photo: photoKey
    });
    c.saleAmount = salesTotal(c);
    c.status = 'won';
    addEvent(c, first ? 'won' : 'sale', amt ? money(amt) : 'মেমো যোগ');
    await saveRec(c); closeSheet();
    toast(first ? 'অভিনন্দন!' : 'বিক্রি যোগ হয়েছে');
    render();
  });
}

async function paintSales(c){
  const box = $('#saleList');
  if (!box) return;
  const rows = salesOf(c);
  box.innerHTML = '';
  for (const s2 of rows){
    const row = document.createElement('div');
    row.className = 'srow';
    const src = s2.photo ? await photoSrc(s2.photo) : null;
    row.innerHTML =
      (src ? '<a class="sthumb" href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="মেমো"></a>'
           : '<span class="sthumb empty">মেমো নেই</span>') +
      '<span class="sbody"><b class="num">' + money(s2.amount) + '</b>' +
      '<small>' + banglaDate(s2.t) + (s2.note ? ' · ' + esc(s2.note) : '') + '</small></span>';
    box.appendChild(row);
  }
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
    await saveRec(c); closeSheet(); render();
  });
}

/* ══════════ ১৩. সেটিংস ও ব্যাকআপ ══════════ */

function openSettings(){
  const s = S.settings;
  const me = S.me;
  const cloud = Store.mode === 'cloud';

  openSheet('সেটিংস',
    (me ? '<div class="card" style="margin-bottom:14px">' +
      '<div class="kv"><span class="k">আপনি</span><span class="v">' + esc(me.name || '—') +
      ' <span class="chip ' + (me.role === 'admin' ? 'gold' : 'cool') + '">' +
      (me.role === 'admin' ? 'মালিক' : roleLabel()) + '</span></span></div>' +
      (me.email ? '<div class="kv"><span class="k">ইমেইল</span><span class="v">' + esc(me.email) + '</span></div>' : '') +
      '<div class="kv"><span class="k">ডেটা</span><span class="v">' +
        (cloud ? '<span class="chip ok">ক্লাউডে — সব ফোনে এক</span>'
               : '<span class="chip idle">শুধু এই ফোনে</span>') + '</span></div>' +
      '</div>' : '') +

    '<label class="field"><span>আপনার নাম</span>' +
    '<input id="s_name" value="' + esc((me && me.name) || s.myName || '') + '" placeholder="রেকর্ডে কার তোলা বোঝা যাবে"' +
    (cloud ? ' disabled' : '') + '></label>' +
    (cloud ? '<div class="hint" style="margin-top:-8px;margin-bottom:14px">নাম বদলাতে মালিককে বলুন।</div>' : '') +

    '<div class="field"><span>দোকানের অবস্থান</span>' +
    '<div class="card" style="padding:11px;margin-bottom:8px" id="shopState">' +
      '<span class="num muted">' + esc(s.shopLat.toFixed(5)) + ', ' + esc(s.shopLng.toFixed(5)) + '</span>' +
      (s.shopPinned ? ' <span class="chip cool">আপনার দেওয়া</span>' : ' <span class="chip idle">আনুমানিক</span>') +
    '</div>' +
    '<button type="button" class="btn sec block" id="s_pin">◎ দোকানে দাঁড়িয়ে এখানে চাপুন</button>' +
    '<div class="hint">সব দূরত্ব এই বিন্দু থেকে মাপা হয়। একবার দোকানে দাঁড়িয়ে সেট করে নিলে হিসাব নির্ভুল হবে।</div></div>' +

    '<label class="field"><span>মাঠকর্মীদের পদবি</span><select id="s_title">' +
    TITLES_OPT.map(([k, l, d]) => '<option value="' + k + '"' +
      ((s.roleTitle || 'TSO') === k ? ' selected' : '') + '>' + l + ' — ' + d + '</option>').join('') +
    '</select><span class="hint">কাস্টমার ও কর্মী সবাই এই নামেই চিনবে। পরে বদলালে সব জায়গায় বদলে যাবে।</span></label>' +

    '<label class="field"><span>প্রতি তলায় আনুমানিক মালের দাম (টাকা)</span>' +
    '<input id="s_floor" type="number" inputmode="numeric" min="0" value="' + esc(s.perFloorValue || '') + '" placeholder="যেমন ২৫০০০"></label>' +
    '<div class="hint" style="margin-top:-8px;margin-bottom:14px">এটা আপনার নিজের অনুমান — আমি কোনো দাম বসাইনি। দিলে পাইপলাইনে কত টাকার কাজ আছে সেটা হিসাব করে দেখাব।</div>' +

    (standalone() ? '' :
      '<button type="button" class="btn pri block" id="s_install" style="margin-bottom:14px">' +
      '📲 ফোনে অ্যাপ হিসেবে বসান</button>') +

    '<div class="sec-h"><h2>ডেটা</h2></div>' +
    '<div class="btnrow" style="margin:9px 0"><button class="btn sec" id="s_xls">Excel ব্যাকআপ</button>' +
    '<button class="btn sec" id="s_json">ফাইল ব্যাকআপ</button></div>' +
    '<div class="btnrow" style="margin-bottom:9px">' +
    '<label class="btn sec" style="cursor:pointer">ফাইল থেকে ফেরান' +
    '<input type="file" id="s_restore" accept=".json,application/json" hidden></label>' +
    '<label class="btn sec" style="cursor:pointer">Excel থেকে ফেরান' +
    '<input type="file" id="s_xlrestore" accept=".xlsx,.xls" hidden></label></div>' +
    backupNoteHTML() +
    '<div class="hint">' + (cloud
      ? 'ডেটা ক্লাউডে আছে, সব ফোনে এক। তবু মাসে একবার ব্যাকআপ নামিয়ে রাখা ভালো।'
      : 'এখন ডেটা শুধু এই ফোনে আছে। নিয়মিত ব্যাকআপ নিন — ফোন হারালে বা ব্রাউজারের ডেটা মুছলে সব চলে যাবে।') + '</div>' +

    (cloud ? '<div class="sec-h" style="margin-top:16px"><h2>কর্মী</h2></div>' +
      '<div id="staffBox"></div>' +
      (me && me.role === 'admin'
        ? '<button class="btn pri block" id="s_addstaff" style="margin-top:9px">＋ নতুন কর্মী যোগ করুন</button>' : '') +
      '<button class="btn sec block" id="s_out" style="margin-top:9px">লগআউট</button>' : ''),

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

  if (cloud){
    $('#s_out').addEventListener('click', async () => {
      await Store.signOut();
      location.reload();
    });
    if (me && me.role === 'admin'){
      paintStaff();
      $('#s_addstaff').addEventListener('click', () => openAddStaff());
    }
  }

  const si = $('#s_install');
  if (si) si.addEventListener('click', doInstall);

  $('#s_xls').addEventListener('click', exportXlsx);
  $('#s_json').addEventListener('click', exportJson);
  $('#s_restore').addEventListener('change', e => { if (e.target.files[0]) importJson(e.target.files[0]); });
  $('#s_xlrestore').addEventListener('change', e => { if (e.target.files[0]) importXlsx(e.target.files[0]); });
  $('#s_save').addEventListener('click', async () => {
    if (!cloud) S.settings.myName = $('#s_name').value.trim();
    S.settings.perFloorValue = Number($('#s_floor').value) || 0;
    S.settings.roleTitle = $('#s_title').value;
    try{
      await Store.setSettings(S.settings);
      closeSheet(); toast('সেটিংস সংরক্ষিত'); render();
    }catch(e){
      toast(/অনুমতি|row-level/i.test(e.message || '') ? 'সেটিংস শুধু মালিক বদলাতে পারেন' : (e.message || 'সংরক্ষণ হয়নি'));
    }
  });
}

function openAddStaff(){
  openSheet('নতুন কর্মী',
    '<label class="field"><span>নাম <b class="req">*</b></span>' +
    '<input id="stName" placeholder="যেমন: রিফাত হোসেন" required></label>' +
    '<label class="field"><span>ইমেইল <b class="req">*</b></span>' +
    '<input id="stMail" type="email" inputmode="email" autocomplete="off" placeholder="rifat@example.com" required></label>' +
    '<label class="field"><span>পাসওয়ার্ড <b class="req">*</b></span>' +
    '<input id="stPass" type="text" autocomplete="off" placeholder="অন্তত ৬ অক্ষর" required>' +
    '<span class="hint">সহজ কিছু দিন, কর্মীকে মুখে বলে দেবেন। সে পরে বদলাতে পারবে না — লাগলে আপনি নতুন দেবেন।</span></label>' +
    '<div id="stErr"></div>' +
    '<div class="hint">অ্যাকাউন্ট খোলার পর তাকে শুধু সাইটের লিংক, ইমেইল আর পাসওয়ার্ড দিলেই হবে। ' +
    'সে সব কাস্টমার দেখতে পাবে, নিজের তোলা রেকর্ড ২৪ ঘণ্টা পর্যন্ত ঠিক করতে পারবে।</div>',
    '<button class="btn gold block" id="stGo">অ্যাকাউন্ট খুলুন</button>');

  $('#stGo').addEventListener('click', async () => {
    const n = $('#stName').value.trim(), e = $('#stMail').value.trim(), pw = $('#stPass').value;
    if (!n || !e || !pw){ toast('তিনটা ঘরই পূরণ করুন'); return; }
    const btn = $('#stGo'); btn.disabled = true; btn.textContent = 'খোলা হচ্ছে…';
    try{
      const r = await Store.createStaff(n, e, pw);
      closeSheet();
      openSheet('অ্যাকাউন্ট খোলা হয়েছে',
        '<div class="card"><div class="kv"><span class="k">নাম</span><span class="v">' + esc(n) + '</span></div>' +
        '<div class="kv"><span class="k">ইমেইল</span><span class="v">' + esc(e) + '</span></div>' +
        '<div class="kv"><span class="k">পাসওয়ার্ড</span><span class="v num">' + esc(pw) + '</span></div></div>' +
        (r.needsConfirm
          ? '<div class="warnbox" style="margin-top:12px"><b>ইমেইল নিশ্চিত করা দরকার</b>' +
            'Supabase-এ ইমেইল যাচাই চালু আছে, তাই সে এখনই ঢুকতে পারবে না। ' +
            'Supabase → Authentication → Sign In / Providers → <b>Confirm email</b> বন্ধ করে দিন, ' +
            'তাহলে আর কারও জন্যই এই ঝামেলা থাকবে না।</div>'
          : '<div class="hint" style="margin-top:12px">এখনই লগইন করতে পারবে।</div>') +
        '<p class="muted">এই তথ্যটুকু তাকে WhatsApp-এ পাঠিয়ে দিন, সাথে সাইটের লিংক।</p>',
        '<button class="btn sec block" id="stDone">ঠিক আছে</button>');
      $('#stDone').addEventListener('click', () => { closeSheet(); setTimeout(openSettings, 80); });
    }catch(err){
      $('#stErr').innerHTML = '<div class="error-box">' + esc(err.message || 'হলো না') + '</div>';
      btn.disabled = false; btn.textContent = 'অ্যাকাউন্ট খুলুন';
    }
  });
}

async function paintStaff(){
  const box = $('#staffBox');
  if (!box) return;
  box.innerHTML = '<p class="muted" style="margin:0">কর্মীর তালিকা আনা হচ্ছে…</p>';
  let rows = [];
  try{ rows = await Store.staff(); }catch(e){}
  if (!rows.length){ box.innerHTML = '<p class="muted" style="margin:0">কেউ নেই।</p>'; return; }
  box.innerHTML = '<div class="card">' + rows.map(r =>
    '<div class="rrow"><span>' + esc(r.name || '—') +
    ' <span class="chip ' + (r.role === 'admin' ? 'gold' : 'cool') + '">' +
    (r.role === 'admin' ? 'মালিক' : roleLabel()) + '</span>' +
    (r.active ? '' : ' <span class="chip bad">বন্ধ</span>') +
    '</span><span class="rn">' +
    bn(S.list.filter(c => c._by === r.id).length) + ' জন</span></div>').join('') + '</div>' +
    '';
}

const BK_KEY = 'jara.lastBackup';
function lastBackup(){ try{ return localStorage.getItem(BK_KEY) || ''; }catch(e){ return ''; } }
function markBackup(){ try{ localStorage.setItem(BK_KEY, todayISO()); }catch(e){} }
function backupAge(){
  const d = lastBackup();
  if (!d) return null;
  return Math.max(0, Math.round((midnight(todayISO()) - midnight(d)) / DAY));
}
function backupNoteHTML(){
  const a = backupAge();
  if (a === null)
    return '<div class="warnbox"><b>এখনো ব্যাকআপ নেননি</b>মাসে একবার “ফাইল ব্যাকআপ” নামিয়ে ' +
           'Google Drive বা WhatsApp-এ নিজেকে পাঠিয়ে রাখুন। ৩০ সেকেন্ডের কাজ।</div>';
  if (a >= 30)
    return '<div class="warnbox"><b>' + bn(a) + ' দিন ব্যাকআপ নেননি</b>আজই একটা নামিয়ে রাখুন।</div>';
  return '<div class="hint" style="margin-bottom:12px">শেষ ব্যাকআপ: ' + banglaDate(lastBackup()) + '</div>';
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
           'jara-crm-backup-' + todayISO() + '.json');
  markBackup();
  toast('ব্যাকআপ নামছে — Drive বা নিজের WhatsApp-এ রেখে দিন');
}

function importJson(file){
  const r = new FileReader();
  r.onload = () => {
    let d;
    try{
      d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.customers)) throw new Error('ভুল ফাইল');
    }catch(e){ toast('ফাইলটি পড়া গেল না — এটা কি জারা CRM-এর ব্যাকআপ?'); return; }

    const mine = new Map(S.list.map(x => [x.id, x]));
    const fresh = [], newer = [], older = [], broken = [];
    d.customers.forEach(x => {
      if (!x || !x.id || !x.name){ broken.push(x); return; }
      const cur = mine.get(x.id);
      if (!cur) fresh.push(x);
      else if ((x.updatedAt || '') > (cur.updatedAt || '')) newer.push(x);
      else older.push(x);
    });

    const line = (n, label, note) => n
      ? '<div class="rrow"><span>' + label + (note ? '<br><small class="muted">' + note + '</small>' : '') +
        '</span><span class="rn">' + bn(n) + '</span></div>' : '';

    openSheet('ফেরানোর আগে দেখে নিন',
      '<p style="margin-top:0" class="muted">ফাইলের তারিখ: ' + banglaDate(d.at || '') +
      ' · মোট ' + bn(d.customers.length) + ' টি রেকর্ড</p>' +
      '<div class="card">' +
        line(fresh.length, 'নতুন — যোগ হবে') +
        line(newer.length, 'ফাইলের তথ্য নতুন — বদলে যাবে', 'ফাইলেরটা পরে বদলানো হয়েছে') +
        line(older.length, 'এখানকার তথ্যই নতুন — হাত দেওয়া হবে না', 'আপনার বর্তমান রেকর্ড অক্ষত থাকবে') +
        line(broken.length, 'পড়া গেল না — বাদ যাবে') +
      '</div>' +
      (newer.length ? '<div class="warnbox" style="margin-top:12px"><b>' + bn(newer.length) +
        ' টি রেকর্ড বদলে যাবে</b>ওগুলোর বর্তমান তথ্য ফাইলের তথ্য দিয়ে ঢেকে যাবে।</div>' : '') +
      '<div class="checkline"><input type="checkbox" id="imSet"' + (d.settings ? '' : ' disabled') + '>' +
      '<span>সেটিংসও ফেরাব (দোকানের অবস্থান, নাম)</span></div>' +
      '<div class="hint">কোনো রেকর্ড মুছে যাবে না। যা এখানে আছে অথচ ফাইলে নেই, সেটা যেমন আছে তেমনই থাকবে।</div>',

      '<div class="btnrow"><button class="btn sec" data-close>থাক</button>' +
      '<button class="btn gold" id="imGo">ফেরান</button></div>');

    $('#imGo').addEventListener('click', async () => {
      let done = 0, failed = 0;
      for (const x of fresh.concat(newer)){
        const i = S.list.findIndex(y => y.id === x.id);
        if (i >= 0) S.list[i] = x;
        if (await saveRec(x)) done++; else failed++;
      }
      if ($('#imSet').checked && d.settings){
        S.settings = Object.assign({}, S.settings, d.settings);
        try{ await Store.setSettings(S.settings); }catch(e){}
      }
      closeSheet(); render();
      toast(bn(done) + ' টি ফেরানো হয়েছে' + (failed ? ', ' + bn(failed) + ' টি পারেনি' : ''));
    });
  };
  r.readAsText(file);
}

function exportXlsx(){
  if (typeof XLSX === 'undefined'){ toast('Excel সুবিধা লোড হয়নি'); return; }
  const rows = S.list.map(c => ({
    'আইডি': c.id,
    'নাম': c.name || '', 'ধরন': c.type || '', 'মোবাইল': c.phone || '',
    'WhatsApp': c.waSame === false ? (c.whatsapp || '') : '',
    'ইউনিয়ন': c.union || '', 'গ্রাম': c.village || '', 'পাড়া': c.para || '', 'কিসের পাশে': c.landmark || '', 'ঠিকানা': c.address || '',
    'তলা': c.floors || '', 'নির্মাণের অবস্থা': c.stage || '',
    'ইলেকট্রিক কাজ': c.elecStatus || '', 'মাল লাগবে': NEED_LABEL[String(c.needDays || '')] || '',
    'এখন মাল নেয়': c.supplierName || '', 'সেই দোকান': c.supplierShop || '',
    'অবস্থা': c.status === 'won' ? 'পেয়েছি' : c.status === 'lost' ? 'হাতছাড়া' : 'চলমান',
    'হাতছাড়া হয়েছে যার কাছে': c.lostTo || '',
    'বিক্রি': c.saleAmount || '',
    'ল্যাটিটিউড': c.lat == null ? '' : c.lat, 'লংগিটিউড': c.lng == null ? '' : c.lng,
    'চা-কফির দাওয়াত': c.teaDate || '', 'পরের যোগাযোগ': c.nextDate || '',
    'শেষ যোগাযোগ': (c.lastContact || c.createdAt || '').slice(0, 10),
    'চা-কফির দাওয়াতের অবস্থা': TEA_LABEL[c.teaStatus || 'none'] || '',
    'কে তুলেছে': c.by || '',
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
  XLSX.writeFile(wb, 'জারা-CRM-' + todayISO() + '.xlsx');
  toast('Excel নামছে');
}

const XL_TYPE = {};
TYPES.forEach(t => XL_TYPE[t] = t);
const XL_NEED = {};
Object.keys(NEED_LABEL).forEach(k => XL_NEED[NEED_LABEL[k]] = k);
const XL_TEA = {};
TEA.forEach(([k, l]) => XL_TEA[l] = k);
const XL_STATUS = { 'পেয়েছি': 'won', 'হাতছাড়া': 'lost', 'চলমান': 'open' };

function cell(r, k){ const v = r[k]; return v == null ? '' : String(v).trim(); }

function rowToCustomer(r, existing){
  const c = existing ? Object.assign({}, existing) : {
    id: cell(r, 'আইডি') || uid(), createdAt: new Date().toISOString(), events: [], status: 'open'
  };
  c.name   = cell(r, 'নাম');
  c.type   = XL_TYPE[cell(r, 'ধরন')] || c.type || TYPES[0];
  c.phone  = cell(r, 'মোবাইল');
  const wa = cell(r, 'WhatsApp');
  c.waSame = !wa;
  c.whatsapp = wa || c.phone;
  c.union   = cell(r, 'ইউনিয়ন');
  c.village = cell(r, 'গ্রাম');
  c.para    = cell(r, 'পাড়া');
  c.landmark = cell(r, 'কিসের পাশে');
  c.address = cell(r, 'ঠিকানা');
  const fl = cell(r, 'তলা'); if (fl) c.floors = fl;
  if (cell(r, 'নির্মাণের অবস্থা')) c.stage = cell(r, 'নির্মাণের অবস্থা');
  if (cell(r, 'ইলেকট্রিক কাজ'))   c.elecStatus = cell(r, 'ইলেকট্রিক কাজ');
  const nd = XL_NEED[cell(r, 'মাল লাগবে')]; if (nd !== undefined) c.needDays = nd;
  c.supplierName = cell(r, 'এখন মাল নেয়');
  c.supplierShop = cell(r, 'সেই দোকান');
  const st = XL_STATUS[cell(r, 'অবস্থা')]; if (st) c.status = st;
  if (cell(r, 'হাতছাড়া হয়েছে যার কাছে')) c.lostTo = cell(r, 'হাতছাড়া হয়েছে যার কাছে');
  if (cell(r, 'বিক্রি')) c.saleAmount = cell(r, 'বিক্রি');
  const la = parseFloat(cell(r, 'ল্যাটিটিউড')), ln = parseFloat(cell(r, 'লংগিটিউড'));
  c.lat = isNaN(la) ? null : la; c.lng = isNaN(ln) ? null : ln;
  if (cell(r, 'চা-কফির দাওয়াত'))    c.teaDate  = cell(r, 'চা-কফির দাওয়াত').slice(0, 10);
  if (cell(r, 'পরের যোগাযোগ')) c.nextDate = cell(r, 'পরের যোগাযোগ').slice(0, 10);
  const ts = XL_TEA[cell(r, 'চা-কফির দাওয়াতের অবস্থা')]; if (ts) c.teaStatus = ts;
  if (cell(r, 'কে তুলেছে')) c.by = cell(r, 'কে তুলেছে');
  c.notes = cell(r, 'নোট');
  c.updatedAt = new Date().toISOString();
  if (!c.events) c.events = [];
  return c;
}

function importXlsx(file){
  if (typeof XLSX === 'undefined'){ toast('Excel সুবিধা লোড হয়নি'); return; }
  const r = new FileReader();
  r.onload = () => {
    let rows;
    try{
      const wb = XLSX.read(new Uint8Array(r.result), { type: 'array' });
      const sheet = wb.Sheets['কাস্টমার'] || wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error('শিট নেই');
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }catch(e){ toast('Excel ফাইলটি পড়া গেল না'); return; }

    const byIdMap = new Map(S.list.map(x => [x.id, x]));
    const byPhone = new Map();
    S.list.forEach(x => { const d = phoneDigits(x.phone); if (d) byPhone.set(d.slice(-10), x); });

    const fresh = [], upd = [], skip = [];
    rows.forEach(row => {
      const name = cell(row, 'নাম');
      if (!name){ skip.push(row); return; }
      const id = cell(row, 'আইডি');
      let cur = id ? byIdMap.get(id) : null;
      if (!cur){
        const d = phoneDigits(cell(row, 'মোবাইল'));
        if (d.length >= 10) cur = byPhone.get(d.slice(-10));
      }
      if (cur) upd.push({ row, cur }); else fresh.push({ row });
    });

    const line = (n, label, note) => n
      ? '<div class="rrow"><span>' + label + (note ? '<br><small class="muted">' + note + '</small>' : '') +
        '</span><span class="rn">' + bn(n) + '</span></div>' : '';

    openSheet('Excel থেকে ফেরানো',
      '<p class="muted" style="margin-top:0">ফাইলে ' + bn(rows.length) + ' টি সারি পাওয়া গেছে।</p>' +
      '<div class="card">' +
        line(fresh.length, 'নতুন — যোগ হবে') +
        line(upd.length, 'আগে থেকেই আছে — তথ্য বদলাবে', 'আইডি বা মোবাইল নম্বর মিলেছে') +
        line(skip.length, 'নাম নেই — বাদ যাবে') +
      '</div>' +
      '<div class="warnbox" style="margin-top:12px"><b>Excel-এ সব থাকে না</b>' +
      'ফলো-আপের ইতিহাস আর বাড়ির ছবি Excel ফাইলে থাকে না। ফেরালে পুরোনো রেকর্ডের ইতিহাস ও ছবি ' +
      'যেমন আছে তেমনই থাকবে, মুছবে না — শুধু উপরের তথ্যগুলো বদলাবে।<br><br>' +
      'পুরো ব্যাকআপ ফেরাতে হলে <b>ফাইল ব্যাকআপ</b> (.json) ব্যবহার করুন, সেখানে সব থাকে।</div>',

      '<div class="btnrow"><button class="btn sec" data-close>থাক</button>' +
      '<button class="btn gold" id="xlGo">ফেরান</button></div>');

    $('#xlGo').addEventListener('click', async () => {
      const btn = $('#xlGo'); btn.disabled = true; btn.textContent = 'চলছে…';
      let done = 0, failed = 0;
      for (const item of fresh.concat(upd)){
        const rec = rowToCustomer(item.row, item.cur);
        const i = S.list.findIndex(x => x.id === rec.id);
        if (i >= 0) S.list[i] = rec;
        if (await saveRec(rec)) done++; else failed++;
      }
      closeSheet(); render();
      toast(bn(done) + ' টি ফেরানো হয়েছে' + (failed ? ', ' + bn(failed) + ' টি পারেনি' : ''));
    });
  };
  r.readAsArrayBuffer(file);
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

  main.querySelectorAll('[data-p]').forEach(el => el.addEventListener('click', () => {
    S.period = el.dataset.p; render();
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

  const ib = $('#ibGo');     if (ib) ib.addEventListener('click', doInstall);
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

/* ══════════ ১৪খ. ফোনে ইনস্টল ══════════ */

let INSTALL_EVT = null;

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  INSTALL_EVT = e;
  const b = $('#installBar');
  if (b) b.hidden = false;
});
window.addEventListener('appinstalled', () => {
  INSTALL_EVT = null;
  const b = $('#installBar');
  if (b) b.hidden = true;
  toast('অ্যাপ ইনস্টল হয়েছে');
});

async function doInstall(){
  if (INSTALL_EVT){
    INSTALL_EVT.prompt();
    const r = await INSTALL_EVT.userChoice.catch(() => null);
    INSTALL_EVT = null;
    const b = $('#installBar');
    if (b) b.hidden = true;
    if (r && r.outcome === 'accepted') toast('ইনস্টল হচ্ছে…');
    return;
  }
  installHelp();
}

function installHelp(){
  if (standalone()){
    openSheet('অ্যাপ ইনস্টল',
      '<div class="card"><div class="empty"><strong>ইনস্টল করা আছে</strong>' +
      'আপনি এখন অ্যাপ থেকেই চালাচ্ছেন।</div></div>',
      '<button class="btn sec block" data-close>ঠিক আছে</button>');
    return;
  }
  const steps = isIOS()
    ? ['নিচের <b>শেয়ার</b> বোতামে চাপুন (উপরের দিকে তীর চিহ্ন)',
       'তালিকা নামিয়ে <b>Add to Home Screen</b> খুঁজুন',
       'ডানদিকে <b>Add</b> চাপুন']
    : ['ব্রাউজারের ডানদিকে উপরে <b>⋮</b> (তিন বিন্দু) চাপুন',
       '<b>Add to Home screen</b> বা <b>অ্যাপ ইনস্টল করুন</b> খুঁজুন',
       '<b>Install</b> বা <b>যোগ করুন</b> চাপুন'];

  openSheet('ফোনে অ্যাপ হিসেবে বসান',
    '<p style="margin-top:0" class="muted">ইনস্টল করলে হোম স্ক্রিনে জারার লোগো বসবে, ' +
    'ব্রাউজারের ঠিকানার ঘর থাকবে না — একদম অ্যাপের মতো খুলবে।</p>' +
    '<div class="card"><div class="tl">' +
    steps.map(t => '<div class="tli"><div class="tt">' + t + '</div></div>').join('') +
    '</div></div>' +
    (isIOS() ? '<div class="hint">আইফোনে অবশ্যই <b>Safari</b> দিয়ে খুলতে হবে, Chrome দিয়ে হবে না।</div>'
             : '<div class="hint">অপশনটা না দেখলে পাতাটা একবার রিফ্রেশ করে কয়েক সেকেন্ড অপেক্ষা করুন, ' +
               'তারপর আবার মেনু খুলুন।</div>'),
    '<button class="btn sec block" data-close>বুঝেছি</button>');
}

function showUpdateBar(){
  if ($('#updBar')) return;
  const d = document.createElement('div');
  d.id = 'updBar';
  d.className = 'updbar';
  d.innerHTML = '<span>নতুন সংস্করণ এসেছে</span>' +
                '<button class="btn gold" id="updGo">এখন নিন</button>';
  document.body.appendChild(d);
  $('#updGo').addEventListener('click', () => location.reload());
}

/* ══════════ ১৫. লগইন ও চালু ══════════ */

function showLogin(msg){
  $('#boot').hidden = true;
  $('#login').hidden = false;
  if (msg) showLoginError(msg);
  setTimeout(() => { const e = $('#liEmail'); if (e) e.focus(); }, 120);
}
function showLoginError(m){
  const b = $('#liErr');
  b.textContent = m; b.hidden = false;
}

async function startApp(){
  $('#boot').hidden = false;
  try{
    await load();
  }catch(e){
    if (Store.mode === 'cloud' && CONFIG.allowLocalFallback){
      $('#boot').hidden = true;
      toast(e.message || 'ডেটা আনা গেল না');
      S.list = S.list || []; S.settings = S.settings || Object.assign({}, DEFAULT_SETTINGS);
    } else {
      $('#boot').hidden = true;
      showLogin(e.message || 'ডেটা আনা গেল না');
      return;
    }
  }
  $('#boot').hidden = true;
  $('#login').hidden = true;
  $('#topbar').hidden = false;
  $('#app').hidden = false;
  $('#tabbar').hidden = false;
  render();
}

/* অন্য ফোনে কিছু বদলালে এখানে ফিরলেই নতুন তথ্য আসবে */
let lastSync = Date.now();
function wireSync(){
  if (Store.mode !== 'cloud') return;
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    if (Date.now() - lastSync < 20000) return;
    lastSync = Date.now();
    try{
      S.list = await Store.all();
      if (!$('#sheetWrap').hidden || !$('#picker').hidden) return;
      render();
    }catch(e){}
  });
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) closeSheet();
});
$('#vpCancel').addEventListener('click', closePicker);
$('#vpQ').addEventListener('input', e => paintPicker(e.target.value));
$('#vpOwn').addEventListener('click', () => {
  const typed = $('#vpQ').value.trim();
  if (!typed){ toast('উপরে নামটা লিখুন, তারপর এই বাটনে চাপুন'); $('#vpQ').focus(); return; }
  VP.onPick(typed); closePicker();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#vpick').hidden) closePicker();
  else if (!$('#picker').hidden) closePinPicker();
  else if (!$('#sheetWrap').hidden) closeSheet();
});

(async function boot(){
  // আগে এটা শেষে ছিল — লগইন পর্দায় আটকে গেলে কখনো চালুই হতো না,
  // ফলে ব্রাউজার ইনস্টলের সুযোগ দিত না।
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').then(reg => {
      // অ্যাপে ফিরলেই নতুন সংস্করণ এসেছে কি না দেখে নেয়
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) reg.update().catch(() => {});
      });
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    }).catch(() => {});

    let swapped = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (swapped) return;
      swapped = true;
      // ফর্ম খোলা থাকলে জোর করে রিলোড করলে লেখা তথ্য হারাবে
      const busy = !$('#sheetWrap').hidden || !$('#picker').hidden || !$('#vpick').hidden;
      if (busy) showUpdateBar();
      else location.reload();
    });
  }

  document.querySelectorAll('.tabbar button').forEach(b =>
    b.addEventListener('click', () => { S.view = b.dataset.view; render(); }));
  $('#btnAdd').addEventListener('click', () => openForm(null));

  const form = $('#loginForm');
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('#liGo');
    $('#liErr').hidden = true;
    btn.disabled = true; btn.textContent = 'দেখা হচ্ছে…';
    try{
      S.me = await Store.signIn($('#liEmail').value, $('#liPass').value);
      $('#login').hidden = true;
      await startApp();
      wireSync();
    }catch(e){
      showLoginError(e.message || 'লগইন হলো না');
    }finally{
      btn.disabled = false; btn.textContent = 'লগইন';
    }
  });

  try{
    await Store.init();
  }catch(e){
    showLogin('ডেটাবেসে পৌঁছানো গেল না — ' + (e.message || ''));
    return;
  }

  try{
    S.me = await Store.me();
  }catch(e){
    showLogin(e.message);
    return;
  }

  if (Store.needsLogin && !S.me){ showLogin(); return; }

  await startApp();
  wireSync();
})();
