
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FormHeader: React.FC = () => {
  const navigate = useNavigate();
  
  return (
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
  );
};

export default FormHeader;
