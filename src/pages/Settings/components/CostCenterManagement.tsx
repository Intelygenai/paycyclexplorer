
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Loader2, PlusCircle, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import ApproverManagement from './ApproverManagement';
import { CostCenter } from '@/types/database';

interface CostCenterFormValues {
  id: string;
  name: string;
  description: string;
}

const CostCenterManagement = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);

  const createForm = useForm<CostCenterFormValues>({
    defaultValues: {
      id: '',
      name: '',
      description: ''
    }
  });

  const editForm = useForm<CostCenterFormValues>({
    defaultValues: {
      id: '',
      name: '',
      description: ''
    }
  });

  // Fetch cost centers
  const { data: costCenters = [], isLoading } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      // Use raw query since type definitions don't include cost_centers yet
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('id');

      if (error) throw error;
      return (data || []) as CostCenter[];
    },
  });

  // Create cost center
  const createCostCenterMutation = useMutation({
    mutationFn: async (values: CostCenterFormValues) => {
      // Use raw query since type definitions don't include cost_centers yet
      const { data, error } = await supabase
        .from('cost_centers')
        .insert([{
          id: values.id,
          name: values.name,
          description: values.description
        }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      setIsAddDialogOpen(false);
      createForm.reset();
      toast({
        title: "Cost center created",
        description: "The cost center has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create cost center: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Update cost center
  const updateCostCenterMutation = useMutation({
    mutationFn: async (values: CostCenterFormValues) => {
      // Use raw query since type definitions don't include cost_centers yet
      const { data, error } = await supabase
        .from('cost_centers')
        .update({
          name: values.name,
          description: values.description
        })
        .eq('id', values.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      setIsEditDialogOpen(false);
      setSelectedCostCenter(null);
      editForm.reset();
      toast({
        title: "Cost center updated",
        description: "The cost center has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update cost center: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleCreateCostCenter = (values: CostCenterFormValues) => {
    createCostCenterMutation.mutate(values);
  };

  const handleUpdateCostCenter = (values: CostCenterFormValues) => {
    updateCostCenterMutation.mutate(values);
  };

  const openEditDialog = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    editForm.setValue('id', costCenter.id);
    editForm.setValue('name', costCenter.name);
    editForm.setValue('description', costCenter.description || '');
    setIsEditDialogOpen(true);
  };

  return (
    <Tabs defaultValue="cost-centers" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="cost-centers">Cost Centers</TabsTrigger>
        <TabsTrigger value="approvers">Approvers</TabsTrigger>
      </TabsList>

      <TabsContent value="cost-centers">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cost Centers</CardTitle>
              <CardDescription>
                Manage cost centers for your organization
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Cost Center
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Cost Center</DialogTitle>
                  <DialogDescription>
                    Create a new cost center for budget tracking and approvals.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateCostCenter)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Center ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., CC006"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for the cost center
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Cost center name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Description"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createCostCenterMutation.isPending}
                      >
                        {createCostCenterMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Cost Center'
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
                  <DialogTitle>Edit Cost Center</DialogTitle>
                  <DialogDescription>
                    Update cost center details.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(handleUpdateCostCenter)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Center ID</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Cost center name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Description"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={updateCostCenterMutation.isPending}
                      >
                        {updateCostCenterMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Cost Center'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : costCenters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No cost centers found. Add a cost center to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costCenters.map((costCenter) => (
                    <TableRow key={costCenter.id}>
                      <TableCell>{costCenter.id}</TableCell>
                      <TableCell>{costCenter.name}</TableCell>
                      <TableCell>{costCenter.description}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(costCenter)}
                          >
                            <Pencil className="h-4 w-4" />
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
      </TabsContent>

      <TabsContent value="approvers">
        <ApproverManagement costCenters={costCenters} />
      </TabsContent>
    </Tabs>
  );
};

export default CostCenterManagement;
