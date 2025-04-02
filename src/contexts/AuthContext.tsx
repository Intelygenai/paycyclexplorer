
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, Permission } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: UserRole.ADMIN,
    department: 'IT',
    permissions: Object.values(Permission),
  },
  {
    id: '2',
    email: 'requester@example.com',
    password: 'requester123',
    name: 'John Requester',
    role: UserRole.REQUESTER,
    department: 'Marketing',
    permissions: [Permission.CREATE_PR],
  },
  {
    id: '3',
    email: 'approver@example.com',
    password: 'approver123',
    name: 'Jane Approver',
    role: UserRole.APPROVER,
    department: 'Executive',
    permissions: [Permission.APPROVE_PR, Permission.APPROVE_PO],
  },
  {
    id: '4',
    email: 'procurement@example.com',
    password: 'procurement123',
    name: 'Sam Procurement',
    role: UserRole.PROCUREMENT_OFFICER,
    department: 'Procurement',
    permissions: [Permission.CREATE_PO, Permission.MANAGE_VENDORS],
  },
  {
    id: '5',
    email: 'warehouse@example.com',
    password: 'warehouse123',
    name: 'Terry Warehouse',
    role: UserRole.WAREHOUSE_OPERATOR,
    department: 'Operations',
    permissions: [Permission.RECEIVE_GOODS],
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (via session storage for demo)
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        sessionStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Invalid credentials');
      }

      // Remove password before storing
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Set the user in context
      setUser(userWithoutPassword);
      
      // Store in session storage for persistence
      sessionStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const hasPermission = (permission: Permission): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
