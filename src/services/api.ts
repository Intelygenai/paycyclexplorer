
import { PurchaseRequisition, PRStatus, PurchaseOrder, POStatus, GoodsReceipt, Vendor, LineItem } from '@/types/p2p';
import { User, Permission } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

// Mock data for initial development (will be replaced by Supabase)
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
    try {
      const { data: prs, error } = await supabase
        .from('purchase_requisitions')
        .select(`
          *,
          line_items(*),
          pr_approvers(*)
        `);
      
      if (error) throw error;
      
      // Transform the data to match the PurchaseRequisition type
      return prs.map(pr => {
        const lineItems = pr.line_items || [];
        const approvers = pr.pr_approvers || [];
        
        return {
          id: pr.id,
          requester: {
            id: pr.requester_id,
            name: pr.requester_name,
            email: pr.requester_email
          },
          department: pr.department,
          costCenter: pr.cost_center,
          budgetCode: pr.budget_code,
          status: pr.status as PRStatus,
          dateCreated: pr.date_created,
          dateNeeded: pr.date_needed,
          lineItems: lineItems.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price),
            totalPrice: Number(item.total_price),
            category: item.category,
            deliveryDate: item.delivery_date,
            notes: item.notes
          })),
          justification: pr.justification,
          totalAmount: Number(pr.total_amount),
          approvers: approvers.map((approver: any) => ({
            id: approver.approver_id,
            name: approver.approver_name,
            email: approver.approver_email,
            status: approver.status,
            comment: approver.comment,
            date: approver.date
          })),
          version: pr.version
        };
      });
    } catch (error) {
      console.error('Error fetching PRs from Supabase:', error);
      // Fallback to mock data if there's an error
      return [...mockPRs];
    }
  },
  
  getById: async (id: string): Promise<PurchaseRequisition> => {
    try {
      const { data: pr, error } = await supabase
        .from('purchase_requisitions')
        .select(`
          *,
          line_items(*),
          pr_approvers(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Transform the data to match the PurchaseRequisition type
      const lineItems = pr.line_items || [];
      const approvers = pr.pr_approvers || [];
      
      return {
        id: pr.id,
        requester: {
          id: pr.requester_id,
          name: pr.requester_name,
          email: pr.requester_email
        },
        department: pr.department,
        costCenter: pr.cost_center,
        budgetCode: pr.budget_code,
        status: pr.status as PRStatus,
        dateCreated: pr.date_created,
        dateNeeded: pr.date_needed,
        lineItems: lineItems.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
          category: item.category,
          deliveryDate: item.delivery_date,
          notes: item.notes
        })),
        justification: pr.justification,
        totalAmount: Number(pr.total_amount),
        approvers: approvers.map((approver: any) => ({
          id: approver.approver_id,
          name: approver.approver_name,
          email: approver.approver_email,
          status: approver.status,
          comment: approver.comment,
          date: approver.date
        })),
        version: pr.version
      };
    } catch (error) {
      console.error('Error fetching PR from Supabase:', error);
      // Fallback to mock data if there's an error
      const pr = mockPRs.find(pr => pr.id === id);
      if (!pr) throw new Error('Purchase Requisition not found');
      return {...pr};
    }
  },
  
  create: async (pr: Omit<PurchaseRequisition, 'id'>): Promise<PurchaseRequisition> => {
    try {
      const id = `PR-${Date.now()}`;
      
      // Insert PR data
      const { data: createdPR, error: prError } = await supabase
        .from('purchase_requisitions')
        .insert({
          id,
          requester_id: pr.requester.id,
          requester_name: pr.requester.name,
          requester_email: pr.requester.email,
          department: pr.department,
          cost_center: pr.costCenter,
          budget_code: pr.budgetCode,
          status: pr.status,
          date_created: new Date().toISOString(),
          date_needed: pr.dateNeeded,
          justification: pr.justification,
          total_amount: pr.totalAmount,
          version: 1
        })
        .select()
        .single();
      
      if (prError) throw prError;
      
      // Insert line items
      if (pr.lineItems.length > 0) {
        const lineItemsData = pr.lineItems.map(item => ({
          id: item.id,
          pr_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          category: item.category,
          delivery_date: item.deliveryDate,
          notes: item.notes
        }));
        
        const { error: lineItemsError } = await supabase
          .from('line_items')
          .insert(lineItemsData);
        
        if (lineItemsError) throw lineItemsError;
      }
      
      // Insert approvers if any
      if (pr.approvers && pr.approvers.length > 0) {
        const approversData = pr.approvers.map(approver => ({
          id: `pa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          pr_id: id,
          approver_id: approver.id,
          approver_name: approver.name,
          approver_email: approver.email,
          status: approver.status,
          comment: approver.comment,
          date: approver.date
        }));
        
        const { error: approversError } = await supabase
          .from('pr_approvers')
          .insert(approversData);
        
        if (approversError) throw approversError;
      }
      
      // Return the full PR object with line items and approvers
      return await purchaseRequisitionAPI.getById(id);
    } catch (error) {
      console.error('Error creating PR in Supabase:', error);
      // Fallback to mock implementation
      const newPR: PurchaseRequisition = {
        ...pr,
        id: `PR-${Date.now()}`,
        status: PRStatus.DRAFT,
        version: 1,
        dateCreated: new Date().toISOString()
      };
      
      mockPRs.push(newPR);
      return {...newPR};
    }
  },
  
  update: async (id: string, updates: Partial<PurchaseRequisition>): Promise<PurchaseRequisition> => {
    try {
      // First get the current PR to determine what needs to be updated
      const currentPR = await purchaseRequisitionAPI.getById(id);
      
      // Update the PR details
      const prUpdates: any = {};
      if (updates.department) prUpdates.department = updates.department;
      if (updates.costCenter) prUpdates.cost_center = updates.costCenter;
      if (updates.budgetCode) prUpdates.budget_code = updates.budgetCode;
      if (updates.status) prUpdates.status = updates.status;
      if (updates.dateNeeded) prUpdates.date_needed = updates.dateNeeded;
      if (updates.justification) prUpdates.justification = updates.justification;
      if (updates.totalAmount) prUpdates.total_amount = updates.totalAmount;
      
      // Increment version
      prUpdates.version = currentPR.version + 1;
      
      if (Object.keys(prUpdates).length > 0) {
        const { error: prError } = await supabase
          .from('purchase_requisitions')
          .update(prUpdates)
          .eq('id', id);
        
        if (prError) throw prError;
      }
      
      // Update line items if provided
      if (updates.lineItems) {
        // Delete existing line items
        const { error: deleteError } = await supabase
          .from('line_items')
          .delete()
          .eq('pr_id', id);
        
        if (deleteError) throw deleteError;
        
        // Insert updated line items
        const lineItemsData = updates.lineItems.map(item => ({
          id: item.id,
          pr_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          category: item.category,
          delivery_date: item.deliveryDate,
          notes: item.notes
        }));
        
        const { error: insertError } = await supabase
          .from('line_items')
          .insert(lineItemsData);
        
        if (insertError) throw insertError;
      }
      
      // Update approvers if provided
      if (updates.approvers) {
        // Delete existing approvers
        const { error: deleteError } = await supabase
          .from('pr_approvers')
          .delete()
          .eq('pr_id', id);
        
        if (deleteError) throw deleteError;
        
        // Insert updated approvers
        const approversData = updates.approvers.map(approver => ({
          id: `pa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          pr_id: id,
          approver_id: approver.id,
          approver_name: approver.name,
          approver_email: approver.email,
          status: approver.status,
          comment: approver.comment,
          date: approver.date
        }));
        
        const { error: insertError } = await supabase
          .from('pr_approvers')
          .insert(approversData);
        
        if (insertError) throw insertError;
      }
      
      // Return the updated PR
      return await purchaseRequisitionAPI.getById(id);
    } catch (error) {
      console.error('Error updating PR in Supabase:', error);
      // Fallback to mock implementation
      const index = mockPRs.findIndex(pr => pr.id === id);
      if (index === -1) throw new Error('Purchase Requisition not found');
      
      const updatedPR = {
        ...mockPRs[index],
        ...updates,
        version: mockPRs[index].version + 1
      };
      
      mockPRs[index] = updatedPR;
      return {...updatedPR};
    }
  },
  
  submit: async (id: string): Promise<PurchaseRequisition> => {
    try {
      // Get the PR to be submitted
      const pr = await purchaseRequisitionAPI.getById(id);
      
      // Get approvers for this cost center
      const { data: costCenterApprovers, error: approversError } = await supabase
        .from('cost_center_approvers')
        .select('*')
        .eq('cost_center', pr.costCenter);
      
      if (approversError) throw approversError;
      
      // If no specific approvers, assign to admin users
      const approversList = costCenterApprovers.length > 0 
        ? costCenterApprovers.map(a => ({
            id: a.user_id,
            name: a.user_name,
            email: a.user_email,
            status: 'PENDING' as const,
          }))
        : [{ 
            id: "approver123", 
            name: "Jane Smith", 
            email: "jane.smith@example.com", 
            status: 'PENDING' as const 
          }];
      
      // Update PR status and approvers
      const updates: Partial<PurchaseRequisition> = {
        status: PRStatus.PENDING_APPROVAL,
        approvers: approversList
      };
      
      return await purchaseRequisitionAPI.update(id, updates);
    } catch (error) {
      console.error('Error submitting PR in Supabase:', error);
      // Fallback to mock implementation
      const prs = mockPRs;
      const index = prs.findIndex(pr => pr.id === id);
      if (index === -1) throw new Error('Purchase Requisition not found');
      
      const costCenter = prs[index].costCenter;
      const approvers = mockCostCenterApprovers.filter(a => a.costCenter === costCenter);
      
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
        ...prs[index],
        status: PRStatus.PENDING_APPROVAL,
        approvers: approversList
      };
      
      prs[index] = updatedPR;
      
      console.log(`Notification: New PR ${id} requires approval`);
      approversList.forEach(approver => {
        console.log(`Email sent to ${approver.email} requesting approval for PR ${id}`);
      });
      
      return {...updatedPR};
    }
  },
  
  approve: async (id: string, approverId: string, comment?: string): Promise<PurchaseRequisition> => {
    try {
      // Get current PR
      const pr = await purchaseRequisitionAPI.getById(id);
      
      // Find the approver
      const approverIndex = pr.approvers.findIndex(a => a.id === approverId);
      if (approverIndex === -1) throw new Error('Approver not found for this PR');
      
      // Update approver status
      pr.approvers[approverIndex] = {
        ...pr.approvers[approverIndex],
        status: 'APPROVED',
        comment,
        date: new Date().toISOString()
      };
      
      // Check if all approvers have approved
      const allApproved = pr.approvers.every(a => a.status === 'APPROVED');
      if (allApproved) {
        pr.status = PRStatus.APPROVED;
        console.log(`Notification: PR ${id} has been fully approved`);
      }
      
      // Update PR in database
      return await purchaseRequisitionAPI.update(id, {
        status: pr.status,
        approvers: pr.approvers
      });
    } catch (error) {
      console.error('Error approving PR in Supabase:', error);
      // Fallback to mock implementation
      const prs = mockPRs;
      const prIndex = prs.findIndex(pr => pr.id === id);
      if (prIndex === -1) throw new Error('Purchase Requisition not found');
      
      const pr = {...prs[prIndex]};
      
      const approverIndex = pr.approvers.findIndex(a => a.id === approverId);
      if (approverIndex === -1) throw new Error('Approver not found for this PR');
      
      pr.approvers[approverIndex] = {
        ...pr.approvers[approverIndex],
        status: 'APPROVED',
        comment,
        date: new Date().toISOString()
      };
      
      const allApproved = pr.approvers.every(a => a.status === 'APPROVED');
      if (allApproved) {
        pr.status = PRStatus.APPROVED;
        console.log(`Notification: PR ${id} has been fully approved`);
      }
      
      prs[prIndex] = pr;
      
      return {...pr};
    }
  },
  
  reject: async (id: string, approverId: string, comment: string): Promise<PurchaseRequisition> => {
    try {
      // Get current PR
      const pr = await purchaseRequisitionAPI.getById(id);
      
      // Find the approver
      const approverIndex = pr.approvers.findIndex(a => a.id === approverId);
      if (approverIndex === -1) throw new Error('Approver not found for this PR');
      
      // Update approver status
      pr.approvers[approverIndex] = {
        ...pr.approvers[approverIndex],
        status: 'REJECTED',
        comment,
        date: new Date().toISOString()
      };
      
      // Update PR status
      pr.status = PRStatus.REJECTED;
      console.log(`Notification: PR ${id} has been rejected by ${approverId}`);
      
      // Update PR in database
      return await purchaseRequisitionAPI.update(id, {
        status: pr.status,
        approvers: pr.approvers
      });
    } catch (error) {
      console.error('Error rejecting PR in Supabase:', error);
      // Fallback to mock implementation
      const prs = mockPRs;
      const prIndex = prs.findIndex(pr => pr.id === id);
      if (prIndex === -1) throw new Error('Purchase Requisition not found');
      
      const pr = {...prs[prIndex]};
      
      const approverIndex = pr.approvers.findIndex(a => a.id === approverId);
      if (approverIndex === -1) throw new Error('Approver not found for this PR');
      
      pr.approvers[approverIndex] = {
        ...pr.approvers[approverIndex],
        status: 'REJECTED',
        comment,
        date: new Date().toISOString()
      };
      
      pr.status = PRStatus.REJECTED;
      console.log(`Notification: PR ${id} has been rejected by ${approverId}`);
      
      prs[prIndex] = pr;
      
      return {...pr};
    }
  },
  
  convertToPO: async (id: string): Promise<{ pr: PurchaseRequisition, po: PurchaseOrder }> => {
    await delay(500);
    const prs = loadPRsFromStorage();
    const prIndex = prs.findIndex(pr => pr.id === id);
    if (prIndex === -1) throw new Error('Purchase Requisition not found');
    
    const pr = prs[prIndex];
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
    
    const pos = loadPOsFromStorage();
    pos.push(newPO);
    savePOsToStorage(pos);
    
    // Update the PR status
    const updatedPR = {
      ...pr,
      status: PRStatus.CONVERTED_TO_PO
    };
    
    prs[prIndex] = updatedPR;
    savePRsToStorage(prs);
    
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
    return loadPOsFromStorage();
  },
  
  getById: async (id: string): Promise<PurchaseOrder> => {
    await delay(200);
    const pos = loadPOsFromStorage();
    const po = pos.find(po => po.id === id);
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
    
    const pos = loadPOsFromStorage();
    pos.push(newPO);
    savePOsToStorage(pos);
    
    return {...newPO};
  },
  
  update: async (id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    await delay(300);
    const pos = loadPOsFromStorage();
    const index = pos.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase Order not found');
    
    const updatedPO = {
      ...pos[index],
      ...updates,
      version: pos[index].version + 1
    };
    
    pos[index] = updatedPO;
    savePOsToStorage(pos);
    
    return {...updatedPO};
  },
  
  submit: async (id: string): Promise<PurchaseOrder> => {
    await delay(300);
    const pos = loadPOsFromStorage();
    const index = pos.findIndex(po => po.id === id);
    if (index === -1) throw new Error('Purchase Order not found');
    
    const updatedPO = {
      ...pos[index],
      status: POStatus.PENDING_APPROVAL,
    };
    
    pos[index] = updatedPO;
    savePOsToStorage(pos);
    
    // Here we would trigger notifications to approvers
    console.log(`Notification: New PO ${id} requires approval`);
    
    return {...updatedPO};
  },
  
  approve: async (id: string, approverId: string, comment?: string): Promise<PurchaseOrder> => {
    await delay(300);
    const pos = loadPOsFromStorage();
    const poIndex = pos.findIndex(po => po.id === id);
    if (poIndex === -1) throw new Error('Purchase Order not found');
    
    const po = {...pos[poIndex]};
    
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
    
    pos[poIndex] = po;
    savePOsToStorage(pos);
    
    return {...po};
  },
  
  reject: async (id: string, approverId: string, comment: string): Promise<PurchaseOrder> => {
    await delay(300);
    const pos = loadPOsFromStorage();
    const poIndex = pos.findIndex(po => po.id === id);
    if (poIndex === -1) throw new Error('Purchase Order not found');
    
    const po = {...pos[poIndex]};
    
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
    
    pos[poIndex] = po;
    savePOsToStorage(pos);
    
    return {...po};
  },
  
  sendToVendor: async (id: string): Promise<PurchaseOrder> => {
    await delay(300);
    const pos = loadPOsFromStorage();
    const poIndex = pos.findIndex(po => po.id === id);
    if (poIndex === -1) throw new Error('Purchase Order not found');
    
    if (pos[poIndex].status !== POStatus.APPROVED) {
      throw new Error('Only approved POs can be sent to vendors');
    }
    
    const updatedPO = {
      ...pos[poIndex],
      status: POStatus.SENT_TO_VENDOR
    };
    
    // Here we would send an email to the vendor
    console.log(`Email sent to vendor ${updatedPO.vendor.email} with PO ${updatedPO.poNumber}`);
    
    pos[poIndex] = updatedPO;
    savePOsToStorage(pos);
    
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
    try {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*');
      
      if (error) throw error;
      
      // Transform the data to match the Vendor type
      return vendors.map(v => ({
        id: v.id,
        name: v.name,
        contactPerson: v.contact_person,
        email: v.email,
        phone: v.phone,
        address: v.address,
        taxId: v.tax_id,
        paymentTerms: v.payment_terms,
        category: v.category,
        status: v.status,
        createdAt: v.created_at,
        updatedAt: v.updated_at
      }));
    } catch (error) {
      console.error('Error fetching vendors from Supabase:', error);
      // Fallback to mock data
      return [...mockVendors];
    }
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
    try {
      let query = supabase
        .from('cost_center_approvers')
        .select('*');
      
      if (costCenter) {
        query = query.eq('cost_center', costCenter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(a => ({
        id: a.id,
        userId: a.user_id,
        userName: a.user_name,
        userEmail: a.user_email,
        costCenter: a.cost_center,
        approvalLimit: a.approval_limit
      }));
    } catch (error) {
      console.error('Error fetching cost center approvers from Supabase:', error);
      // Fallback to mock data
      if (costCenter) {
        return mockCostCenterApprovers.filter(a => a.costCenter === costCenter);
      }
      return [...mockCostCenterApprovers];
    }
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
