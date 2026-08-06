import React from 'react';

export const InventoryTable = ({ artworks, onDelete }: { artworks: any[], onDelete: (id: number) => void }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="p-4">Title</th>
            <th className="p-4">Artist</th>
            <th className="p-4">Price</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {artworks.map((art) => (
            <tr key={art.id} className="border-b border-slate-800 hover:bg-slate-900/50">
              <td className="p-4">{art.title}</td>
              <td className="p-4">{art.artist?.name}</td>
              <td className="p-4">${art.price}</td>
              <td className="p-4">
                <button 
                  onClick={() => onDelete(art.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};