
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { goodsReceiptAPI, purchaseOrderAPI } from '@/services/api';
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
import { Search, MoreHorizontal, PackageCheck, PackageOpen } from 'lucide-react';

const GoodsReceiptList = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<string>('pending');
  
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['goodsReceipts'],
    queryFn: goodsReceiptAPI.getAll,
  });
  
  const { data: pos = [], isLoading: posLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: purchaseOrderAPI.getAll,
  });
  
  const isLoading = receiptsLoading || posLoading;
  
  // Get pending deliveries (POs sent to vendor or partially fulfilled)
  const pendingDeliveries = pos.filter(po => 
    po.status === POStatus.SENT_TO_VENDOR || 
    po.status === POStatus.PARTIALLY_FULFILLED
  );
  
  // Filter receipts based on search term
  const filteredReceipts = receipts.filter(receipt => 
    receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Combine pending deliveries and completed receipts based on selected tab
  const displayItems = tab === 'pending' 
    ? pendingDeliveries.filter(po => 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredReceipts;
  
  // Sort by date
  const sortedItems = [...displayItems].sort((a, b) => {
    const dateA = 'dateReceived' in a 
      ? new Date(a.dateReceived).getTime() 
      : new Date(a.dateCreated).getTime();
    
    const dateB = 'dateReceived' in b 
      ? new Date(b.dateReceived).getTime() 
      : new Date(b.dateCreated).getTime();
    
    return dateB - dateA;
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading goods receipts...</div>;
  }

  const canReceiveGoods = hasPermission(Permission.RECEIVE_GOODS);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipt</h1>
          <p className="text-muted-foreground">
            Manage deliveries and goods receipts
          </p>
        </div>
      </div>
      
      <Tabs defaultValue={tab} onValueChange={setTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Deliveries</TabsTrigger>
            <TabsTrigger value="received">Received Goods</TabsTrigger>
          </TabsList>
          
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tab === 'pending' ? "Search pending deliveries..." : "Search received goods..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
          </div>
        </div>
        
        <TabsContent value={tab} className="mt-0">
          <Card>
            <CardContent className="p-0">
              {sortedItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tab === 'pending' ? (
                        <>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Date Created</TableHead>
                          <TableHead>Required Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Line Items</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Receipt Number</TableHead>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Received By</TableHead>
                          <TableHead>Date Received</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tab === 'pending' ? (
                      sortedItems.map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell>
                            <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline flex items-center">
                              <PackageOpen className="mr-1 h-3 w-3" /> {po.poNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{po.vendor.name}</TableCell>
                          <TableCell>{new Date(po.dateCreated).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(po.requiredDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              po.status === POStatus.PARTIALLY_FULFILLED 
                                ? 'bg-status-pending text-white' 
                                : 'bg-status-processing text-white'
                            }`}>
                              {po.status}
                            </span>
                          </TableCell>
                          <TableCell>{po.lineItems.length}</TableCell>
                          <TableCell>
                            {canReceiveGoods && (
                              <Button size="sm" asChild>
                                <Link to={`/goods-receipt/new?poId=${po.id}`}>Receive</Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      sortedItems.map((receipt: any) => (
                        <TableRow key={receipt.id}>
                          <TableCell>
                            <Link to={`/goods-receipt/${receipt.id}`} className="text-blue-600 hover:underline flex items-center">
                              <PackageCheck className="mr-1 h-3 w-3" /> {receipt.receiptNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link to={`/purchase-orders/${receipt.poId}`} className="text-blue-600 hover:underline">
                              {receipt.poNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{receipt.receivedBy.name}</TableCell>
                          <TableCell>{new Date(receipt.dateReceived).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              receipt.status === 'COMPLETED' 
                                ? 'bg-status-completed text-white' 
                                : 'bg-status-pending text-white'
                            }`}>
                              {receipt.status}
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
                                  <Link to={`/goods-receipt/${receipt.id}`}>View Details</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {tab === 'pending' 
                      ? 'No pending deliveries found' 
                      : 'No goods receipts found'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoodsReceiptList;
