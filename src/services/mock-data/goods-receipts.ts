
import { GoodsReceipt } from '@/types/p2p';

export const mockGoodsReceipts: GoodsReceipt[] = [
  {
    id: 'GR-001',
    poId: 'PO-001',
    poNumber: 'PO-2023-001',
    receiptNumber: 'GR-2023-001',
    receivedBy: {
      id: '5',
      name: 'Terry Warehouse',
    },
    dateReceived: '2023-10-10T14:30:00Z',
    lineItems: [
      {
        lineItemId: 'PRLI-001-1',
        description: 'Office Desk - Premium',
        quantityOrdered: 5,
        quantityReceived: 5,
        status: 'COMPLETE',
      },
      {
        lineItemId: 'PRLI-001-2',
        description: 'Office Chair - Ergonomic',
        quantityOrdered: 5,
        quantityReceived: 5,
        status: 'COMPLETE',
      },
    ],
    deliveryNote: 'Delivery note #DEL-8765',
    carrier: 'Speedy Logistics',
    status: 'COMPLETED',
  },
];
