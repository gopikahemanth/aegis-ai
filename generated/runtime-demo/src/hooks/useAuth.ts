import { useState, useEffect } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Add authentication logic here
  }, []);

  return { user, setUser };
};

export default useAuth;