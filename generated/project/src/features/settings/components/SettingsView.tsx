import React, { useState } from 'react';
import { User } from '../../../entities/User';
import { Card, Button, Input, Toast } from '../../../design-system';

interface SettingsViewProps {
  user: User;
  onUpdateProfile: (userId: string, data: Partial<User>) => Promise<User>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateProfile }) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateProfile(user.id, { name, email });
      setToastMessage('Profile updated successfully!');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissToast = () => {
    setToastMessage(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-fadeIn">
      {toastMessage && (
        <Toast toast={{ id: 'settings_toast', type: 'success', message: toastMessage }} onDismiss={handleDismissToast} />
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-100">User Settings & Preferences</h1>
        <p className="text-sm text-slate-400">Manage your study profile and account credentials.</p>
      </div>

      <Card className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-3">Profile Information</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="flex justify-end mt-4">
            <Button type="submit" variant="primary" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};