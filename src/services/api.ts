import { PurchaseRequisition, PRStatus, PurchaseOrder, POStatus, GoodsReceipt, Vendor, LineItem } from '@/types/p2p';
import { User, Permission } from '@/types/auth';

// Mock data
import { mockPRs } from './mock-data/purchase-requisitions';
import { mockPOs } from './mock-data/purchase-orders';
import { mockVendors } from './mock-data/vendors';
import { mockGoodsReceipts } from './mock-data/goods-receipts';
import { mockCostCenterApprovers } from './mock-data/cost-center-approvers';

// Utility function to simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Purchase Requisition API
export const purchaseRequisitionAPI = {
  getAll: async (): Promise<PurchaseRequisition[]> => {
    await delay(300);
    return [...mockPRs];
  },
  
  getById: async (id: string): Promise<PurchaseRequisition> => {
    await delay(200);
    const pr = mockPRs.find(pr => pr.id === id);
    if (!pr) throw new Error('Purchase Requisition not found');
    return {...pr};
  },
  
  create: async (pr: Omit<PurchaseRequisition, 'id'>): Promise<PurchaseRequisition> => {
    await delay(500);
    const newPR: PurchaseRequisition = {
      ...pr,
      id: `PR-${Date.now()}`,
      status: PRStatus.DRAFT,
      version: 1,
      dateCreated: new Date().toISOString()
    };
    mockPRs.push(newPR);
    return {...newPR};
  },
  
  update: async (id: string, updates: Partial<PurchaseRequisition>): Promise<PurchaseRequisition> => {
    await delay(300);
    const index = mockPRs.findIndex(pr => pr.id === id);
    if (index === -1) throw new Error('Purchase Requisition not found');
    
    const updatedPR = {
      ...mockPRs[index],
      ...updates,
      version: mockPRs[index].version + 1
    };
    mockPRs[index] = updatedPR;
    return {...updatedPR};
  },
  
  submit: async (id: string): Promise<PurchaseRequisition> => {
    await delay(300);
    const index = mockPRs.findIndex(pr => pr.id === id);
    if (index === -1) throw new Error('Purchase Requisition not found');
    
    // Get approvers for this cost center
    const costCenter = mockPRs[index].costCenter;
    const approvers = mockCostCenterApprovers.filter(a => a.costCenter === costCenter);
    
    // If no specific approvers, assign to admin users
    const approversList = approvers.length > 0 
      ? approvers.map(a => ({
          id: a.userId,
          name: a.userName,
          email: a.userEmail,
          status: 'PENDING' as const,
        }))
      : [{ 
          id: "approver123", 
          name: "Jane Smith", 
          email: "jane.smith@example.com", 
          status: 'PENDING' as const 
        }];
    
    const updatedPR = {
      ...mockPRs[index],
      status: PRStatus.PENDING_APPROVAL,
      approvers: approversList
    };
    mockPRs[index] = updatedPR;
    
    // Here we would trigger notifications to approvers
    console.log(`Notification: New PR ${id} requires approval`);
    approversList.forEach(approver => {
      console.log(`Email sent to ${approver.email} requesting approval for PR ${id}`);
    });
    
    return {...updatedPR};
  },
  
  approve: async (id: string, approverId: string, comment?: string): Promise<PurchaseRequisition> => {
    await delay(300);
    const prIndex = mockPRs.findIndex(pr => pr.id === id);
    if (prIndex === -1) throw new Error('Purchase Requisition not found');
    
    const pr = {...mockPRs[prIndex]};
    
    // Find the approver
    const approverIndex = pr.approvers.findIndex(a => a.id === approverId);
    if (approverIndex === -1) throw new Error('Approver not found for this PR');
    
    // Update approver status
    pr.approvers[approverIndex] = {
      ...pr.approvers[approverIndex],
      status: 'APPROVED',
      comment: comment,
      date: new Date().toISOString()
    };
    
    // Check if all approvers have approved
    const allApproved = pr.approvers.every(a => a.status === 'APPROVED');
    if (allApproved) {
      pr.status = PRStatus.APPROVED;
      console.log(`Notification: PR ${id} has been fully approved`);
    }
    
    mockPRs[prIndex] = pr;
    return {...pr};
  },
  
  reject: async (id: string, approverId: string, comment: string): Promise<PurchaseRequisition> => {
    await delay(300);
    const prIndex = mockPRs.findIndex(pr => pr.id === id);
    if (prIndex === -1) throw new Error('Purchase Requisition not found');
    
    const pr = {...mockPRs[prIndex]};
    
    // Find the approver
    const approverIndex = pr.approvers.findIndex(a => a.id === approverId);
    if (approverIndex === -1) throw new Error('Approver not found for this PR');
    
    // Update approver status
    pr.approvers[approverIndex] = {
      ...pr.approvers[approverIndex],
      status: 'REJECTED',
      comment: comment,
      date: new Date().toISOString()
    };
    
    pr.status = PRStatus.REJECTED;
    console.log(`Notification: PR ${id} has been rejected by ${approverId}`);
    
    mockPRs[prIndex] = pr;
    return {...pr};
  },
  
  convertToPO: async (id: string): Promise<{ pr: PurchaseRequisition, po: PurchaseOrder }> => {
    await delay(500);
    const prIndex = mockPRs.findIndex(pr => pr.id === id);
    if (prIndex === -1) throw new Error('Purchase Requisition not found');
    
    const pr = mockPRs[prIndex];
    if (pr.status !== PRStatus.APPROVED) {
      throw new Error('Only approved PRs can be converted to POs');
    }
    
    // Create a PO from the PR
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      prId: pr.id,
      poNumber: `PO-${Date.now().toString().substring(6)}`,
      vendor: mockVendors[0], // This would be selected in real implementation
      status: POStatus.DRAFT,
      dateCreated: new Date().toISOString(),
      requiredDate: pr.dateNeeded,
      lineItems: [...pr.lineItems],
      shippingAddress: '123 Warehouse St, Business Park',
      billingAddress: '456 Finance Ave, Business District',
      currency: 'USD',
      totalAmount: pr.totalAmount,
      approvers: [],
      version: 1
    };
    
    mockPOs.push(newPO);
    
    // Update the PR status
    const updatedPR = {
      ...pr,
      status: PRStatus.CONVERTED_TO_PO
    };
    mockPRs[prIndex] = updatedPR;
    
    return {
      pr: {...updatedPR},
      po: {...newPO}
    };
  }
};

