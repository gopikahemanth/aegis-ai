import React from 'react';
import { AiChatInterface } from './AiChatInterface';
import { useAuth } from '../../auth/hooks/useAuth';

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'usr_guest';

  return <AiChatInterface userId={userId} />;
};