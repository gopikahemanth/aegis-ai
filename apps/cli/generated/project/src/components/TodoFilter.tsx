type Filter = 'all' | 'active' | 'completed';

interface TodoFilterProps {
  currentFilter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export default function TodoFilter({ currentFilter, onFilterChange }: TodoFilterProps) {
  return (
    <div className="todo-filter">
      <button 
        className={currentFilter === 'all' ? 'active' : ''}
        onClick={() => onFilterChange('all')}
      >
        All
      </button>
      <button 
        className={currentFilter === 'active' ? 'active' : ''}
        onClick={() => onFilterChange('active')}
      >
        Active
      </button>
      <button 
        className={currentFilter === 'completed' ? 'active' : ''}
        onClick={() => onFilterChange('completed')}
      >
        Completed
      </button>
    </div>
  );
}