// Purchase Order API
export const purchaseOrderAPI = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    await delay(300);
    return [...mockPOs];
  },
  
  getById: async (id: string): Promise<PurchaseOrder> => {
    await delay(200);
    const po = mockPOs.find(po => po.id === id);
    if (!po) throw new Error('Purchase Order not found');
    return {...po};
  },
  
  create: async (po: Omit<PurchaseOrder, 'id' | 'poNumber'>): Promise<PurchaseOrder> => {
    await delay(500);
    const newPO: PurchaseOrder = {
      ...po,
      id: `PO-${Date.now()}`,
      poNumber: `PO-${Date.now().toString().substring(6)}`,
      status: POStatus.DRAFT,
      dateCreated: new Date().toISOString(),
      version: 1
    };
    mockPOs.push(newPO);
    return {...newPO};
  },
  
  update: async (id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    await delay(300);
    const index = mockPOs.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase Order not found');
    
    const updatedPO = {
      ...mockPOs[index],
      ...updates,
      version: mockPOs[index].version + 1
    };
    mockPOs[index] = updatedPO;
    return {...updatedPO};
  },
  
  submit: async (id: string): Promise<PurchaseOrder> => {
    await delay(300);
    const index = mockPOs.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase Order not found');
    
    const updatedPO = {
      ...mockPOs[index],
      status: POStatus.PENDING_APPROVAL,
    };
    mockPOs[index] = updatedPO;
    
    // Here we would trigger notifications to approvers
    console.log(`Notification: New PO ${id} requires approval`);
    
    return {...updatedPO};
  },
  
  approve: async (id: string, approverId: string, comment?: string): Promise<PurchaseOrder> => {
    await delay(300);
    const poIndex = mockPOs.findIndex(po => po.id === id);
    if (poIndex === -1) throw new Error('Purchase Order not found');
    
    const po = {...mockPOs[poIndex]};
    
    // Find the approver
    const approverIndex = po.approvers.findIndex(a => a.id === approverId);
    if (approverIndex === -1) throw new Error('Approver not found for this PO');
    
    // Update approver status
    po.approvers[approverIndex] = {
      ...po.approvers[approverIndex],
      status: 'APPROVED',
      comment: comment,
      date: new Date().toISOString()
    };
    
    // Check if all approvers have approved
    const allApproved = po.approvers.every(a => a.status === 'APPROVED');
    if (allApproved) {
      po.status = POStatus.APPROVED;
      console.log(`Notification: PO ${id} has been fully approved`);
    }
    
    mockPOs[poIndex] = po;
    return {...po};
  },
  
  reject: async (id: string, approverId: string, comment: string): Promise<PurchaseOrder> => {
    await delay(300);
    const poIndex = mockPOs.findIndex(po => po.id === id);
    if (poIndex === -1) throw new Error('Purchase Order not found');
    
    const po = {...mockPOs[poIndex]};
    
    // Find the approver
    const approverIndex = po.approvers.findIndex(a => a.id === approverId);
    if (approverIndex === -1) throw new Error('Approver not found for this PO');
    
    // Update approver status
    po.approvers[approverIndex] = {
      ...po.approvers[approverIndex],
      status: 'REJECTED',
      comment: comment,
      date: new Date().toISOString()
    };
    
    po.status = POStatus.REJECTED;
    console.log(`Notification: PO ${id} has been rejected by ${approverId}`);
    
    mockPOs[poIndex] = po;
    return {...po};
  },
  
  sendToVendor: async (id: string): Promise<PurchaseOrder> => {
    await delay(300);
    const poIndex = mockPOs.findIndex(po => po.id === id);
    if (poIndex === -1) throw new Error('Purchase Order not found');
    
    if (mockPOs[poIndex].status !== POStatus.APPROVED) {
      throw new Error('Only approved POs can be sent to vendors');
    }
    
    const updatedPO = {
      ...mockPOs[poIndex],
      status: POStatus.SENT_TO_VENDOR
    };
    
    // Here we would send an email to the vendor
    console.log(`Email sent to vendor ${updatedPO.vendor.email} with PO ${updatedPO.poNumber}`);
    
    mockPOs[poIndex] = updatedPO;
    return {...updatedPO};
  }
};

