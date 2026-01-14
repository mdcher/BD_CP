import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useGenres, useDeleteGenre } from "@/features/genres/genresApi.ts";
import { useState } from "react";

function GenresPage(): React.JSX.Element {
	const { data: genres, isLoading, isError } = useGenres();
	const deleteGenreMutation = useDeleteGenre();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredGenres = genres?.filter((genre) => {
		const query = searchQuery.toLowerCase();
		const name = genre.genrename.toLowerCase() || "";
		return name.includes(query);
	});

	const handleDelete = (id: string | number): void => {
		if (window.confirm("Ви впевнені, що хочете видалити цей жанр?")) {
			deleteGenreMutation.mutate(String(id));
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
					<h1 className="text-3xl font-bold text-slate-900">Жанри</h1>
					<p className="text-slate-500">Управління жанрами бібліотеки</p>
				</div>

				<Link
					className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
					to="/genres/create"
				>
					<span>➕</span> Додати жанр
				</Link>
			</div>

			<div className="relative">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<span className="text-slate-400">🔍</span>
				</div>
				<input
					className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					placeholder="Пошук жанру..."
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
								Назва жанру
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
								Дії
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200">
						{filteredGenres?.length === 0 ? (
							<tr>
								<td colSpan={3} className="py-12 text-center text-slate-500">
									Жанрів не знайдено 😔
								</td>
							</tr>
						) : (
							filteredGenres?.map((genre) => (
								<tr
									key={genre.id}
									className="transition-colors hover:bg-slate-50"
								>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
										{genre.id}
									</td>
									<td className="px-6 py-4 text-sm font-medium text-slate-900">
										{genre.genrename}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right text-sm">
										<button
											className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
											onClick={() => {
												handleDelete(genre.id);
											}}
										>
											Видалити
										</button>
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

export const Route = createFileRoute("/genres/")({
	component: GenresPage,
});
