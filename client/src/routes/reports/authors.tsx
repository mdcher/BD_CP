import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthorRatings } from "@/features/reports/reportsApi";

function AuthorRatingsPage() {
	const { data: authors, isLoading, isError } = useAuthorRatings();

	if (isLoading) return <div className="p-8 text-center">Завантаження...</div>;
	if (isError) return <div className="p-8 text-center text-red-600">Помилка</div>;

	return (
		<div className="space-y-6">
			<div>
				<Link to="/reports" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
					← Повернутися до звітів
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Рейтинг авторів</h1>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{authors?.map((author, index) => (
					<div key={index} className="flex items-center justify-between rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
						<div className="flex items-center gap-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600">
								#{author.rank_by_books}
							</div>
							<div>
								<h3 className="font-semibold text-slate-900">{author.fullname}</h3>
								<p className="text-sm text-slate-500">Книг у бібліотеці</p>
							</div>
						</div>
						<div className="text-2xl font-bold text-slate-900">{author.total_books}</div>
					</div>
				))}
			</div>
		</div>
	);
}

export const Route = createFileRoute("/reports/authors")({
	component: AuthorRatingsPage,
});