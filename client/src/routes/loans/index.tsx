import type * as React from "react";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLoans, useDeleteLoan } from "@/features/loans/loansApi";

function LoansPage(): React.JSX.Element {
	const { data: loans, isLoading, isError } = useLoans();
	const deleteLoanMutation = useDeleteLoan();
	const [filter, setFilter] = useState<"all" | "active" | "returned">("all");

	const handleDelete = (id: number): void => {
		if (confirm("Ви впевнені, що хочете видалити цю видачу?")) {
			deleteLoanMutation.mutate(id.toString());
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
				Failed to load loans
			</div>
		);
	}

	// Filter loans
	const filteredLoans = loans?.filter((loan) => {
		if (filter === "active") return !loan.isReturned;
		if (filter === "returned") return loan.isReturned;
		return true;
	});

	// Check if loan is overdue
	const isOverdue = (loan: NonNullable<typeof loans>[number]): boolean => {
		if (loan.isReturned) return false;
		const dueDate = new Date(loan.dueDate);
		const today = new Date();
		return dueDate < today;
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-800">Видачі книг</h1>
					<p className="mt-1 text-sm text-gray-600">
						Всього видач: {loans?.length || 0}
					</p>
				</div>
				<Link
					to="/loans/create"
					className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
				>
					+ Нова видача
				</Link>
			</div>

			{/* Filter */}
			<div className="flex gap-2">
				<button
					onClick={() => setFilter("all")}
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
						filter === "all"
							? "bg-indigo-600 text-white shadow-md"
							: "bg-white text-gray-700 hover:bg-gray-100"
					}`}
				>
					Всі ({loans?.length || 0})
				</button>
				<button
					onClick={() => setFilter("active")}
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
						filter === "active"
							? "bg-orange-600 text-white shadow-md"
							: "bg-white text-gray-700 hover:bg-gray-100"
					}`}
				>
					Активні ({loans?.filter((l) => !l.isReturned).length || 0})
				</button>
				<button
					onClick={() => setFilter("returned")}
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
						filter === "returned"
							? "bg-green-600 text-white shadow-md"
							: "bg-white text-gray-700 hover:bg-gray-100"
					}`}
				>
					Повернені ({loans?.filter((l) => l.isReturned).length || 0})
				</button>
			</div>

			{/* Loans Table */}
			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								ID
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Книга
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								User ID
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Дата видачі
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Дата повернення
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Статус
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
								Дії
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white">
						{filteredLoans && filteredLoans.length > 0 ? (
							filteredLoans.map((loan) => (
								<tr
									key={loan.id}
									className={`transition-colors hover:bg-gray-50 ${
										isOverdue(loan) ? "bg-red-50" : ""
									}`}
								>
									<td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
										{loan.id}
									</td>
									<td className="px-6 py-4 text-sm text-gray-900">
										{loan.book?.title || "N/A"}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
										{loan.userId}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
										{loan.issueDate}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
										{loan.dueDate}
										{isOverdue(loan) && (
											<span className="ml-2 text-red-600 font-semibold">
												Прострочено!
											</span>
										)}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{loan.isReturned ? (
											<span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold leading-5 text-green-800">
												Повернено
											</span>
										) : (
											<span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold leading-5 text-orange-800">
												Активна
											</span>
										)}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
										<div className="flex justify-end gap-2">
											<Link
												to="/loans/$loanId"
												params={{ loanId: loan.id.toString() }}
												className="text-indigo-600 hover:text-indigo-900"
											>
												Редагувати
											</Link>
											<button
												onClick={() => handleDelete(loan.id)}
												disabled={deleteLoanMutation.isPending}
												className="text-red-600 hover:text-red-900 disabled:opacity-50"
											>
												Видалити
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={7} className="px-6 py-12 text-center">
									<div className="text-gray-500">
										<p className="text-lg font-medium">Видачі не знайдено</p>
										<Link
											to="/loans/create"
											className="mt-4 inline-block text-indigo-600 hover:text-indigo-900"
										>
											Створити нову видачу
										</Link>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/loans/")({
	component: LoansPage,
});
