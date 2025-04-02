
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';

interface FormActionsProps {
  onDraftSave?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit' | 'view';
  isDraft?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({ 
  onDraftSave, 
  onSubmit, 
  isSubmitting = false,
  mode = 'create',
  isDraft = false
}) => {
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
      
      {/* Show Save as Draft in create or edit modes */}
      {(mode === 'create' || mode === 'edit') && (
        <Button 
          type="button" 
          onClick={onDraftSave}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
      )}
      
      {/* Show Submit for Approval in create mode or for drafts in edit mode */}
      {(mode === 'create' || isDraft) && (
        <Button 
          type="button" 
          onClick={onSubmit} 
          variant="default"
          disabled={isSubmitting}
        >
          <Send className="mr-2 h-4 w-4" />
          Submit for Approval
        </Button>
      )}
    </div>
  );
};

export default FormActions;
