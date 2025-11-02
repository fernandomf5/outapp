import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  customSignUp: (email: string, password: string, fullName: string) => Promise<{ error?: string; userId?: string; needsVerification?: boolean }>;
  customSignIn: (email: string, password: string) => Promise<{ error?: string; needsVerification?: boolean; userId?: string; requires2FA?: boolean; deviceFingerprint?: string; sessionData?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auto logout após 30 minutos de inatividade
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: NodeJS.Timeout;
    let debounceTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(async () => {
          console.log('Auto logout por inatividade');
          await supabase.auth.signOut();
        }, 30 * 60 * 1000); // 30 minutos
      }, 100); // Debounce de 100ms
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click', 'input'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(debounceTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);
        
        if (sess?.user) {
          // Check admin role after state is set
          setTimeout(async () => {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', sess.user.id);
            
            setIsAdmin(roles?.some(r => r.role === 'admin') ?? false);
          }, 100);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
          
          setIsAdmin(roles?.some(r => r.role === 'admin') ?? false);
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const customSignUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-auth', {
        body: {
          action: 'register',
          email,
          password,
          name: fullName,
        }
      });

      if (error) throw error;

      if (data.error) {
        return { error: data.error };
      }

      return { 
        userId: data.userId,
        needsVerification: data.needsVerification 
      };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const customSignIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-auth', {
        body: {
          action: 'login',
          email,
          password,
          userAgent: navigator.userAgent,
        }
      });

      if (error) throw error;

      if (data.error) {
        return { 
          error: data.error,
          needsVerification: data.needsVerification,
          userId: data.userId
        };
      }

      // Check if 2FA is required (returned directly from edge function now)
      if (data.requires2FA) {
        return { 
          requires2FA: true,
          userId: data.userId,
          deviceFingerprint: data.deviceFingerprint,
          sessionData: data.sessionData
        };
      }

      // Only set session if 2FA is not required
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Limpar estado local
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, customSignUp, customSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