// Goods Receipt API
export const goodsReceiptAPI = {
  getAll: async (): Promise<GoodsReceipt[]> => {
    await delay(300);
    return [...mockGoodsReceipts];
  },
  
  getById: async (id: string): Promise<GoodsReceipt> => {
    await delay(200);
    const receipt = mockGoodsReceipts.find(gr => gr.id === id);
    if (!receipt) throw new Error('Goods Receipt not found');
    return {...receipt};
  },
  
  create: async (receipt: Omit<GoodsReceipt, 'id' | 'receiptNumber'>): Promise<GoodsReceipt> => {
    await delay(500);
    const newReceipt: GoodsReceipt = {
      ...receipt,
      id: `GR-${Date.now()}`,
      receiptNumber: `GR-${Date.now().toString().substring(6)}`,
      dateReceived: new Date().toISOString(),
    };
    mockGoodsReceipts.push(newReceipt);
    
    // Update the PO status based on receipt
    const poIndex = mockPOs.findIndex(po => po.id === receipt.poId);
    if (poIndex !== -1) {
      const allItemsReceived = receipt.lineItems.every(
        item => item.quantityReceived >= item.quantityOrdered
      );
      
      mockPOs[poIndex] = {
        ...mockPOs[poIndex],
        status: allItemsReceived ? POStatus.COMPLETED : POStatus.PARTIALLY_FULFILLED
      };
    }
    
    return {...newReceipt};
  },
  
  update: async (id: string, updates: Partial<GoodsReceipt>): Promise<GoodsReceipt> => {
    await delay(300);
    const index = mockGoodsReceipts.findIndex(gr => gr.id === id);
    if (index === -1) throw new Error('Goods Receipt not found');
    
    const updatedReceipt = {
      ...mockGoodsReceipts[index],
      ...updates
    };
    mockGoodsReceipts[index] = updatedReceipt;
    return {...updatedReceipt};
  }
};

