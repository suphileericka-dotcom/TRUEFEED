import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';

import { getSeasonFromDate, type SeasonKey } from '@/constants/truefeed';

type GlobalSeasonContextValue = {
  selectedSeason: SeasonKey;
  setSelectedSeason: (season: SeasonKey) => void;
};

const GlobalSeasonContext = createContext<GlobalSeasonContextValue | null>(null);

export function GlobalSeasonProvider({ children }: { children: ReactNode }) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>('summer');

  useEffect(() => {
    setSelectedSeason(getSeasonFromDate());
  }, []);

  return createElement(
    GlobalSeasonContext.Provider,
    { value: { selectedSeason, setSelectedSeason } },
    children,
  );
}

export function useGlobalSeason() {
  const context = useContext(GlobalSeasonContext);

  if (!context) {
    return {
      selectedSeason: 'summer' as SeasonKey,
      setSelectedSeason: () => undefined,
    };
  }

  return context;
}
