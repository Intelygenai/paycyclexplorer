
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Permission } from '@/types/auth';
import { UserProfile } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
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
    console.log('Setting up auth state listener');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
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
      console.log('Existing session check:', session?.user?.email);
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
      console.log('Fetching user profile for:', userId);
      
      // Use raw query since we're working with custom types
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Even if there's an error, we should still set loading to false
        // and create a fallback profile so the app can continue functioning
        const fallbackProfile: UserProfile = {
          id: userId,
          email: state.user?.email || '',
          name: state.user?.user_metadata?.name || 'User',
          role: UserRole.REQUESTER, // Default role
          department: state.user?.user_metadata?.department || '',
        };
        
        setState(prev => ({ 
          ...prev, 
          profile: fallbackProfile,
          loading: false 
        }));
        
        // Show a toast notification about the error
        toast({
          title: "Profile loading issue",
          description: "Using temporary profile data. Some features may be limited.",
          variant: "destructive",
        });
        
        return;
      }

      if (data) {
        console.log('User profile fetched:', data);
        const profile: UserProfile = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          department: data.department,
          created_at: data.created_at,
          updated_at: data.updated_at
        };

        setState(prev => ({ 
          ...prev, 
          profile,
          loading: false 
        }));
      } else {
        // No data found, create a fallback profile
        const fallbackProfile: UserProfile = {
          id: userId,
          email: state.user?.email || '',
          name: state.user?.user_metadata?.name || 'User',
          role: UserRole.REQUESTER, // Default role
          department: state.user?.user_metadata?.department || '',
        };
        
        setState(prev => ({ 
          ...prev, 
          profile: fallbackProfile,
          loading: false 
        }));
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false,
        // Set a fallback profile so the UI doesn't break
        profile: {
          id: userId,
          email: state.user?.email || '',
          name: state.user?.user_metadata?.name || 'User',
          role: UserRole.REQUESTER, // Default role
          department: state.user?.user_metadata?.department || '',
        }
      }));
    }
  };

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('Attempting to login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Login successful:', data);
      // We don't need to set state here as the onAuthStateChange listener will handle it
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
      console.log('Attempting to signup with:', email);
      const { data, error } = await supabase.auth.signUp({
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

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      console.log('Signup successful:', data);

      if (data.user) {
        // Create a profile for the new user
        const profileData = {
          id: data.user.id,
          email,
          name,
          department,
          role
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
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
    // Make sure it works even if there's an issue with the profile
    if (!state.profile) return false;
    
    // Return true for admins, otherwise check specific permissions
    return state.profile.role === UserRole.ADMIN || 
           getRolePermissions(state.profile.role as UserRole).includes(permission);
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
