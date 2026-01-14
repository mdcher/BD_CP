import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBook } from "@/features/books/booksApi";
import {
	LanguageEnum,
	BookStatus,
	type CreateBookDto,
} from "@/features/books/types";
import { createBookSchema } from "@/features/books/schemas";

type CreateBookForm = z.infer<typeof createBookSchema>;

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

function CreateBookPage(): React.JSX.Element {
	const createMutation = useCreateBook();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateBookForm>({
		resolver: zodResolver(createBookSchema),
	});

	const onSubmit = (data: CreateBookForm): void => {
		createMutation.mutate({ ...data, title: data.bookTitle } as CreateBookDto);
	};

	const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5";
	const labelClass = "mb-1.5 block text-sm font-medium";
	const errorClass = "mt-1 text-xs text-red-500";

	return (
		<div className="mx-auto max-w-xl py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Нова книга</h1>
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
				<div className="pt-4">
					<button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white" disabled={createMutation.isPending}>
						{createMutation.isPending ? "Створення..." : "Створити книгу"}
					</button>
				</div>
			</form>
		</div>
	);
}

export const Route = createFileRoute("/books/create")({
	component: CreateBookPage,
});
