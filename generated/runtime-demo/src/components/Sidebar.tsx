import React from 'react';

const Sidebar = () => {
  return (
    <aside className="bg-gray-200 p-4 w-64 h-screen">
      <h2 className="text-2xl font-bold mb-4">Menu</h2>
      <ul className="space-y-4">
        <li>
          <a href="#" className="text-lg hover:text-gray-600">Dashboard</a>
        </li>
        <li>
          <a href="#" className="text-lg hover:text-gray-600">Settings</a>
        </li>
        <li>
          <a href="#" className="text-lg hover:text-gray-600">Users</a>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;