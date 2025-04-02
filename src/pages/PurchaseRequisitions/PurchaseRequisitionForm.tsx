import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { purchaseRequisitionAPI } from '@/services/api';
import { LineItem, PRStatus } from '@/types/p2p'; // Import PRStatus enum
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface FormValues {
  department: string;
  costCenter: string;
  budgetCode: string;
  dateNeeded: Date;
  justification: string;
}

const PurchaseRequisitionForm = () => {
  const navigate = useNavigate();
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: uuidv4(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Office Supplies',
      deliveryDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 2 weeks from now
      notes: '',
    },
  ]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now as default
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'IT', 'Operations'],
  });
  
  const { data: costCenters = [] } = useQuery({
    queryKey: ['costCenters'],
    queryFn: () => ['CC001', 'CC002', 'CC003', 'CC004', 'CC005'],
  });

  const { data: budgetCodes = [] } = useQuery({
    queryKey: ['budgetCodes'],
    queryFn: () => ['BUD001', 'BUD002', 'BUD003', 'BUD004', 'BUD005'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => ['Office Supplies', 'IT Equipment', 'Software', 'Furniture', 'Services', 'Travel', 'Other'],
  });

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: uuidv4(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        category: 'Office Supplies',
        deliveryDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        notes: '',
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one line item is required",
        variant: "destructive",
      });
      return;
    }
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    const updatedItems = lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity' ? Number(value) : Number(item.quantity);
          const unitPrice = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
          updatedItem.totalPrice = quantity * unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setLineItems(updatedItems);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const onSubmit = async (data: FormValues) => {
    const invalidItems = lineItems.filter(item => 
      !item.description.trim() || 
      item.quantity <= 0 || 
      item.unitPrice <= 0
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Invalid line items",
        description: "Please check that all items have descriptions, quantities, and prices",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPR = {
        id: `PR-${new Date().getTime()}`,
        requester: {
          id: "user123",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        department: data.department,
        costCenter: data.costCenter,
        budgetCode: data.budgetCode,
        status: PRStatus.DRAFT,
        dateCreated: new Date().toISOString(),
        dateNeeded: data.dateNeeded.toISOString(),
        lineItems,
        justification: data.justification,
        totalAmount: calculateTotal(),
        approvers: [
          {
            id: "approver123",
            name: "Jane Smith",
            email: "jane.smith@example.com",
            status: "PENDING" as "PENDING",
          }
        ],
        version: 1,
      };
      
      await purchaseRequisitionAPI.create(newPR);
      
      toast({
        title: "Success",
        description: "Purchase requisition created successfully",
      });
      
      navigate('/purchase-requisitions');
    } catch (error) {
      console.error("Error creating PR:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase requisition",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/purchase-requisitions')}
          className="mr-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Purchase Requisition</h1>
          <p className="text-muted-foreground">
            Fill out the form below to create a new purchase requisition
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Requisition Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue="" onValueChange={(value) => register("department").onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-sm text-red-500">Department is required</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costCenter">Cost Center</Label>
                  <Select defaultValue="" onValueChange={(value) => register("costCenter").onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Cost Center" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((cc) => (
                        <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.costCenter && <p className="text-sm text-red-500">Cost Center is required</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetCode">Budget Code</Label>
                  <Select defaultValue="" onValueChange={(value) => register("budgetCode").onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Budget Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetCodes.map((code) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.budgetCode && <p className="text-sm text-red-500">Budget Code is required</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateNeeded">Date Needed</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            register("dateNeeded").onChange({ target: { value: date } });
                          }
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateNeeded && <p className="text-sm text-red-500">Date needed is required</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea 
                  id="justification"
                  placeholder="Why is this purchase necessary?"
                  {...register("justification", { required: true })}
                  className="min-h-24"
                />
                {errors.justification && <p className="text-sm text-red-500">Justification is required</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" onClick={addLineItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Item {index + 1}</h3>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor={`description-${item.id}`}>Description</Label>
                        <Input
                          id={`description-${item.id}`}
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`category-${item.id}`}>Category</Label>
                        <Select 
                          value={item.category}
                          onValueChange={(value) => updateLineItem(item.id, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`unitPrice-${item.id}`}>Unit Price ($)</Label>
                        <Input
                          id={`unitPrice-${item.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`totalPrice-${item.id}`}>Total Price</Label>
                        <Input
                          id={`totalPrice-${item.id}`}
                          value={`$${item.totalPrice.toFixed(2)}`}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`deliveryDate-${item.id}`}>Delivery Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {item.deliveryDate ? format(new Date(item.deliveryDate), "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={item.deliveryDate ? new Date(item.deliveryDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  updateLineItem(item.id, 'deliveryDate', format(date, 'yyyy-MM-dd'));
                                }
                              }}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                        <Input
                          id={`notes-${item.id}`}
                          value={item.notes || ''}
                          onChange={(e) => updateLineItem(item.id, 'notes', e.target.value)}
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end p-4 bg-gray-50 rounded-md">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/purchase-requisitions')}
            >
              Cancel
            </Button>
            <Button type="submit">Save as Draft</Button>
            <Button type="submit">Submit for Approval</Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseRequisitionForm;
