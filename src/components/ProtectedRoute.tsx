
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';
import Layout from './Layout/Layout';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredPermissions?: Permission[];
}

const ProtectedRoute = ({ children, requiredPermissions = [] }: ProtectedRouteProps) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  // Check if user has required permissions
  const hasRequiredPermissions = requiredPermissions.length === 0 || 
    requiredPermissions.every(permission => hasPermission(permission));

  // If still loading auth state, show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If doesn't have permissions, show unauthorized
  if (!hasRequiredPermissions) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page</p>
        </div>
      </Layout>
    );
  }

  // All good, render the children wrapped in the layout
  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
