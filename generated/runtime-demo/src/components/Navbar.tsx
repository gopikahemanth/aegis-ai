import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <ul className="flex items-center space-x-4">
        <li>
          <a href="#" className="text-lg hover:text-gray-300">Dashboard</a>
        </li>
        <li>
          <a href="#" className="text-lg hover:text-gray-300">Settings</a>
        </li>
        <li>
          <a href="#" className="text-lg hover:text-gray-300">Users</a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;