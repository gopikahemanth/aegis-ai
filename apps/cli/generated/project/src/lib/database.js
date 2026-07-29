import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

export const initializeDatabase = async () => {
  db = await open({
    filename: './todos.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE
    )
  `);

  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};