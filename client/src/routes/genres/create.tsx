import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGenreSchema, type CreateGenreDto } from "@/features/genres/schemas.ts";
import { useCreateGenre } from "@/features/genres/genresApi.ts";

function CreateGenrePage(): React.JSX.Element {
	const createMutation = useCreateGenre();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateGenreDto>({
		resolver: zodResolver(createGenreSchema),
	});

	const onSubmit = (data: CreateGenreDto): void => {
		createMutation.mutate(data);
	};

	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const errorInputClass =
		"border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20";
	const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";
	const errorClass = "mt-1 text-xs text-red-500";

	return (
		<div className="mx-auto max-w-2xl space-y-8 animate-in fade-in duration-500">
			<div>
				<Link
					to="/genres"
					className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-indigo-600"
				>
					← Повернутися до списку
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Новий жанр</h1>
				<p className="text-slate-500">Додайте новий жанр до бібліотеки</p>
			</div>

			<div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
				<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
					<div>
						<label className={labelClass} htmlFor="genrename">
							Назва жанру *
						</label>
						<input
							id="genrename"
							className={
								errors.genrename
									? `${inputClass} ${errorInputClass}`
									: inputClass
							}
							placeholder="Фантастика"
							type="text"
							{...register("genrename")}
						/>
						{errors.genrename && (
							<p className={errorClass}>{errors.genrename.message}</p>
						)}
					</div>

					<div className="flex gap-3 pt-4">
						<button
							disabled={createMutation.isPending}
							type="submit"
							className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
						>
							{createMutation.isPending ? "Збереження..." : "Створити жанр"}
						</button>
						<Link
							to="/genres"
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

export const Route = createFileRoute("/genres/create")({
	component: CreateGenrePage,
});
