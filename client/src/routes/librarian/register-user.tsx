import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import apiClient from "@/lib/axios";

interface CreateUserDto {
	fullName: string;
	email: string;
	password: string;
	dateOfBirth: string;
	role: string;
}

function RegisterUserPage(): React.JSX.Element {
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState<CreateUserDto>({
		fullName: "",
		email: "",
		password: "",
		dateOfBirth: "",
		role: "Reader",
	});

	const createUserMutation = useMutation({
		mutationFn: async (data: CreateUserDto) => {
			const response = await apiClient.post("/users", data);
			return response.data;
		},
		onSuccess: () => {
			toast.success("Користувача успішно зареєстровано!");
			void queryClient.invalidateQueries({ queryKey: ["users"] });
			// Очищаємо форму
			setFormData({
				fullName: "",
				email: "",
				password: "",
				dateOfBirth: "",
				role: "Reader",
			});
		},
		onError: (error: any) => {
			console.error("Помилка реєстрації користувача:", error);
			const errorMessage =
				error.response?.data?.message || "Не вдалося зареєструвати користувача.";
			toast.error(errorMessage);
		},
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	): void => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault();

		// Валідація
		if (!formData.fullName || !formData.email || !formData.password || !formData.dateOfBirth) {
			toast.error("Будь ласка, заповніть всі обов'язкові поля");
			return;
		}

		// Валідація email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast.error("Будь ласка, введіть коректну email адресу");
			return;
		}

		// Валідація пароля
		if (formData.password.length < 6) {
			toast.error("Пароль повинен містити мінімум 6 символів");
			return;
		}

		createUserMutation.mutate(formData);
	};

	return (
		<div className="animate-in fade-in duration-500">
			<div className="mx-auto max-w-2xl">
				{/* Заголовок */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-slate-900">Реєстрація нового користувача</h1>
					<p className="mt-2 text-slate-500">
						Заповніть форму для створення нового облікового запису читача
					</p>
				</div>

				{/* Форма */}
				<form
					onSubmit={handleSubmit}
					className="space-y-6 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5"
				>
					{/* Повне ім'я */}
					<div>
						<label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
							Повне ім'я <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="fullName"
							name="fullName"
							value={formData.fullName}
							onChange={handleChange}
							required
							className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							placeholder="Введіть повне ім'я"
						/>
					</div>

					{/* Email */}
					<div>
						<label htmlFor="email" className="block text-sm font-medium text-slate-700">
							Email <span className="text-red-500">*</span>
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							placeholder="user@example.com"
						/>
					</div>

					{/* Пароль */}
					<div>
						<label htmlFor="password" className="block text-sm font-medium text-slate-700">
							Пароль <span className="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							required
							minLength={6}
							className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							placeholder="Мінімум 6 символів"
						/>
						<p className="mt-1 text-sm text-slate-500">
							Пароль повинен містити мінімум 6 символів
						</p>
					</div>

					{/* Дата народження */}
					<div>
						<label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700">
							Дата народження <span className="text-red-500">*</span>
						</label>
						<input
							type="date"
							id="dateOfBirth"
							name="dateOfBirth"
							value={formData.dateOfBirth}
							onChange={handleChange}
							required
							className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
					</div>

					{/* Роль */}
					<div>
						<label htmlFor="role" className="block text-sm font-medium text-slate-700">
							Роль <span className="text-red-500">*</span>
						</label>
						<select
							id="role"
							name="role"
							value={formData.role}
							onChange={handleChange}
							required
							className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						>
							<option value="Reader">Читач</option>
							<option value="Librarian">Бібліотекар</option>
							<option value="Accountant">Бухгалтер</option>
						</select>
						<p className="mt-1 text-sm text-slate-500">
							Оберіть роль для нового користувача
						</p>
					</div>

					{/* Кнопки */}
					<div className="flex gap-4 pt-4">
						<button
							type="submit"
							disabled={createUserMutation.isPending}
							className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{createUserMutation.isPending ? "Реєстрація..." : "Зареєструвати користувача"}
						</button>
					</div>
				</form>

				{/* Інформаційний блок */}
				<div className="mt-6 rounded-xl bg-blue-50 p-6 ring-1 ring-blue-100">
					<div className="flex items-start gap-3">
						<span className="text-2xl">ℹ️</span>
						<div>
							<h3 className="font-semibold text-blue-900">Важлива інформація</h3>
							<ul className="mt-2 space-y-1 text-sm text-blue-700">
								<li>• Користувач отримає облікові дані для входу в систему</li>
								<li>• Email використовується для авторизації</li>
								<li>• Пароль буде зашифровано в базі даних</li>
								<li>• Користувач зможе змінити пароль після першого входу</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/librarian/register-user")({
	component: RegisterUserPage,
});
