import type * as React from "react";
import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordDto, useChangePassword } from "@/features/auth/api";
import { useAuthStore } from "@/store/authStore";

function ChangePasswordPage(): React.JSX.Element {
	const navigate = useNavigate();
	const token = useAuthStore((state) => state.token);
	const changePasswordMutation = useChangePassword();

	// Redirect if not logged in (use useEffect to avoid setState during render)
	useEffect(() => {
		if (!token) {
			void navigate({ to: "/login" });
		}
	}, [token, navigate]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ChangePasswordDto>({
		// resolver: zodResolver(changePasswordSchema),
	});

	const onSubmit = (data: ChangePasswordDto): void => {
		changePasswordMutation.mutate(data);
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
					<div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-8 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl shadow-inner backdrop-blur-sm">
							🔑
						</div>
						<h1 className="text-2xl font-bold text-white">Зміна паролю</h1>
						<p className="mt-2 text-orange-100">
							Оновіть свій пароль
						</p>
					</div>

					<div className="p-8">
						<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
							{/* Current Password */}
							<div>
								<label className={labelClass} htmlFor="password">
									Поточний пароль
								</label>
								<input
									id="password"
									className={
										errors.password
											? `${inputClass} ${errorInputClass}`
											: inputClass
									}
									placeholder="Введіть поточний пароль"
									type="password"
									{...register("password")}
								/>
								{errors.password && (
									<p className="mt-1 flex items-center gap-1 text-sm text-red-500">
										<span>⚠️</span> {errors.password.message}
									</p>
								)}
							</div>

							{/* New Password */}
							<div>
								<label className={labelClass} htmlFor="passwordNew">
									Новий пароль
								</label>
								<input
									id="passwordNew"
									className={
										errors.passwordNew
											? `${inputClass} ${errorInputClass}`
											: inputClass
									}
									placeholder="Мінімум 4 символи"
									type="password"
									{...register("passwordNew")}
								/>
								{errors.passwordNew && (
									<p className="mt-1 flex items-center gap-1 text-sm text-red-500">
										<span>⚠️</span> {errors.passwordNew.message}
									</p>
								)}
							</div>

							{/* Confirm New Password */}
							<div>
								<label className={labelClass} htmlFor="passwordConfirm">
									Підтвердіть новий пароль
								</label>
								<input
									id="passwordConfirm"
									className={
										errors.passwordConfirm
											? `${inputClass} ${errorInputClass}`
											: inputClass
									}
									placeholder="Повторіть новий пароль"
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
								disabled={changePasswordMutation.isPending}
								type="submit"
								className="group relative w-full overflow-hidden rounded-lg bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-700 hover:shadow-orange-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
							>
								<div className="relative flex items-center justify-center gap-2">
									{changePasswordMutation.isPending ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											<span>Зміна...</span>
										</>
									) : (
										<span>Змінити пароль</span>
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

export const Route = createFileRoute("/change-password")({
	component: ChangePasswordPage,
});
