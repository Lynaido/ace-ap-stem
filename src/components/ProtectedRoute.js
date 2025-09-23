import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login with the current location as state
    return <Navigate to="/sign-in" state={{ from: location, message: 'Please log in or register to access this page.' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
