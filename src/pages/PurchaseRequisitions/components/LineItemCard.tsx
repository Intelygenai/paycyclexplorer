
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { LineItem } from '@/types/p2p';

interface LineItemCardProps {
  item: LineItem;
  index: number;
  categories: string[];
  updateLineItem: (id: string, field: keyof LineItem, value: any) => void;
  removeLineItem: (id: string) => void;
}

const LineItemCard: React.FC<LineItemCardProps> = ({ 
  item, 
  index, 
  categories, 
  updateLineItem, 
  removeLineItem 
}) => {
  return (
    <div className="p-4 border rounded-md">
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
  );
};

export default LineItemCard;
