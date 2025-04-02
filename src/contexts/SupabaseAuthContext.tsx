
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Permission } from '@/types/auth';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  permissions: Permission[];
}

interface SupabaseAuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, department: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// Helper function to determine permissions based on role
const getRolePermissions = (role: UserRole): Permission[] => {
  switch (role) {
    case UserRole.ADMIN:
      return Object.values(Permission);
    case UserRole.REQUESTER:
      return [Permission.CREATE_PR];
    case UserRole.APPROVER:
      return [Permission.APPROVE_PR, Permission.APPROVE_PO];
    case UserRole.PROCUREMENT_OFFICER:
      return [Permission.CREATE_PO, Permission.MANAGE_VENDORS];
    case UserRole.WAREHOUSE_OPERATOR:
      return [Permission.RECEIVE_GOODS];
    case UserRole.FINANCE:
      return [Permission.VIEW_REPORTS];
    default:
      return [];
  }
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ ...prev, session, user: session?.user || null }));
        
        // If we have a user, fetch their profile 
        if (session?.user) {
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setState(prev => ({ ...prev, profile: null }));
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user || null }));
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    })
    .finally(() => {
      setState(prev => ({ ...prev, loading: false }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setState(prev => ({ 
          ...prev, 
          profile: null,
          loading: false 
        }));
        return;
      }

      if (data) {
        const profile: UserProfile = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          department: data.department,
          permissions: getRolePermissions(data.role as UserRole)
        };

        setState(prev => ({ 
          ...prev, 
          profile,
          loading: false 
        }));
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    name: string, 
    department: string, 
    role: UserRole
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            department,
            role
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Signup error:', error);
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // Auth state listener will handle state update
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return state.profile?.permissions.includes(permission) || false;
  };

  return (
    <SupabaseAuthContext.Provider 
      value={{ 
        ...state,
        login, 
        signup,
        logout, 
        hasPermission 
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): SupabaseAuthContextType => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
