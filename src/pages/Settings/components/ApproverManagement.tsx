
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface ApproverFormValues {
  userId: string;
  costCenter: string;
  approvalLimit: number;
}

interface ApproverManagementProps {
  costCenters: any[];
}

const ApproverManagement = ({ costCenters = [] }: ApproverManagementProps) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<any>(null);

  const createForm = useForm<ApproverFormValues>({
    defaultValues: {
      userId: '',
      costCenter: '',
      approvalLimit: 10000
    }
  });

  const editForm = useForm<ApproverFormValues>({
    defaultValues: {
      userId: '',
      costCenter: '',
      approvalLimit: 10000
    }
  });

  // Fetch approvers
  const { data: approvers = [], isLoading: isLoadingApprovers } = useQuery({
    queryKey: ['cost-center-approvers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_center_approvers')
        .select(`
          id,
          user_id,
          user_name,
          user_email,
          cost_center,
          approval_limit
        `);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch eligible users for approvers (ADMIN, APPROVER roles)
  const { data: eligibleUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['eligible-approvers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, email, role')
        .in('role', ['ADMIN', 'APPROVER']);

      if (error) throw error;
      return data || [];
    },
  });

  // Create approver
  const createApproverMutation = useMutation({
    mutationFn: async (values: ApproverFormValues) => {
      // Find the user details first
      const user = eligibleUsers.find(u => u.id === values.userId);
      if (!user) throw new Error("User not found");
      
      const { data, error } = await supabase
        .from('cost_center_approvers')
        .insert([{
          user_id: values.userId,
          user_name: user.name,
          user_email: user.email,
          cost_center: values.costCenter,
          approval_limit: values.approvalLimit
        }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-center-approvers'] });
      setIsAddDialogOpen(false);
      createForm.reset();
      toast({
        title: "Approver added",
        description: "The approver has been assigned to the cost center successfully."
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

  // Update approver
  const updateApproverMutation = useMutation({
    mutationFn: async (values: ApproverFormValues & { id: string }) => {
      const { data, error } = await supabase
        .from('cost_center_approvers')
        .update({
          cost_center: values.costCenter,
          approval_limit: values.approvalLimit
        })
        .eq('id', values.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-center-approvers'] });
      setIsEditDialogOpen(false);
      setSelectedApprover(null);
      editForm.reset();
      toast({
        title: "Approver updated",
        description: "The approver's settings have been updated successfully."
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

  // Delete approver
  const deleteApproverMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('cost_center_approvers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-center-approvers'] });
      toast({
        title: "Approver removed",
        description: "The approver has been removed from the cost center."
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

  const handleCreateApprover = (values: ApproverFormValues) => {
    createApproverMutation.mutate(values);
  };

  const handleUpdateApprover = (values: ApproverFormValues) => {
    if (!selectedApprover) return;
    
    updateApproverMutation.mutate({
      id: selectedApprover.id,
      ...values
    });
  };

  const handleDeleteApprover = (id: string) => {
    if (confirm('Are you sure you want to remove this approver?')) {
      deleteApproverMutation.mutate(id);
    }
  };

  const openEditDialog = (approver: any) => {
    setSelectedApprover(approver);
    editForm.setValue('userId', approver.user_id);
    editForm.setValue('costCenter', approver.cost_center);
    editForm.setValue('approvalLimit', approver.approval_limit);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cost Center Approvers</CardTitle>
          <CardDescription>
            Manage approvers for different cost centers
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Approver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Cost Center Approver</DialogTitle>
              <DialogDescription>
                Assign a user to approve purchase requisitions for a cost center.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateApprover)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approver</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an approver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>Loading users...</SelectItem>
                          ) : eligibleUsers.map((user) => (
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
                  control={createForm.control}
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
                            <SelectItem key={costCenter.id} value={costCenter.id}>
                              {costCenter.name} ({costCenter.id})
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
                  control={createForm.control}
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
                  <Button 
                    type="submit" 
                    disabled={createApproverMutation.isPending}
                  >
                    {createApproverMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Approver'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Approver</DialogTitle>
              <DialogDescription>
                Update approver settings for this cost center.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateApprover)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approver</FormLabel>
                      <FormControl>
                        <Input
                          value={selectedApprover?.user_name || ''}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
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
                            <SelectItem key={costCenter.id} value={costCenter.id}>
                              {costCenter.name} ({costCenter.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
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
                  <Button 
                    type="submit" 
                    disabled={updateApproverMutation.isPending}
                  >
                    {updateApproverMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Approver'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
                  <TableCell>{approver.user_name}</TableCell>
                  <TableCell>{approver.user_email}</TableCell>
                  <TableCell>
                    {costCenters.find(cc => cc.id === approver.cost_center)?.name || approver.cost_center}
                  </TableCell>
                  <TableCell className="text-right">${approver.approval_limit.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(approver)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteApprover(approver.id)}
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
  );
};

export default ApproverManagement;
