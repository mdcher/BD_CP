import { createFileRoute, Link } from "@tanstack/react-router";
import { useReadingStatistics } from "@/features/reports/reportsApi";

function ReadingStatsPage() {
	const { data: stats, isLoading, isError } = useReadingStatistics();

	if (isLoading) return <div className="p-8 text-center">Завантаження...</div>;
	if (isError) return <div className="p-8 text-center text-red-600">Помилка</div>;

	return (
		<div className="space-y-6">
			<div>
				<Link to="/reports" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
					← Повернутися до звітів
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Статистика читання</h1>
			</div>

			<div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
				<table className="w-full text-left text-sm text-slate-600">
					<thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
					<tr>
						<th className="px-6 py-4">Читач</th>
						<th className="px-6 py-4 text-center">Прочитано книг</th>
						<th className="px-6 py-4 text-right">Середній час читання (дні)</th>
					</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
					{stats?.map((stat, index) => (
						<tr key={index}>
							<td className="px-6 py-4 font-medium text-slate-900">{stat.fullname}</td>
							<td className="px-6 py-4 text-center">{stat.total_loans}</td>
							<td className="px-6 py-4 text-right font-medium text-indigo-600">
								{stat.avg_reading_duration}
							</td>
						</tr>
					))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/reports/reading-stats")({
	component: ReadingStatsPage,
});