
import { useState } from 'react';
import { LineItem } from '@/types/p2p';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export const useLineItems = () => {
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

  const validateLineItems = () => {
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
      return false;
    }
    return true;
  };

  return {
    lineItems,
    addLineItem,
    removeLineItem,
    updateLineItem,
    calculateTotal,
    validateLineItems
  };
};
