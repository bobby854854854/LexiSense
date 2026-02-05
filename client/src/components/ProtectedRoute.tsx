import React from 'react';

export const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) => {
  return <Component {...rest} />;
};