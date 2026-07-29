import React from 'react';
import Navbar from './Navbar';

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-4">
      <Navbar />
      <h1 className="text-3xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
      <p className="text-lg mb-4">This is a sample dashboard.</p>
    </div>
  );
};

export default Dashboard;