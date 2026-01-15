import { createFileRoute, Link } from "@tanstack/react-router";
import { useDebtorsReport } from "../../features/reports/reportsApi";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

function DebtorsReportPage() {
	const { data: debtors, isLoading, isError } = useDebtorsReport();

	if (isLoading) {
		return <div className="p-8 text-center">Завантаження...</div>;
	}

	if (isError) {
		return <div className="p-8 text-center text-red-600">Помилка завантаження звіту</div>;
	}

	return (
		<div className="space-y-6">
			<div>
				<Link
					to="/reports"
					className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-indigo-600"
				>
					← Повернутися до звітів
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Активні боржники</h1>
				<p className="text-slate-500">Користувачі, які мають прострочені книги</p>
			</div>

			<div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm text-slate-600">
						<thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
						<tr>
							<th className="px-6 py-4">Ім'я</th>
							<th className="px-6 py-4">Контакти</th>
							<th className="px-6 py-4">Книга</th>
							<th className="px-6 py-4">Дата повернення</th>
							<th className="px-6 py-4">Прострочення</th>
						</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
						{debtors?.map((debtor, index) => (
							<tr key={index} className="transition-colors hover:bg-slate-50">
								<td className="px-6 py-4 font-medium text-slate-900">
									{debtor.fullname}
								</td>
								<td className="px-6 py-4">{debtor.contactinfo}</td>
								<td className="px-6 py-4">{debtor.book_title}</td>
								<td className="px-6 py-4">
									{debtor.duedate
										? format(new Date(debtor.duedate), "d MMMM yyyy", { locale: uk })
										: "-"}
								</td>
								<td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                      {debtor.days_overdue} дн.
                    </span>
								</td>
							</tr>
						))}
						{(!debtors || debtors.length === 0) && (
							<tr>
								<td colSpan={5} className="px-6 py-8 text-center text-slate-500">
									Боржників не знайдено 🎉
								</td>
							</tr>
						)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/reports/debtors")({
	component: DebtorsReportPage,
});