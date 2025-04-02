
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseRequisitionAPI, userAPI } from '@/services/api';
import { PRStatus } from '@/types/p2p';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';

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
  CheckCircle, 
  XCircle, 
  Loader2, 
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const PurchaseRequisitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  
  const { data: pr, isLoading, error } = useQuery({
    queryKey: ['purchaseRequisition', id],
    queryFn: () => purchaseRequisitionAPI.getById(id || ''),
    enabled: !!id,
  });
  
  // Query to check if user has approval rights for this PR
  const { data: approvalData } = useQuery({
    queryKey: ['approvalRights', id, user?.id],
    queryFn: async () => {
      if (!user || !pr) return { canApprove: false };
      
      // Admins can approve any PR
      if (hasPermission(Permission.APPROVE_PR)) {
        return { canApprove: true, isAdmin: true };
      }
      
      // Check if user is an approver for this cost center
      const approvers = await userAPI.getCostCenterApprovers(pr.costCenter);
      const userApprover = approvers.find(a => a.userId === user.id);
      
      if (!userApprover) return { canApprove: false };
      
      // Check if PR amount is within user's approval limit
      return { 
        canApprove: pr.totalAmount <= userApprover.approvalLimit,
        approvalLimit: userApprover.approvalLimit
      };
    },
    enabled: !!user && !!pr,
  });
  
  const approveMutation = useMutation({
    mutationFn: () => 
      purchaseRequisitionAPI.approve(id!, user!.id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisition', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
      toast({
        title: "PR Approved",
        description: "The purchase requisition has been approved successfully.",
      });
      setIsApproveDialogOpen(false);
      setComment('');
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: `Failed to approve PR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: () => 
      purchaseRequisitionAPI.reject(id!, user!.id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisition', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
      toast({
        title: "PR Rejected",
        description: "The purchase requisition has been rejected.",
      });
      setIsRejectDialogOpen(false);
      setComment('');
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: `Failed to reject PR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const convertToPOMutation = useMutation({
    mutationFn: () => 
      purchaseRequisitionAPI.convertToPO(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisition', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
      toast({
        title: "Converted to PO",
        description: `Purchase Order ${data.po.poNumber} created successfully.`,
      });
      setIsConvertDialogOpen(false);
      navigate(`/purchase-orders/${data.po.id}`);
    },
    onError: (error) => {
      toast({
        title: "Conversion Failed",
        description: `Failed to convert to PO: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
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
  
  const canApprove = (approvalData?.canApprove && pr.status === PRStatus.PENDING_APPROVAL);
  const canConvertToPO = (pr.status === PRStatus.APPROVED && hasPermission(Permission.CREATE_PO));
  const isPendingMyApproval = pr.status === PRStatus.PENDING_APPROVAL && 
    pr.approvers.some(a => a.id === user?.id && a.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/purchase-requisitions')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        </div>
        
        <div className="flex space-x-2">
          {canApprove && (
            <>
              <Button 
                variant="destructive"
                onClick={() => setIsRejectDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button 
                variant="default" 
                onClick={() => setIsApproveDialogOpen(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
            </>
          )}
          
          {canConvertToPO && (
            <Button 
              onClick={() => setIsConvertDialogOpen(true)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Convert to PO
            </Button>
          )}
        </div>
      </div>

      {isPendingMyApproval && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <p className="text-amber-800">
            This PR requires your approval. Please review the details and approve or reject.
          </p>
        </div>
      )}

      {approvalData && !approvalData.canApprove && pr.status === PRStatus.PENDING_APPROVAL && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-blue-500 mr-2" />
          <p className="text-blue-800">
            This PR is pending approval from an authorized approver.
          </p>
        </div>
      )}

      {approvalData?.approvalLimit && pr.totalAmount > approvalData.approvalLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <p className="text-amber-800">
            This PR exceeds your approval limit of ${approvalData.approvalLimit.toLocaleString()}.
          </p>
        </div>
      )}

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
      
      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Requisition</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this purchase requisition?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Comments (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any comments about your approval decision..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Requisition</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this purchase requisition.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason for Rejection <span className="text-red-500">*</span></label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain why this PR is being rejected..."
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => rejectMutation.mutate()} 
              disabled={rejectMutation.isPending || !comment.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Convert to PO Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Purchase Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to convert this approved purchase requisition to a purchase order?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => convertToPOMutation.mutate()} disabled={convertToPOMutation.isPending}>
              {convertToPOMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Convert to PO
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseRequisitionDetail;
