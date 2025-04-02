import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';
import { Navigate } from 'react-router-dom';

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

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CostCenterApprover {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  costCenter: string;
  approvalLimit: number;
}

interface CostCenterApproverFormValues {
  userId: string;
  costCenter: string;
  approvalLimit: number;
}

const CostCenterApprovers = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<CostCenterApprover | null>(null);

  const form = useForm<CostCenterApproverFormValues>({
    defaultValues: {
      userId: '',
      costCenter: '',
      approvalLimit: 10000,
    }
  });

  // Check admin permission
  if (!hasPermission(Permission.MANAGE_USERS)) {
    return <Navigate to="/dashboard" />;
  }

  // Get cost center approvers
  const { data: approvers = [], isLoading: isLoadingApprovers } = useQuery({
    queryKey: ['costCenterApprovers'],
    queryFn: () => userAPI.getCostCenterApprovers(),
  });

  // Get cost centers
  const { data: costCenters = [] } = useQuery({
    queryKey: ['costCenters'],
    queryFn: () => ['CC001', 'CC002', 'CC003', 'CC004', 'CC005'],
  });

  // Get users who can be approvers
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.getApprovers(),
  });

  const createApproverMutation = useMutation({
    mutationFn: userAPI.createCostCenterApprover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenterApprovers'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Approver added",
        description: "Cost center approver has been added successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add approver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const updateApproverMutation = useMutation({
    mutationFn: userAPI.updateCostCenterApprover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenterApprovers'] });
      setIsAddDialogOpen(false);
      setSelectedApprover(null);
      form.reset();
      toast({
        title: "Approver updated",
        description: "Cost center approver has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update approver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const deleteApproverMutation = useMutation({
    mutationFn: (id: string) => userAPI.deleteCostCenterApprover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenterApprovers'] });
      toast({
        title: "Approver removed",
        description: "Cost center approver has been removed successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove approver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Set form values when editing an existing approver
  useEffect(() => {
    if (selectedApprover) {
      form.setValue('userId', selectedApprover.userId);
      form.setValue('costCenter', selectedApprover.costCenter);
      form.setValue('approvalLimit', selectedApprover.approvalLimit);
    } else {
      form.reset();
    }
  }, [selectedApprover, form]);

  const onSubmit = (values: CostCenterApproverFormValues) => {
    if (selectedApprover) {
      updateApproverMutation.mutate({
        id: selectedApprover.id,
        ...values
      });
    } else {
      createApproverMutation.mutate(values);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setSelectedApprover(null);
      form.reset();
    }
  };

  const editApprover = (approver: CostCenterApprover) => {
    setSelectedApprover(approver);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Center Approvers</h1>
          <p className="text-muted-foreground">
            Manage approvers for different cost centers
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Approver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedApprover ? 'Edit Approver' : 'Add New Approver'}</DialogTitle>
              <DialogDescription>
                {selectedApprover ? 'Update approver details' : 'Assign a user to approve purchase requisitions for a cost center.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approver</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        disabled={selectedApprover !== null}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an approver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The user who will approve purchase requisitions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costCenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Center</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a cost center" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {costCenters.map((costCenter) => (
                            <SelectItem key={costCenter} value={costCenter}>
                              {costCenter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The cost center this user can approve requisitions for.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approvalLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approval Limit ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum amount this user can approve (in USD).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createApproverMutation.isPending || updateApproverMutation.isPending}>
                    {(createApproverMutation.isPending || updateApproverMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {selectedApprover ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      selectedApprover ? 'Update Approver' : 'Add Approver'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoadingApprovers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : approvers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approvers have been assigned yet. Add an approver to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Approver Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cost Center</TableHead>
                  <TableHead className="text-right">Approval Limit ($)</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvers.map((approver) => (
                  <TableRow key={approver.id}>
                    <TableCell>{approver.userName}</TableCell>
                    <TableCell>{approver.userEmail}</TableCell>
                    <TableCell>{approver.costCenter}</TableCell>
                    <TableCell className="text-right">${approver.approvalLimit.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editApprover(approver)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteApproverMutation.mutate(approver.id)}
                          disabled={deleteApproverMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CostCenterApprovers;
