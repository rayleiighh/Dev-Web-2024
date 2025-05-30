import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import ResetPassword from '../pages/ResetPassword'; 

const ResetPasswordProtected = () => {
  const [params] = useSearchParams();
  const token = params.get('token');

  // Si pas de token, redirection
  if (!token) return <Navigate to="/login" replace />;

  return <ResetPassword />;
};

export default ResetPasswordProtected;
