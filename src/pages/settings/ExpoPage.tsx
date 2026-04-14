import React, { useEffect, useState } from 'react';
import { Building2, Plus, X, MapPin, Users, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function ExpoPage() {
  const [exhibitors, setExhibitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    // Expo uses event_people with attendee_type = 'exhibitor'
    const { data } = await supabase
      .from('event_people')
      .select('*, person:people(*), event:events(name)')
      .eq('attendee_type', 'exhibitor')
      .order('created_at', { ascending: false });
    setExhibitors((data as any) ?? []);
    setLoading(false);
  }

  const filtered = exhibitors.filter(ex =>
    `${ex.person?.first_name} ${ex.person?.last_name} ${ex.person?.company} ${ex.person?.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Expo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Exhibitor & sponsor management</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15}/> Add Exhibitor</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {l:'Total Exhibitors',v:exhibitors.length},
          {l:'Checked In',v:exhibitors.filter(e=>e.checkin_status==='checked_in').length},
          {l:'Credentialed',v:exhibitors.filter(e=>e.credential_status==='issued').length},
        ].map(({l,v})=>(
          <div key={l} className="card p-4 text-center"><div className="text-2xl font-semibold text-gray-900">{v}</div><div className="text-xs text-gray-500 mt-0.5">{l}</div></div>
        ))}
      </div>

      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input className="input pl-9" placeholder="Search exhibitors..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {loading ? (
        <div className="card p-10 text-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-400 border-t-transparent mx-auto"/></div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <Building2 size={38} className="text-gray-200 mx-auto mb-3"/>
          <p className="text-sm text-gray-400 mb-3">No exhibitors yet.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15}/> Add First Exhibitor</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(ex => (
            <div key={ex.id} className="card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-teal-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{ex.person?.company || `${ex.person?.first_name} ${ex.person?.last_name}`}</p>
                  <p className="text-xs text-gray-500">{ex.person?.first_name} {ex.person?.last_name} · {ex.event?.name}</p>
                </div>
                <div className="flex gap-1.5">
                  <span className={ex.checkin_status==='checked_in'?'badge-green':'badge-gray'}>{ex.checkin_status==='checked_in'?'In':'Not in'}</span>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                {ex.person?.email && <div className="flex items-center gap-1.5"><Mail size={11}/>{ex.person.email}</div>}
                {ex.person?.city && <div className="flex items-center gap-1.5"><MapPin size={11}/>{ex.person.city}{ex.person.state?`, ${ex.person.state}`:''}</div>}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <span className={ex.credential_status==='issued'?'badge-green':'badge-yellow'}>{ex.credential_status==='issued'?'Credentialed':'No credential'}</span>
                <span className={ex.registration_status==='approved'?'badge-blue':'badge-gray'}>{ex.registration_status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddExhibitorModal onClose={() => setShowAdd(false)} onAdded={load}/>}
    </div>
  );
}

function AddExhibitorModal({ onClose, onAdded }: {onClose:()=>void;onAdded:()=>void}) {
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', company:'', title:'', event_id:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.from('events').select('id,name').order('start_at',{ascending:false}).then(({data})=>setEvents(data??[]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.email || !form.event_id) { setError('First name, email, and event are required.'); return; }
    setSaving(true);
    let personId: string;
    const { data: existing } = await supabase.from('people').select('id').eq('email', form.email.trim()).maybeSingle();
    if (existing) { personId = existing.id; }
    else {
      const { data: newP, error: pErr } = await supabase.from('people').insert({ first_name:form.first_name, last_name:form.last_name, email:form.email.trim(), company:form.company, title:form.title }).select('id').single();
      if (pErr || !newP) { setError('Could not create person: ' + pErr?.message); setSaving(false); return; }
      personId = newP.id;
    }
    const { error: epErr } = await supabase.from('event_people').insert({ event_id:form.event_id, person_id:personId, attendee_type:'exhibitor', registration_status:'approved', checkin_status:'not_arrived', credential_status:'not_issued', payment_status:'complimentary' });
    setSaving(false);
    if (epErr) { setError(epErr.message); return; }
    onAdded(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Exhibitor</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div><label className="label">Event *</label>
            <select className="input" value={form.event_id} onChange={e => set('event_id', e.target.value)}>
              <option value="">Select event...</option>
              {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input className="input" value={form.first_name} onChange={e=>set('first_name',e.target.value)}/></div>
            <div><label className="label">Last Name</label><input className="input" value={form.last_name} onChange={e=>set('last_name',e.target.value)}/></div>
          </div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e=>set('company',e.target.value)}/></div>
            <div><label className="label">Title</label><input className="input" value={form.title} onChange={e=>set('title',e.target.value)}/></div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving?'Adding...':'Add Exhibitor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
