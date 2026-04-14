import React, { useEffect, useState, useRef } from 'react';
import { IdCard, Search, Shield, XCircle, RefreshCw, Plus, X, QrCode } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import QRCode from 'qrcode';

const STATUS_COLORS: Record<string,string> = {
  active:'badge-green', pending:'badge-yellow', revoked:'badge-red',
  expired:'badge-gray', draft:'badge-gray', replaced:'badge-purple', suspended:'badge-yellow',
};

const ROLES = ['General Admission','VIP','Speaker','Exhibitor','Sponsor','Staff','Volunteer','Backstage','Press'];

export function CredentialsPage() {
  const [creds, setCreds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showIssue, setShowIssue] = useState(false);
  const [qrTarget, setQrTarget] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('credentials').select('*, event:events(name), event_person:event_people(*, person:people(first_name,last_name,email))').order('created_at', { ascending: false });
    setCreds(data ?? []);
    setLoading(false);
  }

  async function revoke(id: string) {
    if (!window.confirm('Revoke this credential? This cannot be undone.')) return;
    await supabase.from('credentials').update({ status: 'revoked' }).eq('id', id);
    setCreds(cs => cs.map(c => c.id===id ? {...c, status:'revoked'} : c));
  }

  async function replace(c: any) {
    await supabase.from('credentials').update({ status: 'replaced' }).eq('id', c.id);
    const { error } = await supabase.from('credentials').insert({
      event_id: c.event_id, event_person_id: c.event_person_id,
      issuer: 'event_table', role_label: c.role_label, badge_type: c.badge_type,
      status: 'active', valid_from: c.valid_from, valid_until: c.valid_until,
      version: c.version + 1,
    });
    if (!error) load();
  }

  const filtered = creds.filter(c => {
    const person = c.event_person?.person;
    const matchSearch = (c.role_label + (person?.first_name??'') + (person?.last_name??'') + (person?.email??'')).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = creds.filter(c=>c.status==='active').length;
  const revokedCount = creds.filter(c=>c.status==='revoked').length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Credentials</h1>
          <div className="flex items-center gap-2 mt-1">
            <Shield size={12} className="text-indigo-500"/>
            <span className="text-xs text-indigo-600 font-medium">Event Table is the sole permission authority</span>
          </div>
        </div>
        <button onClick={() => setShowIssue(true)} className="btn-primary"><Plus size={15}/> Issue Credential</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{l:'Total',v:creds.length},{l:'Active',v:activeCount},{l:'Revoked',v:revokedCount}].map(({l,v})=>(
          <div key={l} className="card p-4 text-center"><div className="text-2xl font-semibold text-gray-900">{v}</div><div className="text-xs text-gray-500 mt-0.5">{l}</div></div>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search by name, email, or role..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="input w-40" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {['active','pending','revoked','expired','replaced'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card divide-y divide-gray-50">
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
          : filtered.length === 0 ? (
            <div className="p-12 text-center"><IdCard size={36} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No credentials found.</p></div>
          ) : filtered.map(c => {
            const person = c.event_person?.person;
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0"><IdCard size={16} className="text-violet-600"/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{c.role_label ?? 'General Admission'}</p>
                    <span className="text-xs text-gray-400">v{c.version}</span>
                  </div>
                  <p className="text-xs text-gray-500">{person ? `${person.first_name} ${person.last_name} · ${person.email}` : 'Unknown attendee'} · {c.event?.name}</p>
                </div>
                <div className="text-xs text-gray-400 hidden lg:block">
                  {c.valid_from ? format(new Date(c.valid_from),'MMM d') : '?'} – {c.valid_until ? format(new Date(c.valid_until),'MMM d yy') : '?'}
                </div>
                <span className={STATUS_COLORS[c.status]??'badge-gray'}>{c.status}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQrTarget(c)} className="btn-ghost p-1.5" title="View QR"><QrCode size={14}/></button>
                  {c.status==='active' && <>
                    <button onClick={() => replace(c)} className="btn-ghost p-1.5 text-blue-500" title="Replace (increment version)"><RefreshCw size={14}/></button>
                    <button onClick={() => revoke(c.id)} className="btn-ghost p-1.5 text-red-400" title="Revoke"><XCircle size={14}/></button>
                  </>}
                </div>
              </div>
            );
          })}
      </div>

      {showIssue && <IssueCredentialModal onClose={() => setShowIssue(false)} onIssued={load}/>}
      {qrTarget && <QRModal credential={qrTarget} onClose={() => setQrTarget(null)}/>}
    </div>
  );
}

function IssueCredentialModal({ onClose, onIssued }: { onClose: ()=>void; onIssued: ()=>void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [eventPeople, setEventPeople] = useState<any[]>([]);
  const [form, setForm] = useState({ event_id:'', event_person_id:'', role_label:'General Admission', badge_type:'standard', valid_from:'', valid_until:'' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.from('events').select('id,name').order('start_at', { ascending: false }).then(({data})=>setEvents(data??[]));
  }, []);

  useEffect(() => {
    if (!form.event_id) return;
    supabase.from('event_people').select('id, attendee_type, person:people(first_name,last_name,email)').eq('event_id', form.event_id).then(({data})=>setEventPeople((data as any)??[]));
  }, [form.event_id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.event_id || !form.event_person_id) return;
    setSaving(true);
    await supabase.from('credentials').insert({ ...form, issuer:'event_table', status:'active', version:1 });
    await supabase.from('event_people').update({ credential_status:'issued' }).eq('id', form.event_person_id);
    setSaving(false); onIssued(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Issue Credential</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div><label className="label">Event</label>
            <select className="input" value={form.event_id} onChange={e => set('event_id', e.target.value)}>
              <option value="">Select event...</option>
              {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div><label className="label">Attendee</label>
            <select className="input" value={form.event_person_id} onChange={e => set('event_person_id', e.target.value)} disabled={!form.event_id}>
              <option value="">Select attendee...</option>
              {eventPeople.map(ep=><option key={ep.id} value={ep.id}>{(ep.person as any)?.first_name} {(ep.person as any)?.last_name} ({ep.attendee_type})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Role / Access Level</label>
              <select className="input" value={form.role_label} onChange={e => set('role_label', e.target.value)}>
                {ROLES.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">Badge Type</label>
              <select className="input" value={form.badge_type} onChange={e => set('badge_type', e.target.value)}>
                {['standard','vip','staff','exhibitor','sponsor','collector','metal'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Valid From</label><input className="input" type="datetime-local" value={form.valid_from} onChange={e => set('valid_from', e.target.value)}/></div>
            <div><label className="label">Valid Until</label><input className="input" type="datetime-local" value={form.valid_until} onChange={e => set('valid_until', e.target.value)}/></div>
          </div>
          <div className="bg-indigo-50 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-indigo-700">
            <Shield size={12}/> Event Table will be the issuing authority. MyCard may display but cannot modify.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Issuing...' : 'Issue Credential'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QRModal({ credential, onClose }: { credential: any; onClose: ()=>void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `eventtable://verify/${credential.id}/v${credential.version}`, { width: 220, margin: 2, color: { dark: '#1e1b4b', light: '#f5f3ff' } });
    }
  }, [credential]);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-72 p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-1">{credential.role_label}</h3>
        <p className="text-xs text-gray-400 mb-4">v{credential.version} · {credential.badge_type} · {credential.status}</p>
        <div className="flex justify-center mb-4 bg-indigo-50 rounded-xl p-4">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-xs text-gray-400 mb-4 font-mono break-all">{credential.id}</p>
        <button onClick={onClose} className="btn-secondary w-full">Close</button>
      </div>
    </div>
  );
}
