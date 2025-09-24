import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import AuthLoading from './AuthLoading';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAppContext();
  const location = useLocation();

  // Show elegant loading screen while authentication is being checked
  if (isAuthLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    // Redirect to login with the current location as state
    return <Navigate to="/sign-in" state={{ from: location, message: 'Please log in or register to access this page.' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
