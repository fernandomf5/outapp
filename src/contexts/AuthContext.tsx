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

  // Logout ao fechar a página (se não clicou em sair)
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Marca que a página está sendo fechada
      sessionStorage.setItem('page_closing', 'true');
    };

    const handleUnload = () => {
      // Ao fechar a página, faz logout
      navigator.sendBeacon && supabase.auth.signOut();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    // Limpa o flag ao carregar (significa que voltou/recarregou)
    sessionStorage.removeItem('page_closing');

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
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

      if (error) {
        console.error('Edge function error:', error);
        return { error: error.message || 'Erro ao criar conta. Verifique seus dados e tente novamente.' };
      }

      if (data?.error) {
        return { error: data.error };
      }

      return { 
        userId: data?.userId,
        needsVerification: data?.needsVerification 
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error.message || 'Erro ao criar conta. Verifique seus dados e tente novamente.' };
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

      if (error) {
        return { error: 'Email ou senha inválidos. Verifique seus dados e tente novamente.' };
      }

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
      return { error: 'Email ou senha inválidos. Verifique seus dados e tente novamente.' };
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