// Vendor API
export const vendorAPI = {
  getAll: async (): Promise<Vendor[]> => {
    await delay(300);
    return [...mockVendors];
  },
  
  getById: async (id: string): Promise<Vendor> => {
    await delay(200);
    const vendor = mockVendors.find(v => v.id === id);
    if (!vendor) throw new Error('Vendor not found');
    return {...vendor};
  },
  
  create: async (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
    await delay(500);
    const newVendor: Vendor = {
      ...vendor,
      id: `V-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockVendors.push(newVendor);
    return {...newVendor};
  },
  
  update: async (id: string, updates: Partial<Vendor>): Promise<Vendor> => {
    await delay(300);
    const index = mockVendors.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Vendor not found');
    
    const updatedVendor = {
      ...mockVendors[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    mockVendors[index] = updatedVendor;
    return {...updatedVendor};
  }
};

// Users API
export const userAPI = {
  getApprovers: async (): Promise<Pick<User, 'id' | 'name' | 'email'>[]> => {
    await delay(300);
    return [
      { id: '3', name: 'Jane Approver', email: 'approver@example.com' },
      { id: '1', name: 'Admin User', email: 'admin@example.com' }
    ];
  },
  
  getCostCenterApprovers: async (costCenter?: string): Promise<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    costCenter: string;
    approvalLimit: number;
  }[]> => {
    await delay(300);
    if (costCenter) {
      return mockCostCenterApprovers.filter(a => a.costCenter === costCenter);
    }
    return [...mockCostCenterApprovers];
  },
  
  createCostCenterApprover: async (approver: {
    userId: string; 
    costCenter: string; 
    approvalLimit: number;
  }) => {
    await delay(500);
    
    // Find user details
    const users = await userAPI.getApprovers();
    const user = users.find(u => u.id === approver.userId);
    
    if (!user) throw new Error('User not found');
    
    // Check if this user already has approval rights for this cost center
    const existing = mockCostCenterApprovers.find(
      a => a.userId === approver.userId && a.costCenter === approver.costCenter
    );
    
    if (existing) {
      throw new Error('This user is already an approver for this cost center');
    }
    
    const newApprover = {
      id: `ca-${Date.now()}`,
      userId: approver.userId,
      userName: user.name,
      userEmail: user.email,
      costCenter: approver.costCenter,
      approvalLimit: approver.approvalLimit
    };
    
    mockCostCenterApprovers.push(newApprover);
    return newApprover;
  },
  
  updateCostCenterApprover: async (approver: {
    id: string;
    userId: string; 
    costCenter: string; 
    approvalLimit: number;
  }) => {
    await delay(500);
    
    const index = mockCostCenterApprovers.findIndex(a => a.id === approver.id);
    if (index === -1) throw new Error('Approver not found');
    
    // Find user details
    const users = await userAPI.getApprovers();
    const user = users.find(u => u.id === approver.userId);
    
    if (!user) throw new Error('User not found');
    
    // Check for duplicates (same user, same cost center, different id)
    const duplicateIndex = mockCostCenterApprovers.findIndex(
      a => a.id !== approver.id && 
          a.userId === approver.userId && 
          a.costCenter === approver.costCenter
    );
    
    if (duplicateIndex !== -1) {
      throw new Error('This user is already an approver for this cost center');
    }
    
    const updatedApprover = {
      ...mockCostCenterApprovers[index],
      costCenter: approver.costCenter,
      approvalLimit: approver.approvalLimit
    };
    
    mockCostCenterApprovers[index] = updatedApprover;
    return updatedApprover;
  },
  
  deleteCostCenterApprover: async (id: string) => {
    await delay(500);
    
    const index = mockCostCenterApprovers.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Approver not found');
    
    const approver = mockCostCenterApprovers[index];
    mockCostCenterApprovers.splice(index, 1);
    
    return approver;
  }
};
