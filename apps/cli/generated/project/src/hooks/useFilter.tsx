import { useState } from 'react';

type Filter = 'all' | 'active' | 'completed';

export default function useFilter() {
  const [filter, setFilter] = useState<Filter>('all');

  return { filter, setFilter };
}