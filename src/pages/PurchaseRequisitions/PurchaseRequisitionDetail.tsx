
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { purchaseRequisitionAPI } from '@/services/api';
import { PRStatus } from '@/types/p2p';
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
import { ArrowLeft, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PurchaseRequisitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: pr, isLoading, error } = useQuery({
    queryKey: ['purchaseRequisition', id],
    queryFn: () => purchaseRequisitionAPI.getById(id || ''),
    enabled: !!id,
  });
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4">Loading purchase requisition details...</p>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/purchase-requisitions')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <XCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold mt-4">Purchase Requisition Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The purchase requisition you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBadgeVariant = (status: PRStatus) => {
    switch (status) {
      case PRStatus.DRAFT: return "bg-status-draft text-white";
      case PRStatus.PENDING_APPROVAL: return "bg-status-pending text-white";
      case PRStatus.APPROVED: return "bg-status-approved text-white";
      case PRStatus.REJECTED: return "bg-status-rejected text-white";
      case PRStatus.CONVERTED_TO_PO: return "bg-status-processing text-white";
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
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/purchase-requisitions')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        </div>
        
        {pr.status === PRStatus.APPROVED && (
          <Button>
            Convert to Purchase Order
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Purchase Requisition {pr.id}
            </CardTitle>
            <CardDescription>Created on {formatDate(pr.dateCreated)}</CardDescription>
          </div>
          <Badge className={`${getBadgeVariant(pr.status)} py-1 px-3 text-sm`}>
            {pr.status}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Requester</h3>
              <p>{pr.requester.name}</p>
              <p className="text-sm text-muted-foreground">{pr.requester.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
              <p>{pr.department}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Date Needed</h3>
              <p>{formatDate(pr.dateNeeded)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Cost Center</h3>
              <p>{pr.costCenter}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Budget Code</h3>
              <p>{pr.budgetCode}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
              <p className="font-semibold">${pr.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Justification</h3>
            <p className="bg-muted p-3 rounded-md">{pr.justification}</p>
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
                  {pr.lineItems.map((item) => (
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
                    <TableCell className="text-right font-bold">${pr.totalAmount.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          {pr.status !== PRStatus.DRAFT && (
            <>
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Approval Status</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pr.approvers.map((approver) => (
                        <TableRow key={approver.id}>
                          <TableCell>{approver.name}</TableCell>
                          <TableCell>Approver</TableCell>
                          <TableCell>
                            <Badge
                              className={`
                                ${approver.status === 'APPROVED' ? 'bg-status-approved text-white' : 
                                  approver.status === 'REJECTED' ? 'bg-status-rejected text-white' : 
                                  'bg-status-pending text-white'} 
                                py-0.5
                              `}
                            >
                              {approver.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{approver.date ? formatDate(approver.date) : '-'}</TableCell>
                          <TableCell>{approver.comment || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseRequisitionDetail;
