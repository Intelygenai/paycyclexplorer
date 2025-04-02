
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { purchaseRequisitionAPI } from '@/services/api';
import { PRStatus } from '@/types/p2p';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, FileText } from 'lucide-react';

const PurchaseRequisitionList = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [tab, setTab] = useState<string>('all');
  
  const { data: prs = [], isLoading, error } = useQuery({
    queryKey: ['purchaseRequisitions'],
    queryFn: purchaseRequisitionAPI.getAll,
  });

  // Filter by search term and status
  const filteredPRs = prs.filter(pr => {
    const matchesSearch = 
      pr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.requester.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tab === 'all') {
      return matchesSearch;
    }
    
    switch(tab) {
      case 'draft':
        return matchesSearch && pr.status === PRStatus.DRAFT;
      case 'pending':
        return matchesSearch && pr.status === PRStatus.PENDING_APPROVAL;
      case 'approved':
        return matchesSearch && pr.status === PRStatus.APPROVED;
      case 'rejected':
        return matchesSearch && pr.status === PRStatus.REJECTED;
      case 'converted':
        return matchesSearch && pr.status === PRStatus.CONVERTED_TO_PO;
      default:
        return matchesSearch;
    }
  });

  // Sort by date
  const sortedPRs = [...filteredPRs].sort((a, b) => {
    return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading purchase requisitions...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-8">Error loading purchase requisitions</div>;
  }

  const canCreatePR = hasPermission(Permission.CREATE_PR);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Requisitions</h1>
          <p className="text-muted-foreground">
            Manage and track purchase requisitions
          </p>
        </div>
        {canCreatePR && (
          <Link to="/purchase-requisitions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create PR
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
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="converted">Converted</TabsTrigger>
          </TabsList>
          
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requisitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
          </div>
        </div>
        
        <TabsContent value={tab} className="mt-0">
          <Card>
            <CardContent className="p-0">
              {sortedPRs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PR ID</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Date Needed</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPRs.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell>
                          <Link to={`/purchase-requisitions/${pr.id}`} className="text-blue-600 hover:underline flex items-center">
                            <FileText className="mr-1 h-3 w-3" /> {pr.id}
                          </Link>
                        </TableCell>
                        <TableCell>{pr.requester.name}</TableCell>
                        <TableCell>{pr.department}</TableCell>
                        <TableCell>{new Date(pr.dateCreated).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(pr.dateNeeded).toLocaleDateString()}</TableCell>
                        <TableCell>${pr.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span 
                            className={`text-xs px-2 py-1 rounded-full ${
                              pr.status === PRStatus.APPROVED ? 'bg-status-approved text-white' :
                              pr.status === PRStatus.PENDING_APPROVAL ? 'bg-status-pending text-white' :
                              pr.status === PRStatus.REJECTED ? 'bg-status-rejected text-white' :
                              pr.status === PRStatus.DRAFT ? 'bg-status-draft text-white' :
                              'bg-status-processing text-white'
                            }`}
                          >
                            {pr.status}
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
                                <Link to={`/purchase-requisitions/${pr.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              {pr.status === PRStatus.APPROVED && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/purchase-requisitions/${pr.id}/convert-to-po`}>Convert to PO</Link>
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
                  <p className="text-muted-foreground">No purchase requisitions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseRequisitionList;
