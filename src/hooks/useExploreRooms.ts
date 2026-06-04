import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room, CategoryId } from '@/types';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface LocationGroup {
  name: string;
  count: number;
  lat: number | null;
  lng: number | null;
}

export function useExploreRooms(
  search: string,
  category: CategoryId | null,
  center: [number, number] | null,
  radiusKm: number,
) {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      setAllRooms((data as Room[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return allRooms.filter(room => {
      if (category && room.category !== category) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [room.name, room.description, room.location_name, room.host_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (center && room.location_lat != null && room.location_lng != null) {
        const dist = haversineKm(center[0], center[1], room.location_lat, room.location_lng);
        if (dist > radiusKm) return false;
      }

      return true;
    });
  }, [allRooms, search, category, center, radiusKm]);

  const locationGroups: LocationGroup[] = useMemo(() => {
    const map: Record<string, LocationGroup> = {};
    filtered.forEach(room => {
      const loc = room.location_name?.trim() || 'No location set';
      if (!map[loc]) {
        map[loc] = { name: loc, count: 0, lat: room.location_lat, lng: room.location_lng };
      }
      map[loc].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const roomsWithCoords = useMemo(
    () => filtered.filter(r => r.location_lat != null && r.location_lng != null),
    [filtered],
  );

  return { rooms: filtered, roomsWithCoords, locationGroups, loading, total: allRooms.length };
}
