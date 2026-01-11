import type * as React from "react";
import { useEffect } from "react";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { useLoan, useUpdateLoan } from "@/features/loans/loansApi";
import { useBooks } from "@/features/books/booksApi";
import { updateLoanSchema, type UpdateLoanSchema } from "@/features/loans/schemas";

function EditLoanPage(): React.JSX.Element {
	const { loanId } = useParams({ from: "/loans/$loanId" });
	const navigate = useNavigate();
	const { data: loan, isLoading, isError } = useLoan(loanId);
	const { data: books, isLoading: booksLoading } = useBooks();
	const updateLoanMutation = useUpdateLoan();

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<UpdateLoanDto>({
		// resolver: zodResolver(updateLoanSchema),
	});

	useEffect(() => {
		if (loan) {
			reset({
				bookId: loan.book?.id,
				userId: loan.userId,
				issueDate: loan.issueDate,
				dueDate: loan.dueDate,
				isReturned: loan.isReturned,
				returnDate: loan.returnDate || undefined,
			});
		}
	}, [loan, reset]);

	const isReturned = watch("isReturned");

	const onSubmit = (data: UpdateLoanSchema): void => {
		updateLoanMutation.mutate({ id: loanId, data }, {
			onSuccess: () => {
				void navigate({ to: "/loans" });
			},
		});
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (isError || !loan) {
		return (
			<div className="container mx-auto p-4">
				<div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
					Loan not found or failed to load.
				</div>
			</div>
		);
	}

	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
	const errorClass = "mt-1 text-xs text-red-500";

	return (
		<div className="container mx-auto max-w-3xl p-4">
			<div className="mb-6">
				<button
					className="mb-4 text-blue-500 hover:text-blue-600"
					type="button"
					onClick={() => {
						void navigate({ to: "/loans" });
					}}
				>
					← Back to Loans
				</button>
				<h1 className="text-3xl font-bold text-gray-800">
					Edit Loan #{loan.id}
				</h1>
			</div>

			<form
				className="space-y-6 rounded-lg bg-white p-6 shadow-md"
				onSubmit={handleSubmit(onSubmit)}
			>
				{/* Book Selection */}
				<div>
					<label className={labelClass} htmlFor="bookId">
						Книга *
					</label>
					{booksLoading ? (
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
							Завантаження книг...
						</div>
					) : (
						<select
							className={inputClass}
							id="bookId"
							{...register("bookId", { valueAsNumber: true })}
						>
							<option value="">Оберіть книгу</option>
							{books?.map((book) => (
								<option key={book.id} value={book.id}>
									{book.bookTitle} ({book.publisher}, {book.year})
								</option>
							))}
						</select>
					)}
					{errors.bookId && (
						<p className={errorClass}>{errors.bookId.message}</p>
					)}
				</div>

				{/* User ID */}
				<div>
					<label className={labelClass} htmlFor="userId">
						User ID *
					</label>
					<input
						{...register("userId", { valueAsNumber: true })}
						id="userId"
						type="number"
						min="1"
						className={inputClass}
					/>
					{errors.userId && (
						<p className={errorClass}>{errors.userId.message}</p>
					)}
				</div>

				{/* Dates */}
				<div className="grid gap-6 md:grid-cols-2">
					<div>
						<label className={labelClass} htmlFor="issueDate">
							Дата видачі *
						</label>
						<input
							{...register("issueDate")}
							id="issueDate"
							type="date"
							className={inputClass}
						/>
						{errors.issueDate && (
							<p className={errorClass}>{errors.issueDate.message}</p>
						)}
					</div>
					<div>
						<label className={labelClass} htmlFor="dueDate">
							Дата повернення *
						</label>
						<input
							{...register("dueDate")}
							id="dueDate"
							type="date"
							className={inputClass}
						/>
						{errors.dueDate && (
							<p className={errorClass}>{errors.dueDate.message}</p>
						)}
					</div>
				</div>

				{/* Is Returned Checkbox */}
				<div className="flex items-center gap-3">
					<input
						id="isReturned"
						type="checkbox"
						className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
						{...register("isReturned")}
					/>
					<label htmlFor="isReturned" className="text-sm font-medium text-slate-700">
						Книга повернена
					</label>
				</div>

				{/* Return Date (conditional) */}
				{isReturned && (
					<div>
						<label className={labelClass} htmlFor="returnDate">
							Фактична дата повернення
						</label>
						<input
							{...register("returnDate")}
							id="returnDate"
							type="date"
							className={inputClass}
						/>
						{errors.returnDate && (
							<p className={errorClass}>{errors.returnDate.message}</p>
						)}
					</div>
				)}

				{/* Buttons */}
				<div className="flex gap-4">
					<button
						className="flex-1 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600 disabled:bg-gray-400"
						disabled={updateLoanMutation.isPending}
						type="submit"
					>
						{updateLoanMutation.isPending ? "Saving..." : "Save Changes"}
					</button>
					<button
						className="rounded-lg border border-gray-300 px-6 py-3 transition-colors hover:bg-gray-50"
						type="button"
						onClick={() => {
							void navigate({ to: "/loans" });
						}}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}

export const Route = createFileRoute("/loans/$loanId")({
	component: EditLoanPage,
});
