
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Permission } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Auth Pages
import Login from "@/pages/Auth/Login";

// App Pages
import Dashboard from "@/pages/Dashboard/Dashboard";
import PurchaseRequisitionList from "@/pages/PurchaseRequisitions/PurchaseRequisitionList";
import PurchaseRequisitionForm from "@/pages/PurchaseRequisitions/PurchaseRequisitionForm";
import PurchaseOrderList from "@/pages/PurchaseOrders/PurchaseOrderList";
import GoodsReceiptList from "@/pages/GoodsReceipt/GoodsReceiptList";
import VendorList from "@/pages/Vendors/VendorList";
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/purchase-requisitions" element={
              <ProtectedRoute>
                <PurchaseRequisitionList />
              </ProtectedRoute>
            } />
            
            <Route path="/purchase-requisitions/new" element={
              <ProtectedRoute>
                <PurchaseRequisitionForm />
              </ProtectedRoute>
            } />
            
            <Route path="/purchase-orders" element={
              <ProtectedRoute>
                <PurchaseOrderList />
              </ProtectedRoute>
            } />
            
            <Route path="/goods-receipt" element={
              <ProtectedRoute requiredPermissions={[Permission.RECEIVE_GOODS]}>
                <GoodsReceiptList />
              </ProtectedRoute>
            } />
            
            <Route path="/vendors" element={
              <ProtectedRoute>
                <VendorList />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
