import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useDebtorsReport } from "@/features/reports/reportsApi.ts";

function DebtorsReportPage(): React.JSX.Element {
	const { data: debtors, isLoading, isError } = useDebtorsReport();

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
				Помилка завантаження звіту.
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<Link
					to="/reports"
					className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-indigo-600"
				>
					← Повернутися до звітів
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Боржники</h1>
				<p className="text-slate-500">Користувачі з простроченими книгами</p>
			</div>

			<div className="rounded-lg bg-red-50 p-4">
				<p className="text-sm text-red-800">
					⚠️ Всього боржників: <span className="font-bold">{debtors?.length || 0}</span>
				</p>
			</div>

			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<table className="w-full">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Користувач
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Контакт
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Книга
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Дата повернення
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Прострочено (днів)
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200">
						{debtors?.length === 0 ? (
							<tr>
								<td colSpan={5} className="py-12 text-center text-slate-500">
									🎉 Немає боржників!
								</td>
							</tr>
						) : (
							debtors?.map((debtor, index) => (
								<tr
									key={index}
									className="transition-colors hover:bg-red-50"
								>
									<td className="px-6 py-4 text-sm font-medium text-slate-900">
										{debtor.fullname}
									</td>
									<td className="px-6 py-4 text-sm text-slate-600">
										{debtor.contactinfo}
									</td>
									<td className="px-6 py-4 text-sm text-slate-900">
										{debtor.book_title}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
										{new Date(debtor.duedate).toLocaleDateString("uk-UA")}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm">
										<span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
											{debtor.days_overdue} днів
										</span>
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

export const Route = createFileRoute("/reports/debtors")({
	component: DebtorsReportPage,
});
