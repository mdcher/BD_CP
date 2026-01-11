import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAuthorSchema, type UpdateAuthorDto } from "@/features/authors/schemas.ts";
import { useAuthor, useUpdateAuthor } from "@/features/authors/authorsApi.ts";
import { useEffect } from "react";

function EditAuthorPage(): React.JSX.Element {
	const { authorId } = Route.useParams();
	const { data: author, isLoading, isError } = useAuthor(authorId);
	const updateMutation = useUpdateAuthor();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<UpdateAuthorDto>({
		resolver: zodResolver(updateAuthorSchema),
	});

	useEffect(() => {
		if (author) {
			reset({
				fullname: author.fullname,
			});
		}
	}, [author, reset]);

	const onSubmit = (data: UpdateAuthorDto): void => {
		updateMutation.mutate({ id: authorId, data });
	};

	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const errorInputClass =
		"border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20";
	const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";
	const errorClass = "mt-1 text-xs text-red-500";

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
			</div>
		);
	}

	if (isError || !author) {
		return (
			<div className="rounded-lg bg-red-50 p-4 text-red-600">
				Автора не знайдено.
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-8 animate-in fade-in duration-500">
			<div>
				<Link
					to="/authors"
					className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-indigo-600"
				>
					← Повернутися до списку
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Редагувати автора</h1>
				<p className="text-slate-500">Оновіть інформацію про автора</p>
			</div>

			<div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
				<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
					<div>
						<label className={labelClass} htmlFor="fullname">
							Повне ім'я автора *
						</label>
						<input
							id="fullname"
							className={
								errors.fullname
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							placeholder="Тарас Шевченко"
							type="text"
							{...register("fullname")}
						/>
						{errors.fullname && (
							<p className={errorClass}>{errors.fullname.message}</p>
						)}
					</div>

					<div className="flex gap-3 pt-4">
						<button
							disabled={updateMutation.isPending}
							type="submit"
							className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
						>
							{updateMutation.isPending ? "Збереження..." : "Зберегти зміни"}
						</button>
						<Link
							to="/authors"
							className="flex-1 rounded-lg border border-slate-300 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
						>
							Скасувати
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/authors/$authorId")({
	component: EditAuthorPage,
});
