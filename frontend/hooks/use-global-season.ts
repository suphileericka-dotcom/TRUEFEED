import { createContext, createElement, useContext, useState, type ReactNode } from 'react';

import { getSeasonFromDate, type SeasonKey } from '@/constants/truefeed';

type GlobalSeasonContextValue = {
  selectedSeason: SeasonKey;
  setSelectedSeason: (season: SeasonKey) => void;
};

const GlobalSeasonContext = createContext<GlobalSeasonContextValue | null>(null);

export function GlobalSeasonProvider({ children }: { children: ReactNode }) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>(getSeasonFromDate());

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
      selectedSeason: getSeasonFromDate(),
      setSelectedSeason: () => undefined,
    };
  }

  return context;
}
