
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RequisitionDetailsFormProps {
  register: any;
  errors: any;
  departments: string[];
  costCenters: string[];
  budgetCodes: string[];
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  onFieldChange: (field: string, value: any) => void;
  formValues: {
    department: string;
    costCenter: string;
    budgetCode: string;
    justification: string;
  };
}

const RequisitionDetailsForm: React.FC<RequisitionDetailsFormProps> = ({
  register,
  errors,
  departments,
  costCenters,
  budgetCodes,
  selectedDate,
  setSelectedDate,
  onFieldChange,
  formValues,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requisition Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={formValues.department} 
              onValueChange={(value) => onFieldChange('department', value)}
            >
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
            <Select 
              value={formValues.costCenter} 
              onValueChange={(value) => onFieldChange('costCenter', value)}
            >
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
            <Select 
              value={formValues.budgetCode} 
              onValueChange={(value) => onFieldChange('budgetCode', value)}
            >
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
            value={formValues.justification}
            onChange={(e) => onFieldChange('justification', e.target.value)}
            className="min-h-24"
          />
          {errors.justification && <p className="text-sm text-red-500">Justification is required</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequisitionDetailsForm;
