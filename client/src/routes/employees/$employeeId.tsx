import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateEmployeeSchema, type UpdateEmployeeDto } from "@/features/employees/schemas.ts";
import { useEmployee, useUpdateEmployee } from "@/features/employees/employeesApi.ts";
import { useEffect } from "react";

function EditEmployeePage(): React.JSX.Element {
	const { employeeId } = Route.useParams();
	const { data: employee, isLoading, isError } = useEmployee(employeeId);
	const updateMutation = useUpdateEmployee();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<UpdateEmployeeDto>({
		resolver: zodResolver(updateEmployeeSchema),
	});

	useEffect(() => {
		if (employee) {
			reset({
				position: employee.position,
				salaryrate: employee.salaryrate,
				workedhours: employee.workedhours,
			});
		}
	}, [employee, reset]);

	const onSubmit = (data: UpdateEmployeeDto): void => {
		updateMutation.mutate({ id: employeeId, data });
	};

	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const errorInputClass =
		"border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20";
	const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";
	const errorClass = "mt-1 text-xs text-red-500";

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
			</div>
		);
	}

	if (isError || !employee) {
		return (
			<div className="rounded-lg bg-red-50 p-4 text-red-600">
				Співробітника не знайдено.
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-8 animate-in fade-in duration-500">
			<div>
				<Link
					to="/employees"
					className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-indigo-600"
				>
					← Повернутися до списку
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Редагувати співробітника</h1>
				<p className="text-slate-500">
					{employee.fullname || `Користувач #${employee.userid}`}
				</p>
			</div>

			<div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
				<div className="mb-6 rounded-lg bg-slate-50 p-4">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="font-semibold text-slate-700">ID співробітника:</span>
							<p className="text-slate-900">{employee.employeeid}</p>
						</div>
						<div>
							<span className="font-semibold text-slate-700">ID користувача:</span>
							<p className="text-slate-900">{employee.userid}</p>
						</div>
						<div className="col-span-2">
							<span className="font-semibold text-slate-700">Розрахункова зарплата:</span>
							<p className="text-lg font-bold text-green-600">
								{employee.calculatedsalary.toFixed(2)} грн
							</p>
						</div>
					</div>
				</div>

				<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
					<div>
						<label className={labelClass} htmlFor="position">
							Посада
						</label>
						<input
							id="position"
							type="text"
							className={
								errors.position
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							{...register("position")}
						/>
						{errors.position && (
							<p className={errorClass}>{errors.position.message}</p>
						)}
					</div>

					<div>
						<label className={labelClass} htmlFor="salaryrate">
							Ставка зарплати (грн/год)
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
							{...register("salaryrate", { valueAsNumber: true })}
						/>
						{errors.salaryrate && (
							<p className={errorClass}>{errors.salaryrate.message}</p>
						)}
					</div>

					<div>
						<label className={labelClass} htmlFor="workedhours">
							Відпрацьовані години
						</label>
						<input
							id="workedhours"
							type="number"
							className={
								errors.workedhours
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							{...register("workedhours", { valueAsNumber: true })}
						/>
						{errors.workedhours && (
							<p className={errorClass}>{errors.workedhours.message}</p>
						)}
					</div>

					<div className="flex gap-3 pt-4">
						<button
							disabled={updateMutation.isPending}
							type="submit"
							className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
						>
							{updateMutation.isPending ? "Збереження..." : "Зберегти зміни"}
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

export const Route = createFileRoute("/employees/$employeeId")({
	component: EditEmployeePage,
});
