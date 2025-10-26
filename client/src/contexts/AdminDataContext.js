import React, { createContext, useContext, useState } from 'react';

const AdminDataContext = createContext();

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};

export const AdminDataProvider = ({ children }) => {
  const [totalUsers, setTotalUsers] = useState(0);

  return (
    <AdminDataContext.Provider value={{ totalUsers, setTotalUsers }}>
      {children}
    </AdminDataContext.Provider>
  );
};
