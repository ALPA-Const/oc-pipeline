import { createContext, useContext, useState, ReactNode } from 'react';

export type KPIFilterType = 
  | 'all'
  | 'opp_proposal'
  | 'opp_negotiation'
  | 'opp_award'
  | 'opp_lost'
  | 'opp_lead_gen'
  | 'joint_venture';

interface MapFilterContextType {
  selectedFilter: KPIFilterType;
  setSelectedFilter: (filter: KPIFilterType) => void;
  clearFilter: () => void;
}

const MapFilterContext = createContext<MapFilterContextType | undefined>(undefined);

export function MapFilterProvider({ children }: { children: ReactNode }) {
  const [selectedFilter, setSelectedFilter] = useState<KPIFilterType>('all');

  const clearFilter = () => setSelectedFilter('all');

  return (
    <MapFilterContext.Provider value={{ selectedFilter, setSelectedFilter, clearFilter }}>
      {children}
    </MapFilterContext.Provider>
  );
}

export function useMapFilter() {
  const context = useContext(MapFilterContext);
  if (context === undefined) {
    throw new Error('useMapFilter must be used within a MapFilterProvider');
  }
  return context;
}