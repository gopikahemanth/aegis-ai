import { nanoid } from 'nanoid';

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

let todos: Todo[] = [];

function getAllTodos(): Todo[] {
  return [...todos];
}

function createTodo(text: string): Todo {
  const newTodo = {
    id: Date.now(),
    text,
    completed: false
  };
  todos.push(newTodo);
  return newTodo;
}

function updateTodo(id: number, updatedTodo: Todo) {
  todos = todos.map(todo => todo.id === id ? updatedTodo : todo);
}

function deleteTodo(id: number) {
  todos = todos.filter(todo => todo.id !== id);
}

export default {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo
};