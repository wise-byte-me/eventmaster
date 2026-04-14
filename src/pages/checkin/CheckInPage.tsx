import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScanLine, CheckCircle2, XCircle, Search, Wifi, Monitor, User, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

type CheckResult = { decision:'allow'|'deny'; name:string; role:string; message:string; checkinTime?:string; };
type Mode = 'search'|'nfc'|'qr';

export function CheckInPage() {
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CheckResult|null>(null);
  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [stats, setStats] = useState({ checkedIn:0, denied:0, total:0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadRecent();
    supabase.from('events').select('id,name').order('start_at', { ascending: false }).limit(10).then(({data})=>setEvents(data??[]));
    const interval = setInterval(loadRecent, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadRecent() {
    const { data } = await supabase.from('tap_logs').select('*').order('occurred_at', { ascending: false }).limit(15);
    setRecentLogs(data ?? []);
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = (data ?? []).filter(l => l.occurred_at?.startsWith(today));
    setStats({ checkedIn: todayLogs.filter(l=>l.decision==='allow').length, denied: todayLogs.filter(l=>l.decision==='deny').length, total: todayLogs.length });
  }

  const doLookup = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setResult(null);
    const { data: person } = await supabase.from('people').select('*, event_people(*, credentials(*))').ilike('email', q.trim()).maybeSingle();
    const p = person as any;
    if (!p) {
      const res: CheckResult = { decision:'deny', name:q, role:'—', message:'No attendee found with this email.' };
      setResult(res);
      await supabase.from('tap_logs').insert({ tap_source:'manual_search', tap_type:'entry', decision:'deny', message:res.message, occurred_at:new Date().toISOString(), event_id: selectedEvent||null });
      setLoading(false); loadRecent(); return;
    }
    const ep = p.event_people?.[0];
    const cred = ep?.credentials?.[0];
    const name = `${p.first_name} ${p.last_name}`;
    let res: CheckResult;
    if (!ep || ['cancelled','revoked'].includes(ep.registration_status)) {
      res = { decision:'deny', name, role:ep?.attendee_type??'—', message:'Registration is not active.' };
    } else if (cred && cred.status !== 'active') {
      res = { decision:'deny', name, role:cred.role_label??'General', message:`Credential is ${cred.status}.` };
    } else {
      const now = new Date().toISOString();
      res = { decision:'allow', name, role:cred?.role_label??ep?.attendee_type??'General', message:'Access granted. Welcome!', checkinTime: format(new Date(), 'h:mm a') };
      if (ep) {
        await supabase.from('event_people').update({ checkin_status:'checked_in' }).eq('id', ep.id);
        await supabase.from('tap_logs').insert({ event_id: ep.event_id||selectedEvent||null, event_person_id:ep.id, credential_id:cred?.id??null, tap_source:'manual_search', tap_type:'entry', decision:'allow', message:'Manual check-in', occurred_at:new Date().toISOString() });
      }
    }
    setResult(res); setLoading(false); loadRecent();
  }, [selectedEvent]);

  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); await doLookup(query); }

  function simulateNFC() {
    const fakeUID = 'ET-' + Math.random().toString(36).substr(2,8).toUpperCase();
    setQuery(fakeUID);
    setResult({ decision:'allow', name:'NFC Tap Detected', role:'VIP', message:`Card ${fakeUID} — tap received (demo mode)`, checkinTime: format(new Date(),'h:mm a') });
  }

  function clearResult() { setResult(null); setQuery(''); inputRef.current?.focus(); }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><ScanLine size={20} className="text-white"/></div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Check-In Station</h1>
          <p className="text-sm text-gray-400">Scan NFC · QR · or search by email</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
          <Wifi size={11} className="animate-pulse"/> Station Active
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{l:'Checked In Today',v:stats.checkedIn,c:'text-emerald-600',bg:'bg-emerald-50'},{l:'Denied',v:stats.denied,c:'text-red-500',bg:'bg-red-50'},{l:'Total Taps',v:stats.total,c:'text-indigo-600',bg:'bg-indigo-50'}].map(({l,v,c,bg})=>(
          <div key={l} className={`card p-4 ${bg} border-0`}><div className={`text-2xl font-semibold ${c}`}>{v}</div><div className="text-xs text-gray-500 mt-0.5">{l}</div></div>
        ))}
      </div>

      {/* Event selector */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <Monitor size={15} className="text-gray-400 shrink-0"/>
        <div className="flex-1">
          <label className="label">Active Event (optional)</label>
          <select className="input" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="">All events</option>
            {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {(['search','nfc','qr'] as Mode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode===m?'bg-indigo-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {m === 'search' ? '🔍 Email Search' : m === 'nfc' ? '📡 NFC Tap' : '📷 QR Scan'}
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode === 'search' && (
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input ref={inputRef} className="w-full pl-12 pr-36 py-4 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 transition-colors" placeholder="Type email address and press Enter..." value={query} onChange={e => setQuery(e.target.value)}/>
            <button type="submit" disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary">
              {loading ? 'Checking...' : 'Check In'}
            </button>
          </div>
        </form>
      )}

      {mode === 'nfc' && (
        <div className="mb-5 card p-8 text-center border-dashed border-2 border-indigo-200 bg-indigo-50">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3"><Wifi size={28} className="text-indigo-500"/></div>
          <p className="text-sm text-gray-600 mb-4">Hold NFC card near reader</p>
          <button onClick={simulateNFC} className="btn-primary">Simulate NFC Tap (Demo)</button>
        </div>
      )}

      {mode === 'qr' && (
        <div className="mb-5 card p-8 text-center border-dashed border-2 border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><ScanLine size={28} className="text-gray-400"/></div>
          <p className="text-sm text-gray-500 mb-2">Point camera at attendee QR code</p>
          <p className="text-xs text-gray-400">Camera integration coming in Phase 2 — use email search in the meantime.</p>
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div className={`rounded-2xl p-5 mb-5 flex items-center gap-4 border-2 ${result.decision==='allow'?'bg-green-50 border-green-300':'bg-red-50 border-red-300'}`}>
          {result.decision==='allow' ? <CheckCircle2 size={40} className="text-green-600 shrink-0"/> : <XCircle size={40} className="text-red-500 shrink-0"/>}
          <div className="flex-1">
            <p className={`text-lg font-semibold ${result.decision==='allow'?'text-green-800':'text-red-700'}`}>{result.name}</p>
            <p className={`text-sm ${result.decision==='allow'?'text-green-700':'text-red-600'}`}>
              {result.role} · {result.message}
              {result.checkinTime && <span className="ml-2 font-medium">{result.checkinTime}</span>}
            </p>
          </div>
          <button onClick={clearResult} className={`px-4 py-2 rounded-lg text-sm font-medium ${result.decision==='allow'?'bg-green-200 text-green-800 hover:bg-green-300':'bg-red-200 text-red-800 hover:bg-red-300'}`}>
            Next
          </button>
        </div>
      )}

      {/* Live log */}
      <div className="card">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Live Activity</h2>
          <div className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11}/> Auto-updates</div>
        </div>
        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No check-ins recorded yet.</div>
          ) : recentLogs.map(log => (
            <div key={log.id} className="flex items-center gap-3 px-5 py-2.5">
              {log.decision==='allow' ? <CheckCircle2 size={14} className="text-green-500 shrink-0"/> : <XCircle size={14} className="text-red-400 shrink-0"/>}
              <User size={12} className="text-gray-300 shrink-0"/>
              <div className="flex-1 text-xs text-gray-600">{log.message ?? log.decision} <span className="text-gray-400">· {log.tap_source}</span></div>
              <span className="text-xs text-gray-400">{format(new Date(log.occurred_at), 'h:mm:ss a')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
