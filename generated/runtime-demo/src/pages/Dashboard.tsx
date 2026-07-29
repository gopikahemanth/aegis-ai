import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-4">
        <Navbar />
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-lg mb-4">This is the dashboard page.</p>
      </div>
    </div>
  );
};

export default Dashboard;