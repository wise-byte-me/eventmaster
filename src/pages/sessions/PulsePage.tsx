import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, Zap, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { format, subHours } from 'date-fns';

export function PulsePage() {
  const [tapLogs, setTapLogs] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const [tapRes, ciRes] = await Promise.all([
      supabase.from('tap_logs').select('*').order('occurred_at', { ascending: false }).limit(50),
      supabase.from('event_people').select('id', { count:'exact', head:true }).eq('checkin_status', 'checked_in'),
    ]);
    const logs = tapRes.data ?? [];
    setTapLogs(logs);
    setCheckedIn(ciRes.count ?? 0);
    setLastUpdated(new Date());

    // Auto-generate alerts
    const newAlerts: string[] = [];
    const denied = logs.filter(l=>l.decision==='deny').length;
    if (denied > 3) newAlerts.push(`⚠️ ${denied} denied entries detected — review access rules`);
    setAlerts(newAlerts);
    setLoading(false);
  }

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = tapLogs.filter(l => l.occurred_at?.startsWith(today));
  const allowed = todayLogs.filter(l=>l.decision==='allow').length;
  const denied = todayLogs.filter(l=>l.decision==='deny').length;

  // Hourly chart data (last 8 hours)
  const hourlyData = Array.from({ length: 8 }, (_, i) => {
    const h = subHours(new Date(), 7 - i);
    const hourStr = format(h, 'yyyy-MM-dd HH');
    const hourLogs = tapLogs.filter(l => l.occurred_at?.slice(0,13) === hourStr);
    return { hour: format(h, 'ha'), allowed: hourLogs.filter(l=>l.decision==='allow').length, denied: hourLogs.filter(l=>l.decision==='deny').length };
  });

  // Source breakdown
  const sourceMap: Record<string,number> = {};
  todayLogs.forEach(l => { sourceMap[l.tap_source] = (sourceMap[l.tap_source]??0)+1; });
  const sourceData = Object.entries(sourceMap).map(([name,value])=>({name,value}));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center"><Activity size={18} className="text-white"/></div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Pulse</h1>
            <p className="text-xs text-gray-400">Live event intelligence · refreshes every 12s</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <Zap size={11} className="animate-pulse"/> Live · {format(lastUpdated,'h:mm:ss a')}
          </div>
          <button onClick={load} className="btn-secondary text-xs"><RefreshCw size={13}/> Refresh</button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-5 space-y-2">
          {alerts.map((a,i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
              <AlertCircle size={15} className="shrink-0"/>{a}
            </div>
          ))}
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Checked In', value:checkedIn, color:'text-emerald-600', bg:'bg-emerald-50' },
          { label:'Allowed Today', value:allowed, color:'text-indigo-600', bg:'bg-indigo-50' },
          { label:'Denied Today', value:denied, color:'text-red-500', bg:'bg-red-50' },
          { label:'Total Tap Logs', value:tapLogs.length, color:'text-gray-600', bg:'bg-gray-50' },
        ].map(({label,value,color,bg}) => (
          <div key={label} className="card p-5">
            <p className="text-xs text-gray-500 mb-2">{label}</p>
            <p className={`text-3xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Hourly chart */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-indigo-500"/>
            <h2 className="text-sm font-medium text-gray-900">Hourly Activity (last 8h)</h2>
          </div>
          {loading ? <div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-400 border-t-transparent"/></div> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={hourlyData} barSize={14}>
                <XAxis dataKey="hour" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} allowDecimals={false} width={24}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:'1px solid #e5e7eb'}}/>
                <Bar dataKey="allowed" fill="#6366f1" name="Allowed" radius={[3,3,0,0]}/>
                <Bar dataKey="denied" fill="#ef4444" name="Denied" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Entry Sources</h2>
          {sourceData.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">No data yet</div>
          ) : (
            <div className="space-y-3">
              {sourceData.map(({name,value}) => (
                <div key={name}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium">{name}</span><span>{value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{width:`${Math.min(100,(value/Math.max(1,todayLogs.length))*100)}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live feed */}
      <div className="card">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Live Tap Feed</h2>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Live
          </div>
        </div>
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {loading ? <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
            : tapLogs.length === 0 ? <div className="p-10 text-center text-sm text-gray-400">No tap events yet.</div>
            : tapLogs.map(tap => (
              <div key={tap.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50">
                {tap.decision==='allow' ? <CheckCircle2 size={14} className="text-green-500 shrink-0"/> : <XCircle size={14} className="text-red-400 shrink-0"/>}
                <div className="flex-1 text-xs">
                  <span className={`font-medium ${tap.decision==='allow'?'text-green-700':'text-red-600'}`}>{tap.decision==='allow'?'Allowed':'Denied'}</span>
                  <span className="text-gray-400"> · {tap.tap_source}</span>
                  {tap.tap_location && <span className="text-gray-300"> · {tap.tap_location}</span>}
                  {tap.message && <span className="text-gray-500"> · {tap.message}</span>}
                </div>
                <span className="text-xs text-gray-400">{format(new Date(tap.occurred_at),'h:mm:ss a')}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
