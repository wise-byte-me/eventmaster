import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, IdCard, CreditCard, ArrowRight, CheckCircle2, Circle, Zap, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format, subDays } from 'date-fns';

const ONBOARDING = [
  { id: 1, label: 'Sign in and access your account', link: '/' },
  { id: 2, label: 'Create your first event', link: '/events' },
  { id: 3, label: 'Add attendees or import a list', link: '/people' },
  { id: 4, label: 'Issue credentials to attendees', link: '/credentials' },
  { id: 5, label: 'Connect Stripe for platform billing', link: '/billing' },
  { id: 6, label: 'Set up GoHighLevel automation', link: '/integrations' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ events: 0, people: 0, credentials: 0, cards: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [tapData, setTapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);

  useEffect(() => { load(); }, []);

  async function load() {
    const [evRes, pplRes, credRes, cardRes, tapRes] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('people').select('id', { count: 'exact', head: true }),
      supabase.from('credentials').select('id', { count: 'exact', head: true }),
      supabase.from('cards').select('id', { count: 'exact', head: true }),
      supabase.from('tap_logs').select('occurred_at, decision').order('occurred_at'),
    ]);
    setStats({ events: evRes.data?.length ?? 0, people: pplRes.count ?? 0, credentials: credRes.count ?? 0, cards: cardRes.count ?? 0 });
    setRecentEvents(evRes.data ?? []);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayStr = format(d, 'yyyy-MM-dd');
      const taps = (tapRes.data ?? []).filter((t: any) => t.occurred_at?.startsWith(dayStr));
      return { day: format(d, 'MMM d'), allowed: taps.filter((t: any) => t.decision === 'allow').length, denied: taps.filter((t: any) => t.decision === 'deny').length };
    });
    setTapData(days);
    const steps = [1];
    if ((evRes.data?.length ?? 0) > 0) steps.push(2);
    if ((pplRes.count ?? 0) > 0) steps.push(3);
    if ((credRes.count ?? 0) > 0) steps.push(4);
    setCompletedSteps(steps);
    setLoading(false);
  }

  const pct = Math.round((completedSteps.length / ONBOARDING.length) * 100);
  const name = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Good to see you, {name} 👋</h1>
        <p className="text-sm text-gray-400 mt-1">Here's your event operations command center.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Events', value: stats.events, icon: CalendarDays, color: 'text-indigo-600', bg: 'bg-indigo-50', to: '/events' },
          { label: 'People', value: stats.people, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', to: '/people' },
          { label: 'Credentials', value: stats.credentials, icon: IdCard, color: 'text-violet-600', bg: 'bg-violet-50', to: '/credentials' },
          { label: 'Cards', value: stats.cards, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50', to: '/cards' },
        ].map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="card p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}><Icon size={15} className={color} /></div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? <div className="h-7 w-8 bg-gray-100 rounded animate-pulse" /> : value}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><TrendingUp size={15} className="text-indigo-500" /><h2 className="text-sm font-medium text-gray-900">Check-in Activity (7 days)</h2></div>
            <Link to="/pulse" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Live Pulse <ArrowRight size={11} /></Link>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={tapData}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="allowed" stroke="#6366f1" strokeWidth={2} fill="url(#gA)" name="Allowed" />
              <Area type="monotone" dataKey="denied" stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="3 3" name="Denied" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900">Setup Progress</h2>
              <span className="text-xs font-medium text-indigo-600">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {ONBOARDING.map(step => {
              const done = completedSteps.includes(step.id);
              return (
                <Link key={step.id} to={step.link} className="flex items-start gap-2.5 group">
                  {done ? <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    : <Circle size={15} className="text-gray-200 mt-0.5 shrink-0 group-hover:text-indigo-300 transition-colors" />}
                  <span className={`text-xs ${done ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-indigo-600'} transition-colors`}>{step.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="px-5 pb-4">
            <div className="bg-indigo-50 rounded-lg p-3 flex items-start gap-2">
              <Zap size={13} className="text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-700">Beautiful credentials. Fast access. Serious control.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Recent Events</h2>
          <Link to="/events" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">All events <ArrowRight size={11} /></Link>
        </div>
        {loading ? <div className="p-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-400 border-t-transparent mx-auto" /></div>
          : recentEvents.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No events yet</p>
              <Link to="/events" className="btn-primary text-xs">Create your first event</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentEvents.map(ev => {
                const now = new Date(), start = new Date(ev.start_at), end = new Date(ev.end_at);
                const status = now >= start && now <= end ? { l: 'Live', c: 'badge-green' } : now < start ? { l: 'Upcoming', c: 'badge-blue' } : { l: 'Past', c: 'badge-gray' };
                return (
                  <Link key={ev.id} to={`/events/${ev.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0"><CalendarDays size={15} className="text-indigo-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                      <p className="text-xs text-gray-400">{ev.venue_name || ev.city || 'No venue'} · {format(start, 'MMM d, yyyy')}</p>
                    </div>
                    <span className={status.c}>{status.l}</span>
                  </Link>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
