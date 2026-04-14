import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CalendarDays, MapPin, Search, Filter, X, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const EVENT_TYPES = ['Conference','Workshop','Trade Show','Expo','VIP Event','Fan Convention','Invite-Only','Multi-Day','Custom'];
const PAYMENT_MODES = ['free','external_link','embedded','ghl_form','manual'];
const TYPE_COLORS: Record<string, string> = {
  conference:'bg-indigo-50 text-indigo-700', workshop:'bg-amber-50 text-amber-700',
  'trade show':'bg-emerald-50 text-emerald-700', expo:'bg-violet-50 text-violet-700',
  'vip event':'bg-pink-50 text-pink-700', 'fan convention':'bg-orange-50 text-orange-700',
  'invite-only':'bg-teal-50 text-teal-700',
};

export function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('events').select('*, event_people(id)').order('start_at', { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  }

  const filtered = events.filter(e => {
    const matchSearch = (e.name + e.venue_name + e.city).toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || e.event_type?.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Events</h1><p className="text-sm text-gray-500 mt-0.5">{events.length} total</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={15} /> New Event</button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All types</option>
          {EVENT_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="card p-5 animate-pulse h-36" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16">
          <CalendarDays size={40} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-500 mb-4">{search ? 'No events match your search' : 'No events yet'}</p>
          {!search && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={15} /> Create your first event</button>}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const now = new Date(), start = new Date(event.start_at), end = new Date(event.end_at);
  const status = now >= start && now <= end ? { l:'Live', c:'badge-green' } : now < start ? { l:'Upcoming', c:'badge-blue' } : { l:'Past', c:'badge-gray' };
  const typeColor = TYPE_COLORS[event.event_type?.toLowerCase()] ?? 'bg-gray-50 text-gray-600';
  const attendeeCount = event.event_people?.length ?? 0;
  return (
    <Link to={`/events/${event.id}`} className="card-hover p-5 block">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${typeColor}`}>{event.event_type ?? 'Event'}</span>
        <span className={status.c}>{status.l}</span>
      </div>
      <h3 className="font-medium text-gray-900 text-sm mb-2 leading-snug">{event.name}</h3>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <CalendarDays size={11} />{format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
        </div>
        {event.venue_name && <div className="flex items-center gap-1.5 text-xs text-gray-400"><MapPin size={11} />{event.venue_name}</div>}
        <div className="flex items-center gap-1.5 text-xs text-gray-400"><Users size={11} />{attendeeCount} registered</div>
      </div>
    </Link>
  );
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name:'', event_type:'Conference', description:'', venue_name:'', address_1:'',
    city:'', state:'', country:'US', timezone:'America/Los_Angeles',
    start_at:'', end_at:'', registration_open_at:'', payment_mode:'free',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.start_at || !form.end_at) { setError('Name, start and end date are required.'); return; }
    setSaving(true); setError('');
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const { error: err } = await supabase.from('events').insert({
      ...form, slug, planner_enabled:true, sessions_enabled:true,
      expo_enabled:false, mycard_enabled:false, wallet_enabled:true, qr_enabled:true, nfc_enabled:false,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Create Event</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div><label className="label">Event Name *</label><input className="input" placeholder="Magic Expo 2026" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Event Type</label>
              <select className="input" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Payment Mode</label>
              <select className="input" value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start *</label><input className="input" type="datetime-local" value={form.start_at} onChange={e => set('start_at', e.target.value)} /></div>
            <div><label className="label">End *</label><input className="input" type="datetime-local" value={form.end_at} onChange={e => set('end_at', e.target.value)} /></div>
          </div>
          <div><label className="label">Venue Name</label><input className="input" placeholder="Planet Hollywood" value={form.venue_name} onChange={e => set('venue_name', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">City</label><input className="input" placeholder="Las Vegas" value={form.city} onChange={e => set('city', e.target.value)} /></div>
            <div><label className="label">State</label><input className="input" placeholder="NV" value={form.state} onChange={e => set('state', e.target.value)} /></div>
            <div><label className="label">Country</label><input className="input" placeholder="US" value={form.country} onChange={e => set('country', e.target.value)} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={3} placeholder="What is this event about?" value={form.description} onChange={e => set('description', e.target.value)} /></div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
