import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Users, Flag, CreditCard, LayoutDashboard, Check, Ban,
  RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronUp, ChevronDown, Search, ShieldCheck, ShieldOff,
  KeyRound, Trash2, Info, DoorOpen, ClipboardList, Edit2,
  Archive, Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Report, IdSubmission } from '@/types';

// ── Theme ────────────────────────────────────────────────────────────────────
const A = {
  bg:         '#06131B',
  surface:    '#0D1F2D',
  surfaceAlt: '#142332',
  border:     '#1E3448',
  border2:    '#253F57',
  text:       '#F1EDE1',
  textMuted:  '#7A9BB5',
  textDim:    '#4A6880',
  primary:    '#1D6FD8',
  accent:     '#C82718',
  green:      '#22C55E',
  amber:      '#F59E0B',
  purple:     '#A855F7',
  highlight:  '#EEA64C',
};

// ── Audit logger ─────────────────────────────────────────────────────────────
async function logAudit(adminEmail: string, action: string, targetType: string, targetId: string, targetName: string, details?: string) {
  try {
    await supabase.from('audit_logs').insert({ admin_email: adminEmail, action, target_type: targetType, target_id: targetId, target_name: targetName, details: details ?? null });
  } catch { /* table may not exist yet */ }
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 86_400_000;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function NewBadge() {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, background: A.accent, color: '#fff', padding: '2px 6px', borderRadius: 6, letterSpacing: 0.5, flexShrink: 0 }}>NEW</span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: `${A.amber}20`, color: A.amber },
    reviewed:  { bg: `${A.green}18`, color: A.green },
    dismissed: { bg: `${A.textDim}20`, color: A.textDim },
    approved:  { bg: `${A.green}18`, color: A.green },
    rejected:  { bg: `${A.accent}18`, color: A.accent },
  };
  const s = map[status] ?? { bg: `${A.textDim}20`, color: A.textDim };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, padding: '3px 8px', borderRadius: 8, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const W = 72, H = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * (H - 4) - 2}`).join(' ');
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const trend = last > prev ? 'up' : last < prev ? 'down' : 'flat';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
      <svg width={W} height={H} style={{ overflow: 'visible', opacity: 0.8 }}>
        <defs>
          <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#g${color.replace('#','')})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
        {(() => {
          const lastPt = pts.split(' ').pop()!.split(',');
          return <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />;
        })()}
      </svg>
      {trend === 'up'   && <TrendingUp   size={13} style={{ color: A.green,    flexShrink: 0, marginBottom: 2 }} />}
      {trend === 'down' && <TrendingDown  size={13} style={{ color: A.accent,   flexShrink: 0, marginBottom: 2 }} />}
      {trend === 'flat' && <Minus         size={13} style={{ color: A.textMuted, flexShrink: 0, marginBottom: 2 }} />}
    </div>
  );
}

// ── Bar chart row ─────────────────────────────────────────────────────────────
function BarRow({ label, value, max, color, total }: { label: string; value: number; max: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 48px', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: A.textMuted, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ height: 7, background: A.border, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / Math.max(max, 1)) * 100}%`, background: color, borderRadius: 4, transition: 'width 700ms ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, textAlign: 'right' }}>{value} <span style={{ fontWeight: 400, opacity: 0.6 }}>({pct}%)</span></span>
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────
function Th({ children, width }: { children: React.ReactNode; width?: number | string }) {
  return (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: A.textDim, letterSpacing: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap', width: width ?? 'auto', borderBottom: `1.5px solid ${A.border}` }}>
      {children}
    </th>
  );
}
function Td({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td style={{ padding: '11px 14px', fontSize: 12, color: muted ? A.textMuted : A.text, borderBottom: `1px solid ${A.border}`, verticalAlign: 'middle' }}>
      {children}
    </td>
  );
}

// ── Photo viewer ──────────────────────────────────────────────────────────────
function IdThumbs({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  const [big, setBig] = useState('');
  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ label: 'F', url: frontUrl }, { label: 'B', url: backUrl }].map(({ label, url }) => (
          <div key={label} onClick={() => setBig(url)} style={{ cursor: 'zoom-in', position: 'relative' }}>
            <img src={url} alt={label} style={{ width: 48, height: 34, objectFit: 'cover', borderRadius: 6, border: `1px solid ${A.border2}` }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }} />
            <span style={{ position: 'absolute', bottom: 2, left: 2, fontSize: 8, fontWeight: 800, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>{label}</span>
          </div>
        ))}
      </div>
      {big && (
        <div onClick={() => setBig('')} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 24 }}>
          <img src={big} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 14, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setBig('')} style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
      )}
    </>
  );
}

