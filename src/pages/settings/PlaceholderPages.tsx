import React, { useState, useEffect } from 'react';
import { Plug, Receipt, UserCog, Settings, Check, X, Plus, Trash2, Shield, Bell, Palette, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// ── INTEGRATIONS ──────────────────────────────────────────────
export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('integrations').select('*').then(({data}) => { setIntegrations(data??[]); setLoading(false); });
  }, []);

  async function connect(type: string) {
    const { data } = await supabase.from('integrations').select('id').eq('integration_type', type).maybeSingle();
    if (data) {
      await supabase.from('integrations').update({ status: 'active' }).eq('id', data.id);
    } else {
      await supabase.from('integrations').insert({ integration_type: type, status: 'active', config_json: {} });
    }
    const { data: fresh } = await supabase.from('integrations').select('*');
    setIntegrations(fresh ?? []);
  }

  async function disconnect(type: string) {
    await supabase.from('integrations').update({ status: 'inactive' }).eq('integration_type', type);
    const { data: fresh } = await supabase.from('integrations').select('*');
    setIntegrations(fresh ?? []);
  }

  const getStatus = (type: string) => integrations.find(i => i.integration_type === type)?.status ?? 'inactive';

  const INTEGRATIONS = [
    { type:'stripe', name:'Stripe', desc:'Platform billing, subscriptions, card orders. Not for organizer revenue.', icon:'💳', category:'Billing', docs:'https://stripe.com' },
    { type:'ghl', name:'GoHighLevel', desc:'CRM automation, onboarding workflows, post-event follow-up.', icon:'🚀', category:'CRM', docs:'https://gohighlevel.com' },
    { type:'mycard', name:'MyCard', desc:'Credential compatibility — display and present only. Event Table retains all permissions.', icon:'📱', category:'Credentials', docs:'#' },
    { type:'webhook', name:'Webhooks', desc:'Receive payment confirmations and trigger entitlement changes from external systems.', icon:'🔗', category:'Payments', docs:'#' },
    { type:'mailchimp', name:'Mailchimp', desc:'Email campaigns and post-event attendee communications.', icon:'📧', category:'Email', docs:'#' },
    { type:'zapier', name:'Zapier', desc:'Connect Event Table to 5000+ apps via automated workflows.', icon:'⚡', category:'Automation', docs:'https://zapier.com' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6"><h1 className="text-xl font-semibold text-gray-900">Integrations</h1><p className="text-sm text-gray-500 mt-0.5">Connect your tools and automate workflows</p></div>
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
        <Shield size={14} className="text-indigo-500 mt-0.5 shrink-0"/>
        <p className="text-xs text-indigo-700">Stripe is for <strong>Event Table platform billing only</strong> — not organizer event revenue. Organizers use their own payment stack (see Stripe, GHL, PayPal, etc.)</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {INTEGRATIONS.map(({ type, name, desc, icon, category, docs }) => {
          const status = getStatus(type);
          const isActive = status === 'active';
          return (
            <div key={type} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">{name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{category}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  {isActive ? <><Check size={12} className="text-emerald-500"/><span className="text-emerald-600 font-medium">Connected</span></>
                    : <><span className="w-2 h-2 rounded-full bg-gray-200 inline-block"/><span className="text-gray-400">Not connected</span></>}
                </div>
                <div className="flex items-center gap-2">
                  {docs !== '#' && <a href={docs} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">Docs</a>}
                  {isActive
                    ? <button onClick={() => disconnect(type)} className="btn-secondary text-xs">Disconnect</button>
                    : <button onClick={() => connect(type)} className="btn-primary text-xs">Connect</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BILLING ───────────────────────────────────────────────────
export function BillingPage() {
  const PLANS = [
    { name:'Launch', price:'$0', desc:'Get started — up to 100 attendees', features:['1 event','QR check-in','Basic credentials','Email support'], current:true, color:'border-gray-200' },
    { name:'Producer', price:'$79/mo', desc:'Professional event producers', features:['Unlimited events','NFC + QR + Wallet','Card fulfillment','GHL integration','Priority support'], current:false, color:'border-indigo-400' },
    { name:'Prestige', price:'$249/mo', desc:'Premium conventions & VIP events', features:['All Producer features','Metal & collector cards','Concierge onboarding','MyCard compatibility','Dedicated support'], current:false, color:'border-purple-400' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6"><h1 className="text-xl font-semibold text-gray-900">Billing</h1><p className="text-sm text-gray-500 mt-0.5">Platform subscription & card orders</p></div>
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-xs text-amber-700">
        ⚡ Connect Stripe to activate your plan. Event Table billing is separate from your event revenue — you keep all ticket proceeds.
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {PLANS.map(plan => (
          <div key={plan.name} className={`card p-5 border-2 ${plan.current?'border-indigo-400 shadow-sm':'border-gray-200'}`}>
            {plan.current && <div className="text-xs font-medium text-indigo-600 mb-2">Current Plan</div>}
            <div className="mb-1 text-lg font-semibold text-gray-900">{plan.name}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{plan.price}</div>
            <p className="text-xs text-gray-400 mb-4">{plan.desc}</p>
            <ul className="space-y-2 mb-4">
              {plan.features.map(f => <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600"><Check size={12} className="text-emerald-500 mt-0.5 shrink-0"/>{f}</li>)}
            </ul>
            <button className={plan.current?'btn-secondary w-full text-xs':'btn-primary w-full text-xs'}>
              {plan.current?'Current':'Upgrade'}
            </button>
          </div>
        ))}
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Card & Fulfillment Pricing</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            {type:'Standard PVC NFC', price:'$4.50/card', min:'Min 25'},
            {type:'Active Stock Card', price:'$3.75/card', min:'Min 50'},
            {type:'Metal VIP Card', price:'$18/card', min:'Min 10'},
            {type:'Key Fob', price:'$8/fob', min:'Min 10'},
            {type:'Sponsor Prestige', price:'$22/card', min:'Min 5'},
            {type:'Collector Edition', price:'$28/card', min:'Min 5'},
          ].map(({type,price,min})=>(
            <div key={type} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700">{type}</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{price}</p>
              <p className="text-xs text-gray-400">{min}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TEAM ─────────────────────────────────────────────────────
export function TeamPage() {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [invited, setInvited] = useState(false);

  const ROLES = [
    { role:'owner', desc:'Full access to everything', badge:'badge-purple' },
    { role:'admin', desc:'Full event and account management', badge:'badge-indigo-100 text-indigo-700' },
    { role:'producer', desc:'All event operational access', badge:'badge-blue' },
    { role:'check-in lead', desc:'Check-in, cards, badge printing', badge:'badge-green' },
    { role:'staff', desc:'Assigned station operations', badge:'badge-gray' },
    { role:'fulfillment manager', desc:'Card orders, print/encode queues', badge:'badge-yellow' },
  ];

  function invite(e: React.FormEvent) {
    e.preventDefault();
    setInvited(true);
    setTimeout(() => setInvited(false), 3000);
    setInviteEmail('');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6"><h1 className="text-xl font-semibold text-gray-900">Team</h1><p className="text-sm text-gray-500 mt-0.5">Manage staff roles and permissions</p></div>

      {/* Current users */}
      <div className="card mb-5">
        <div className="px-5 py-3.5 border-b border-gray-100"><h2 className="text-sm font-medium text-gray-900">Team Members</h2></div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center gap-4 px-5 py-3.5">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">{user?.email?.[0]?.toUpperCase()}</div>
            <div className="flex-1"><p className="text-sm font-medium text-gray-900">{user?.email}</p><p className="text-xs text-gray-400">Account owner</p></div>
            <span className="badge bg-purple-100 text-purple-700">Owner</span>
          </div>
        </div>
      </div>

      {/* Invite */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Invite Team Member</h2>
        <form onSubmit={invite} className="flex gap-3">
          <input className="input flex-1" type="email" placeholder="teammate@example.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/>
          <select className="input w-44" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
            {ROLES.map(r=><option key={r.role} value={r.role}>{r.role}</option>)}
          </select>
          <button type="submit" className="btn-primary"><Plus size={14}/> Invite</button>
        </form>
        {invited && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><Check size={12}/> Invitation sent!</p>}
      </div>

      {/* Role reference */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Role Reference</h3>
        <div className="space-y-3">
          {ROLES.map(({role,desc,badge})=>(
            <div key={role} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className={`badge ${badge} w-36 justify-center`}>{role}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────────────
export function SettingsPage() {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState('account');
  const [saved, setSaved] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  const sections = [
    {id:'account',label:'Account',icon:Globe},
    {id:'branding',label:'Branding',icon:Palette},
    {id:'notifications',label:'Notifications',icon:Bell},
    {id:'security',label:'Security',icon:Shield},
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6"><h1 className="text-xl font-semibold text-gray-900">Settings</h1></div>
      <div className="flex gap-6">
        <div className="w-44 shrink-0">
          <nav className="space-y-1">
            {sections.map(({id,label,icon:Icon})=>(
              <button key={id} onClick={() => setSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${section===id?'bg-indigo-50 text-indigo-700 font-medium':'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={14}/>{label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1">
          {section === 'account' && (
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-medium text-gray-900">Account</h2>
              <div><label className="label">Email</label><input className="input" value={user?.email ?? ''} readOnly/></div>
              <div><label className="label">Organization Name</label><input className="input" placeholder="My Event Company"/></div>
              <div><label className="label">Default Timezone</label>
                <select className="input">
                  <option>America/Los_Angeles</option><option>America/New_York</option><option>America/Chicago</option><option>Europe/London</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button onClick={save} className="btn-primary">{saved?<><Check size={14}/> Saved</>:'Save Changes'}</button>
                <button onClick={signOut} className="btn-danger text-xs">Sign Out</button>
              </div>
            </div>
          )}
          {section === 'branding' && (
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-medium text-gray-900">Branding</h2>
              <div><label className="label">Primary Color</label><input className="input" type="color" defaultValue="#4f46e5" style={{height:42,padding:4}}/></div>
              <div><label className="label">Logo URL</label><input className="input" placeholder="https://your-logo.com/logo.png"/></div>
              <div><label className="label">Brand Name on Credentials</label><input className="input" placeholder="Event Table"/></div>
              <button onClick={save} className="btn-primary">{saved?<><Check size={14}/> Saved</>:'Save Branding'}</button>
            </div>
          )}
          {section === 'notifications' && (
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-medium text-gray-900 mb-2">Notifications</h2>
              {[
                'Email me when someone registers',
                'Email me when a credential is revoked',
                'Email me on denied check-in attempts',
                'Daily event summary digest',
                'Card order status updates',
              ].map(label => (
                <label key={label} className="flex items-center gap-3 cursor-pointer py-1.5 border-b border-gray-50 last:border-0">
                  <input type="checkbox" defaultChecked className="rounded"/>
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
              <button onClick={save} className="btn-primary mt-2">{saved?<><Check size={14}/> Saved</>:'Save Preferences'}</button>
            </div>
          )}
          {section === 'security' && (
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-medium text-gray-900">Security</h2>
              <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700 flex items-center gap-2"><Shield size={12}/> Authentication handled securely by Supabase Auth</div>
              <div><label className="label">Session timeout</label>
                <select className="input"><option>7 days</option><option>1 day</option><option>8 hours</option></select>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Danger Zone</h3>
                <button className="btn-danger text-xs">Delete Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
