import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, type CreateEmployeeDto } from "@/features/employees/schemas.ts";
import { useCreateEmployee } from "@/features/employees/employeesApi.ts";

function CreateEmployeePage(): React.JSX.Element {
	const createMutation = useCreateEmployee();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateEmployeeDto>({
		resolver: zodResolver(createEmployeeSchema),
	});

	const onSubmit = (data: CreateEmployeeDto): void => {
		createMutation.mutate(data);
	};

	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const errorInputClass =
		"border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20";
	const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";
	const errorClass = "mt-1 text-xs text-red-500";

	return (
		<div className="mx-auto max-w-2xl space-y-8 animate-in fade-in duration-500">
			<div>
				<Link
					to="/employees"
					className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-indigo-600"
				>
					← Повернутися до списку
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Новий співробітник</h1>
				<p className="text-slate-500">Додайте нового співробітника</p>
			</div>

			<div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
				<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
					<div>
						<label className={labelClass} htmlFor="userid">
							ID користувача *
						</label>
						<input
							id="userid"
							type="number"
							className={
								errors.userid
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							placeholder="1"
							{...register("userid", { valueAsNumber: true })}
						/>
						{errors.userid && (
							<p className={errorClass}>{errors.userid.message}</p>
						)}
						<p className="mt-1 text-xs text-slate-500">
							Має відповідати існуючому користувачу в системі
						</p>
					</div>

					<div>
						<label className={labelClass} htmlFor="position">
							Посада *
						</label>
						<input
							id="position"
							type="text"
							className={
								errors.position
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							placeholder="Бібліотекар"
							{...register("position")}
						/>
						{errors.position && (
							<p className={errorClass}>{errors.position.message}</p>
						)}
					</div>

					<div>
						<label className={labelClass} htmlFor="salaryrate">
							Ставка зарплати (грн/год) *
						</label>
						<input
							id="salaryrate"
							type="number"
							step="0.01"
							className={
								errors.salaryrate
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							placeholder="150.00"
							{...register("salaryrate", { valueAsNumber: true })}
						/>
						{errors.salaryrate && (
							<p className={errorClass}>{errors.salaryrate.message}</p>
						)}
					</div>

					<div>
						<label className={labelClass} htmlFor="workedhours">
							Відпрацьовані години *
						</label>
						<input
							id="workedhours"
							type="number"
							className={
								errors.workedhours
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							placeholder="160"
							{...register("workedhours", { valueAsNumber: true })}
						/>
						{errors.workedhours && (
							<p className={errorClass}>{errors.workedhours.message}</p>
						)}
					</div>

					<div className="flex gap-3 pt-4">
						<button
							disabled={createMutation.isPending}
							type="submit"
							className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
						>
							{createMutation.isPending ? "Збереження..." : "Створити"}
						</button>
						<Link
							to="/employees"
							className="flex-1 rounded-lg border border-slate-300 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
						>
							Скасувати
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/employees/create")({
	component: CreateEmployeePage,
});
