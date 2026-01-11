import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  role: z.enum(['Reader', 'Librarian', 'Admin', 'Accountant']),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterUserPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await apiClient.post('/users', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('User registered successfully!');
      await navigate({ to: '/admin/users' });
    } catch (error) {
      console.error('Failed to register user:', error);
      alert('Failed to register user.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Register New User</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <label className="block font-medium">Full Name</label>
          <input {...register('fullName')} className="w-full p-2 border rounded" />
          {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input {...register('email')} className="w-full p-2 border rounded" />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block font-medium">Password</label>
          <input type="password" {...register('password')} className="w-full p-2 border rounded" />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block font-medium">Date of Birth</label>
          <input type="date" {...register('dateOfBirth')} className="w-full p-2 border rounded" />
          {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>}
        </div>
        <div>
          <label className="block font-medium">Role</label>
          <select {...register('role')} className="w-full p-2 border rounded">
            <option value="Reader">Reader</option>
            <option value="Librarian">Librarian</option>
            <option value="Admin">Admin</option>
            <option value="Accountant">Accountant</option>
          </select>
          {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded">
          Register User
        </button>
      </form>
    </div>
  );
}

export const Route = createFileRoute('/admin/users/create')({
  component: RegisterUserPage,
});
