import { Bell, MessageSquare, UserPlus, CheckCircle, Users, X, Trash2, CheckCheck } from 'lucide-react';
import type { Theme, NotificationType, AppNotification } from '@/types';
import type { TabId } from './BottomNav';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_CONFIG: Record<NotificationType, {
  Icon: React.ComponentType<any>;
  color: string;
  tab: TabId;
}> = {
  new_message:    { Icon: MessageSquare, color: '#3B82F6', tab: 'messages' },
  join_request:   { Icon: UserPlus,      color: '#F59E0B', tab: 'rooms'    },
  accepted:       { Icon: CheckCircle,   color: '#10B981', tab: 'messages' },
  gc_established: { Icon: Users,         color: '#8B5CF6', tab: 'messages' },
};

interface Props {
  theme: Theme;
  notifications: AppNotification[];
  loading: boolean;
  available: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onNavigate: (tab: TabId) => void;
}

export default function NotificationsTab({
  theme: T,
  notifications,
  loading,
  available,
  onMarkRead,
  onMarkAllRead,
  onRemove,
  onClearAll,
  onNavigate,
}: Props) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!available) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Bell size={48} style={{ color: T.textMuted, opacity: 0.3, marginBottom: 16 }} />
        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Notifications not set up</p>
        <p style={{ fontSize: 12, color: T.textMuted, margin: 0, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          Run the SQL migration from <code style={{ background: T.surfaceAlt, padding: '1px 4px', borderRadius: 4 }}>useNotifications.ts</code> in your Supabase dashboard to enable this feature.
        </p>
      </div>
    );
  }

  const handleTap = async (n: AppNotification) => {
    if (!n.is_read) await onMarkRead(n.id);
    onNavigate(TYPE_CONFIG[n.type]?.tab ?? 'discover');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque", serif' }}>Notifications</h2>
          <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 10,
                background: `${T.primary}18`, border: `1.5px solid ${T.primary}40`,
                color: T.primary, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <CheckCheck size={14} /> Read all
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 10,
                background: T.surfaceAlt, border: `1.5px solid ${T.border}`,
                color: T.textMuted, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: T.border, marginBottom: 4 }} />

      {/* List */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Bell size={32} style={{ color: T.textMuted, opacity: 0.5 }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: '0 0 6px', fontFamily: '"Bricolage Grotesque", serif' }}>You're all caught up!</p>
          <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>Messages, join requests, and approvals will appear here.</p>
        </div>
      ) : (
        <div style={{ paddingBottom: 24 }}>
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.new_message;
            const { Icon } = cfg;
            return (
              <div
                key={n.id}
                onClick={() => handleTap(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px',
                  background: n.is_read ? 'transparent' : `${cfg.color}0D`,
                  borderLeft: `3px solid ${n.is_read ? 'transparent' : cfg.color}`,
                  cursor: 'pointer',
                  transition: 'background 150ms',
                  position: 'relative',
                }}
              >
                {/* Type icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: `${cfg.color}1A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} style={{ color: cfg.color }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 13, fontWeight: n.is_read ? 500 : 700,
                      color: T.text, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{relTime(n.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: T.textMuted, lineHeight: 1.45 }}>{n.body}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: cfg.color,
                    position: 'absolute', right: 36, top: 18,
                  }} />
                )}

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); onRemove(n.id); }}
                  style={{
                    position: 'absolute', top: 12, right: 10,
                    width: 26, height: 26, borderRadius: '50%',
                    background: T.surfaceAlt, border: `1px solid ${T.border}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.textMuted, flexShrink: 0,
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
