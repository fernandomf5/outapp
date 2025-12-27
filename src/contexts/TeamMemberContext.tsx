import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMemberPermission {
  module_key: string;
  action: 'create' | 'read' | 'update' | 'delete';
  is_allowed: boolean;
  restrictions: Record<string, any>;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  adminUserId: string;
  adminName: string;
}

interface TeamMemberContextType {
  isTeamMember: boolean;
  teamMember: TeamMember | null;
  permissions: TeamMemberPermission[];
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (moduleKey: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
  getModuleRestrictions: (moduleKey: string) => Record<string, any>;
  canAccessModule: (moduleKey: string) => boolean;
}

const TeamMemberContext = createContext<TeamMemberContextType | undefined>(undefined);

const STORAGE_KEY = 'team_member_session';

export function TeamMemberProvider({ children }: { children: ReactNode }) {
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [permissions, setPermissions] = useState<TeamMemberPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      if (!storedSession) {
        setLoading(false);
        return;
      }

      const { token, expiresAt } = JSON.parse(storedSession);
      
      // Check if expired locally first
      if (new Date(expiresAt) < new Date()) {
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
        return;
      }

      // Validate with server
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: { action: 'validate', token }
      });

      if (error || !data?.valid) {
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
        return;
      }

      setIsTeamMember(true);
      setTeamMember(data.teamMember);
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error validating team member session:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('team-member-auth', {
        body: { action: 'login', username, password }
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Não foi possível conectar ao servidor. Tente novamente.' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Credenciais inválidas' };
      }

      // Store session
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        token: data.token,
        expiresAt: data.expiresAt
      }));

      setIsTeamMember(true);
      setTeamMember(data.teamMember);
      setPermissions(data.permissions || []);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao realizar login. Tente novamente.' };
    }
  };

  const logout = async () => {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      if (storedSession) {
        const { token } = JSON.parse(storedSession);
        await supabase.functions.invoke('team-member-auth', {
          body: { action: 'logout', token }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setIsTeamMember(false);
      setTeamMember(null);
      setPermissions([]);
    }
  };

  const hasPermission = (moduleKey: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (!isTeamMember) return true; // Regular users have all permissions
    return permissions.some(p => 
      p.module_key === moduleKey && 
      p.action === action && 
      p.is_allowed
    );
  };

  const getModuleRestrictions = (moduleKey: string): Record<string, any> => {
    if (!isTeamMember) return {};
    const modulePerms = permissions.filter(p => p.module_key === moduleKey);
    const restrictions: Record<string, any> = {};
    modulePerms.forEach(p => {
      if (p.restrictions) {
        Object.assign(restrictions, p.restrictions);
      }
    });
    return restrictions;
  };

  const canAccessModule = (moduleKey: string): boolean => {
    if (!isTeamMember) return true; // Regular users have all access
    // Check if at least has read permission
    return hasPermission(moduleKey, 'read');
  };

  return (
    <TeamMemberContext.Provider value={{
      isTeamMember,
      teamMember,
      permissions,
      loading,
      login,
      logout,
      hasPermission,
      getModuleRestrictions,
      canAccessModule
    }}>
      {children}
    </TeamMemberContext.Provider>
  );
}

export function useTeamMember() {
  const context = useContext(TeamMemberContext);
  if (context === undefined) {
    throw new Error('useTeamMember must be used within a TeamMemberProvider');
  }
  return context;
}