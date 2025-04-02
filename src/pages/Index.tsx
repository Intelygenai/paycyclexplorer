
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login page
    navigate('/login');
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p>Redirecting to login...</p>
    </div>
  );
};

export default Index;
