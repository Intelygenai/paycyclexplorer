
import React from 'react';
import { 
  BarChart3, 
  FileText, 
  FileCheck, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PRStatus, POStatus } from '@/types/p2p';
import { purchaseRequisitionAPI, purchaseOrderAPI } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const StatusCard = ({ 
  title, 
  count, 
  icon, 
  bgColor, 
  path 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  bgColor: string;
  path: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{count}</div>
        <div className={`p-2 rounded-full ${bgColor}`}>
          {icon}
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Link to={path} className="text-sm text-blue-600 hover:underline flex items-center">
        View all <ArrowUpRight className="ml-1 h-3 w-3" />
      </Link>
    </CardFooter>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();

  const { data: prs = [] } = useQuery({
    queryKey: ['purchaseRequisitions'],
    queryFn: purchaseRequisitionAPI.getAll,
  });

  const { data: pos = [] } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: purchaseOrderAPI.getAll,
  });

  // Calculate summary metrics
  const pendingPRsCount = prs.filter(pr => pr.status === PRStatus.PENDING_APPROVAL).length;
  const pendingPOsCount = pos.filter(po => po.status === POStatus.PENDING_APPROVAL).length;
  const pendingReceiptsCount = pos.filter(po => 
    po.status === POStatus.SENT_TO_VENDOR || 
    po.status === POStatus.PARTIALLY_FULFILLED
  ).length;
  const alertsCount = pos.filter(po => 
    (new Date(po.requiredDate) < new Date() && 
     po.status !== POStatus.COMPLETED)
  ).length;

  // PR Status data for chart
  const prStatusData = [
    { name: 'Draft', value: prs.filter(pr => pr.status === PRStatus.DRAFT).length },
    { name: 'Pending', value: pendingPRsCount },
    { name: 'Approved', value: prs.filter(pr => pr.status === PRStatus.APPROVED).length },
    { name: 'Rejected', value: prs.filter(pr => pr.status === PRStatus.REJECTED).length },
    { name: 'Converted', value: prs.filter(pr => pr.status === PRStatus.CONVERTED_TO_PO).length },
  ];

  // PO Status data for chart
  const poStatusData = [
    { name: 'Draft', value: pos.filter(po => po.status === POStatus.DRAFT).length },
    { name: 'Pending', value: pendingPOsCount },
    { name: 'Approved', value: pos.filter(po => po.status === POStatus.APPROVED).length },
    { name: 'Sent', value: pos.filter(po => po.status === POStatus.SENT_TO_VENDOR).length },
    { name: 'Partial', value: pos.filter(po => po.status === POStatus.PARTIALLY_FULFILLED).length },
    { name: 'Complete', value: pos.filter(po => po.status === POStatus.COMPLETED).length },
  ];

  const monthlySpendsData = [
    { name: 'Jan', amount: 4000 },
    { name: 'Feb', amount: 3500 },
    { name: 'Mar', amount: 6000 },
    { name: 'Apr', amount: 5500 },
    { name: 'May', amount: 7000 },
    { name: 'Jun', amount: 9000 },
    { name: 'Jul', amount: 8000 },
    { name: 'Aug', amount: 12000 },
    { name: 'Sep', amount: 10000 },
    { name: 'Oct', amount: 0 },
    { name: 'Nov', amount: 0 },
    { name: 'Dec', amount: 0 },
  ];

  // Chart colors
  const COLORS = ['#718096', '#FFA500', '#38B2AC', '#E53E3E', '#3182CE', '#2F855A'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard 
          title="Pending Requisitions" 
          count={pendingPRsCount}
          icon={<FileText className="h-5 w-5 text-white" />}
          bgColor="bg-blue-500"
          path="/purchase-requisitions?status=pending"
        />
        <StatusCard 
          title="Pending Orders" 
          count={pendingPOsCount}
          icon={<FileCheck className="h-5 w-5 text-white" />}
          bgColor="bg-indigo-500"
          path="/purchase-orders?status=pending"
        />
        <StatusCard 
          title="Pending Receipts" 
          count={pendingReceiptsCount}
          icon={<Package className="h-5 w-5 text-white" />}
          bgColor="bg-green-500"
          path="/goods-receipt"
        />
        <StatusCard 
          title="Alerts" 
          count={alertsCount}
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
          bgColor="bg-red-500"
          path="/purchase-orders?status=alert"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Procurement Spend</CardTitle>
            <CardDescription>Year to date procurement spend in USD</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlySpendsData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3182CE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PR & PO Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-80 grid grid-cols-1 gap-4">
            <div className="h-36">
              <p className="text-sm font-medium mb-2">Purchase Requisitions</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={45}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-36">
              <p className="text-sm font-medium mb-2">Purchase Orders</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={poStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={45}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {poStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Recent Requisitions</CardTitle>
              <CardDescription>Latest PRs submitted</CardDescription>
            </div>
            <Link to="/purchase-requisitions">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prs.slice(0, 5).map((pr) => (
                <div key={pr.id} className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{pr.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {pr.department} - ${pr.totalAmount}
                    </p>
                  </div>
                  <div className="flex items-center">
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Upcoming Deliveries</CardTitle>
              <CardDescription>Expected goods receipts</CardDescription>
            </div>
            <Link to="/goods-receipt">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pos
                .filter(po => po.status === POStatus.SENT_TO_VENDOR)
                .slice(0, 5)
                .map((po) => (
                  <div key={po.id} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{po.poNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {po.vendor.name} - ${po.totalAmount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        {new Date(po.requiredDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
