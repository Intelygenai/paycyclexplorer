
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { purchaseOrderAPI } from '@/services/api';
import { POStatus } from '@/types/p2p';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, FileCheck } from 'lucide-react';

const PurchaseOrderList = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<string>('all');
  
  const { data: pos = [], isLoading, error } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: purchaseOrderAPI.getAll,
  });

  // Filter by search term and status
  const filteredPOs = pos.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tab === 'all') {
      return matchesSearch;
    }
    
    switch(tab) {
      case 'draft':
        return matchesSearch && po.status === POStatus.DRAFT;
      case 'pending':
        return matchesSearch && po.status === POStatus.PENDING_APPROVAL;
      case 'approved':
        return matchesSearch && po.status === POStatus.APPROVED;
      case 'sent':
        return matchesSearch && po.status === POStatus.SENT_TO_VENDOR;
      case 'partial':
        return matchesSearch && po.status === POStatus.PARTIALLY_FULFILLED;
      case 'complete':
        return matchesSearch && po.status === POStatus.COMPLETED;
      default:
        return matchesSearch;
    }
  });

  // Sort by date
  const sortedPOs = [...filteredPOs].sort((a, b) => {
    return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading purchase orders...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-8">Error loading purchase orders</div>;
  }

  const canCreatePO = hasPermission(Permission.CREATE_PO);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage and track purchase orders
          </p>
        </div>
        {canCreatePO && (
          <Link to="/purchase-orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Button>
          </Link>
        )}
      </div>
      
      <Tabs defaultValue={tab} onValueChange={setTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="partial">Partial</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>
          
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
          </div>
        </div>
        
        <TabsContent value={tab} className="mt-0">
          <Card>
            <CardContent className="p-0">
              {sortedPOs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Required Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell>
                          <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline flex items-center">
                            <FileCheck className="mr-1 h-3 w-3" /> {po.poNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{po.vendor.name}</TableCell>
                        <TableCell>{new Date(po.dateCreated).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(po.requiredDate).toLocaleDateString()}</TableCell>
                        <TableCell>${po.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span 
                            className={`text-xs px-2 py-1 rounded-full ${
                              po.status === POStatus.APPROVED ? 'bg-status-approved text-white' :
                              po.status === POStatus.PENDING_APPROVAL ? 'bg-status-pending text-white' :
                              po.status === POStatus.DRAFT ? 'bg-status-draft text-white' :
                              po.status === POStatus.SENT_TO_VENDOR ? 'bg-status-processing text-white' :
                              po.status === POStatus.PARTIALLY_FULFILLED ? 'bg-status-pending text-white' :
                              po.status === POStatus.COMPLETED ? 'bg-status-completed text-white' :
                              'bg-status-rejected text-white'
                            }`}
                          >
                            {po.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/purchase-orders/${po.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              {(po.status === POStatus.SENT_TO_VENDOR || po.status === POStatus.PARTIALLY_FULFILLED) && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/goods-receipt/new?poId=${po.id}`}>Record Goods Receipt</Link>
                                </DropdownMenuItem>
                              )}
                              {po.status === POStatus.APPROVED && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/purchase-orders/${po.id}/send`}>Send to Vendor</Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No purchase orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseOrderList;
