import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterDto, useRegister } from "@/features/auth/api";

function RegisterPage(): React.JSX.Element {
	const registerMutation = useRegister();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterDto>({
		// resolver: zodResolver(registerSchema),
	});

	const onSubmit = (data: RegisterDto): void => {
		registerMutation.mutate(data);
	};

	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const errorInputClass =
		"border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20";
	const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

	return (
		<div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 p-4">
			<div className="w-full max-w-md animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
				<div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5">
					{/* Header */}
					<div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl shadow-inner backdrop-blur-sm">
							✨
						</div>
						<h1 className="text-2xl font-bold text-white">Реєстрація</h1>
						<p className="mt-2 text-emerald-100">
							Створіть новий обліковий запис
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
									placeholder="user@example.com"
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
								<label className={labelClass} htmlFor="password">
									Пароль
								</label>
								<input
									id="password"
									className={
										errors.password
											? `${inputClass} ${errorInputClass}`
											: inputClass
									}
									placeholder="Мінімум 4 символи"
									type="password"
									{...register("password")}
								/>
								{errors.password && (
									<p className="mt-1 flex items-center gap-1 text-sm text-red-500">
										<span>⚠️</span> {errors.password.message}
									</p>
								)}
							</div>

							{/* Password Confirm */}
							<div>
								<label className={labelClass} htmlFor="passwordConfirm">
									Підтвердіть пароль
								</label>
								<input
									id="passwordConfirm"
									className={
										errors.passwordConfirm
											? `${inputClass} ${errorInputClass}`
											: inputClass
									}
									placeholder="Повторіть пароль"
									type="password"
									{...register("passwordConfirm")}
								/>
								{errors.passwordConfirm && (
									<p className="mt-1 flex items-center gap-1 text-sm text-red-500">
										<span>⚠️</span> {errors.passwordConfirm.message}
									</p>
								)}
							</div>

							{/* Submit Button */}
							<button
								disabled={registerMutation.isPending}
								type="submit"
								className="group relative w-full overflow-hidden rounded-lg bg-green-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:bg-green-700 hover:shadow-green-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
							>
								<div className="relative flex items-center justify-center gap-2">
									{registerMutation.isPending ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											<span>Реєстрація...</span>
										</>
									) : (
										<span>Зареєструватися</span>
									)}
								</div>
							</button>
						</form>

						<div className="mt-6 text-center space-y-2">
							<p className="text-sm text-slate-600">
								Вже є обліковий запис?{" "}
								<Link
									to="/login"
									className="font-medium text-green-600 hover:text-green-700"
								>
									Увійти
								</Link>
							</p>
							<Link
								to="/"
								className="block text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
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

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});
