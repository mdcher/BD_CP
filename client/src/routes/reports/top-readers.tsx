import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTopReaders } from "@/features/reports/reportsApi.ts";

function TopReadersPage(): React.JSX.Element {
	const { data: readers, isLoading, isError } = useTopReaders(10);

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
				<h1 className="text-3xl font-bold text-slate-900">Топ читачів</h1>
				<p className="text-slate-500">10 найактивніших користувачів</p>
			</div>

			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<table className="w-full">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Місце
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Читач
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Контакт
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
								Прочитано книг
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
								Середня тривалість
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200">
						{readers?.length === 0 ? (
							<tr>
								<td colSpan={5} className="py-12 text-center text-slate-500">
									Немає даних
								</td>
							</tr>
						) : (
							readers?.map((reader, index) => (
								<tr
									key={index}
									className="transition-colors hover:bg-slate-50"
								>
									<td className="whitespace-nowrap px-6 py-4 text-sm">
										{index + 1 <= 3 ? (
											<span className="text-2xl">
												{index + 1 === 1 ? "🥇" : index + 1 === 2 ? "🥈" : "🥉"}
											</span>
										) : (
											<span className="font-medium text-slate-700">
												#{index + 1}
											</span>
										)}
									</td>
									<td className="px-6 py-4 text-sm font-medium text-slate-900">
										{reader.fullname}
									</td>
									<td className="px-6 py-4 text-sm text-slate-600">
										{reader.contactinfo}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right text-sm">
										<span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
											{reader.total_books_read} книг
										</span>
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-600">
										{reader.avg_days_per_book.toFixed(1)} днів
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

export const Route = createFileRoute("/reports/top-readers")({
	component: TopReadersPage,
});
