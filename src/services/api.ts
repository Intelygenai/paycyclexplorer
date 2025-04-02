
import { PurchaseRequisition, PRStatus, PurchaseOrder, POStatus, GoodsReceipt, Vendor, LineItem } from '@/types/p2p';
import { User, Permission } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Mock data for fallback/development
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
      
      if (!prs) return [...mockPRs];
      
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
      
      if (!pr) throw new Error('Purchase Requisition not found');
      
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
        .select();
      
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
      const approversList = costCenterApprovers && costCenterApprovers.length > 0 
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
      const index = mockPRs.findIndex(pr => pr.id === id);
      if (index === -1) throw new Error('Purchase Requisition not found');
      
      const costCenter = mockPRs[index].costCenter;
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
        ...mockPRs[index],
        status: PRStatus.PENDING_APPROVAL,
        approvers: approversList
      };
      
      mockPRs[index] = updatedPR;
      
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
      const prIndex = mockPRs.findIndex(pr => pr.id === id);
      if (prIndex === -1) throw new Error('Purchase Requisition not found');
      
      const pr = {...mockPRs[prIndex]};
      
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
      
      mockPRs[prIndex] = pr;
      
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
      const prIndex = mockPRs.findIndex(pr => pr.id === id);
      if (prIndex === -1) throw new Error('Purchase Requisition not found');
      
      const pr = {...mockPRs[prIndex]};
      
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
      
      mockPRs[prIndex] = pr;
      
      return {...pr};
    }
  },
  
  convertToPO: async (id: string): Promise<{ pr: PurchaseRequisition, po: PurchaseOrder }> => {
    await delay(500);
    
    try {
      // Get the PR
      const pr = await purchaseRequisitionAPI.getById(id);
      
      if (pr.status !== PRStatus.APPROVED) {
        throw new Error('Only approved PRs can be converted to POs');
      }
      
      // Get a vendor - in a real implementation, the vendor would be selected
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .limit(1);
      
      if (vendorError || !vendors || vendors.length === 0) throw new Error('No vendors available');
      
      const vendor = vendors[0];
      
      // Create a PO from the PR
      const poId = `PO-${Date.now()}`;
      const poNumber = `PO-${Date.now().toString().substring(6)}`;
      
      const { error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          id: poId,
          pr_id: pr.id,
          po_number: poNumber,
          vendor_id: vendor.id,
          status: POStatus.DRAFT,
          required_date: pr.dateNeeded,
          shipping_address: '123 Warehouse St, Business Park',
          billing_address: '456 Finance Ave, Business District',
          currency: 'USD',
          total_amount: pr.totalAmount,
          version: 1
        });
      
      if (poError) throw poError;
      
      // Copy line items to the PO
      const poLineItems = pr.lineItems.map(item => ({
        ...item,
        po_id: poId,
        pr_id: null
      }));
      
      const lineItemsData = poLineItems.map(item => ({
        id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        po_id: poId,
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
      
      // Update PR status
      const { error: updateError } = await supabase
        .from('purchase_requisitions')
        .update({ status: PRStatus.CONVERTED_TO_PO })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Construct PO object for return
      const po: PurchaseOrder = {
        id: poId,
        prId: pr.id,
        poNumber,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          contactPerson: vendor.contact_person,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          taxId: vendor.tax_id,
          paymentTerms: vendor.payment_terms,
          category: vendor.category,
          status: vendor.status as 'ACTIVE' | 'INACTIVE',
          createdAt: vendor.created_at,
          updatedAt: vendor.updated_at
        },
        status: POStatus.DRAFT,
        dateCreated: new Date().toISOString(),
        requiredDate: pr.dateNeeded,
        lineItems: pr.lineItems,
        shippingAddress: '123 Warehouse St, Business Park',
        billingAddress: '456 Finance Ave, Business District',
        currency: 'USD',
        totalAmount: pr.totalAmount,
        approvers: [],
        version: 1
      };
      
      // Update the PR with new status
      pr.status = PRStatus.CONVERTED_TO_PO;
      
      return {
        pr,
        po
      };
    } catch (error) {
      console.error('Error converting PR to PO:', error);
      // Fallback to mock implementation
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
        vendor: mockVendors[0],
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
  }
};

// Purchase Order API
export const purchaseOrderAPI = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    try {
      // TODO: Implement Supabase version when needed
      await delay(300);
      return [...mockPOs];
    } catch (error) {
      console.error('Error fetching POs:', error);
      return [...mockPOs];
    }
  },
  
  getById: async (id: string): Promise<PurchaseOrder> => {
    try {
      // TODO: Implement Supabase version when needed
      await delay(200);
      const po = mockPOs.find(po => po.id === id);
      if (!po) throw new Error('Purchase Order not found');
      return {...po};
    } catch (error) {
      console.error('Error fetching PO:', error);
      throw error;
    }
  },
  
  create: async (po: Omit<PurchaseOrder, 'id' | 'poNumber'>): Promise<PurchaseOrder> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error creating PO:', error);
      throw error;
    }
  },
  
  update: async (id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error updating PO:', error);
      throw error;
    }
  },
  
  submit: async (id: string): Promise<PurchaseOrder> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error submitting PO:', error);
      throw error;
    }
  },
  
  approve: async (id: string, approverId: string, comment?: string): Promise<PurchaseOrder> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error approving PO:', error);
      throw error;
    }
  },
  
  reject: async (id: string, approverId: string, comment: string): Promise<PurchaseOrder> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error rejecting PO:', error);
      throw error;
    }
  },
  
  sendToVendor: async (id: string): Promise<PurchaseOrder> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error sending PO to vendor:', error);
      throw error;
    }
  }
};

