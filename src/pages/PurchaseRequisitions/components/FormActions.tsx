
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FormActionsProps {
  onDraftSave?: () => void;
  onSubmit?: () => void;
}

const FormActions: React.FC<FormActionsProps> = ({ onDraftSave, onSubmit }) => {
  const navigate = useNavigate();

  return (
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
  );
};

export default FormActions;
