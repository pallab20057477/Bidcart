import React from 'react';
import VendorNavigation from './VendorNavigation';
import { Outlet } from 'react-router-dom';

const VendorLayout = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1 space-y-6">
        <VendorNavigation />
      </aside>
      <section className="lg:col-span-3">
        <Outlet />
      </section>
    </div>
  );
};

export default VendorLayout;
