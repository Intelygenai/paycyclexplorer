
import React, { useState, useEffect } from 'react';
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
  const { register, handleSubmit, getValues, formState: { errors }, setValue } = useForm<FormValues>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now as default
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state for form values to handle controlled components
  const [formValues, setFormValues] = useState<{
    department: string;
    costCenter: string;
    budgetCode: string;
    justification: string;
  }>({
    department: '',
    costCenter: '',
    budgetCode: '',
    justification: '',
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setValue(field as keyof FormValues, value);
  };
  
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

  const validateForm = () => {
    // Check all required fields
    if (!formValues.department || !formValues.costCenter || !formValues.budgetCode || !selectedDate || !formValues.justification) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const createPurchaseRequisition = async (status: PRStatus) => {
    if (!validateLineItems() || !validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newPR = {
        id: `PR-${new Date().getTime()}`,
        requester: {
          id: "user123",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        department: formValues.department,
        costCenter: formValues.costCenter,
        budgetCode: formValues.budgetCode,
        status,
        dateCreated: new Date().toISOString(),
        dateNeeded: selectedDate?.toISOString() || new Date().toISOString(),
        lineItems,
        justification: formValues.justification,
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
      
      // If submitting for approval, use the submit API endpoint
      if (status === PRStatus.PENDING_APPROVAL) {
        const result = await purchaseRequisitionAPI.create(newPR);
        // After creation, submit the PR for approval
        await purchaseRequisitionAPI.submit(result.id);
        
        toast({
          title: "Success",
          description: "Purchase requisition submitted for approval",
        });
      } else {
        // Just save as draft
        await purchaseRequisitionAPI.create(newPR);
        toast({
          title: "Success",
          description: "Purchase requisition saved as draft",
        });
      }
      
      navigate('/purchase-requisitions');
    } catch (error) {
      console.error("Error creating PR:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase requisition",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraftSave = () => {
    createPurchaseRequisition(PRStatus.DRAFT);
  };

  const handleSubmitForApproval = () => {
    createPurchaseRequisition(PRStatus.PENDING_APPROVAL);
  };

  return (
    <div className="space-y-6">
      <FormHeader />

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-6">
          <RequisitionDetailsForm 
            register={register}
            errors={errors}
            departments={departments}
            costCenters={costCenters}
            budgetCodes={budgetCodes}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onFieldChange={handleFieldChange}
            formValues={formValues}
          />

          <LineItemsForm 
            lineItems={lineItems}
            categories={categories}
            addLineItem={addLineItem}
            removeLineItem={removeLineItem}
            updateLineItem={updateLineItem}
            calculateTotal={calculateTotal}
          />

          <FormActions 
            onDraftSave={handleDraftSave}
            onSubmit={handleSubmitForApproval}
            isSubmitting={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
};

export default PurchaseRequisitionForm;
