import React, { useState } from 'react';
export const SearchBar: React.FC<any> = (props: any) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const sampleItems = [
    { id: 1, title: 'Starry Night Resonance', artist: 'Vincent van Gogh', price: 1200, category: 'Impressionism', imageUrl: 'https://picsum.photos/seed/art1/600/400' },
    { id: 2, title: 'Abstract Composition #4', artist: 'Wassily Kandinsky', price: 850, category: 'Abstract', imageUrl: 'https://picsum.photos/seed/art2/600/400' },
    { id: 3, title: 'Neon Horizon', artist: 'Elena Vance', price: 1500, category: 'Digital', imageUrl: 'https://picsum.photos/seed/art3/600/400' }
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SearchBar</h1>
          <p className="text-slate-400 text-sm mt-1">Explore curated collection, filter by category, and manage inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search artworks or artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </header>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Impressionism', 'Abstract', 'Digital'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleItems.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-slate-700 transition-all">
            <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
            <div className="p-5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">{item.category}</span>
              <h3 className="text-lg font-bold text-white mt-2">{item.title}</h3>
              <p className="text-slate-400 text-xs mt-1">By {item.artist}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-base font-bold text-emerald-400">${item.price}</span>
                <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium">View Artwork</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SearchBar;
