import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        console.log('🔐 Auth state change:', event, sess?.user?.email);
        setSession(sess);
        setUser(sess?.user ?? null);
        
        if (sess?.user) {
          console.log('🔍 Checking admin role for user:', sess.user.id);
          // Check admin role synchronously to avoid race condition
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', sess.user.id);
          
          console.log('👥 User roles found:', roles);
          const isUserAdmin = roles?.some(r => r.role === 'admin') ?? false;
          console.log('🔰 Is admin?', isUserAdmin);
          setIsAdmin(isUserAdmin);
        } else {
          console.log('❌ No user session');
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // loading will be set by onAuthStateChange after role check
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        email: email,
        full_name: fullName
      });

      // Assign user role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'user'
      });

      // Create free trial subscription
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('plan_type', 'free_trial')
        .single();

      if (freePlan) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        await supabase.from('subscriptions').insert({
          user_id: data.user.id,
          plan_id: freePlan.id,
          status: 'active',
          expires_at: expiresAt.toISOString()
        });
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
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
