import React, { useEffect, useState } from 'react';
import { Layers, Plus, X, Lock, Unlock, Users, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, differenceInMinutes } from 'date-fns';

const STATUS_STYLES: Record<string,string> = {
  open:'badge-green', full:'badge-red', locked:'badge-gray',
  upgrade_available:'badge-yellow', cancelled:'badge-red', waitlist:'badge-yellow', closed:'badge-gray',
};

export function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('events').select('id,name').order('start_at',{ascending:false}).then(({data})=>setEvents(data??[]));
  }, []);

  useEffect(() => { load(); }, [selectedEvent]);

  async function load() {
    setLoading(true);
    let q = supabase.from('sessions').select('*, event:events(name), _count:session_entitlements(count)').order('start_at');
    if (selectedEvent) q = q.eq('event_id', selectedEvent);
    const { data } = await q;
    setSessions(data ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('sessions').update({ status }).eq('id', id);
    setSessions(ss => ss.map(s => s.id===id ? {...s, status} : s));
  }

  const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sessions.length} sessions</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-52 text-sm" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="">All events</option>
            {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15}/> New Session</button>
        </div>
      </div>

      <div className="relative mb-5">
        <input className="input pl-9" placeholder="Search sessions..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>

      {loading ? (
        <div className="card p-10 text-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-400 border-t-transparent mx-auto"/></div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <Layers size={38} className="text-gray-200 mx-auto mb-3"/>
          <p className="text-sm text-gray-400 mb-3">No sessions yet.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15}/> Create First Session</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const dur = differenceInMinutes(new Date(s.end_at), new Date(s.start_at));
            return (
              <div key={s.id} className="card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="text-right w-20 shrink-0 pt-0.5">
                    <p className="text-xs font-semibold text-gray-900">{format(new Date(s.start_at),'h:mm a')}</p>
                    <p className="text-xs text-gray-400">{format(new Date(s.end_at),'h:mm a')}</p>
                    <p className="text-xs text-gray-300 flex items-center justify-end gap-0.5 mt-1"><Clock size={9}/>{dur}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{s.title}</h3>
                      {s.upgrade_enabled ? <Unlock size={13} className="text-amber-500" /> : <Lock size={13} className="text-gray-200"/>}
                    </div>
                    {s.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{s.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {s.capacity && <span className="flex items-center gap-1"><Users size={11}/>Cap: {s.capacity}</span>}
                      {s.event?.name && <span className="text-gray-300">{s.event.name}</span>}
                      {s.upgrade_external_url && (
                        <a href={s.upgrade_external_url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-indigo-500 hover:underline"><ExternalLink size={10}/> Upgrade link</a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      {['open','full','locked','upgrade_available','waitlist','cancelled','closed'].map(st=><option key={st} value={st}>{st}</option>)}
                    </select>
                    <span className={STATUS_STYLES[s.status]??'badge-gray'}>{s.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddSessionModal events={events} defaultEventId={selectedEvent} onClose={() => setShowAdd(false)} onAdded={load}/>}
    </div>
  );
}

function AddSessionModal({ events, defaultEventId, onClose, onAdded }: any) {
  const [form, setForm] = useState({ event_id:defaultEventId, title:'', description:'', start_at:'', end_at:'', capacity:'', status:'open', upgrade_enabled:false, upgrade_external_url:'' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_at || !form.end_at) return;
    setSaving(true);
    await supabase.from('sessions').insert({ ...form, capacity: form.capacity ? parseInt(form.capacity) : null });
    setSaving(false); onAdded(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Session</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div><label className="label">Event</label>
            <select className="input" value={form.event_id} onChange={e => set('event_id', e.target.value)}>
              <option value="">No event</option>
              {events.map((ev: any)=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div><label className="label">Session Title *</label><input className="input" placeholder="Keynote: The Future of Magic" value={form.title} onChange={e => set('title', e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start *</label><input className="input" type="datetime-local" value={form.start_at} onChange={e => set('start_at', e.target.value)}/></div>
            <div><label className="label">End *</label><input className="input" type="datetime-local" value={form.end_at} onChange={e => set('end_at', e.target.value)}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Capacity</label><input className="input" type="number" placeholder="200" value={form.capacity} onChange={e => set('capacity', e.target.value)}/></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['open','locked','upgrade_available'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)}/></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.upgrade_enabled} onChange={e => set('upgrade_enabled', e.target.checked)} className="rounded"/>
            <span className="text-sm text-gray-700">Session requires upgrade / paid access</span>
          </label>
          {form.upgrade_enabled && (
            <div><label className="label">External Upgrade URL (organizer payment link)</label><input className="input" placeholder="https://checkout.stripe.com/..." value={form.upgrade_external_url} onChange={e => set('upgrade_external_url', e.target.value)}/></div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving?'Saving...':'Create Session'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
