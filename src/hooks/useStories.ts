import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/*
    Required Supabase setup — run once in SQL editor:

    create table if not exists public.stories (
      id          uuid primary key default gen_random_uuid(),
      user_id     uuid references auth.users(id) on delete cascade not null,
      type        text check (type in ('photo', 'note')) not null,
      media_url   text,
      note_text   text,
      theme_color text not null default '#043E81',
      created_at  timestamptz not null default now(),
      expires_at  timestamptz not null default (now() + interval '24 hours')
    );
    create index if not exists stories_expires_idx on public.stories (expires_at);
    alter table public.stories enable row level security;
    create policy "Read active stories" on public.stories
      for select using (expires_at > now());
    create policy "Manage own stories" on public.stories
      for all using (auth.uid() = user_id);

    -- Storage bucket (create manually in Supabase dashboard: "story-media", public)
    -- Then add policies:
    create policy "Public read story media"
      on storage.objects for select using (bucket_id = 'story-media');
    create policy "Auth upload story media"
      on storage.objects for insert
      with check (bucket_id = 'story-media' and auth.role() = 'authenticated');
    create policy "Auth delete own story media"
      on storage.objects for delete
      using (bucket_id = 'story-media' and auth.uid()::text = (storage.foldername(name))[1]);
*/

export interface Story {
  id: string;
  user_id: string;
  type: 'photo' | 'note';
  media_url: string | null;
  note_text: string | null;
  theme_color: string;
  created_at: string;
  expires_at: string;
  // joined from profiles
  display_name: string | null;
  gender: string | null;
  profile_tags: string[] | null;
}

export const NOTE_MAX_CHARS = 60;
export const PHOTO_MAX_MB = 20;        // raw input ceiling (MB) — anything bigger is likely not a photo
export const PHOTO_COMPRESSED_MB = 2;  // target after compression
export const MAX_PHOTO_STORIES = 3;    // max simultaneous photo stories per user
export const STORY_EXPIRE_HOURS = 24;

export const NOTE_COLORS = [
  { value: '#043E81', label: 'Ocean' },
  { value: '#9F5E0F', label: 'Amber' },
  { value: '#1C6E94', label: 'Teal' },
  { value: '#0E1B26', label: 'Midnight' },
  { value: '#7F3B19', label: 'Espresso' },
  { value: '#2E5748', label: 'Forest' },
  { value: '#D97706', label: 'Saffron' },
  { value: '#C82718', label: 'Crimson' },
];

async function compressToJpeg(file: File, maxBytes = 2 * 1024 * 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (file.size > maxBytes) {
        const scale = Math.sqrt(maxBytes / file.size);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('Compression failed'))),
        'image/jpeg',
        0.82,
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

export function useStories(userId?: string) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  // Use a ref so the guard doesn't stale-close over the state value
  const unavailableRef = useRef(false);

  const refresh = useCallback(async () => {
    if (unavailableRef.current) return;
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(
          'id, user_id, type, media_url, note_text, theme_color, created_at, expires_at, profiles!stories_user_id_fkey(display_name, gender, profile_tags)',
        )
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(80);

      // Only permanently disable if the table genuinely doesn't exist
      if (error?.code === '42P01') {
        unavailableRef.current = true;
        setAvailable(false);
        return;
      }
      // For any other error (RLS, network, join) just log and keep available
      if (error) {
        console.warn('[useStories] fetch error:', error.message);
        setLoading(false);
        return;
      }

      setStories(
        (data ?? []).map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          type: s.type,
          media_url: s.media_url ?? null,
          note_text: s.note_text ?? null,
          theme_color: s.theme_color ?? '#043E81',
          created_at: s.created_at,
          expires_at: s.expires_at,
          display_name: (s.profiles as any)?.display_name ?? null,
          gender: (s.profiles as any)?.gender ?? null,
          profile_tags: (s.profiles as any)?.profile_tags ?? null,
        })),
      );
    } catch (e: any) {
      // Network-level failure — don't permanently disable, just log
      console.warn('[useStories] unexpected error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      if (!userId) return 'Not signed in';
      if (file.size > PHOTO_MAX_MB * 1024 * 1024)
        return `Photo is too large (max ${PHOTO_MAX_MB}MB raw)`;

      // Enforce 3-photo limit per user
      const activePhotos = stories.filter(
        s => s.user_id === userId && s.type === 'photo',
      );
      if (activePhotos.length >= MAX_PHOTO_STORIES)
        return `You can only have ${MAX_PHOTO_STORIES} active photo stories at once. Delete one first.`;

      try {
        // Always compress to ≤ 2MB JPEG regardless of original size
        const blob = await compressToJpeg(file, PHOTO_COMPRESSED_MB * 1024 * 1024);
        const path = `${userId}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('story-media')
          .upload(path, blob, { contentType: 'image/jpeg' });
        if (upErr) throw upErr;

        const {
          data: { publicUrl },
        } = supabase.storage.from('story-media').getPublicUrl(path);

        const expires = new Date(
          Date.now() + STORY_EXPIRE_HOURS * 3_600_000,
        ).toISOString();
        const { error } = await supabase.from('stories').insert({
          user_id: userId,
          type: 'photo',
          media_url: publicUrl,
          theme_color: '#043E81',
          expires_at: expires,
        });
        if (error) throw error;
        await refresh();
        return null;
      } catch (e: any) {
        return e.message ?? 'Upload failed';
      }
    },
    [userId, stories, refresh],
  );

  const addNote = useCallback(
    async (text: string, color: string): Promise<string | null> => {
      if (!userId) return 'Not signed in';
      const trimmed = text.trim();
      if (!trimmed) return 'Note cannot be empty';
      if (trimmed.length > NOTE_MAX_CHARS)
        return `Max ${NOTE_MAX_CHARS} characters`;
      try {
        const expires = new Date(
          Date.now() + STORY_EXPIRE_HOURS * 3_600_000,
        ).toISOString();
        const { error } = await supabase.from('stories').insert({
          user_id: userId,
          type: 'note',
          note_text: trimmed,
          theme_color: color,
          expires_at: expires,
        });
        if (error) throw error;
        await refresh();
        return null;
      } catch (e: any) {
        return e.message ?? 'Failed to post';
      }
    },
    [userId, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await supabase.from('stories').delete().eq('id', id);
      setStories(prev => prev.filter(s => s.id !== id));
    },
    [],
  );

  const myStories = stories.filter(s => s.user_id === userId);

  return {
    stories,
    loading,
    available,
    myStories,
    addPhoto,
    addNote,
    remove,
    refresh,
  };
}

// Group stories by user, preserving insertion order per user
export function groupStoriesByUser(stories: Story[]): Map<string, Story[]> {
  const map = new Map<string, Story[]>();
  for (const s of stories) {
    const arr = map.get(s.user_id) ?? [];
    arr.push(s);
    map.set(s.user_id, arr);
  }
  return map;
}
