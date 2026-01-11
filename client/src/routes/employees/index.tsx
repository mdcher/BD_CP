import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEmployees, useDeleteEmployee } from "@/features/employees/employeesApi.ts";
import { useState } from "react";

function EmployeesPage(): React.JSX.Element {
	const { data: employees, isLoading, isError } = useEmployees();
	const deleteEmployeeMutation = useDeleteEmployee();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredEmployees = employees?.filter((employee) => {
		const query = searchQuery.toLowerCase();
		const name = (employee.fullname || "").toLowerCase();
		const position = employee.position.toLowerCase();
		return name.includes(query) || position.includes(query);
	});

	const handleDelete = (id: string | number): void => {
		if (window.confirm("Ви впевнені, що хочете видалити цього співробітника?")) {
			deleteEmployeeMutation.mutate(String(id));
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-lg bg-red-50 p-4 text-red-600">
				Помилка завантаження. Перевірте, чи запущено сервер.
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-slate-900">Співробітники</h1>
					<p className="text-slate-500">Управління співробітниками бібліотеки</p>
				</div>

				<Link
					className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
					to="/employees/create"
				>
					<span>➕</span> Додати співробітника
				</Link>
			</div>

			<div className="relative">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<span className="text-slate-400">🔍</span>
				</div>
				<input
					className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					placeholder="Пошук за ім'ям або посадою..."
					type="text"
					value={searchQuery}
					onChange={(event) => {
						setSearchQuery(event.target.value);
					}}
				/>
			</div>

			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<table className="w-full">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								ID
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Ім'я
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Посада
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Ставка (грн/год)
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Години
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Зарплата
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
								Дії
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200">
						{filteredEmployees?.length === 0 ? (
							<tr>
								<td colSpan={7} className="py-12 text-center text-slate-500">
									Співробітників не знайдено 😔
								</td>
							</tr>
						) : (
							filteredEmployees?.map((employee) => (
								<tr
									key={employee.employeeid}
									className="transition-colors hover:bg-slate-50"
								>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
										{employee.employeeid}
									</td>
									<td className="px-6 py-4 text-sm font-medium text-slate-900">
										{employee.fullname || `User #${employee.userid}`}
									</td>
									<td className="px-6 py-4 text-sm text-slate-600">
										{employee.position}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
										{employee.salaryrate.toFixed(2)}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
										{employee.workedhours}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-green-600">
										{employee.calculatedsalary.toFixed(2)} грн
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right text-sm">
										<div className="flex justify-end gap-2">
											<Link
												className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
												to="/employees/$employeeId"
												params={{ employeeId: String(employee.employeeid) }}
											>
												Редагувати
											</Link>
											<button
												className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
												onClick={() => {
													handleDelete(employee.employeeid);
												}}
											>
												Видалити
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/employees/")({
	component: EmployeesPage,
});
