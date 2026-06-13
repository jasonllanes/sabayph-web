import { Plus } from 'lucide-react';
import type { Story } from '@/hooks/useStories';
import { groupStoriesByUser } from '@/hooks/useStories';
import { getDefaultAvatar } from '@/components/app/tagConstants';
import type { Theme } from '@/types';

interface Props {
  theme: Theme;
  stories: Story[];
  userId?: string;
  userName?: string;
  userAvatar?: string;
  isMobile?: boolean;
  seenStoryIds?: Set<string>;
  onAddStory: () => void;
  onViewOwnStory?: (stories: Story[]) => void;
  onViewStory: (userStories: Story[], startIdx?: number) => void;
}

// ── Speech bubble (Instagram-style note preview) ─────────────────────────────

function SpeechBubble({ text, theme: T }: { text: string; theme: Theme }) {
  const preview = text.length > 22 ? text.slice(0, 22) + '…' : text;
  return (
    <div style={{ position: 'relative', width: 'max-content', maxWidth: 130, overflow: 'hidden' }}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: '3px 7px',
        fontSize: 10,
        color: T.text,
        lineHeight: 1.3,
        fontFamily: '"DM Sans",system-ui,sans-serif',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {preview}
      </div>
      <div style={{ position: 'absolute', bottom: -5, left: 14, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${T.border}` }} />
      <div style={{ position: 'absolute', bottom: -4, left: 15, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${T.surface}` }} />
    </div>
  );
}

const BUBBLE_RESERVE = 30;

