import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  //useEffect(() => {
  //  if (isAuthenticated) {
  //    navigate('/');
  //  } else {
  //    navigate('/auth/login');
  //  }
  //}, [navigate, isAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Página no encontrada</h1>
      <p className="text-gray-600">
        Lo sentimos, la página que estás buscando no existe.
      </p>
    </div>
  );
};

export default NotFoundPage;
