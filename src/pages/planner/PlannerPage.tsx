import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, X, Clock, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, differenceInMinutes } from 'date-fns';

const TYPES = ['session','break','rehearsal','staff_shift','vip_window','setup','teardown','sponsor_activation','meal'];
const TYPE_STYLES: Record<string,string> = {
  session:'bg-indigo-100 text-indigo-700', break:'bg-gray-100 text-gray-500',
  rehearsal:'bg-amber-100 text-amber-700', staff_shift:'bg-emerald-100 text-emerald-700',
  vip_window:'bg-purple-100 text-purple-700', setup:'bg-orange-100 text-orange-700',
  teardown:'bg-red-100 text-red-700', sponsor_activation:'bg-teal-100 text-teal-700',
  meal:'bg-yellow-100 text-yellow-700',
};
type View = 'schedule'|'runofshow';

export function PlannerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('schedule');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  useEffect(() => {
    supabase.from('events').select('id,name').order('start_at',{ascending:false}).then(({data})=>{
      setEvents(data??[]);
    });
  }, []);

  useEffect(() => { load(); }, [selectedEvent]);

  async function load() {
    setLoading(true);
    let q = supabase.from('planner_items').select('*').order('starts_at');
    if (selectedEvent) q = q.eq('event_id', selectedEvent);
    const { data } = await q;
    setItems(data ?? []);
    setLoading(false);
  }

  async function deleteItem(id: string) {
    if (!window.confirm('Delete this planner item?')) return;
    await supabase.from('planner_items').delete().eq('id', id);
    load();
  }

  const grouped = items.reduce<Record<string,any[]>>((acc, item) => {
    const day = item.starts_at ? format(new Date(item.starts_at), 'EEEE, MMMM d, yyyy') : 'Unscheduled';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Planner</h1><p className="text-sm text-gray-500 mt-0.5">Master schedule & run of show</p></div>
        <div className="flex gap-2">
          <select className="input w-52 text-sm" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="">All events</option>
            {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15}/> Add Item</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['schedule','runofshow'] as View[]).map(v=>(
          <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view===v?'bg-indigo-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {v === 'schedule' ? '📅 Schedule' : '🎬 Run of Show'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 text-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-400 border-t-transparent mx-auto"/></div>
      ) : items.length === 0 ? (
        <div className="card p-14 text-center">
          <CalendarClock size={38} className="text-gray-200 mx-auto mb-3"/>
          <p className="text-sm text-gray-500 mb-3">No planner items yet.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15}/> Add First Item</button>
        </div>
      ) : view === 'schedule' ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, dayItems]) => (
            <div key={day}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarClock size={13}/>{day}
                <span className="text-gray-300">({dayItems.length} items)</span>
              </h2>
              <div className="space-y-2">
                {dayItems.map(item => {
                  const dur = differenceInMinutes(new Date(item.ends_at), new Date(item.starts_at));
                  return (
                    <div key={item.id} className="card flex items-start gap-4 p-4 hover:shadow-sm transition-shadow">
                      <div className="text-right w-20 shrink-0 pt-0.5">
                        <p className="text-xs font-semibold text-gray-900">{format(new Date(item.starts_at),'h:mm a')}</p>
                        <p className="text-xs text-gray-400">{format(new Date(item.ends_at),'h:mm a')}</p>
                        <p className="text-xs text-gray-300 mt-1 flex items-center justify-end gap-0.5"><Clock size={9}/>{dur}m</p>
                      </div>
                      <div className="w-px bg-gray-100 self-stretch"/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[item.planner_type]??'bg-gray-100 text-gray-500'}`}>{item.planner_type}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${item.status==='completed'?'bg-green-100 text-green-700':item.status==='in_progress'?'bg-blue-100 text-blue-700':'bg-gray-50 text-gray-400'}`}>{item.status}</span>
                        </div>
                        {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditItem(item)} className="btn-ghost p-1.5"><Edit2 size={13}/></button>
                        <button onClick={() => deleteItem(item.id)} className="btn-ghost p-1.5 text-red-400"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Run of Show view — compact table
        <div className="card overflow-hidden">
          <div className="bg-gray-900 text-white px-5 py-3 flex items-center gap-2">
            <span className="text-sm font-semibold">🎬 RUN OF SHOW</span>
            <span className="text-gray-400 text-xs ml-auto">{items.length} cues</span>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <div key={item.id} className={`flex items-center gap-4 px-5 py-2.5 text-sm ${i%2===0?'bg-white':'bg-gray-50'}`}>
                <span className="text-xs font-mono text-gray-400 w-6 text-right">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs font-mono font-semibold text-gray-900 w-16">{format(new Date(item.starts_at),'HH:mm')}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium w-28 text-center ${TYPE_STYLES[item.planner_type]??'bg-gray-100 text-gray-500'}`}>{item.planner_type}</span>
                <span className="text-sm text-gray-900 flex-1">{item.title}</span>
                <span className="text-xs text-gray-400">{differenceInMinutes(new Date(item.ends_at),new Date(item.starts_at))}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAdd || editItem) && (
        <PlannerItemModal
          item={editItem}
          events={events}
          defaultEventId={selectedEvent}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function PlannerItemModal({ item, events, defaultEventId, onClose, onSaved }: any) {
  const [form, setForm] = useState(item ? {
    event_id: item.event_id??'', title:item.title, planner_type:item.planner_type,
    description:item.description??'', starts_at:item.starts_at?.slice(0,16)??'',
    ends_at:item.ends_at?.slice(0,16)??'', status:item.status, priority:item.priority??'normal',
  } : { event_id:defaultEventId, title:'', planner_type:'session', description:'', starts_at:'', ends_at:'', status:'scheduled', priority:'normal' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.starts_at || !form.ends_at) return;
    setSaving(true);
    if (item) { await supabase.from('planner_items').update(form).eq('id', item.id); }
    else { await supabase.from('planner_items').insert(form); }
    setSaving(false); onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Planner Item'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div><label className="label">Event</label>
            <select className="input" value={form.event_id} onChange={e => set('event_id', e.target.value)}>
              <option value="">No event</option>
              {events.map((ev: any)=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div><label className="label">Title *</label><input className="input" placeholder="Opening Keynote" value={form.title} onChange={e => set('title', e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label>
              <select className="input" value={form.planner_type} onChange={e => set('planner_type', e.target.value)}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['low','normal','high','critical'].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start *</label><input className="input" type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}/></div>
            <div><label className="label">End *</label><input className="input" type="datetime-local" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}/></div>
          </div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {['scheduled','in_progress','completed','cancelled'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)}/></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving?'Saving...':item?'Update':'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
