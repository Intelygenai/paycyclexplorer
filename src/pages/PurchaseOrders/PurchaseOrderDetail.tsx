
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { purchaseOrderAPI } from '@/services/api';
import { POStatus } from '@/types/p2p';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileText, 
  Loader2,
  ShoppingBag
} from 'lucide-react';

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: po, isLoading, error } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => purchaseOrderAPI.getById(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4">Loading purchase order details...</p>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="text-destructive">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold mt-4">Purchase Order Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The purchase order you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBadgeVariant = (status: POStatus) => {
    switch (status) {
      case POStatus.DRAFT: return "bg-status-draft text-white";
      case POStatus.PENDING_APPROVAL: return "bg-status-pending text-white";
      case POStatus.APPROVED: return "bg-status-approved text-white";
      case POStatus.REJECTED: return "bg-status-rejected text-white";
      case POStatus.SENT_TO_VENDOR: return "bg-status-processing text-white";
      case POStatus.PARTIALLY_FULFILLED: return "bg-blue-500 text-white";
      case POStatus.COMPLETED: return "bg-green-700 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Purchase Order {po.poNumber}
            </CardTitle>
            <CardDescription>Created on {formatDate(po.dateCreated)}</CardDescription>
          </div>
          <Badge className={`${getBadgeVariant(po.status)} py-1 px-3 text-sm`}>
            {po.status}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Vendor</h3>
              <p>{po.vendor.name}</p>
              <p className="text-sm text-muted-foreground">{po.vendor.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
              <p>{po.vendor.contactPerson}</p>
              <p className="text-sm text-muted-foreground">{po.vendor.phone}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Required Date</h3>
              <p>{formatDate(po.requiredDate)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Shipping Address</h3>
              <p>{po.shippingAddress}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Billing Address</h3>
              <p>{po.billingAddress}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
              <p className="font-semibold">${po.totalAmount.toLocaleString()} {po.currency}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Line Items</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${item.totalPrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">Total:</TableCell>
                    <TableCell className="text-right font-bold">${po.totalAmount.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          {po.prId && (
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate(`/purchase-requisitions/${po.prId}`)}>
                <FileText className="mr-2 h-4 w-4" />
                View Original Purchase Requisition
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;
