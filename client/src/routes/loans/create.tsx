import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateLoan } from "@/features/loans/loansApi";
import { useBooks } from "@/features/books/booksApi";
import { createLoanSchema, type CreateLoanSchema } from "@/features/loans/schemas";

function CreateLoanPage(): React.JSX.Element {
	const createLoanMutation = useCreateLoan();
	const { data: books, isLoading: booksLoading } = useBooks();

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<CreateLoanDto>({
		// resolver: zodResolver(createLoanSchema),
	});

	const isReturned = watch("isReturned");

	const onSubmit = (data: CreateLoanSchema): void => {
		const payload = {
			...data,
			issueDate: new Date(data.issueDate).toISOString(),
			dueDate: new Date(data.dueDate).toISOString(),
			...(data.returnDate && { returnDate: new Date(data.returnDate).toISOString() }),
		};
		createLoanMutation.mutate(payload);
	};
	
	const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5";
	const labelClass = "mb-1.5 block text-sm font-medium";
	const errorClass = "mt-1 text-xs text-red-500";

	return (
		<div className="mx-auto max-w-xl py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Нова видача</h1>
				<Link to="/loans" className="text-sm font-medium text-indigo-600">Скасувати</Link>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div>
					<label className={labelClass} htmlFor="bookId">Книга *</label>
					{booksLoading ? <p>Завантаження книг...</p> : (
						<select id="bookId" {...register("bookId", { valueAsNumber: true })} className={inputClass}>
							<option value="">Оберіть книгу</option>
							{books?.map(book => <option key={book.id} value={book.id}>{book.bookTitle}</option>)}
						</select>
					)}
					{errors.bookId && <p className={errorClass}>{errors.bookId.message}</p>}
				</div>
				<div>
					<label className={labelClass} htmlFor="userId">ID Користувача *</label>
					<input id="userId" type="number" {...register("userId", { valueAsNumber: true })} className={inputClass} />
					{errors.userId && <p className={errorClass}>{errors.userId.message}</p>}
				</div>
				<div className="grid grid-cols-2 gap-6">
					<div>
						<label className={labelClass} htmlFor="issueDate">Дата видачі *</label>
						<input id="issueDate" type="date" {...register("issueDate")} className={inputClass} />
						{errors.issueDate && <p className={errorClass}>{errors.issueDate.message}</p>}
					</div>
					<div>
						<label className={labelClass} htmlFor="dueDate">Дата повернення *</label>
						<input id="dueDate" type="date" {...register("dueDate")} className={inputClass} />
						{errors.dueDate && <p className={errorClass}>{errors.dueDate.message}</p>}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<input id="isReturned" type="checkbox" {...register("isReturned")} />
					<label htmlFor="isReturned">Книга вже повернена</label>
				</div>
				{isReturned && (
					<div>
						<label className={labelClass} htmlFor="returnDate">Фактична дата повернення</label>
						<input id="returnDate" type="date" {...register("returnDate")} className={inputClass} />
						{errors.returnDate && <p className={errorClass}>{errors.returnDate.message}</p>}
					</div>
				)}
				<div className="pt-4">
					<button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white" disabled={createLoanMutation.isPending}>
						{createLoanMutation.isPending ? "Створення..." : "Створити видачу"}
					</button>
				</div>
			</form>
		</div>
	);
}

export const Route = createFileRoute("/loans/create")({
	component: CreateLoanPage,
});
