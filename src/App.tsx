
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { Permission } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import SupabaseProtectedRoute from "@/components/SupabaseProtectedRoute";

// Auth Pages
import Login from "@/pages/Auth/Login";
import SupabaseLogin from "@/pages/Auth/SupabaseLogin";

// App Pages
import Dashboard from "@/pages/Dashboard/Dashboard";
import PurchaseRequisitionList from "@/pages/PurchaseRequisitions/PurchaseRequisitionList";
import PurchaseRequisitionForm from "@/pages/PurchaseRequisitions/PurchaseRequisitionForm";
import PurchaseRequisitionDetail from "@/pages/PurchaseRequisitions/PurchaseRequisitionDetail";
import PurchaseOrderList from "@/pages/PurchaseOrders/PurchaseOrderList";
import PurchaseOrderDetail from "@/pages/PurchaseOrders/PurchaseOrderDetail";
import GoodsReceiptList from "@/pages/GoodsReceipt/GoodsReceiptList";
import VendorList from "@/pages/Vendors/VendorList";
import CostCenterApprovers from "@/pages/Admin/CostCenterApprovers"; 
import Settings from "@/pages/Settings/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<SupabaseLogin />} />
              <Route path="/legacy-login" element={<Login />} />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <SupabaseProtectedRoute>
                  <Dashboard />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/purchase-requisitions" element={
                <SupabaseProtectedRoute>
                  <PurchaseRequisitionList />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/purchase-requisitions/new" element={
                <SupabaseProtectedRoute>
                  <PurchaseRequisitionForm />
                </SupabaseProtectedRoute>
              } />

              <Route path="/purchase-requisitions/:id" element={
                <SupabaseProtectedRoute>
                  <PurchaseRequisitionDetail />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/purchase-orders" element={
                <SupabaseProtectedRoute>
                  <PurchaseOrderList />
                </SupabaseProtectedRoute>
              } />
              
              {/* Add missing route for PurchaseOrderDetail */}
              <Route path="/purchase-orders/:id" element={
                <SupabaseProtectedRoute>
                  <PurchaseOrderDetail />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/goods-receipt" element={
                <SupabaseProtectedRoute requiredPermission={Permission.RECEIVE_GOODS}>
                  <GoodsReceiptList />
                </SupabaseProtectedRoute>
              } />
              
              <Route path="/vendors" element={
                <SupabaseProtectedRoute>
                  <VendorList />
                </SupabaseProtectedRoute>
              } />
              
              {/* Settings Route */}
              <Route path="/settings" element={
                <SupabaseProtectedRoute>
                  <Settings />
                </SupabaseProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/approvers" element={
                <SupabaseProtectedRoute requiredPermission={Permission.MANAGE_USERS}>
                  <CostCenterApprovers />
                </SupabaseProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
);

export default App;
