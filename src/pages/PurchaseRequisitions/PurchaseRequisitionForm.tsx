
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { purchaseRequisitionAPI } from '@/services/api';
import { PRStatus } from '@/types/p2p';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// Import components
import FormHeader from './components/FormHeader';
import RequisitionDetailsForm from './components/RequisitionDetailsForm';
import LineItemsForm from './components/LineItemsForm';
import FormActions from './components/FormActions';
import { useLineItems } from './hooks/useLineItems';

interface FormValues {
  department: string;
  costCenter: string;
  budgetCode: string;
  dateNeeded: Date;
  justification: string;
}

const PurchaseRequisitionForm = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now as default
  );
  
  const {
    lineItems,
    addLineItem,
    removeLineItem,
    updateLineItem,
    calculateTotal,
    validateLineItems
  } = useLineItems();

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

  const onSubmit = async (data: FormValues) => {
    if (!validateLineItems()) {
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
      <FormHeader />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <RequisitionDetailsForm 
            register={register}
            errors={errors}
            departments={departments}
            costCenters={costCenters}
            budgetCodes={budgetCodes}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />

          <LineItemsForm 
            lineItems={lineItems}
            categories={categories}
            addLineItem={addLineItem}
            removeLineItem={removeLineItem}
            updateLineItem={updateLineItem}
            calculateTotal={calculateTotal}
          />

          <FormActions />
        </div>
      </form>
    </div>
  );
};

export default PurchaseRequisitionForm;
