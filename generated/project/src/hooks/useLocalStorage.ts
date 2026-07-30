import { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return StorageService.get<T>(key, initialValue);
  });

  useEffect(() => {
    StorageService.set(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}