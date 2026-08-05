import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';

const schema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().min(10, "Description too short"),
});

export const ArtworkForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: any) => {
    // Logic to call API service...
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input {...register('title')} className="mt-1 w-full rounded-md border p-2" />
        {errors.title && <p className="text-red-500 text-xs">{errors.title.message as string}</p>}
      </div>
      <Button type="submit" loading={isSubmitting}>Submit Artwork</Button>
    </form>
  );
};