// ── Avatar cell ───────────────────────────────────────────────────────────────
function AvatarCell({ name, avatarUrl, sub }: { name: string; avatarUrl?: string | null; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: A.primary, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {avatarUrl
          ? <img src={avatarUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{(name ?? '?').charAt(0).toUpperCase()}</span>}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: A.text, margin: 0 }}>{name || '—'}</p>
        {sub && <p style={{ fontSize: 11, color: A.textMuted, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Loading / Empty ───────────────────────────────────────────────────────────
function Loading() {
  return (
    <tr><td colSpan={99} style={{ padding: '40px 0', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: A.textMuted }}>
        <RefreshCw size={16} style={{ animation: 'adminSpin 1s linear infinite' }} />
        <span style={{ fontSize: 13 }}>Loading…</span>
      </div>
    </td></tr>
  );
}
function Empty({ msg }: { msg: string }) {
  return (
    <tr><td colSpan={99} style={{ padding: '48px 0', textAlign: 'center', color: A.textMuted, fontSize: 13 }}>{msg}</td></tr>
  );
}

// ── Tab header ────────────────────────────────────────────────────────────────
function TabHeader({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: A.text, margin: '0 0 3px', fontFamily: '"Bricolage Grotesque",serif', letterSpacing: '-0.02em' }}>{title}</h2>
        <p style={{ fontSize: 12, color: A.textMuted, margin: 0 }}>{sub}</p>
      </div>
      {action}
    </div>
  );
}

// ── Filter pills ──────────────────────────────────────────────────────────────
function FilterPill({ label, active, count, color, onClick }: { label: string; active: boolean; count?: number; color?: string; onClick: () => void }) {
  const c = color ?? A.primary;
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? c : A.border}`, background: active ? `${c}18` : A.surfaceAlt, color: active ? c : A.textMuted, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}>
      {label}
      {count !== undefined && count > 0 && <span style={{ fontSize: 10, fontWeight: 800, background: active ? c : A.border2, color: active ? '#fff' : A.textMuted, padding: '1px 6px', borderRadius: 10 }}>{count}</span>}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ════════════════════════════════════════════════════════════════════════════
interface DashStats { users: number; online: number; rooms: number; reports: number; pendingIds: number; }
interface Trend { users: number[]; rooms: number[]; reports: number[]; }

function DashboardTab() {
  const [stats, setStats]   = useState<DashStats>({ users: 0, online: 0, rooms: 0, reports: 0, pendingIds: 0 });
  const [trend, setTrend]   = useState<Trend>({ users: [], rooms: [], reports: [] });
  const [catData, setCatData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recentIds, setRecentIds] = useState<IdSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Core counts
      const [usersR, onlineR, roomsR, reportsR, idsR] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('rooms').select('id', { count: 'exact', head: true }).not('status', 'in', '("completed","cancelled")'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('id_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setStats({ users: usersR.count ?? 0, online: onlineR.count ?? 0, rooms: roomsR.count ?? 0, reports: reportsR.count ?? 0, pendingIds: idsR.count ?? 0 });

      // Trend: last 7 days of user registrations
      const since7 = new Date(Date.now() - 6 * 86_400_000).toISOString();
      const [uDays, rDays, repDays] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', since7),
        supabase.from('rooms').select('created_at').gte('created_at', since7),
        supabase.from('reports').select('created_at').gte('created_at', since7),
      ]);
      const bucket = (rows: { created_at: string }[] | null) => {
        const counts = Array(7).fill(0);
        (rows ?? []).forEach(r => {
          const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86_400_000);
          if (daysAgo < 7) counts[6 - daysAgo]++;
        });
        return counts;
      };
      setTrend({ users: bucket(uDays.data), rooms: bucket(rDays.data), reports: bucket(repDays.data) });

      // Category distribution
      const { data: catRows } = await supabase.from('rooms').select('category').not('status', 'in', '("completed","cancelled")');
      const catMap: Record<string, number> = {};
      (catRows ?? []).forEach(r => { catMap[r.category] = (catMap[r.category] ?? 0) + 1; });
      const catColors: Record<string, string> = { gaming: '#7C3AED', cafe: '#D97706', pasabuy: '#B45309', rotary: '#15803D', travel: '#0284C7', hiking: '#16A34A' };
      setCatData(Object.entries(catMap).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: catColors[k] ?? A.primary })));

      // Recent reports
      const { data: repData } = await supabase.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
      if (repData?.length) {
        const ids = [...new Set([...repData.map(r => r.reporter_id), ...repData.map(r => r.reported_user_id)].filter(Boolean))];
        const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids);
        const pm = Object.fromEntries((profs ?? []).map(p => [p.id, p.display_name]));
        setRecentReports(repData.map(r => ({ ...r, reporter_name: pm[r.reporter_id] ?? 'Unknown', reported_name: pm[r.reported_user_id] ?? 'Unknown' })));
      }

      // Recent ID submissions
      const { data: idData } = await supabase.from('id_submissions').select('*').eq('status', 'pending').order('submitted_at', { ascending: false }).limit(5);
      if (idData?.length) {
        const ids = [...new Set(idData.map(s => s.user_id))];
        const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
        const pm = Object.fromEntries((profs ?? []).map(p => [p.id, p]));
        setRecentIds(idData.map(s => ({ ...s, display_name: pm[s.user_id]?.display_name ?? null, avatar_url: pm[s.user_id]?.avatar_url ?? null })));
      }

      setLoading(false);
    })();
  }, []);

  const totalRooms = catData.reduce((s, d) => s + d.value, 0);

  const statCards = [
    { label: 'Total Players',   value: stats.users,     color: A.primary,  icon: '👥', spark: trend.users   },
    { label: 'Online Now',       value: stats.online,    color: A.green,    icon: '🟢', spark: []             },
    { label: 'Active Rooms',     value: stats.rooms,     color: A.highlight,icon: '🚪', spark: trend.rooms   },
    { label: 'Pending Reports',  value: stats.reports,   color: A.accent,   icon: '🚩', spark: trend.reports },
    { label: 'Pending IDs',      value: stats.pendingIds,color: A.purple,   icon: '🪪', spark: []             },
  ];

  return (
    <div>
      <TabHeader title="Dashboard" sub="Live snapshot of platform activity" />

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statCards.map(({ label, value, color, icon, spark }) => (
          <div key={label} style={{ padding: '18px 18px 14px', background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {(label.includes('Report') || label.includes('ID')) && value > 0 && <span style={{ fontSize: 10, fontWeight: 800, background: A.accent, color: '#fff', padding: '2px 7px', borderRadius: 8 }}>ACTION</span>}
            </div>
            <p style={{ fontSize: 32, fontWeight: 800, color, margin: 0, fontFamily: '"Bricolage Grotesque",serif', letterSpacing: '-0.03em', lineHeight: 1 }}>{loading ? '…' : value}</p>
            <p style={{ fontSize: 11, color: A.textMuted, margin: 0 }}>{label}</p>
            {spark.length > 1 && <Sparkline data={spark} color={color} />}
          </div>
        ))}
      </div>

      {/* ── Two columns: bar chart + recent activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Room distribution */}
        <div style={{ padding: '20px', background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: A.text, margin: '0 0 4px', fontFamily: '"Bricolage Grotesque",serif' }}>Active Rooms by Category</p>
          <p style={{ fontSize: 11, color: A.textMuted, margin: '0 0 18px' }}>{totalRooms} total active</p>
          {loading ? <p style={{ fontSize: 12, color: A.textMuted }}>Loading…</p> : catData.length === 0 ? (
            <p style={{ fontSize: 12, color: A.textMuted }}>No active rooms</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {catData.sort((a, b) => b.value - a.value).map(d => (
                <BarRow key={d.label} label={d.label} value={d.value} max={catData[0]?.value ?? 1} color={d.color} total={totalRooms} />
              ))}
            </div>
          )}
        </div>

        {/* User growth sparkline expanded */}
        <div style={{ padding: '20px', background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: A.text, margin: '0 0 4px', fontFamily: '"Bricolage Grotesque",serif' }}>7-Day Activity</p>
          <p style={{ fontSize: 11, color: A.textMuted, margin: '0 0 18px' }}>New registrations, rooms &amp; reports</p>
          {trend.users.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'New Players', data: trend.users,   color: A.primary  },
                { label: 'New Rooms',   data: trend.rooms,   color: A.highlight },
                { label: 'Reports',     data: trend.reports, color: A.accent   },
              ].map(({ label, data, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: A.textMuted }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{data.reduce((a, b) => a + b, 0)}</span>
                  </div>
                  <div style={{ height: 6, background: A.border, borderRadius: 3, overflow: 'hidden' }}>
                    {data.map((v, i) => {
                      const maxV = Math.max(...data, 1);
                      return (
                        <div key={i} style={{ display: 'inline-block', height: '100%', width: `${100 / data.length}%`, background: v > 0 ? color : 'transparent', opacity: 0.3 + (v / maxV) * 0.7, verticalAlign: 'top' }} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent pending reports table ── */}
      {recentReports.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: A.text, margin: '0 0 12px', fontFamily: '"Bricolage Grotesque",serif' }}>Recent Pending Reports</p>
          <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: A.surfaceAlt }}>
                <Th>Reported</Th><Th>Reason</Th><Th>Reporter</Th><Th>Date</Th>
              </tr></thead>
              <tbody>
                {recentReports.map(r => (
                  <tr key={r.id} style={{ background: 'transparent' }}>
                    <Td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{isNew(r.created_at) && <NewBadge />}<span>{r.reported_name}</span></div></Td>
                    <Td muted>{r.reason}</Td>
                    <Td muted>{r.reporter_name}</Td>
                    <Td muted>{fmtTime(r.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Recent pending IDs table ── */}
      {recentIds.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: A.text, margin: '0 0 12px', fontFamily: '"Bricolage Grotesque",serif' }}>Recent ID Submissions</p>
          <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: A.surfaceAlt }}>
                <Th>User</Th><Th>ID Type</Th><Th>Photos</Th><Th>Submitted</Th>
              </tr></thead>
              <tbody>
                {recentIds.map(s => (
                  <tr key={s.id}>
                    <Td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{isNew(s.submitted_at) && <NewBadge />}<AvatarCell name={s.display_name ?? s.user_id.slice(0, 8)} avatarUrl={s.avatar_url} /></div></Td>
                    <Td muted>{s.id_type}</Td>
                    <Td><IdThumbs frontUrl={s.id_front_url} backUrl={s.id_back_url} /></Td>
                    <Td muted>{fmt(s.submitted_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REPORTS TAB
// ════════════════════════════════════════════════════════════════════════════
function ReportsTab({ adminEmail }: { adminEmail: string }) {
  const [rows, setRows]   = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'dismissed'>('pending');
  const [counts, setCounts] = useState({ pending: 0, reviewed: 0, dismissed: 0 });
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    // Counts for filter badges
    const [p, r, d] = await Promise.all([
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'reviewed'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'dismissed'),
    ]);
    setCounts({ pending: p.count ?? 0, reviewed: r.count ?? 0, dismissed: d.count ?? 0 });

    const { data } = await supabase.from('reports').select('*').eq('status', filter)
      .order('created_at', { ascending: sortDir === 'asc' }).limit(100);
    if (data?.length) {
      const ids = [...new Set([...data.map(r => r.reporter_id), ...data.map(r => r.reported_user_id)].filter(Boolean))];
      const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
      const pm = Object.fromEntries((profs ?? []).map(p => [p.id, p]));
      setRows(data.map(r => ({ ...r, reporter_name: pm[r.reporter_id]?.display_name ?? 'Unknown', reported_name: pm[r.reported_user_id]?.display_name ?? 'Unknown', reported_avatar: pm[r.reported_user_id]?.avatar_url ?? null })));
    } else { setRows([]); }
    setLoading(false);
  }, [filter, sortDir]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, status: 'reviewed' | 'dismissed') => {
    const row = rows.find(r => r.id === id);
    await supabase.from('reports').update({ status }).eq('id', id);
    await logAudit(adminEmail, status === 'reviewed' ? 'mark_report_reviewed' : 'dismiss_report', 'report', id, row?.reported_name ?? id, `Reason: ${row?.reason ?? '—'}`);
    setRows(prev => prev.filter(r => r.id !== id));
    setCounts(c => ({ ...c, pending: Math.max(0, c.pending - 1) }));
  };

  return (
    <div>
      <TabHeader title="Reported Accounts" sub="User-submitted reports awaiting admin review" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <FilterPill label="Pending"   active={filter === 'pending'}   count={counts.pending}   color={A.accent}   onClick={() => setFilter('pending')} />
        <FilterPill label="Reviewed"  active={filter === 'reviewed'}  count={counts.reviewed}  color={A.green}    onClick={() => setFilter('reviewed')} />
        <FilterPill label="Dismissed" active={filter === 'dismissed'} count={counts.dismissed} color={A.textMuted} onClick={() => setFilter('dismissed')} />
        <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
          {sortDir === 'desc' ? <ChevronDown size={13} /> : <ChevronUp size={13} />} Date
        </button>
      </div>

      <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: A.surfaceAlt }}>
            <Th>Reported User</Th>
            <Th>Reason</Th>
            <Th>Details</Th>
            <Th>Reporter</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            {filter === 'pending' && <Th>Actions</Th>}
          </tr></thead>
          <tbody>
            {loading ? <Loading /> : rows.length === 0 ? <Empty msg={`No ${filter} reports`} /> : rows.map(r => (
              <tr key={r.id} style={{ background: 'transparent', transition: 'background 150ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = A.surfaceAlt}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isNew(r.created_at) && <NewBadge />}
                    <AvatarCell name={r.reported_name ?? '—'} avatarUrl={r.reported_avatar} />
                  </div>
                </Td>
                <Td><span style={{ fontSize: 12, fontWeight: 600, color: A.highlight }}>{r.reason}</span></Td>
                <Td muted><span style={{ maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.details || '—'}</span></Td>
                <Td muted>{r.reporter_name ?? 'Anonymous'}</Td>
                <Td muted>{fmtTime(r.created_at)}</Td>
                <Td><StatusPill status={r.status} /></Td>
                {filter === 'pending' && (
                  <Td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => act(r.id, 'reviewed')} title="Mark reviewed"
                        style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: `${A.green}18`, color: A.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => act(r.id, 'dismissed')} title="Dismiss"
                        style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: `${A.textDim}18`, color: A.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={13} />
                      </button>
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VERIFICATIONS TAB
// ════════════════════════════════════════════════════════════════════════════
function VerificationsTab({ adminEmail }: { adminEmail: string }) {
  const [rows, setRows]  = useState<IdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]    = useState<'pending' | 'approved'>('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0 });
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [p, a] = await Promise.all([
      supabase.from('id_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('id_submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ]);
    setCounts({ pending: p.count ?? 0, approved: a.count ?? 0 });

    const { data } = await supabase.from('id_submissions').select('*').eq('status', tab)
      .order('submitted_at', { ascending: false }).limit(100);
    if (data?.length) {
      const ids = [...new Set(data.map(s => s.user_id))];
      const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
      const pm = Object.fromEntries((profs ?? []).map(p => [p.id, p]));
      setRows(data.map(s => ({ ...s, display_name: pm[s.user_id]?.display_name ?? null, avatar_url: pm[s.user_id]?.avatar_url ?? null })));
    } else { setRows([]); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (s: IdSubmission) => {
    await Promise.all([
      supabase.from('id_submissions').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', s.id),
      supabase.from('profiles').update({ id_verified: true, id_type: s.id_type }).eq('id', s.user_id),
    ]);
    await logAudit(adminEmail, 'approve_id', 'id_submission', s.id, s.display_name ?? s.user_id, `ID type: ${s.id_type}`);
    setRows(prev => prev.filter(r => r.id !== s.id));
    setCounts(c => ({ ...c, pending: Math.max(0, c.pending - 1), approved: c.approved + 1 }));
  };

  const reject = async (s: IdSubmission) => {
    const reason = rejectReason || 'Does not meet requirements';
    await Promise.all([
      supabase.from('id_submissions').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', s.id),
      supabase.from('profiles').update({ id_verified: false }).eq('id', s.user_id),
    ]);
    await logAudit(adminEmail, 'reject_id', 'id_submission', s.id, s.display_name ?? s.user_id, `Reason: ${reason}`);
    setRows(prev => prev.filter(r => r.id !== s.id));
    setCounts(c => ({ ...c, pending: Math.max(0, c.pending - 1) }));
    setRejectId(null); setRejectReason('');
  };

  return (
    <div>
      <TabHeader title="ID Verifications" sub="Review submitted government IDs — front &amp; back" />

      {/* 24h SLA note */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: `${A.primary}10`, border: `1.5px solid ${A.primary}30`, borderRadius: 12, marginBottom: 18 }}>
        <Info size={15} style={{ color: A.primary, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: A.textMuted, margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: A.text }}>24-hour review policy:</strong> All submitted ID verifications should be reviewed within <strong style={{ color: A.primary }}>1 working day</strong>. Users are shown a "⏳ Reviewing" status until a decision is made. Approving or rejecting will notify the user in-app.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <FilterPill label="Pending"  active={tab === 'pending'}  count={counts.pending}  color={A.purple} onClick={() => setTab('pending')} />
        <FilterPill label="Approved" active={tab === 'approved'} count={counts.approved} color={A.green}  onClick={() => setTab('approved')} />
      </div>

      <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: A.surfaceAlt }}>
            <Th>User</Th>
            <Th>ID Type</Th>
            <Th>Photos</Th>
            <Th>Submitted</Th>
            {tab === 'approved' && <Th>Approved</Th>}
            <Th>Status</Th>
            {tab === 'pending' && <Th>Actions</Th>}
          </tr></thead>
          <tbody>
            {loading ? <Loading /> : rows.length === 0 ? <Empty msg={`No ${tab} submissions`} /> : rows.map(s => (
              <React.Fragment key={s.id}>
                <tr style={{ background: 'transparent', transition: 'background 150ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = A.surfaceAlt}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isNew(s.submitted_at) && <NewBadge />}
                      <AvatarCell name={s.display_name ?? s.user_id.slice(0, 8)} avatarUrl={s.avatar_url} />
                    </div>
                  </Td>
                  <Td muted>{s.id_type}</Td>
                  <Td><IdThumbs frontUrl={s.id_front_url} backUrl={s.id_back_url} /></Td>
                  <Td muted>{fmt(s.submitted_at)}</Td>
                  {tab === 'approved' && <Td muted>{s.reviewed_at ? fmt(s.reviewed_at) : '—'}</Td>}
                  <Td><StatusPill status={s.status} /></Td>
                  {tab === 'pending' && (
                    <Td>
                      {rejectId === s.id ? (
                        <span style={{ fontSize: 11, color: A.textMuted }}>See below ↓</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => approve(s)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: 'none', background: `${A.green}18`, color: A.green, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            <ShieldCheck size={12} /> Approve
                          </button>
                          <button onClick={() => setRejectId(s.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: 'none', background: `${A.accent}18`, color: A.accent, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            <ShieldOff size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </Td>
                  )}
                </tr>
                {rejectId === s.id && (
                  <tr>
                    <td colSpan={99} style={{ padding: '12px 14px', background: `${A.accent}08`, borderBottom: `1px solid ${A.border}` }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Rejection reason (shown to user)…" rows={2}
                          style={{ flex: 1, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', border: `1.5px solid ${A.border2}`, borderRadius: 8, background: A.surfaceAlt, color: A.text, outline: 'none', resize: 'none' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button onClick={() => reject(s)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: A.accent, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Confirm Reject
                          </button>
                          <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                            style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ════════════════════════════════════════════════════════════════════════════
interface AdminProfile {
  id: string; display_name: string | null; location: string | null;
  avatar_url: string | null; kasama_rating: number | null;
  id_verified: boolean; is_online: boolean; is_banned: boolean; updated_at: string;
}

type ActionPanel = { userId: string; type: 'ban' | 'reset' | 'delete' };

function UsersTab({ adminEmail }: { adminEmail: string }) {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionPanel, setActionPanel] = useState<ActionPanel | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [resetError, setResetError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [sortCol, setSortCol] = useState<'name' | 'rating' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('profiles')
        .select('id, display_name, location, avatar_url, kasama_rating, id_verified, is_online, is_banned, updated_at')
        .order('updated_at', { ascending: false }).limit(200);
      if (!error) setUsers((data ?? []).map(u => ({ ...u, is_banned: u.is_banned ?? false })));
      setLoading(false);
    })();
  }, []);

  const closePanel = () => {
    setActionPanel(null);
    setNewPassword(''); setConfirmPassword('');
    setResetStatus('idle'); setResetError(''); setShowPw(false);
  };

  const toggleBan = async (u: AdminProfile) => {
    const ban = !u.is_banned;
    await supabase.from('profiles').update({ is_banned: ban }).eq('id', u.id);
    await logAudit(adminEmail, ban ? 'ban_user' : 'unban_user', 'user', u.id, u.display_name ?? u.id);
    setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_banned: ban } : p));
    closePanel();
  };

  const setUserPassword = async (u: AdminProfile) => {
    if (newPassword.length < 8) { setResetError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match.'); return; }
    setResetStatus('saving'); setResetError('');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';
    const { error } = await supabase.functions.invoke('admin-set-password', {
      body: { userId: u.id, newPassword },
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) { setResetStatus('error'); setResetError(error.message ?? 'Failed to set password.'); }
    else {
      await logAudit(adminEmail, 'reset_password', 'user', u.id, u.display_name ?? u.id);
      setResetStatus('done');
    }
  };

  const deleteAccount = async (u: AdminProfile) => {
    await supabase.from('profiles').update({ is_banned: true, display_name: '[Deleted Account]', avatar_url: null }).eq('id', u.id);
    await logAudit(adminEmail, 'delete_account', 'user', u.id, u.display_name ?? u.id);
    setUsers(prev => prev.filter(p => p.id !== u.id));
    closePanel();
  };

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : null;

  const filtered = users
    .filter(u => !search || (u.display_name ?? '').toLowerCase().includes(search.toLowerCase()) || (u.location ?? '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'name') return (a.display_name ?? '').localeCompare(b.display_name ?? '') * dir;
      if (sortCol === 'rating') return ((a.kasama_rating ?? -1) - (b.kasama_rating ?? -1)) * dir;
      return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
    });

  return (
    <div>
      <TabHeader
        title="User Management"
        sub={`${users.length} registered players`}
        action={
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: A.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ height: 36, paddingLeft: 30, paddingRight: 12, fontSize: 12, fontFamily: 'inherit', border: `1.5px solid ${A.border}`, borderRadius: 20, background: A.surfaceAlt, color: A.text, outline: 'none', width: 200 }} />
          </div>
        }
      />

      <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: A.surfaceAlt }}>
            <Th><button onClick={() => toggleSort('name')} style={{ background: 'none', border: 'none', color: A.textDim, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>User <SortIcon col="name" /></button></Th>
            <Th>Location</Th>
            <Th><button onClick={() => toggleSort('rating')} style={{ background: 'none', border: 'none', color: A.textDim, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>Rating <SortIcon col="rating" /></button></Th>
            <Th>Verified</Th>
            <Th>Online</Th>
            <Th>Status</Th>
            <Th><button onClick={() => toggleSort('date')} style={{ background: 'none', border: 'none', color: A.textDim, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>Activity <SortIcon col="date" /></button></Th>
            <Th>Actions</Th>
          </tr></thead>
          <tbody>
            {loading ? <Loading /> : filtered.length === 0 ? <Empty msg="No users found" /> : filtered.map(u => {
              const panel = actionPanel?.userId === u.id ? actionPanel.type : null;
              return (
                <React.Fragment key={u.id}>
                  <tr style={{ background: u.is_banned ? `${A.accent}07` : 'transparent', transition: 'background 150ms' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = u.is_banned ? `${A.accent}12` : A.surfaceAlt}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = u.is_banned ? `${A.accent}07` : 'transparent'}>
                    <Td><AvatarCell name={u.display_name ?? 'Unnamed'} avatarUrl={u.avatar_url} /></Td>
                    <Td muted>{u.location ?? '—'}</Td>
                    <Td><span style={{ fontWeight: 700, color: u.kasama_rating != null ? A.highlight : A.textDim }}>
                      {u.kasama_rating != null ? `⭐ ${u.kasama_rating.toFixed(1)}` : '—'}
                    </span></Td>
                    <Td>
                      {u.id_verified
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: A.green }}>✓ Verified</span>
                        : <span style={{ fontSize: 11, color: A.textDim }}>—</span>}
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.is_online ? A.green : A.border }} />
                        <span style={{ fontSize: 11, color: u.is_online ? A.green : A.textDim }}>{u.is_online ? 'Online' : 'Offline'}</span>
                      </div>
                    </Td>
                    <Td>
                      {u.is_banned
                        ? <span style={{ fontSize: 11, fontWeight: 700, background: `${A.accent}20`, color: A.accent, padding: '3px 8px', borderRadius: 8 }}>BANNED</span>
                        : <span style={{ fontSize: 11, color: A.green }}>Active</span>}
                    </Td>
                    <Td muted>{fmt(u.updated_at)}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {/* Ban/Unban */}
                        <button
                          onClick={() => setActionPanel(panel === 'ban' ? null : { userId: u.id, type: 'ban' })}
                          title={u.is_banned ? 'Unban' : 'Ban'}
                          style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${panel === 'ban' ? (u.is_banned ? A.green : A.accent) : A.border}`, background: panel === 'ban' ? (u.is_banned ? `${A.green}20` : `${A.accent}20`) : A.surfaceAlt, color: u.is_banned ? A.green : A.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ban size={12} />
                        </button>
                        {/* Reset Password */}
                        <button
                          onClick={() => { setResetStatus('idle'); setActionPanel(panel === 'reset' ? null : { userId: u.id, type: 'reset' }); }}
                          title="Reset Password"
                          style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${panel === 'reset' ? A.primary : A.border}`, background: panel === 'reset' ? `${A.primary}20` : A.surfaceAlt, color: A.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <KeyRound size={12} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setActionPanel(panel === 'delete' ? null : { userId: u.id, type: 'delete' })}
                          title="Delete Account"
                          style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${panel === 'delete' ? A.accent : A.border}`, background: panel === 'delete' ? `${A.accent}20` : A.surfaceAlt, color: A.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </Td>
                  </tr>

                  {/* ── Inline action panels ── */}
                  {panel === 'ban' && (
                    <tr>
                      <td colSpan={99} style={{ padding: '12px 14px', background: u.is_banned ? `${A.green}08` : `${A.accent}08`, borderBottom: `1px solid ${A.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Ban size={14} style={{ color: u.is_banned ? A.green : A.accent, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: A.textMuted, margin: 0, flex: 1 }}>
                            {u.is_banned
                              ? `Remove ban for ${u.display_name ?? 'this user'}? They will regain full access.`
                              : `Ban ${u.display_name ?? 'this user'}? They will be locked out immediately.`}
                          </p>
                          <button onClick={() => toggleBan(u)}
                            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: u.is_banned ? A.green : A.accent, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {u.is_banned ? 'Confirm Unban' : 'Confirm Ban'}
                          </button>
                          <button onClick={closePanel}
                            style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {panel === 'reset' && (
                    <tr>
                      <td colSpan={99} style={{ padding: '14px 16px', background: `${A.primary}08`, borderBottom: `1px solid ${A.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <KeyRound size={16} style={{ color: A.primary, flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: A.text, margin: '0 0 10px' }}>
                              Set new password for <span style={{ color: A.primary }}>{u.display_name ?? 'this user'}</span>
                            </p>
                            {resetStatus === 'done' ? (
                              <p style={{ fontSize: 12, color: A.green, margin: 0 }}>✓ Password updated successfully.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                      type={showPw ? 'text' : 'password'}
                                      value={newPassword}
                                      onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                                      placeholder="New password (min 8 chars)"
                                      style={{ width: '100%', height: 32, padding: '0 32px 0 10px', fontSize: 12, fontFamily: 'inherit', border: `1.5px solid ${resetError ? A.accent : A.border2}`, borderRadius: 8, background: A.surfaceAlt, color: A.text, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: A.textMuted, padding: 0, fontSize: 11 }}>
                                      {showPw ? '🙈' : '👁'}
                                    </button>
                                  </div>
                                  <input
                                    type={showPw ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setResetError(''); }}
                                    placeholder="Confirm password"
                                    style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', border: `1.5px solid ${resetError ? A.accent : A.border2}`, borderRadius: 8, background: A.surfaceAlt, color: A.text, outline: 'none' }}
                                  />
                                  <button onClick={() => setUserPassword(u)} disabled={resetStatus === 'saving' || !newPassword || !confirmPassword}
                                    style={{ padding: '0 16px', height: 32, borderRadius: 8, border: 'none', background: A.primary, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', opacity: (resetStatus === 'saving' || !newPassword || !confirmPassword) ? 0.5 : 1 }}>
                                    {resetStatus === 'saving' ? 'Saving…' : 'Set Password'}
                                  </button>
                                </div>
                                {resetError && <p style={{ fontSize: 11, color: A.accent, margin: 0 }}>{resetError}</p>}
                              </div>
                            )}
                          </div>
                          <button onClick={closePanel}
                            style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {resetStatus === 'done' ? 'Close' : 'Cancel'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {panel === 'delete' && (
                    <tr>
                      <td colSpan={99} style={{ padding: '12px 14px', background: `${A.accent}0A`, borderBottom: `1px solid ${A.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <Trash2 size={14} style={{ color: A.accent, flexShrink: 0, marginTop: 1 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: A.accent, margin: '0 0 2px' }}>Delete account for {u.display_name ?? 'this user'}?</p>
                            <p style={{ fontSize: 11, color: A.textMuted, margin: 0 }}>This will anonymize their profile and permanently ban them. The auth record is preserved — remove it manually from Supabase Auth if needed.</p>
                          </div>
                          <button onClick={() => deleteAccount(u)}
                            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: A.accent, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Delete Account
                          </button>
                          <button onClick={closePanel}
                            style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOMS MANAGEMENT TAB
// ════════════════════════════════════════════════════════════════════════════
interface AdminRoom {
  id: string; name: string; category: string; status: string;
  max_members: number; member_count: number; event_date: string | null;
  user_id: string; created_at: string; host_name?: string | null;
}

const CAT_OPTS = ['all', 'rotary', 'gaming', 'cafe', 'pasabuy', 'sports'] as const;
const CAT_COLORS: Record<string, string> = { rotary: A.primary, gaming: '#7C3AED', cafe: '#D97706', pasabuy: '#B45309', sports: '#bee800' };
const CAT_EMOJI: Record<string, string>  = { rotary: '🏛️', gaming: '🎮', cafe: '☕', pasabuy: '🛒', sports: '⚽' };

type RoomState = 'active' | 'queuing' | 'finished' | 'archived';

function getRoomState(r: AdminRoom): RoomState {
  if (r.status === 'completed') return 'finished';
  if (r.status === 'cancelled') return 'archived';
  // Past event date with no active session → archived
  if (r.event_date && new Date(r.event_date) < new Date() && r.status !== 'confirmed') return 'archived';
  // Active:
  //   - All categories: host confirmed (status === 'confirmed')
  //   - Gaming / Cafe: room is full even if not yet host-confirmed
  const isFull = r.member_count >= r.max_members;
  if (r.status === 'confirmed') return 'active';
  if ((r.category === 'gaming' || r.category === 'cafe') && isFull) return 'active';
  return 'queuing';
}

const STATE_META: Record<RoomState, { label: string; emoji: string; color: string; sub: string }> = {
  active:   { label: 'Active',    emoji: '🟢', color: A.green,     sub: 'Rooms currently in session' },
  queuing:  { label: 'Queuing',   emoji: '🟡', color: A.amber,     sub: 'Waiting for members or confirmation' },
  finished: { label: 'Finished',  emoji: '✅', color: A.primary,   sub: 'Completed by host or buyer' },
  archived: { label: 'Archived',  emoji: '📦', color: A.textMuted, sub: 'Cancelled or past their event date' },
};

function RoomsManagementTab({ adminEmail }: { adminEmail: string }) {
  const [rooms, setRooms]   = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<typeof CAT_OPTS[number]>('all');
  const [stateFilter, setStateFilter] = useState<RoomState | 'all'>('all');
  const [actionPanel, setActionPanel] = useState<{ roomId: string; type: 'delete' | 'archive' | 'edit' } | null>(null);
  const [editName, setEditName] = useState('');
  const [editMax, setEditMax] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('rooms')
      .select('id, name, category, status, max_members, member_count, event_date, user_id, created_at')
      .order('created_at', { ascending: false }).limit(500);
    if (data?.length) {
      const uids = [...new Set(data.map(r => r.user_id).filter(Boolean))];
      const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', uids);
      const pm = Object.fromEntries((profs ?? []).map(p => [p.id, p.display_name]));
      setRooms(data.map(r => ({ ...r, host_name: pm[r.user_id] ?? null })));
    } else { setRooms([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const closePanel = () => setActionPanel(null);

  const deleteRoom = async (r: AdminRoom) => {
    await supabase.from('rooms').delete().eq('id', r.id);
    await logAudit(adminEmail, 'delete_room', 'room', r.id, r.name, `Category: ${r.category}`);
    setRooms(prev => prev.filter(x => x.id !== r.id));
    closePanel();
  };

  const archiveRoom = async (r: AdminRoom) => {
    await supabase.from('rooms').update({ status: 'completed' }).eq('id', r.id);
    await logAudit(adminEmail, 'archive_room', 'room', r.id, r.name, `Category: ${r.category}`);
    setRooms(prev => prev.map(x => x.id === r.id ? { ...x, status: 'completed' } : x));
    closePanel();
  };

  const saveEdit = async (r: AdminRoom) => {
    const updates: Record<string, unknown> = {};
    if (editName.trim() && editName.trim() !== r.name) updates.name = editName.trim();
    if (editMax && Number(editMax) !== r.max_members) updates.max_members = Number(editMax);
    if (!Object.keys(updates).length) { closePanel(); return; }
    await supabase.from('rooms').update(updates).eq('id', r.id);
    await logAudit(adminEmail, 'update_room', 'room', r.id, r.name, JSON.stringify(updates));
    setRooms(prev => prev.map(x => x.id === r.id ? { ...x, ...updates, name: (updates.name as string) ?? x.name, max_members: (updates.max_members as number) ?? x.max_members } : x));
    closePanel();
  };

  // State counts (across all rooms, before cat/search filter)
  const stateCounts = rooms.reduce<Record<string, number>>((acc, r) => {
    const s = getRoomState(r);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = rooms.filter(r => {
    if (stateFilter !== 'all' && getRoomState(r) !== stateFilter) return false;
    if (catFilter !== 'all' && r.category !== catFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !(r.host_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <TabHeader
        title="Room Management"
        sub={`${rooms.length} total rooms`}
        action={
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: A.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms or host…"
              style={{ height: 36, paddingLeft: 30, paddingRight: 12, fontSize: 12, fontFamily: 'inherit', border: `1.5px solid ${A.border}`, borderRadius: 20, background: A.surfaceAlt, color: A.text, outline: 'none', width: 220 }} />
          </div>
        }
      />

      {/* ── State tabs (Active / Queuing / Finished / Archived) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        {(['active', 'queuing', 'finished', 'archived'] as RoomState[]).map(s => {
          const m = STATE_META[s];
          const active = stateFilter === s;
          const count = stateCounts[s] ?? 0;
          return (
            <button key={s} onClick={() => setStateFilter(active ? 'all' : s)}
              style={{ padding: '12px 14px', borderRadius: 14, border: `2px solid ${active ? m.color : A.border}`, background: active ? `${m.color}12` : A.surface, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 180ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{m.emoji}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: active ? m.color : A.text, fontFamily: '"Bricolage Grotesque",serif' }}>{loading ? '…' : count}</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 800, color: active ? m.color : A.text, margin: '0 0 2px' }}>{m.label}</p>
              <p style={{ fontSize: 10, color: A.textMuted, margin: 0, lineHeight: 1.3 }}>{m.sub}</p>
            </button>
          );
        })}
      </div>

      {/* ── Category filter + result count ── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {CAT_OPTS.map(c => (
          <FilterPill key={c} label={c === 'all' ? 'All' : `${CAT_EMOJI[c]} ${c.charAt(0).toUpperCase() + c.slice(1)}`}
            active={catFilter === c} color={c === 'all' ? A.primary : CAT_COLORS[c]} onClick={() => setCatFilter(c)} />
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: A.textDim }}>{filtered.length} rooms</span>
      </div>

      <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: A.surfaceAlt }}>
            <Th>Room</Th><Th>Category</Th><Th>Host</Th><Th>Members</Th><Th>State</Th><Th>Created</Th><Th>Actions</Th>
          </tr></thead>
          <tbody>
            {loading ? <Loading /> : filtered.length === 0 ? <Empty msg="No rooms found" /> : filtered.map(r => {
              const panel = actionPanel?.roomId === r.id ? actionPanel.type : null;
              const catColor = CAT_COLORS[r.category] ?? A.primary;
              return (
                <React.Fragment key={r.id}>
                  <tr style={{ background: 'transparent', transition: 'background 150ms' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = A.surfaceAlt}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isNew(r.created_at) && <NewBadge />}
                        <span style={{ fontSize: 13, fontWeight: 700, color: A.text }}>{r.name}</span>
                      </div>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 11, fontWeight: 700, background: `${catColor}18`, color: catColor, padding: '3px 8px', borderRadius: 8 }}>
                        {CAT_EMOJI[r.category]} {r.category.charAt(0).toUpperCase() + r.category.slice(1)}
                      </span>
                    </Td>
                    <Td muted>{r.host_name ?? '—'}</Td>
                    <Td muted>{r.member_count}/{r.max_members}</Td>
                    <Td>{(() => { const s = getRoomState(r); const m = STATE_META[s]; return <span style={{ fontSize: 11, fontWeight: 700, background: `${m.color}18`, color: m.color, padding: '3px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>{m.emoji} {m.label}</span>; })()}</Td>
                    <Td muted>{fmt(r.created_at)}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => { setEditName(r.name); setEditMax(String(r.max_members)); setActionPanel(panel === 'edit' ? null : { roomId: r.id, type: 'edit' }); }}
                          title="Edit" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${panel === 'edit' ? A.primary : A.border}`, background: panel === 'edit' ? `${A.primary}20` : A.surfaceAlt, color: A.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setActionPanel(panel === 'archive' ? null : { roomId: r.id, type: 'archive' })}
                          title="Archive" disabled={r.status === 'completed'}
                          style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${panel === 'archive' ? A.amber : A.border}`, background: panel === 'archive' ? `${A.amber}20` : A.surfaceAlt, color: r.status === 'completed' ? A.textDim : A.amber, cursor: r.status === 'completed' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: r.status === 'completed' ? 0.4 : 1 }}>
                          <Archive size={12} />
                        </button>
                        <button onClick={() => setActionPanel(panel === 'delete' ? null : { roomId: r.id, type: 'delete' })}
                          title="Delete" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${panel === 'delete' ? A.accent : A.border}`, background: panel === 'delete' ? `${A.accent}20` : A.surfaceAlt, color: A.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </Td>
                  </tr>

                  {/* Edit inline */}
                  {panel === 'edit' && (
                    <tr><td colSpan={99} style={{ padding: '12px 14px', background: `${A.primary}08`, borderBottom: `1px solid ${A.border}` }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Edit2 size={14} style={{ color: A.primary, flexShrink: 0 }} />
                        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 2, minWidth: 160 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: A.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>Room Name</span>
                            <input value={editName} onChange={e => setEditName(e.target.value)}
                              style={{ height: 32, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', border: `1.5px solid ${A.border2}`, borderRadius: 8, background: A.surfaceAlt, color: A.text, outline: 'none' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 90 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: A.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>Max Members</span>
                            <input value={editMax} onChange={e => setEditMax(e.target.value)} type="number" min={1} max={50}
                              style={{ height: 32, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', border: `1.5px solid ${A.border2}`, borderRadius: 8, background: A.surfaceAlt, color: A.text, outline: 'none' }} />
                          </div>
                        </div>
                        <button onClick={() => saveEdit(r)}
                          style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: A.primary, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Save
                        </button>
                        <button onClick={closePanel}
                          style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </td></tr>
                  )}

                  {/* Archive confirm */}
                  {panel === 'archive' && (
                    <tr><td colSpan={99} style={{ padding: '12px 14px', background: `${A.amber}08`, borderBottom: `1px solid ${A.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Archive size={14} style={{ color: A.amber, flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: A.textMuted, margin: 0, flex: 1 }}>Archive <strong style={{ color: A.text }}>{r.name}</strong>? Status will be set to Completed and the room will no longer be active.</p>
                        <button onClick={() => archiveRoom(r)}
                          style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: A.amber, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Confirm Archive
                        </button>
                        <button onClick={closePanel}
                          style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </td></tr>
                  )}

                  {/* Delete confirm */}
                  {panel === 'delete' && (
                    <tr><td colSpan={99} style={{ padding: '12px 14px', background: `${A.accent}0A`, borderBottom: `1px solid ${A.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <Trash2 size={14} style={{ color: A.accent, flexShrink: 0, marginTop: 1 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: A.accent, margin: '0 0 2px' }}>Permanently delete "{r.name}"?</p>
                          <p style={{ fontSize: 11, color: A.textMuted, margin: 0 }}>This removes the room and all join requests from the database. This cannot be undone.</p>
                        </div>
                        <button onClick={() => deleteRoom(r)}
                          style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: A.accent, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Delete Room
                        </button>
                        <button onClick={closePanel}
                          style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${A.border}`, background: A.surfaceAlt, color: A.textMuted, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AUDIT TRAIL TAB
// ════════════════════════════════════════════════════════════════════════════
interface AuditLog {
  id: string; admin_email: string; action: string; target_type: string | null;
  target_id: string | null; target_name: string | null; details: string | null; created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  ban_user:             { label: 'Ban User',         color: '#C82718' },
  unban_user:           { label: 'Unban User',        color: '#22C55E' },
  delete_account:       { label: 'Delete Account',   color: '#C82718' },
  approve_id:           { label: 'Approve ID',        color: '#22C55E' },
  reject_id:            { label: 'Reject ID',         color: '#F59E0B' },
  mark_report_reviewed: { label: 'Review Report',     color: '#1D6FD8' },
  dismiss_report:       { label: 'Dismiss Report',    color: '#4A6880' },
  delete_room:          { label: 'Delete Room',       color: '#C82718' },
  archive_room:         { label: 'Archive Room',      color: '#F59E0B' },
  update_room:          { label: 'Update Room',       color: '#1D6FD8' },
};

function AuditTrailTab() {
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('audit_logs').select('*')
        .order('created_at', { ascending: false }).limit(200);
      if (error?.code === '42P01') { setTableExists(false); setLoading(false); return; }
      setLogs(data ?? []);
      setLoading(false);
    })();
  }, []);

  const actionTypes = ['all', ...Array.from(new Set(logs.map(l => l.action)))];
  const filtered = actionFilter === 'all' ? logs : logs.filter(l => l.action === actionFilter);

  if (!tableExists) return (
    <div>
      <TabHeader title="Audit Trail" sub="Log of all admin actions" />
      <div style={{ padding: '32px 24px', background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, textAlign: 'center' }}>
        <ClipboardList size={32} style={{ color: A.textDim, marginBottom: 12 }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: A.text, margin: '0 0 6px' }}>audit_logs table not found</p>
        <p style={{ fontSize: 12, color: A.textMuted, margin: '0 0 16px', maxWidth: 420, lineHeight: 1.6 }}>
          Create this table in your Supabase SQL editor to enable audit logging:
        </p>
        <pre style={{ textAlign: 'left', fontSize: 11, background: A.surfaceAlt, border: `1px solid ${A.border}`, borderRadius: 10, padding: '14px 16px', color: A.textMuted, overflow: 'auto', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>{`CREATE TABLE audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_name text,
  details text,
  created_at timestamptz DEFAULT now()
);`}</pre>
      </div>
    </div>
  );

  return (
    <div>
      <TabHeader title="Audit Trail" sub={`${logs.length} logged admin actions`} />

      {/* Action filter */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
        {actionTypes.map(a => {
          const meta = ACTION_LABELS[a];
          return (
            <button key={a} onClick={() => setActionFilter(a)}
              style={{ padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: `1.5px solid ${actionFilter === a ? (meta?.color ?? A.primary) : A.border}`, background: actionFilter === a ? `${meta?.color ?? A.primary}18` : A.surfaceAlt, color: actionFilter === a ? (meta?.color ?? A.primary) : A.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
              {meta?.label ?? (a === 'all' ? 'All Actions' : a)}
            </button>
          );
        })}
      </div>

      <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: A.surfaceAlt }}>
            <Th>Action</Th><Th>Target</Th><Th>Details</Th><Th>Admin</Th><Th>Date & Time</Th>
          </tr></thead>
          <tbody>
            {loading ? <Loading /> : filtered.length === 0 ? <Empty msg="No audit logs yet" /> : filtered.map(log => {
              const meta = ACTION_LABELS[log.action];
              return (
                <tr key={log.id} style={{ background: 'transparent', transition: 'background 150ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = A.surfaceAlt}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <Td>
                    <span style={{ fontSize: 11, fontWeight: 800, background: `${meta?.color ?? A.primary}18`, color: meta?.color ?? A.primary, padding: '3px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                      {meta?.label ?? log.action}
                    </span>
                  </Td>
                  <Td>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: A.text, margin: 0 }}>{log.target_name ?? '—'}</p>
                      {log.target_type && <p style={{ fontSize: 10, color: A.textDim, margin: '1px 0 0', textTransform: 'capitalize' }}>{log.target_type}</p>}
                    </div>
                  </Td>
                  <Td muted><span style={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details ?? '—'}</span></Td>
                  <Td muted>{log.admin_email}</Td>
                  <Td muted>{fmtTime(log.created_at)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'dashboard',     label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'reports',       label: 'Reports',   Icon: Flag },
  { id: 'verifications', label: 'ID Verify', Icon: CreditCard },
  { id: 'rooms',         label: 'Rooms',     Icon: DoorOpen },
  { id: 'users',         label: 'Users',     Icon: Users },
  { id: 'audit',         label: 'Audit',     Icon: ClipboardList },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminPanel({ onClose, userEmail }: { userId?: string; userEmail: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: A.bg, display: 'flex', flexDirection: 'column', fontFamily: '"DM Sans", system-ui, sans-serif', color: A.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes adminSpin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      {/* ── Top header (logo + close only) ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 22px', borderBottom: `1.5px solid ${A.border}`, background: A.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${A.accent}20`, border: `1.5px solid ${A.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={16} style={{ color: A.accent }} />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: A.accent, margin: '0 0 1px', letterSpacing: 1.5, fontFamily: '"Bricolage Grotesque",serif' }}>ADMIN PANEL</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: A.text, margin: 0, fontFamily: '"Bricolage Grotesque",serif' }}>SabayPH Moderation</p>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: A.surfaceAlt, border: `1.5px solid ${A.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.textMuted }}>
          <X size={15} />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 16px', maxWidth: 1100, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {activeTab === 'dashboard'     && <DashboardTab />}
        {activeTab === 'reports'       && <ReportsTab adminEmail={userEmail} />}
        {activeTab === 'verifications' && <VerificationsTab adminEmail={userEmail} />}
        {activeTab === 'rooms'         && <RoomsManagementTab adminEmail={userEmail} />}
        {activeTab === 'users'         && <UsersTab adminEmail={userEmail} />}
        {activeTab === 'audit'         && <AuditTrailTab />}
      </div>

      {/* ── Bottom navigation bar (mirrors app BottomNav) ── */}
      <div style={{ flexShrink: 0, borderTop: `1.5px solid ${A.border}`, background: A.surface, padding: '6px 0 env(safe-area-inset-bottom, 6px)' }}>
        <div style={{ display: 'flex', maxWidth: 600, margin: '0 auto' }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 4px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 160ms' }}>
                <div style={{ width: 40, height: 28, borderRadius: 14, background: active ? `${A.accent}22` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 160ms' }}>
                  <Icon size={18} style={{ color: active ? A.accent : A.textMuted, transition: 'color 160ms' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? A.accent : A.textMuted, letterSpacing: active ? 0.2 : 0, transition: 'all 160ms' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
