import React, { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBook, useUpdateBook } from "@/features/books/booksApi";
import { useAuthors } from "@/features/authors/authorsApi";
import { useGenres } from "@/features/genres/genresApi";
import {
	LanguageEnum,
	BookStatus,
	type UpdateBookDto,
} from "@/features/books/types";
import { updateBookSchema } from "@/features/books/schemas";

type UpdateBookForm = z.infer<typeof updateBookSchema>;

const languageDisplay: Record<LanguageEnum, string> = {
	[LanguageEnum.UKRAINIAN]: "Українська",
	[LanguageEnum.ENGLISH]: "Англійська",
	[LanguageEnum.GERMAN]: "Німецька",
	[LanguageEnum.FRENCH]: "Французька",
	[LanguageEnum.SPANISH]: "Іспанська",
	[LanguageEnum.ROMANIAN]: "Румунська",
	[LanguageEnum.SLOVAK]: "Словацька",
};

const statusDisplay: Record<BookStatus, string> = {
	[BookStatus.NEW]: "Нова",
	[BookStatus.GOOD]: "В доброму стані",
	[BookStatus.DAMAGED]: "Пошкоджена",
	[BookStatus.LOST]: "Втрачена",
};

function EditBookPage(): React.JSX.Element {
	const { bookId } = Route.useParams();
	const navigate = useNavigate();
	const { data: book, isLoading } = useBook(bookId);
	const { data: authors, isLoading: authorsLoading } = useAuthors();
	const { data: genres, isLoading: genresLoading } = useGenres();
	const updateMutation = useUpdateBook();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		reset,
	} = useForm<UpdateBookForm>({
		resolver: zodResolver(updateBookSchema),
		defaultValues: {
			authorIds: [],
			genreIds: [],
		},
	});

	// Заповнити форму даними книги після завантаження
	useEffect(() => {
		if (book && authors && genres) {
			// Знаходимо ID авторів за їх іменами
			const bookAuthors = book.authors.split(', ');
			const authorIds = authors
				.filter(a => bookAuthors.includes(a.fullname))
				.map(a => a.id);

			// Знаходимо ID жанрів за їх назвами
			const bookGenres = book.genres.split(', ');
			const genreIds = genres
				.filter(g => bookGenres.includes(g.genrename))
				.map(g => g.id);

			reset({
				bookTitle: book.title,
				publisher: book.publisher,
				year: book.year,
				language: book.language as LanguageEnum,
				status: book.status as BookStatus,
				location: book.location,
				authorIds: authorIds,
				genreIds: genreIds,
			});
		}
	}, [book, authors, genres, reset]);

	const onSubmit = (data: UpdateBookForm): void => {
		const bookData: UpdateBookDto = {
			title: data.bookTitle,
			publisher: data.publisher,
			language: data.language,
			year: data.year ? Number(data.year) : undefined,
			location: data.location,
			status: data.status,
			authorIds: data.authorIds,
			genreIds: data.genreIds,
		};
		updateMutation.mutate(
			{ id: bookId, data: bookData },
			{
				onSuccess: () => {
					void navigate({ to: "/books" });
				},
			}
		);
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
			</div>
		);
	}

	const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5";
	const labelClass = "mb-1.5 block text-sm font-medium";
	const errorClass = "mt-1 text-xs text-red-500";

	return (
		<div className="mx-auto max-w-xl py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Редагувати книгу</h1>
				<Link to="/books" className="text-sm font-medium text-indigo-600">Скасувати</Link>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div>
					<label className={labelClass} htmlFor="bookTitle">Назва *</label>
					<input id="bookTitle" {...register("bookTitle")} className={inputClass} />
					{errors.bookTitle && <p className={errorClass}>{errors.bookTitle.message}</p>}
				</div>
				<div>
					<label className={labelClass} htmlFor="publisher">Видавництво *</label>
					<input id="publisher" {...register("publisher")} className={inputClass} />
					{errors.publisher && <p className={errorClass}>{errors.publisher.message}</p>}
				</div>
				<div className="grid grid-cols-2 gap-6">
					<div>
						<label className={labelClass} htmlFor="year">Рік *</label>
						<input id="year" type="number" {...register("year")} className={inputClass} />
						{errors.year && <p className={errorClass}>{errors.year.message}</p>}
					</div>
					<div>
						<label className={labelClass} htmlFor="language">Мова *</label>
						<select id="language" {...register("language")} className={inputClass}>
							{Object.values(LanguageEnum).map(lang => <option key={lang} value={lang}>{languageDisplay[lang]}</option>)}
						</select>
						{errors.language && <p className={errorClass}>{errors.language.message}</p>}
					</div>
				</div>
				<div className="grid grid-cols-2 gap-6">
					<div>
						<label className={labelClass} htmlFor="status">Статус *</label>
						<select id="status" {...register("status")} className={inputClass}>
							{Object.values(BookStatus).map(status => <option key={status} value={status}>{statusDisplay[status]}</option>)}
						</select>
						{errors.status && <p className={errorClass}>{errors.status.message}</p>}
					</div>
					<div>
						<label className={labelClass} htmlFor="location">Локація *</label>
						<input id="location" {...register("location")} className={inputClass} />
						{errors.location && <p className={errorClass}>{errors.location.message}</p>}
					</div>
				</div>
				<div>
					<label className={labelClass}>Автори *</label>
					<Controller
						name="authorIds"
						control={control}
						render={({ field }) => (
							<div className="rounded-lg border border-slate-300 bg-white p-4 max-h-[200px] overflow-y-auto">
								{authorsLoading ? (
									<p className="text-sm text-slate-500">Завантаження...</p>
								) : (
									<div className="space-y-2">
										{authors?.map(author => (
											<label key={author.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
												<input
													type="checkbox"
													value={author.id}
													checked={field.value?.includes(author.id) || false}
													onChange={(e) => {
														const value = Number(e.target.value);
														const currentValue = field.value || [];
														const newValue = e.target.checked
															? [...currentValue, value]
															: currentValue.filter(id => id !== value);
														field.onChange(newValue);
													}}
													className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
												/>
												<span className="text-sm">{author.fullname}</span>
											</label>
										))}
									</div>
								)}
							</div>
						)}
					/>
					{errors.authorIds && <p className={errorClass}>{errors.authorIds.message}</p>}
				</div>
				<div>
					<label className={labelClass}>Жанри *</label>
					<Controller
						name="genreIds"
						control={control}
						render={({ field }) => (
							<div className="rounded-lg border border-slate-300 bg-white p-4 max-h-[200px] overflow-y-auto">
								{genresLoading ? (
									<p className="text-sm text-slate-500">Завантаження...</p>
								) : (
									<div className="space-y-2">
										{genres?.map(genre => (
											<label key={genre.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
												<input
													type="checkbox"
													value={genre.id}
													checked={field.value?.includes(genre.id) || false}
													onChange={(e) => {
														const value = Number(e.target.value);
														const currentValue = field.value || [];
														const newValue = e.target.checked
															? [...currentValue, value]
															: currentValue.filter(id => id !== value);
														field.onChange(newValue);
													}}
													className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
												/>
												<span className="text-sm">{genre.genrename}</span>
											</label>
										))}
									</div>
								)}
							</div>
						)}
					/>
					{errors.genreIds && <p className={errorClass}>{errors.genreIds.message}</p>}
				</div>
				<div className="pt-4">
					<button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white" disabled={updateMutation.isPending}>
						{updateMutation.isPending ? "Збереження..." : "Зберегти зміни"}
					</button>
				</div>
			</form>
		</div>
	);
}

export const Route = createFileRoute("/books/$bookId")({
	component: EditBookPage,
});
