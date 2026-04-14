import React, { useEffect, useState } from 'react';
import { Plus, Users, Search, Mail, Building2, X, Download, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function PeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('people').select('*').order('last_name');
    setPeople(data ?? []);
    setLoading(false);
  }

  const filtered = people.filter(p =>
    `${p.first_name} ${p.last_name} ${p.email} ${p.company ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  function exportCSV() {
    const rows = [['First Name','Last Name','Email','Phone','Company','Title']];
    filtered.forEach(p => rows.push([p.first_name,p.last_name??'',p.email,p.phone??'',p.company??'',p.title??'']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'people.csv'; a.click();
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function deleteSelected() {
    if (!window.confirm(`Delete ${selected.size} people?`)) return;
    await supabase.from('people').delete().in('id', Array.from(selected));
    setSelected(new Set()); load();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">People</h1><p className="text-sm text-gray-500 mt-0.5">{people.length} total</p></div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs"><Download size={13}/> Export CSV</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15}/> Add Person</button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search by name, email, or company..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {selected.size > 0 && (
          <button onClick={deleteSelected} className="btn-danger text-xs">Delete {selected.size}</button>
        )}
      </div>

      <div className="card divide-y divide-gray-50">
        <div className="flex items-center gap-4 px-5 py-2 bg-gray-50 rounded-t-xl">
          <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(p=>p.id)) : new Set())} checked={selected.size === filtered.length && filtered.length > 0} className="rounded"/>
          <span className="text-xs font-medium text-gray-500 flex-1">Name</span>
          <span className="text-xs font-medium text-gray-500 w-48">Email</span>
          <span className="text-xs font-medium text-gray-500 w-32">Company</span>
          <span className="text-xs font-medium text-gray-500 w-24">Title</span>
        </div>
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
          : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={36} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400 mb-3">No people found.</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary text-xs"><Plus size={13}/> Add first person</button>
            </div>
          ) : filtered.map(p => (
            <div key={p.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${selected.has(p.id)?'bg-indigo-50':''}`}>
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded"/>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 shrink-0">
                  {p.first_name?.[0]}{p.last_name?.[0]}
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">{p.first_name} {p.last_name}</span>
              </div>
              <span className="text-xs text-gray-500 w-48 truncate">{p.email}</span>
              <span className="text-xs text-gray-400 w-32 truncate">{p.company ?? '—'}</span>
              <span className="text-xs text-gray-400 w-24 truncate">{p.title ?? '—'}</span>
            </div>
          ))}
      </div>

      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} onAdded={load}/>}
    </div>
  );
}

function AddPersonModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', company:'', title:'', city:'', state:'', country:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.email) { setError('First name and email are required.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('people').insert(form);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Person</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)}/></div>
            <div><label className="label">Last Name</label><input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)}/></div>
          </div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phone</label><input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}/></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)}/></div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)}/></div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Add Person'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
