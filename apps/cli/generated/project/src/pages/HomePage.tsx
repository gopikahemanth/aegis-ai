import { useState } from 'react';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import TodoFilter from '../components/TodoFilter';
import useTodos from '../hooks/useTodos';
import useFilter from '../hooks/useFilter';

export default function HomePage() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();
  const { filter, setFilter } = useFilter();
  
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div className="home-page">
      <h1>Todo App</h1>
      <TodoForm onSubmit={addTodo} />
      <TodoFilter currentFilter={filter} onFilterChange={setFilter} />
      <TodoList 
        todos={filteredTodos} 
        onToggle={toggleTodo} 
        onDelete={deleteTodo} 
      />
    </div>
  );
}