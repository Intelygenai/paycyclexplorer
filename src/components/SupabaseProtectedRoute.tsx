
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Permission } from '@/types/auth';
import Layout from './Layout/Layout';
import { Loader2 } from 'lucide-react';

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Even if profile is not fully loaded, we'll allow access to basic pages
  // but show unauthorized for pages that require specific permissions
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

  // Wrap the children in Layout
  return <Layout>{children}</Layout>;
};

export default SupabaseProtectedRoute;
