import { useQuery } from '@tanstack/react-query'
import { fetchStop } from '../api/stops'

// Looks up a stop by its id, to show its name. Pass null to look up nothing.
export function useStop(stopId: number | null) {
  return useQuery({
    queryKey: ['stop', stopId],
    queryFn: () => fetchStop(stopId ?? 0),
    enabled: stopId !== null,
    // A stop does not change its name during a visit, so one lookup is enough.
    staleTime: Infinity,
  })
}
