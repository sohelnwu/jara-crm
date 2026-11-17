/* জারা ইলেকট্রিক CRM — ডেটা রাখার স্তর
   CONFIG.supabase বসানো থাকলে ক্লাউড, নইলে এই ফোনের ভেতরে। */

const CONFIG = {
  supabase: {
    url: 'https://ccqgolmvilcwsgavypya.supabase.co',
    key: 'sb_publishable_oGc7DMpxADw2JVjrsOIQFg_2mTfUghq',
  },
  // ক্লাউডে যেতে না পারলে ফোনের ভেতরের ডেটা দিয়ে চালু থাকবে কি না
  allowLocalFallback: true,
};

const DB_KEY  = 'jara.maath.v1';
const SET_KEY = 'jara.maath.settings.v1';

const DEFAULT_SETTINGS = {
  // দোকানের পিন। সেটিংসে দোকানে দাঁড়িয়ে ঠিক করে নেওয়া যায়।
  shopLat: 24.3203,
  shopLng: 89.6128,
  shopPinned: false,
  perFloorValue: 0,
  myName: '',
};

function uid(){
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const lsGet = (k, d) => { try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } };
const lsSet = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } };

/* ══════════ এই ফোনের ভেতরে ══════════ */
const LocalStore = {
  mode: 'local',
  needsLogin: false,
  async init(){ return true; },
  async me(){ return { id: 'local', name: (await this.getSettings()).myName || 'আপনি', role: 'admin' }; },
  async signIn(){ throw new Error('এই ধরনে লগইন লাগে না'); },
  async signOut(){ return true; },
  async all(){ return lsGet(DB_KEY, []); },
  async put(rec){
    const list = lsGet(DB_KEY, []);
    const i = list.findIndex(x => x.id === rec.id);
    if (i >= 0) list[i] = rec; else list.unshift(rec);
    lsSet(DB_KEY, list);
    return rec;
  },
  async del(id){
    lsSet(DB_KEY, lsGet(DB_KEY, []).filter(x => x.id !== id));
    return true;
  },
  async getSettings(){ return Object.assign({}, DEFAULT_SETTINGS, lsGet(SET_KEY, {})); },
  async setSettings(s){ return lsSet(SET_KEY, s); },
  async putPhoto(){ return null; },     // ছবি IndexedDB-তে, app.js সামলায়
  async photoUrl(){ return null; },
  async staff(){ return []; },
  async createStaff(){ throw new Error('ক্লাউড চালু না থাকলে কর্মী যোগ করা যায় না'); },
  async setStaffActive(){ return false; },
};

