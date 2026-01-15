import { createFileRoute, Link } from "@tanstack/react-router";
import { useTopReaders } from "@/features/reports/reportsApi";

function TopReadersPage() {
	const { data: readers, isLoading, isError } = useTopReaders(10);

	if (isLoading) return <div className="p-8 text-center">Завантаження...</div>;
	if (isError) return <div className="p-8 text-center text-red-600">Помилка</div>;

	return (
		<div className="space-y-6">
			<div>
				<Link to="/reports" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
					← Повернутися до звітів
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Топ читачів</h1>
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{readers?.map((reader, index) => (
					<div key={index} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-hover hover:shadow-md">
						<div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-indigo-50 opacity-50" />
						<div className="relative">
							<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-xl font-bold text-indigo-700">
								{index + 1}
							</div>
							<h3 className="text-lg font-bold text-slate-900">{reader.fullname}</h3>
							<p className="text-sm text-slate-500">{reader.contactinfo}</p>

							<div className="mt-6 flex items-baseline gap-2">
								<span className="text-3xl font-bold text-slate-900">{reader.total_books_read}</span>
								<span className="text-sm font-medium text-slate-600">книг прочитано</span>
							</div>
							<div className="mt-2 text-xs text-slate-400">
								Сер. час читання: {reader.avg_days_per_book} дн.
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export const Route = createFileRoute("/reports/top-readers")({
	component: TopReadersPage,
});