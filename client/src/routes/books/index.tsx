import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore.ts";
import { useBooks, useDeleteBook } from "@/features/books/booksApi.ts";
import { useState } from "react";

function BooksPage(): React.JSX.Element {
	const { data: books, isLoading, isError } = useBooks();
	const deleteBookMutation = useDeleteBook();
	const [searchQuery, setSearchQuery] = useState("");
	const { isAuthenticated, user } = useAuthStore();

	const isAdminOrLibrarian =
		isAuthenticated && (user?.role === "Admin" || user?.role === "Librarian");
	const isReader = isAuthenticated && user?.role === "Reader";

	const filteredBooks = books?.filter((book) => {
		const query = searchQuery.toLowerCase();
		const title = book.title?.toLowerCase() ?? "";
		const authors = book.authors?.toLowerCase() ?? "";
		const genres = book.genres?.toLowerCase() ?? "";
		const publisher = book.publisher?.toLowerCase() ?? "";
		return (
			title.includes(query) ||
			authors.includes(query) ||
			genres.includes(query) ||
			publisher.includes(query)
		);
	});

	const handleDelete = (id: string): void => {
		if (window.confirm("Ви впевнені, що хочете видалити цю книгу?")) {
			deleteBookMutation.mutate(id);
		}
	};

	const handleReserve = async (bookId: number) => {
		try {
			await apiClient.post(
				`/reservations`,
				{ bookId },
				{ headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } },
			);
			alert("Book reserved successfully!");
		} catch (error) {
			console.error("Failed to reserve book:", error);
			alert("Failed to reserve book.");
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
					<h1 className="text-3xl font-bold text-slate-900">Бібліотека</h1>
					<p className="text-slate-500">Ваша колекція книг</p>
				</div>
				{isAdminOrLibrarian && (
					<Link
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
						to="/books/create"
					>
						<span>➕</span> Додати книгу
					</Link>
				)}
			</div>

			<div className="relative">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<span className="text-slate-400">🔍</span>
				</div>
				<input
					className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					placeholder="Пошук за назвою..."
					type="text"
					value={searchQuery}
					onChange={(event) => {
						setSearchQuery(event.target.value);
					}}
				/>
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{filteredBooks?.length === 0 ? (
					<div className="col-span-full py-12 text-center text-slate-500">
						Книг не знайдено 😔
					</div>
				) : (
					filteredBooks?.map((book) => (
						<div
							key={book.bookid}
							className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-xl hover:ring-indigo-500/20 hover:-translate-y-1"
						>
							<div>
								<div className="mb-4 flex items-start justify-between">
									<div className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
										{book.language}
									</div>
									<span className="text-xs font-medium text-slate-400">
										{book.year}
									</span>
								</div>

								<h3
									className="mb-1 text-xl font-bold text-slate-900 line-clamp-1"
									title={book.title}
								>
									{book.title || "Без назви"}
								</h3>

								<p className="mb-4 text-sm font-medium text-slate-500">
									{book.publisher}
								</p>

								<div className="mb-6 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
									<div className="flex justify-between">
										<span>Локація:</span>
										<span className="font-mono text-slate-700">
											{book.location}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Жанри:</span>
										<span className="text-right font-semibold text-slate-700 line-clamp-1">
											{book.genres}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Статус:</span>
										<span className="font-semibold text-slate-700">
											{book.availabilitystatus}
										</span>
									</div>
								</div>
							</div>

							<div className="flex gap-2 pt-2">
								{isAdminOrLibrarian && (
									<>
										<Link
											className="flex-1 rounded-lg border border-indigo-100 bg-indigo-50 py-2 text-center text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
											to="/books/$bookId"
											params={{ bookId: String(book.bookid) }}
										>
											Редагувати
										</Link>
										<button
											className="flex-1 rounded-lg border border-red-100 bg-red-50 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
											onClick={() => {
												handleDelete(String(book.bookid));
											}}
										>
											Видалити
										</button>
									</>
								)}
								{isReader && (
									<button
										className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600"
										onClick={() => {
											if (confirm("Ви впевнені, що хочете забронювати цю книгу?")) {
												handleReserve(book.bookid);
											}
										}}
									>
										Зарезервувати
									</button>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

export const Route = createFileRoute("/books/")({
	component: BooksPage,
});