/* ══════════ ক্লাউড (Supabase) ══════════ */
const CloudStore = {
  mode: 'cloud',
  needsLogin: true,
  sb: null,
  _me: null,

  async init(){
    const { createClient } = await import(
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm'
    );
    this.sb = createClient(CONFIG.supabase.url, CONFIG.supabase.key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'jara.auth' },
    });
    const { data } = await this.sb.auth.getSession();
    if (data && data.session) await this._loadMe();
    return true;
  },

  async _loadMe(){
    const { data: u } = await this.sb.auth.getUser();
    if (!u || !u.user){ this._me = null; return null; }
    const { data: p, error } = await this.sb
      .from('profiles').select('id,name,role,active').eq('id', u.user.id).maybeSingle();
    if (error) throw new Error('প্রোফাইল পড়া গেল না: ' + error.message);
    if (!p)        throw new Error('আপনার প্রোফাইল তৈরি হয়নি। SQL ফাইলটি চালানো হয়েছে কি?');
    if (!p.active) throw new Error('আপনার অ্যাকাউন্ট বন্ধ করা আছে। মালিককে বলুন।');
    this._me = { id: p.id, name: p.name, role: p.role, email: u.user.email };
    return this._me;
  },

  async me(){ return this._me; },

  async signIn(email, password){
    const { error } = await this.sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error){
      const m = (error.message || '').toLowerCase();
      if (m.includes('invalid login')) throw new Error('ইমেইল বা পাসওয়ার্ড মিলছে না');
      if (m.includes('email not confirmed')) throw new Error('ইমেইল নিশ্চিত করা হয়নি — Supabase-এ Auto Confirm দিয়ে আবার তৈরি করুন');
      throw new Error(error.message);
    }
    return this._loadMe();
  },

  async signOut(){ await this.sb.auth.signOut(); this._me = null; return true; },

  async all(){
    const { data, error } = await this.sb
      .from('customers').select('id,body,created_by,created_at,edit_deadline')
      .order('created_at', { ascending: false });
    if (error) throw new Error(this._say(error));
    return (data || []).map(r => Object.assign({}, r.body, {
      id: r.id,
      _by: r.created_by,
      _editUntil: r.edit_deadline,
      createdAt: r.body && r.body.createdAt ? r.body.createdAt : r.created_at,
    }));
  },

  async put(rec){
    const body = Object.assign({}, rec);
    delete body._by; delete body._editUntil;
    const { data, error } = await this.sb
      .from('customers')
      .upsert({ id: rec.id, body }, { onConflict: 'id' })
      .select('id,created_by,edit_deadline').maybeSingle();
    if (error) throw new Error(this._say(error));
    if (data){ rec._by = data.created_by; rec._editUntil = data.edit_deadline; }
    return rec;
  },

  async del(id){
    const { error } = await this.sb.from('customers').delete().eq('id', id);
    if (error) throw new Error(this._say(error));
    return true;
  },

  async getSettings(){
    const { data, error } = await this.sb
      .from('settings').select('body').eq('id', 'shop').maybeSingle();
    if (error) return Object.assign({}, DEFAULT_SETTINGS);
    return Object.assign({}, DEFAULT_SETTINGS, (data && data.body) || {});
  },

  async setSettings(s){
    const { error } = await this.sb.from('settings').upsert({ id: 'shop', body: s });
    if (error) throw new Error(this._say(error));
    return true;
  },

  /* মালিক অ্যাপের ভেতর থেকেই কর্মীর অ্যাকাউন্ট খুলতে পারবেন।
     আলাদা ক্লায়েন্ট ব্যবহার করা হয় যাতে মালিকের নিজের লগইন কেটে না যায়। */
  async createStaff(name, email, password){
    const { createClient } = await import(
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm'
    );
    const tmp = createClient(CONFIG.supabase.url, CONFIG.supabase.key, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'jara.tmp' },
    });
    const { data, error } = await tmp.auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim(), role: 'mde' } },
    });
    if (error){
      const m = (error.message || '').toLowerCase();
      if (m.includes('already registered') || m.includes('already been')) throw new Error('এই ইমেইলে অ্যাকাউন্ট আগেই আছে');
      if (m.includes('password')) throw new Error('পাসওয়ার্ড অন্তত ৬ অক্ষরের দিন');
      if (m.includes('signups not allowed') || m.includes('disabled'))
        throw new Error('Supabase-এ নতুন অ্যাকাউন্ট খোলা বন্ধ আছে — Authentication → Sign In / Providers → Allow new users to sign up চালু করুন');
      throw new Error(error.message);
    }
    const needsConfirm = data && data.user && !data.session && !data.user.confirmed_at;
    return { needsConfirm: !!needsConfirm };
  },

  async setStaffActive(id, active){
    const { error } = await this.sb.from('profiles').update({ active }).eq('id', id);
    if (error) throw new Error(this._say(error));
    return true;
  },

  async staff(){
    const { data, error } = await this.sb.from('profiles').select('id,name,role,active').order('name');
    if (error) return [];
    return data || [];
  },

  /* বাড়ির ছবি — ক্লাউডে */
  async putPhoto(key, blob){
    const { error } = await this.sb.storage.from('photos')
      .upload(key + '.jpg', blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error('ছবি তোলা গেল না: ' + error.message);
    return key;
  },
  async photoUrl(key){
    const { data, error } = await this.sb.storage.from('photos')
      .createSignedUrl(key + '.jpg', 3600);
    if (error || !data) return null;
    return data.signedUrl;
  },

  _say(error){
    const m = (error && error.message) || 'অজানা সমস্যা';
    if (/row-level security|violates row/i.test(m))
      return 'এই কাজের অনুমতি নেই — হয় অন্য কারও রেকর্ড, নয়তো ২৪ ঘণ্টা পেরিয়ে গেছে';
    if (/২৪ ঘণ্টা|24 hours/i.test(m)) return m;
    if (/অন্য কারও/.test(m)) return m;
    if (/relation .* does not exist|schema cache/i.test(m))
      return 'ডেটাবেসের টেবিল পাওয়া যায়নি — supabase.sql ফাইলটি চালানো হয়েছে কি?';
    if (/JWT|apikey|Invalid API key/i.test(m))
      return 'ডেটাবেসের চাবি মিলছে না — Project URL ও publishable key ঠিক আছে কি?';
    if (/Failed to fetch|NetworkError|fetch/i.test(m))
      return 'ইন্টারনেট পাওয়া যাচ্ছে না';
    return m;
  },
};

const Store = (CONFIG.supabase && CONFIG.supabase.url) ? CloudStore : LocalStore;