export default function StoriesBar({
  theme: T,
  stories,
  userId,
  userName,
  userAvatar,
  isMobile,
  seenStoryIds,
  onAddStory,
  onViewOwnStory,
  onViewStory,
}: Props) {
  const grouped = groupStoriesByUser(stories);

  // My own stories — NOT added to storyUsers, handled by the Add Story button
  const myStories = userId ? (grouped.get(userId) ?? []) : [];
  const myNote = myStories.find(s => s.type === 'note' && s.note_text) ?? null;
  const hasMyStories = myStories.length > 0;

  // Only OTHER users' stories
  const storyUsers: Array<{
    uid: string;
    userStories: Story[];
    displayName: string;
    avatarUrl: string | null;
    gender: string | null;
    tags: string[] | null;
  }> = [];

  for (const [uid, userStories] of grouped.entries()) {
    if (uid === userId) continue; // skip own — handled by avatar button
    const first = userStories[0];
    storyUsers.push({
      uid,
      userStories,
      displayName: first.display_name ?? 'Kasama',
      avatarUrl: first.avatar_url ?? null,
      gender: first.gender,
      tags: first.profile_tags,
    });
  }

  const bubbleSize = isMobile ? 44 : 48;
  const ringSize = bubbleSize + 6;

  // Clicking the main avatar area: view own stories if any, else open add modal
  const handleAvatarClick = () => {
    if (hasMyStories && onViewOwnStory) {
      onViewOwnStory(myStories);
    } else {
      onAddStory();
    }
  };

  // Clicking the + badge always opens add modal
  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddStory();
  };

  return (
    <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
      <style>{`
        .story-scroll::-webkit-scrollbar { display: none; }
        .story-item-btn { background: none; border: none; padding: 0; cursor: pointer; }
        .story-item-btn:active { opacity: 0.7; }
      `}</style>

      <div
        className="story-scroll"
        style={{ display: 'flex', gap: isMobile ? 8 : 12, padding: isMobile ? '4px 14px 8px' : '4px 18px 8px', minWidth: 'max-content' }}
      >
        {/* ── My avatar (single entry point for own stories) ── */}
        <button
          className="story-item-btn"
          onClick={handleAvatarClick}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          {/* Speech bubble space */}
          <div style={{ height: BUBBLE_RESERVE, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', alignItems: 'flex-start', paddingBottom: 8 }}>
            {myNote?.note_text && <SpeechBubble text={myNote.note_text} theme={T} />}
          </div>

          {/* Circle — gradient ring when has stories, plain border when not */}
          <div style={{
            width: ringSize, height: ringSize, borderRadius: '50%',
            padding: hasMyStories ? 2 : 0,
            background: hasMyStories
              ? `linear-gradient(135deg, ${T.highlight}, ${T.primary})`
              : 'transparent',
            border: hasMyStories ? 'none' : `2px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', flexShrink: 0,
          }}>
            <div style={{ width: bubbleSize, height: bubbleSize, borderRadius: '50%', overflow: 'hidden', background: T.primary, border: hasMyStories ? `2px solid ${T.surface}` : 'none', position: 'relative' }}>
              <img
                src={userAvatar ?? getDefaultAvatar(null, null)}
                alt={userName ?? 'Me'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(null, null); }}
              />
            </div>
            {/* + badge — always visible, always opens add modal */}
            <div
              onClick={handlePlusClick}
              style={{ position: 'absolute', bottom: -1, right: -1, width: 17, height: 17, borderRadius: '50%', background: T.primary, border: `2px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
            >
              <Plus size={9} color={T.bg} strokeWidth={3} />
            </div>
          </div>

          <span style={{ fontSize: 10, fontWeight: 600, color: hasMyStories ? T.primary : T.textMuted, whiteSpace: 'nowrap', fontFamily: '"DM Sans",system-ui,sans-serif', maxWidth: ringSize + 20, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
            {myNote ? 'Your note' : hasMyStories ? 'My story' : 'Add story'}
          </span>
        </button>

        {/* ── Other users' story bubbles ── */}
        {storyUsers.map(({ uid, userStories, displayName, avatarUrl, gender, tags }) => {
          const latestStory = userStories[0];
          const noteStory = userStories.find(s => s.type === 'note' && s.note_text);
          const isPhotoStory = latestStory.type === 'photo';
          const allSeen = seenStoryIds ? userStories.every(s => seenStoryIds.has(s.id)) : false;

          const ringBg = allSeen
            ? T.border
            : isPhotoStory
              ? `linear-gradient(135deg, ${T.accent}, ${T.primary})`
              : `linear-gradient(135deg, ${T.highlight}, ${T.accent})`;

          return (
            <button
              key={uid}
              className="story-item-btn"
              onClick={() => onViewStory(userStories, 0)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: allSeen ? 0.6 : 1, transition: 'opacity 200ms' }}
            >
              <div style={{ height: BUBBLE_RESERVE, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', alignItems: 'flex-start', paddingBottom: 8 }}>
                {noteStory?.note_text && <SpeechBubble text={noteStory.note_text} theme={T} />}
              </div>

              <div style={{
                width: ringSize, height: ringSize, borderRadius: '50%',
                padding: 2, background: ringBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: bubbleSize, height: bubbleSize, borderRadius: '50%', overflow: 'hidden', background: T.primary, border: `2px solid ${T.surface}`, position: 'relative' }}>
                  {isPhotoStory && latestStory.media_url ? (
                    <img src={latestStory.media_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img
                      src={avatarUrl || getDefaultAvatar(gender, tags)}
                      alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(gender, tags); }}
                    />
                  )}
                </div>
              </div>

              <span style={{ fontSize: 10, fontWeight: 600, color: allSeen ? T.textMuted : T.text, whiteSpace: 'nowrap', fontFamily: '"DM Sans",system-ui,sans-serif', maxWidth: ringSize + 20, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                {displayName.split(' ')[0]}
              </span>
            </button>
          );
        })}

        {/* Empty state — only when no other stories exist */}
        {storyUsers.length === 0 && !hasMyStories && (
          <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'flex-end', paddingBottom: 20, gap: 8, color: T.textMuted, fontSize: 12 }}>
            <span>No stories yet · Be the first!</span>
          </div>
        )}
      </div>
    </div>
  );
}
