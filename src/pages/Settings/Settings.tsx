import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import UserManagement from './components/UserManagement';
import CostCenterManagement from './components/CostCenterManagement';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Permission } from '@/types/auth';

const Settings = () => {
  const { user } = useAuth();
  const supabaseAuth = useSupabaseAuth();
  const isAdmin = supabaseAuth.hasPermission(Permission.MANAGE_USERS);
  
  const [saving, setSaving] = useState(false);
  
  const handleSave = () => {
    setSaving(true);
    
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      });
    }, 1000);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences.
              </p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="users">User Management</TabsTrigger>
                  <TabsTrigger value="costCenters">Cost Centers</TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <input 
                        id="name" 
                        type="text" 
                        className="w-full p-2 border rounded-md" 
                        defaultValue={supabaseAuth.profile?.name || user?.name || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <input 
                        id="email" 
                        type="email" 
                        className="w-full p-2 border rounded-md bg-gray-100" 
                        defaultValue={supabaseAuth.profile?.email || user?.email || ""}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="department" className="text-sm font-medium">Department</label>
                      <input 
                        id="department" 
                        type="text" 
                        className="w-full p-2 border rounded-md" 
                        defaultValue={supabaseAuth.profile?.department || user?.department || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium">Role</label>
                      <input 
                        id="role" 
                        type="text" 
                        className="w-full p-2 border rounded-md bg-gray-100" 
                        defaultValue={supabaseAuth.profile?.role || user?.role || ""}
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email.
                        </p>
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Purchase Order Updates</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified about purchase order status changes.
                        </p>
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Requisition Approvals</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified about approval requests.
                        </p>
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance of the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Theme</h4>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="border-2 border-primary">Light</Button>
                      <Button variant="outline">Dark</Button>
                      <Button variant="outline">System</Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="users">
                  <UserManagement />
                </TabsContent>
                
                <TabsContent value="costCenters">
                  <CostCenterManagement />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
