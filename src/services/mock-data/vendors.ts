
import { Vendor } from '@/types/p2p';

export const mockVendors: Vendor[] = [
  {
    id: 'V-001',
    name: 'Office Supplies Co.',
    contactPerson: 'Sarah Johnson',
    email: 'sjohnson@officesupplies.co',
    phone: '+1-555-123-4567',
    address: '123 Business Ave, Suite 200, Commerce City, CC 54321',
    taxId: 'TAX-123456789',
    paymentTerms: 'Net 30',
    category: ['Furniture', 'Office Supplies', 'Electronics'],
    status: 'ACTIVE',
    createdAt: '2022-01-15T08:00:00Z',
    updatedAt: '2023-06-10T14:30:00Z',
  },
  {
    id: 'V-002',
    name: 'Marketing Materials Inc.',
    contactPerson: 'Robert Williams',
    email: 'rwilliams@marketingmaterials.com',
    phone: '+1-555-987-6543',
    address: '456 Creative Blvd, Marketing Town, MT 98765',
    taxId: 'TAX-987654321',
    paymentTerms: 'Net 45',
    category: ['Marketing Materials', 'Printing', 'Design Services'],
    status: 'ACTIVE',
    createdAt: '2022-03-20T09:15:00Z',
    updatedAt: '2023-05-12T11:20:00Z',
  },
  {
    id: 'V-003',
    name: 'Tech Solutions Ltd.',
    contactPerson: 'Amanda Chen',
    email: 'achen@techsolutions.ltd',
    phone: '+1-555-456-7890',
    address: '789 Tech Park Dr, Innovation City, IC 12345',
    taxId: 'TAX-456789123',
    paymentTerms: 'Net 15',
    category: ['IT Services', 'Software', 'Hardware'],
    status: 'ACTIVE',
    createdAt: '2022-05-05T10:30:00Z',
    updatedAt: '2023-08-18T16:45:00Z',
  },
  {
    id: 'V-004',
    name: 'Global Shipping Corp.',
    contactPerson: 'Michael Thompson',
    email: 'mthompson@globalshipping.corp',
    phone: '+1-555-789-0123',
    address: '321 Logistics Way, Port City, PC 54321',
    taxId: 'TAX-789012345',
    paymentTerms: 'Net 30',
    category: ['Shipping', 'Logistics', 'Transportation'],
    status: 'ACTIVE',
    createdAt: '2022-06-12T13:45:00Z',
    updatedAt: '2023-07-23T09:10:00Z',
  },
  {
    id: 'V-005',
    name: 'Premium Catering Services',
    contactPerson: 'Lisa Rodriguez',
    email: 'lrodriguez@premiumcatering.services',
    phone: '+1-555-234-5678',
    address: '567 Culinary St, Gourmet District, GD 67890',
    taxId: 'TAX-234567890',
    paymentTerms: 'Net 15',
    category: ['Catering', 'Events', 'Food Services'],
    status: 'INACTIVE',
    createdAt: '2022-04-18T11:00:00Z',
    updatedAt: '2023-01-30T14:20:00Z',
  },
];
