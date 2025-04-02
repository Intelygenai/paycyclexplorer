
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Permission } from '@/types/auth';
import Layout from './Layout/Layout';

interface SupabaseProtectedRouteProps {
  children: JSX.Element;
  requiredPermission?: Permission;
}

const SupabaseProtectedRoute = ({ 
  children, 
  requiredPermission 
}: SupabaseProtectedRouteProps) => {
  const { profile, session, loading, hasPermission } = useSupabaseAuth();
  const location = useLocation();

  // Check if user has required permission
  const hasRequiredPermission = !requiredPermission || 
    hasPermission(requiredPermission);

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!session || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If doesn't have permissions, show unauthorized
  if (requiredPermission && !hasRequiredPermission) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page</p>
        </div>
      </Layout>
    );
  }

  // All good, render the children
  return children;
};

export default SupabaseProtectedRoute;
