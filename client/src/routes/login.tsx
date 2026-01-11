import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto, useLogin } from "@/features/auth/api";

function LoginPage(): React.JSX.Element {
	const loginMutation = useLogin();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginDto>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = (data: LoginDto): void => {
		loginMutation.mutate(data);
	};

	// Стилі для Material Design
	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const errorInputClass =
		"border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20";
	const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

	return (
		<div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 p-4">
			{/* Картка з анімацією появи */}
			<div className="w-full max-w-md animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
				<div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5">
					{/* Декоративна шапка */}
					<div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl shadow-inner backdrop-blur-sm">
							🔐
						</div>
						<h1 className="text-2xl font-bold text-white">Ласкаво просимо</h1>
						<p className="mt-2 text-indigo-100">
							Увійдіть у свій обліковий запис
						</p>
					</div>

					<div className="p-8">
						<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
							{/* Email */}
							<div>
								<label className={labelClass} htmlFor="email">
									Електронна пошта
								</label>
								<input
									id="email"
									className={
										errors.email
											? `${inputClass} ${errorInputClass}`
											: inputClass
									}
									placeholder="admin@example.com"
									type="email"
									{...register("email")}
								/>
								{errors.email && (
									<p className="mt-1 flex items-center gap-1 text-sm text-red-500">
										<span>⚠️</span> {errors.email.message}
									</p>
								)}
							</div>

							{/* Password */}
							<div>
								<div className="flex items-center justify-between">
									<label className={labelClass} htmlFor="password">
										Пароль
									</label>
								</div>
								<input
									id="password"
									className={
										errors.password
											? `${inputClass} ${errorInputClass}`
											: inputClass
									}
									placeholder="••••••"
									type="password"
									{...register("password")}
								/>
								{errors.password && (
									<p className="mt-1 flex items-center gap-1 text-sm text-red-500">
										<span>⚠️</span> {errors.password.message}
									</p>
								)}
							</div>

							{/* Кнопка входу */}
							<button
								disabled={loginMutation.isPending}
								type="submit"
								className="group relative w-full overflow-hidden rounded-lg bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
							>
								<div className="relative flex items-center justify-center gap-2">
									{loginMutation.isPending ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											<span>Вхід...</span>
										</>
									) : (
										<span>Увійти</span>
									)}
								</div>
							</button>
						</form>

						<div className="mt-6 text-center">
							<Link
								to="/"
								className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
							>
								← Повернутися на головну
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/login")({
	component: LoginPage,
});
