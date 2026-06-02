import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { getSeasonFromDate, seasonOrder, type SeasonKey } from '@/constants/truefeed';

function isSeasonKey(value: unknown): value is SeasonKey {
  return typeof value === 'string' && seasonOrder.includes(value as SeasonKey);
}

export function useGlobalSeason() {
  const params = useLocalSearchParams<{ season?: string | string[] }>();

  const selectedSeason = useMemo<SeasonKey>(() => {
    const seasonParam = Array.isArray(params.season) ? params.season[0] : params.season;

    return isSeasonKey(seasonParam) ? seasonParam : getSeasonFromDate();
  }, [params.season]);

  function setSelectedSeason(season: SeasonKey) {
    router.setParams({ season });
  }

  return {
    selectedSeason,
    setSelectedSeason,
  };
}
