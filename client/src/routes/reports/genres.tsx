import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useGenrePopularity } from "@/features/reports/reportsApi.ts";

function GenrePopularityPage(): React.JSX.Element {
	const { data: genres, isLoading, isError } = useGenrePopularity();

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
				<h1 className="text-3xl font-bold text-slate-900">Популярність жанрів</h1>
				<p className="text-slate-500">Найпопулярніші книги за жанрами</p>
			</div>

			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<table className="w-full">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Жанр
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
								Найпопулярніша книга
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
								Кількість видач
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200">
						{genres?.length === 0 ? (
							<tr>
								<td colSpan={3} className="py-12 text-center text-slate-500">
									Немає даних
								</td>
							</tr>
						) : (
							genres?.map((genre, index) => (
								<tr
									key={index}
									className="transition-colors hover:bg-slate-50"
								>
									<td className="whitespace-nowrap px-6 py-4 text-sm">
										<span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
											{genre.genrename}
										</span>
									</td>
									<td className="px-6 py-4 text-sm font-medium text-slate-900">
										{genre.title}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right text-sm">
										<span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
											{genre.loan_count} видач
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

export const Route = createFileRoute("/reports/genres")({
	component: GenrePopularityPage,
});
