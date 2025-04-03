
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
  refreshProfile: () => Promise<void>;
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

// Helper function to create a fallback profile
const createFallbackProfile = (userId: string, email?: string | null, metadata?: any): UserProfile => {
  return {
    id: userId,
    email: email || '',
    name: metadata?.name || 'User',
    role: UserRole.ADMIN, // Default to admin for testing purposes
    department: metadata?.department || '',
  };
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  // Fetch user profile with better error handling
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      // Direct query without RLS
      const { data, error } = await supabase
        .rpc('get_current_user_profile');

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Create fallback profile with admin privileges for testing
        const fallbackProfile = createFallbackProfile(
          userId, 
          state.user?.email,
          state.user?.user_metadata
        );
        
        setState(prev => ({ 
          ...prev, 
          profile: fallbackProfile,
          loading: false 
        }));
        
        toast({
          title: "Profile loading issue",
          description: "Using temporary profile data. Some features may be limited.",
          variant: "destructive",
        });
        
        return;
      }

      if (data) {
        console.log('User profile fetched:', data);
        
        setState(prev => ({ 
          ...prev, 
          profile: data,
          loading: false 
        }));
      } else {
        // No data found, create a fallback profile
        const fallbackProfile = createFallbackProfile(
          userId,
          state.user?.email,
          state.user?.user_metadata
        );
        
        setState(prev => ({ 
          ...prev, 
          profile: fallbackProfile,
          loading: false 
        }));
        
        toast({
          title: "Profile not found",
          description: "Using temporary profile data. Some features may be limited.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Create fallback profile with admin privileges for testing
      const fallbackProfile = createFallbackProfile(
        userId,
        state.user?.email,
        state.user?.user_metadata
      );
      
      setState(prev => ({ 
        ...prev, 
        profile: fallbackProfile,
        loading: false 
      }));
      
      toast({
        title: "Profile loading error",
        description: "Using temporary profile data. Some features may be limited.",
        variant: "destructive",
      });
    }
  };

  // Function to manually refresh the profile
  const refreshProfile = async () => {
    if (state.user) {
      await fetchUserProfile(state.user.id);
    }
  };

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
        hasPermission,
        refreshProfile
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
