
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LineItem } from '@/types/p2p';
import LineItemCard from './LineItemCard';

interface LineItemsFormProps {
  lineItems: LineItem[];
  categories: string[];
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: any) => void;
  calculateTotal: () => number;
}

const LineItemsForm: React.FC<LineItemsFormProps> = ({
  lineItems,
  categories,
  addLineItem,
  removeLineItem,
  updateLineItem,
  calculateTotal,
}) => {
  return (
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
            <LineItemCard
              key={item.id}
              item={item}
              index={index}
              categories={categories}
              updateLineItem={updateLineItem}
              removeLineItem={removeLineItem}
            />
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
  );
};

export default LineItemsForm;
