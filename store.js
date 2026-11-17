/* জারা মাঠ — storage layer.
   Two backends behind one interface. Today: LocalStore (this device).
   When staff join: set CONFIG.supabase and SupabaseStore takes over with
   no change to app.js. */

const CONFIG = {
  // Filled in when the shared database is switched on.
  supabase: null, // { url: '...', anonKey: '...' }
};

const DB_KEY   = 'jara.maath.v1';
const SET_KEY  = 'jara.maath.settings.v1';

/* ---------- defaults ---------- */
const DEFAULT_SETTINGS = {
  // The shop pin. Editable in Settings by standing at the shop and tapping
  // "এখানেই দোকান". Until then this is an approximate Ullapara bus-stand point.
  shopLat: 24.3203,
  shopLng: 89.6128,
  shopPinned: false,
  perFloorValue: 0,      // owner's own estimate of material value per floor
  myName: '',
};

function uid(){
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- local backend ---------- */
const LocalStore = {
  kind: 'local',
  _read(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  },
  _write(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch(e){ return false; }
  },
  async all(){ return this._read(DB_KEY, []); },
  async saveAll(list){ return this._write(DB_KEY, list); },
  async getSettings(){
    return Object.assign({}, DEFAULT_SETTINGS, this._read(SET_KEY, {}));
  },
  async setSettings(s){ return this._write(SET_KEY, s); },
};

/* ---------- supabase backend (dormant until configured) ---------- */
const SupabaseStore = {
  kind: 'cloud',
  _c: null,
  async _client(){
    if (this._c) return this._c;
    const { createClient } = await import(
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm'
    );
    this._c = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    return this._c;
  },
  async all(){
    const c = await this._client();
    const { data, error } = await c.from('customers').select('*');
    if (error) throw error;
    return (data || []).map(r => r.body ? Object.assign({ id: r.id }, r.body) : r);
  },
  async saveAll(list){
    const c = await this._client();
    const rows = list.map(x => ({ id: x.id, body: x, updated_at: new Date().toISOString() }));
    const { error } = await c.from('customers').upsert(rows);
    if (error) throw error;
    return true;
  },
  async getSettings(){
    const c = await this._client();
    const { data } = await c.from('settings').select('*').eq('id', 'shop').maybeSingle();
    return Object.assign({}, DEFAULT_SETTINGS, (data && data.body) || {});
  },
  async setSettings(s){
    const c = await this._client();
    const { error } = await c.from('settings').upsert({ id: 'shop', body: s });
    if (error) throw error;
    return true;
  },
};

const Store = CONFIG.supabase ? SupabaseStore : LocalStore;
