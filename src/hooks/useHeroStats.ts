import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/data/themes';

interface HeroStats {
  activeMembers: number;
  activeRooms: number;
  activeCategories: number;
}

export function useHeroStats() {
  const [stats, setStats] = useState<HeroStats>({ activeMembers: 0, activeRooms: 0, activeCategories: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const [membersRes, roomsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('profile_completed', true).eq('show_in_discover', true),
      supabase.from('rooms').select('category').eq('status', 'live'),
    ]);

    const liveIds = new Set(CATEGORIES.filter(c => c.status === 'live').map(c => c.id));
    const categoriesWithRooms = new Set<string>(
      (roomsRes.data ?? []).map((r: any) => r.category).filter((cat: string) => liveIds.has(cat))
    );

    setStats({
      activeMembers: membersRes.count ?? 0,
      activeRooms: (roomsRes.data ?? []).length,
      activeCategories: categoriesWithRooms.size,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel('hero-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { stats, loading };
}
