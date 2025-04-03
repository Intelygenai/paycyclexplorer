
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/types/auth';

const SupabaseLogin = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.REQUESTER);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const { login, signup, session, loading } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fill in demo credentials
  const fillDemoCredentials = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
  };
  
  useEffect(() => {
    // If the user is already logged in, redirect to dashboard
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      // No need to navigate here as useEffect will handle it
    } catch (err: any) {
      console.error('Login error:', err);
      // Extract the actual error message
      let errorMessage = 'Invalid credentials. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.data?.error) {
        errorMessage = err.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSigningUp(true);
    
    if (!name.trim()) {
      setError('Name is required.');
      setIsSigningUp(false);
      return;
    }
    
    try {
      await signup(email, password, name, department, role);
      toast({
        title: "Account created",
        description: "Your account has been created successfully. You can now log in.",
      });
      // Reset form and switch to login tab
      setName('');
      setDepartment('');
      const loginTab = document.querySelector('[data-state="inactive"][data-value="login"]') as HTMLButtonElement;
      if (loginTab) loginTab.click();
    } catch (err: any) {
      console.error('Signup error:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (typeof err === 'object') {
        if (err.message?.includes('already exists')) {
          errorMessage = 'This email is already registered. Please log in instead.';
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSigningUp(false);
    }
  };
  
  if (loading && !isLoggingIn && !isSigningUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">PayCycleXplorer</h1>
          <p className="text-gray-600 mt-2">Procurement Made Simple</p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-department">Department</Label>
                <Input
                  id="signup-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Enter your department"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSigningUp}
              >
                {isSigningUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={fillDemoCredentials} 
            className="w-full mt-4"
          >
            Use demo credentials
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            Demo credentials: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseLogin;
