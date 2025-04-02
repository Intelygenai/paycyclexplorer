
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  permissions: Permission[];
}

export enum UserRole {
  ADMIN = 'ADMIN',
  REQUESTER = 'REQUESTER',
  APPROVER = 'APPROVER',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  WAREHOUSE_OPERATOR = 'WAREHOUSE_OPERATOR',
  FINANCE = 'FINANCE',
}

export enum Permission {
  CREATE_PR = 'CREATE_PR',
  APPROVE_PR = 'APPROVE_PR',
  CREATE_PO = 'CREATE_PO',
  APPROVE_PO = 'APPROVE_PO',
  RECEIVE_GOODS = 'RECEIVE_GOODS',
  MANAGE_VENDORS = 'MANAGE_VENDORS',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_REPORTS = 'VIEW_REPORTS',
}
