import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Users, IdCard, ScanLine, Settings, Layers, CalendarClock, Plus, X, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

type Tab = 'overview'|'people'|'credentials'|'sessions'|'planner'|'settings';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [creds, setCreds] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [plannerItems, setPlannerItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    const [evRes, epRes, credRes, sessRes, planRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id!).single(),
      supabase.from('event_people').select('*, person:people(*)').eq('event_id', id!),
      supabase.from('credentials').select('*').eq('event_id', id!),
      supabase.from('sessions').select('*').eq('event_id', id!).order('start_at'),
      supabase.from('planner_items').select('*').eq('event_id', id!).order('starts_at'),
    ]);
    setEvent(evRes.data);
    setAttendees((epRes.data as any) ?? []);
    setCreds(credRes.data ?? []);
    setSessions(sessRes.data ?? []);
    setPlannerItems(planRes.data ?? []);
    setLoading(false);
  }

  async function issueCredential(epId: string) {
    const { error } = await supabase.from('credentials').insert({
      event_id: id, event_person_id: epId, issuer: 'event_table',
      role_label: 'General Admission', badge_type: 'standard', status: 'active', version: 1,
      valid_from: event?.start_at, valid_until: event?.end_at,
    });
    if (!error) {
      await supabase.from('event_people').update({ credential_status: 'issued' }).eq('id', epId);
      load();
    }
  }

  async function toggleFlag(flag: string, val: boolean) {
    await supabase.from('events').update({ [flag]: val }).eq('id', id!);
    setEvent((e: any) => ({ ...e, [flag]: val }));
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-400 border-t-transparent" /></div>;
  if (!event) return <div className="p-8 text-sm text-red-500">Event not found.</div>;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id:'overview', label:'Overview', icon:<CalendarDays size={14}/> },
    { id:'people', label:'People', icon:<Users size={14}/>, count:attendees.length },
    { id:'credentials', label:'Credentials', icon:<IdCard size={14}/>, count:creds.length },
    { id:'sessions', label:'Sessions', icon:<Layers size={14}/>, count:sessions.length },
    { id:'planner', label:'Planner', icon:<CalendarClock size={14}/>, count:plannerItems.length },
    { id:'settings', label:'Settings', icon:<Settings size={14}/> },
  ];

  const now = new Date(), start = new Date(event.start_at), end = new Date(event.end_at);
  const status = now>=start&&now<=end?{l:'Live',c:'badge-green'}:now<start?{l:'Upcoming',c:'badge-blue'}:{l:'Past',c:'badge-gray'};

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft size={13} /> Back to Events
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{event.event_type}</span>
            <span className={status.c}>{status.l}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><CalendarDays size={13}/>{format(start,'MMM d')} – {format(end,'MMM d, yyyy')}</span>
            {event.venue_name && <span className="flex items-center gap-1"><MapPin size={13}/>{event.venue_name}{event.city?`, ${event.city}`:''}</span>}
          </div>
        </div>
        <Link to={`/checkin?event=${event.id}`} className="btn-primary"><ScanLine size={14}/> Check-In Station</Link>
      </div>

      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`tab-btn ${tab===t.id?'tab-active':'tab-inactive'} whitespace-nowrap`}>
            {t.icon} {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              {l:'Registered',v:attendees.length},
              {l:'Checked In',v:attendees.filter(a=>a.checkin_status==='checked_in').length},
              {l:'Credentials',v:creds.length},
              {l:'Sessions',v:sessions.length},
            ].map(({l,v})=>(
              <div key={l} className="card p-4"><p className="text-xs text-gray-500 mb-1">{l}</p><p className="text-2xl font-semibold text-gray-900">{v}</p></div>
            ))}
          </div>
          {event.description && <div className="card p-5"><h3 className="text-xs font-medium text-gray-500 mb-2">Description</h3><p className="text-sm text-gray-700">{event.description}</p></div>}
          <div className="card p-5">
            <h3 className="text-xs font-medium text-gray-500 mb-3">Features</h3>
            <div className="flex flex-wrap gap-2">
              {[['planner_enabled','Planner'],['sessions_enabled','Sessions'],['expo_enabled','Expo'],['mycard_enabled','MyCard'],['wallet_enabled','Wallet'],['qr_enabled','QR'],['nfc_enabled','NFC']].map(([k,l])=>(
                <span key={k} className={event[k]?'badge-green':'badge-gray'}>{l}</span>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-xs font-medium text-gray-500 mb-1">Payment Mode</h3>
            <p className="text-sm text-gray-700 font-medium">{event.payment_mode}</p>
            <p className="text-xs text-gray-400 mt-1">Event Table does not handle organizer revenue — use your own payment system.</p>
          </div>
        </div>
      )}

      {tab === 'people' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-sm text-gray-500">{attendees.length} attendees</p>
            <button onClick={() => setShowAddPerson(true)} className="btn-primary text-xs"><Plus size={13}/> Add Person</button>
          </div>
          <div className="card divide-y divide-gray-50">
            {attendees.length === 0 ? (
              <div className="p-10 text-center"><Users size={32} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No attendees yet.</p></div>
            ) : attendees.map(ep => (
              <div key={ep.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 shrink-0">
                  {ep.person?.first_name?.[0]}{ep.person?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{ep.person?.first_name} {ep.person?.last_name}</p>
                  <p className="text-xs text-gray-400">{ep.person?.email} · {ep.attendee_type}</p>
                </div>
                <span className={ep.registration_status==='paid_confirmed'?'badge-green':ep.registration_status==='pending'?'badge-yellow':'badge-gray'}>{ep.registration_status}</span>
                <span className={ep.checkin_status==='checked_in'?'badge-blue':'badge-gray'}>{ep.checkin_status}</span>
                {ep.credential_status !== 'issued' && (
                  <button onClick={() => issueCredential(ep.id)} className="btn-ghost text-xs text-indigo-600">Issue Credential</button>
                )}
              </div>
            ))}
          </div>
          {showAddPerson && <AddPersonToEventModal eventId={id!} onClose={() => setShowAddPerson(false)} onAdded={load} />}
        </div>
      )}

      {tab === 'credentials' && (
        <div className="card divide-y divide-gray-50">
          {creds.length === 0 ? (
            <div className="p-10 text-center"><IdCard size={32} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No credentials issued. Go to People tab to issue credentials.</p></div>
          ) : creds.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0"><IdCard size={16} className="text-violet-600"/></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{c.role_label ?? 'General Admission'}</p>
                <p className="text-xs text-gray-500">v{c.version} · {c.badge_type} · {c.valid_from ? format(new Date(c.valid_from),'MMM d') : '?'} – {c.valid_until ? format(new Date(c.valid_until),'MMM d yyyy') : '?'}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                <Shield size={11}/> Event Table Authority
              </div>
              <span className={c.status==='active'?'badge-green':c.status==='revoked'?'badge-red':'badge-gray'}>{c.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'sessions' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddSession(true)} className="btn-primary text-xs"><Plus size={13}/> Add Session</button>
          </div>
          <div className="card divide-y divide-gray-50">
            {sessions.length === 0 ? (
              <div className="p-10 text-center"><Layers size={32} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No sessions yet.</p></div>
            ) : sessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="text-right w-16 shrink-0">
                  <p className="text-xs font-medium text-gray-900">{format(new Date(s.start_at),'h:mm a')}</p>
                  <p className="text-xs text-gray-400">{format(new Date(s.end_at),'h:mm a')}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  {s.description && <p className="text-xs text-gray-400 line-clamp-1">{s.description}</p>}
                </div>
                {s.capacity && <span className="text-xs text-gray-400">Cap: {s.capacity}</span>}
                <span className={s.status==='open'?'badge-green':s.status==='full'?'badge-red':'badge-gray'}>{s.status}</span>
              </div>
            ))}
          </div>
          {showAddSession && <AddSessionModal eventId={id!} onClose={() => setShowAddSession(false)} onAdded={load} />}
        </div>
      )}

      {tab === 'planner' && (
        <div className="space-y-3">
          {plannerItems.length === 0 ? (
            <div className="card p-10 text-center"><CalendarClock size={32} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No planner items. Add items from the Planner page.</p></div>
          ) : plannerItems.map(item => (
            <div key={item.id} className="card flex items-start gap-4 p-4">
              <div className="text-right w-16 shrink-0">
                <p className="text-xs font-medium text-gray-900">{format(new Date(item.starts_at),'h:mm a')}</p>
                <p className="text-xs text-gray-400">{format(new Date(item.ends_at),'h:mm a')}</p>
              </div>
              <div className="w-px bg-gray-100 self-stretch"/>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.planner_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Feature Flags</h3>
            <div className="space-y-3">
              {[
                ['planner_enabled','Planner','Master schedule and run-of-show tools'],
                ['sessions_enabled','Sessions','Session scheduling and access control'],
                ['expo_enabled','Expo','Exhibitor and sponsor management'],
                ['mycard_enabled','MyCard','MyCard credential compatibility'],
                ['wallet_enabled','Digital Wallet','Apple Wallet / Google Wallet passes'],
                ['qr_enabled','QR Codes','QR code check-in and verification'],
                ['nfc_enabled','NFC','NFC card tap entry'],
              ].map(([k,l,desc])=>(
                <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm text-gray-800">{l}</p><p className="text-xs text-gray-400">{desc}</p></div>
                  <button onClick={() => toggleFlag(k, !event[k])} className="text-gray-400 hover:text-indigo-600 transition-colors">
                    {event[k] ? <ToggleRight size={24} className="text-indigo-600"/> : <ToggleLeft size={24}/>}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5 grid grid-cols-2 gap-3 text-sm">
            {[['Event ID',event.id],['Slug',event.slug],['Timezone',event.timezone],['Created',format(new Date(event.created_at),'PPP')]].map(([k,v])=>(
              <div key={k}><p className="text-xs text-gray-400">{k}</p><p className="font-mono text-xs text-gray-700 mt-0.5 break-all">{v}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddPersonToEventModal({ eventId, onClose, onAdded }: { eventId: string; onClose: () => void; onAdded: () => void }) {
  const [email, setEmail] = useState('');
  const [type, setType] = useState('attendee');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    let personId: string;
    const { data: existing } = await supabase.from('people').select('id').eq('email', email.trim()).single();
    if (existing) { personId = existing.id; }
    else {
      const parts = email.split('@')[0].split('.');
      const { data: newP, error: pErr } = await supabase.from('people').insert({ first_name: parts[0] ?? 'Unknown', last_name: parts[1] ?? '', email: email.trim() }).select('id').single();
      if (pErr || !newP) { setError('Could not create person: ' + pErr?.message); setSaving(false); return; }
      personId = newP.id;
    }
    const { error: epErr } = await supabase.from('event_people').insert({ event_id: eventId, person_id: personId, attendee_type: type, registration_status: 'approved', checkin_status: 'not_arrived', credential_status: 'not_issued', payment_status: 'complimentary' });
    setSaving(false);
    if (epErr) { setError(epErr.message); return; }
    onAdded(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Person to Event</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div><label className="label">Email Address *</label><input className="input" type="email" placeholder="attendee@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="label">Role</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              {['attendee','vip','speaker','exhibitor','sponsor','staff','volunteer'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Adding...' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSessionModal({ eventId, onClose, onAdded }: { eventId: string; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ title:'', description:'', start_at:'', end_at:'', capacity:'', status:'open', upgrade_enabled:false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_at || !form.end_at) return;
    setSaving(true);
    await supabase.from('sessions').insert({ event_id: eventId, title: form.title, description: form.description, start_at: form.start_at, end_at: form.end_at, capacity: form.capacity ? parseInt(form.capacity) : null, status: form.status, upgrade_enabled: form.upgrade_enabled });
    setSaving(false); onAdded(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Session</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div><label className="label">Title *</label><input className="input" placeholder="Keynote: The Future of Magic" value={form.title} onChange={e => set('title', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start *</label><input className="input" type="datetime-local" value={form.start_at} onChange={e => set('start_at', e.target.value)} /></div>
            <div><label className="label">End *</label><input className="input" type="datetime-local" value={form.end_at} onChange={e => set('end_at', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Capacity</label><input className="input" type="number" placeholder="200" value={form.capacity} onChange={e => set('capacity', e.target.value)} /></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['open','locked','upgrade_available','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.upgrade_enabled} onChange={e => set('upgrade_enabled', e.target.checked)} className="rounded" />
            Upgrade available (paid session access)
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Add Session'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
