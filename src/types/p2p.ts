
export enum PRStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED_TO_PO = 'CONVERTED_TO_PO',
}

export enum POStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SENT_TO_VENDOR = 'SENT_TO_VENDOR',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  COMPLETED = 'COMPLETED',
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  deliveryDate: string;
  notes?: string;
}

export interface PurchaseRequisition {
  id: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  department: string;
  costCenter: string;
  budgetCode: string;
  status: PRStatus;
  dateCreated: string;
  dateNeeded: string;
  lineItems: LineItem[];
  justification: string;
  totalAmount: number;
  approvers: {
    id: string;
    name: string;
    email: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment?: string;
    date?: string;
  }[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    uploadedBy: string;
    uploadDate: string;
  }[];
  comments?: {
    id: string;
    user: string;
    text: string;
    date: string;
  }[];
  version: number;
  previousVersions?: string[]; // References to previous version IDs
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: string;
  category: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  prId?: string; // Can be created without PR
  poNumber: string;
  vendor: Vendor;
  status: POStatus;
  dateCreated: string;
  requiredDate: string;
  lineItems: LineItem[];
  shippingAddress: string;
  billingAddress: string;
  currency: string;
  totalAmount: number;
  approvers: {
    id: string;
    name: string;
    email: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment?: string;
    date?: string;
  }[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    uploadedBy: string;
    uploadDate: string;
  }[];
  comments?: {
    id: string;
    user: string;
    text: string;
    date: string;
  }[];
  version: number;
}

export interface GoodsReceipt {
  id: string;
  poId: string;
  poNumber: string;
  receiptNumber: string;
  receivedBy: {
    id: string;
    name: string;
  };
  dateReceived: string;
  lineItems: {
    lineItemId: string;
    description: string;
    quantityOrdered: number;
    quantityReceived: number;
    status: 'COMPLETE' | 'PARTIAL' | 'EXCESS' | 'DAMAGED';
    notes?: string;
  }[];
  deliveryNote?: string;
  carrier?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    uploadedBy: string;
    uploadDate: string;
  }[];
  status: 'COMPLETED' | 'PARTIAL';
}
