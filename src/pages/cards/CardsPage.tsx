import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Search, Wifi, Package, X, Printer, Radio } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const CARD_TYPES = ['standard pvc nfc','metal','key fob','sponsor prestige','collector','staff fob'];
const CARD_MATERIALS = ['pvc','metal','composite'];

const STATUS_CONFIG: Record<string,{label:string;badge:string}> = {
  in_inventory:{label:'In Inventory',badge:'badge-gray'},
  active_inventory:{label:'Active',badge:'badge-blue'},
  assigned:{label:'Assigned',badge:'badge-yellow'},
  activated:{label:'Activated',badge:'badge-green'},
  revoked:{label:'Revoked',badge:'badge-red'},
  lost:{label:'Lost',badge:'badge-red'},
  replaced:{label:'Replaced',badge:'badge-purple'},
  shipped:{label:'Shipped',badge:'badge-teal'},
};

export function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showOrder, setShowOrder] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
    setCards(data ?? []);
    setLoading(false);
  }

  async function markEncoded(id: string) {
    await supabase.from('cards').update({ encode_status: 'encoded', status: 'active_inventory' }).eq('id', id);
    load();
  }

  async function markPrinted(id: string) {
    await supabase.from('cards').update({ print_status: 'printed' }).eq('id', id);
    load();
  }

  const filtered = cards.filter(c => {
    const matchSearch = (c.card_uid + c.card_type + c.card_material).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summaryStats = [
    { label: 'Total', value: cards.length },
    { label: 'Active', value: cards.filter(c=>c.status==='activated').length },
    { label: 'Assigned', value: cards.filter(c=>c.assignment_status==='assigned').length },
    { label: 'Pending Print', value: cards.filter(c=>c.print_status==='not_started').length },
    { label: 'Pending Encode', value: cards.filter(c=>c.encode_status==='not_started').length },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Cards</h1><p className="text-sm text-gray-500 mt-0.5">Credential production & inventory</p></div>
        <button onClick={() => setShowOrder(true)} className="btn-primary"><Plus size={15}/> Order Cards</button>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {summaryStats.map(({label,value}) => (
          <div key={label} className="card p-3 text-center"><div className="text-xl font-semibold text-gray-900">{value}</div><div className="text-xs text-gray-400 mt-0.5">{label}</div></div>
        ))}
      </div>

      {/* Fulfillment pipeline */}
      <div className="card p-4 mb-5">
        <h3 className="text-xs font-medium text-gray-500 mb-3">Fulfillment Pipeline</h3>
        <div className="flex items-center gap-2">
          {[
            {label:'Order',count:cards.length,color:'bg-gray-100 text-gray-600'},
            {label:'Print',count:cards.filter(c=>c.print_status==='printed').length,color:'bg-amber-100 text-amber-700'},
            {label:'Encode',count:cards.filter(c=>c.encode_status==='encoded').length,color:'bg-blue-100 text-blue-700'},
            {label:'Ship',count:cards.filter(c=>c.shipment_status==='shipped').length,color:'bg-violet-100 text-violet-700'},
            {label:'Assign',count:cards.filter(c=>c.assignment_status==='assigned').length,color:'bg-emerald-100 text-emerald-700'},
            {label:'Activate',count:cards.filter(c=>c.status==='activated').length,color:'bg-green-100 text-green-700'},
          ].map(({label,count,color},i,arr) => (
            <React.Fragment key={label}>
              <div className={`flex-1 text-center px-2 py-2 rounded-lg ${color}`}>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs">{label}</div>
              </div>
              {i < arr.length-1 && <div className="text-gray-300 text-lg">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search by UID or type..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="input w-44" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card divide-y divide-gray-50">
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
          : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard size={36} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400 mb-1">No cards in inventory.</p>
              <p className="text-xs text-gray-300">Order cards to begin fulfillment.</p>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                {c.card_type === 'key fob' ? <Package size={15} className="text-amber-600"/> : c.encode_status==='encoded' ? <Wifi size={15} className="text-amber-600"/> : <CreditCard size={15} className="text-amber-600"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 font-mono">{c.card_uid}</p>
                <p className="text-xs text-gray-400">{c.card_material} · {c.card_type} · {format(new Date(c.created_at),'MMM d yyyy')}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={() => markPrinted(c.id)} disabled={c.print_status==='printed'} className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${c.print_status==='printed'?'text-green-600 bg-green-50':'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`} title="Mark printed">
                  <Printer size={12}/> {c.print_status==='printed'?'Printed':'Print'}
                </button>
                <button onClick={() => markEncoded(c.id)} disabled={c.encode_status==='encoded'} className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${c.encode_status==='encoded'?'text-blue-600 bg-blue-50':'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`} title="Mark encoded">
                  <Radio size={12}/> {c.encode_status==='encoded'?'Encoded':'Encode'}
                </button>
              </div>
              <span className={(STATUS_CONFIG[c.status]?.badge ?? 'badge-gray')}>{STATUS_CONFIG[c.status]?.label ?? c.status}</span>
            </div>
          ))}
      </div>

      {showOrder && <OrderCardsModal onClose={() => setShowOrder(false)} onOrdered={load}/>}
    </div>
  );
}

function OrderCardsModal({ onClose, onOrdered }: { onClose: ()=>void; onOrdered: ()=>void }) {
  const [form, setForm] = useState({ card_type:'standard pvc nfc', card_material:'pvc', quantity:50 });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const cards = Array.from({ length: form.quantity }, () => ({
      card_uid: 'ET-' + Math.random().toString(36).substr(2,10).toUpperCase(),
      card_type: form.card_type,
      card_material: form.card_material,
      print_status: 'not_started',
      encode_status: 'not_started',
      shipment_status: 'not_shipped',
      assignment_status: 'unassigned',
      status: 'in_inventory',
    }));
    // Insert in batches of 50
    for (let i = 0; i < cards.length; i += 50) {
      await supabase.from('cards').insert(cards.slice(i, i + 50) as any);
    }
    setSaving(false); onOrdered(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Order Cards</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div><label className="label">Card Type</label>
            <select className="input" value={form.card_type} onChange={e => set('card_type', e.target.value)}>
              {CARD_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Material</label>
            <select className="input" value={form.card_material} onChange={e => set('card_material', e.target.value)}>
              {CARD_MATERIALS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label className="label">Quantity</label>
            <input className="input" type="number" min={1} max={500} value={form.quantity} onChange={e => set('quantity', parseInt(e.target.value))}/>
          </div>
          <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg">
            UIDs will be auto-generated. Cards enter inventory as "not_started" — print and encode queues update as you process them.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : `Add ${form.quantity} Cards`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
