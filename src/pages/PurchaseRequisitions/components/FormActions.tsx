
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FormActionsProps {
  onDraftSave?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({ onDraftSave, onSubmit, isSubmitting = false }) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end space-x-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => navigate('/purchase-requisitions')}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button 
        type="button" 
        onClick={onDraftSave}
        disabled={isSubmitting}
      >
        Save as Draft
      </Button>
      <Button 
        type="button" 
        onClick={onSubmit} 
        variant="default"
        disabled={isSubmitting}
      >
        Submit for Approval
      </Button>
    </div>
  );
};

export default FormActions;
