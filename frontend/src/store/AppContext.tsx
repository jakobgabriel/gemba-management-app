import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.js';
import type { Workstation, Category, Area, Team, Shift, Operator } from '../types/index.js';

interface AppContextValue {
  currentView: string;
  setCurrentView: (view: string) => void;
  workstations: Workstation[];
  categories: Category[];
  areas: Area[];
  teams: Team[];
  shifts: Shift[];
  operators: Operator[];
  configLoading: boolean;
  configError: string | null;
  refreshConfig: () => Promise<void>;
  reloadConfig: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const [wsRes, catRes, areaRes, teamRes, shiftRes, opRes] = await Promise.all([
        api.getWorkstations(),
        api.getCategories(),
        api.getAreas(),
        api.getTeams(),
        api.getShifts(),
        api.getOperators(),
      ]);
      setWorkstations(wsRes.data || []);
      setCategories(catRes.data || []);
      setAreas(areaRes.data || []);
      setTeams(teamRes.data || []);
      setShifts(shiftRes.data || []);
      setOperators(opRes.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load config';
      setConfigError(msg);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshConfig();
    } else {
      setWorkstations([]); setCategories([]); setAreas([]);
      setTeams([]); setShifts([]); setOperators([]);
      setConfigError(null);
    }
  }, [isAuthenticated, refreshConfig]);

  const value = useMemo<AppContextValue>(() => ({
    currentView, setCurrentView,
    workstations, categories, areas, teams, shifts, operators,
    configLoading, configError, refreshConfig, reloadConfig: refreshConfig,
  }), [currentView, workstations, categories, areas, teams, shifts, operators, configLoading, configError, refreshConfig]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
