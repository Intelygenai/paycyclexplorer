
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vendorAPI } from '@/services/api';
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
import { Plus, Search, MoreHorizontal, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const VendorList = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: vendors = [], isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: vendorAPI.getAll,
  });

  // Filter by search term
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort by name
  const sortedVendors = [...filteredVendors].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading vendors...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-8">Error loading vendors</div>;
  }

  const canManageVendors = hasPermission(Permission.MANAGE_VENDORS);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage vendor information and contracts
          </p>
        </div>
        {canManageVendors && (
          <Link to="/vendors/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </Link>
        )}
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {sortedVendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <Link to={`/vendors/${vendor.id}`} className="text-blue-600 hover:underline flex items-center">
                        <Building className="mr-1 h-3 w-3" /> {vendor.name}
                      </Link>
                    </TableCell>
                    <TableCell>{vendor.contactPerson}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>{vendor.phone}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {vendor.category.slice(0, 2).map((category, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-100">
                            {category}
                          </Badge>
                        ))}
                        {vendor.category.length > 2 && (
                          <Badge variant="outline" className="bg-gray-100">
                            +{vendor.category.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        vendor.status === 'ACTIVE' 
                          ? 'bg-status-approved text-white' 
                          : 'bg-status-rejected text-white'
                      }`}>
                        {vendor.status}
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
                            <Link to={`/vendors/${vendor.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          {canManageVendors && (
                            <DropdownMenuItem asChild>
                              <Link to={`/vendors/${vendor.id}/edit`}>Edit</Link>
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
              <p className="text-muted-foreground">No vendors found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorList;