// Goods Receipt API
export const goodsReceiptAPI = {
  getAll: async (): Promise<GoodsReceipt[]> => {
    try {
      // TODO: Implement Supabase version when needed
      await delay(300);
      return [...mockGoodsReceipts];
    } catch (error) {
      console.error('Error fetching goods receipts:', error);
      return [...mockGoodsReceipts];
    }
  },
  
  getById: async (id: string): Promise<GoodsReceipt> => {
    try {
      // TODO: Implement Supabase version when needed
      await delay(200);
      const receipt = mockGoodsReceipts.find(gr => gr.id === id);
      if (!receipt) throw new Error('Goods Receipt not found');
      return {...receipt};
    } catch (error) {
      console.error('Error fetching goods receipt:', error);
      throw error;
    }
  },
  
  create: async (receipt: Omit<GoodsReceipt, 'id' | 'receiptNumber'>): Promise<GoodsReceipt> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error creating goods receipt:', error);
      throw error;
    }
  },
  
  update: async (id: string, updates: Partial<GoodsReceipt>): Promise<GoodsReceipt> => {
    try {
      // TODO: Implement Supabase version when needed
      await delay(300);
      const index = mockGoodsReceipts.findIndex(gr => gr.id === id);
      if (index === -1) throw new Error('Goods Receipt not found');
      
      const updatedReceipt = {
        ...mockGoodsReceipts[index],
        ...updates
      };
      mockGoodsReceipts[index] = updatedReceipt;
      return {...updatedReceipt};
    } catch (error) {
      console.error('Error updating goods receipt:', error);
      throw error;
    }
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
      
      if (!vendors) return [...mockVendors];
      
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
        status: v.status as 'ACTIVE' | 'INACTIVE',
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
    try {
      // TODO: Implement Supabase version when needed
      await delay(200);
      const vendor = mockVendors.find(v => v.id === id);
      if (!vendor) throw new Error('Vendor not found');
      return {...vendor};
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  },
  
  create: async (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
    try {
      // TODO: Implement Supabase version when needed
      await delay(500);
      const newVendor: Vendor = {
        ...vendor,
        id: `V-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockVendors.push(newVendor);
      return {...newVendor};
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },
  
  update: async (id: string, updates: Partial<Vendor>): Promise<Vendor> => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
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
      
      if (!data) {
        return costCenter 
          ? mockCostCenterApprovers.filter(a => a.costCenter === costCenter)
          : [...mockCostCenterApprovers];
      }
      
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
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error creating cost center approver:', error);
      throw error;
    }
  },
  
  updateCostCenterApprover: async (approver: {
    id: string;
    userId: string; 
    costCenter: string; 
    approvalLimit: number;
  }) => {
    try {
      // TODO: Implement Supabase version when needed
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
    } catch (error) {
      console.error('Error updating cost center approver:', error);
      throw error;
    }
  },
  
  deleteCostCenterApprover: async (id: string) => {
    try {
      // TODO: Implement Supabase version when needed
      await delay(500);
      
      const index = mockCostCenterApprovers.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Approver not found');
      
      const approver = mockCostCenterApprovers[index];
      mockCostCenterApprovers.splice(index, 1);
      
      return approver;
    } catch (error) {
      console.error('Error deleting cost center approver:', error);
      throw error;
    }
  }
};
