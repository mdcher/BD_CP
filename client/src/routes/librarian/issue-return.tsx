import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import apiClient from "@/lib/axios";

interface User {
	userid: number;
	fullname: string;
	contactinfo: string;
}

interface Book {
	bookid: number;
	title: string;
	authors: string;
	availabilitystatus: string;
}

interface ActiveLoan {
	loanid: number;
	username: string;
	booktitle: string;
	issuedate: string;
	duedate: string;
	is_overdue: boolean;
	days_overdue?: number;
}

function IssueReturnPage(): React.JSX.Element {
	const queryClient = useQueryClient();

	// Стан для видачі книги
	const [issueUserId, setIssueUserId] = useState("");
	const [issueBookId, setIssueBookId] = useState("");
	const [issueDays, setIssueDays] = useState("14");

	// Стан для повернення книги
	const [returnLoanId, setReturnLoanId] = useState("");
	const [searchLoan, setSearchLoan] = useState("");

	// Завантаження користувачів
	const { data: usersData = [] } = useQuery({
		queryKey: ["users"],
		queryFn: async () => {
			const response = await apiClient.get("/users");
			return response.data as User[];
		},
	});

	// Завантаження доступних книг
	const { data: booksData = [] } = useQuery({
		queryKey: ["books"],
		queryFn: async () => {
			const response = await apiClient.get("/books");
			return response.data as Book[];
		},
	});

	// Завантаження активних видач
	const { data: activeLoansData = [], refetch: refetchLoans } = useQuery({
		queryKey: ["active-loans"],
		queryFn: async () => {
			const response = await apiClient.get("/reports/active-loans");
			return response.data as ActiveLoan[];
		},
	});

	// Мутація для видачі книги
	const issueBookMutation = useMutation({
		mutationFn: async (data: { userId: number; bookId: number; days?: number }) => {
			const response = await apiClient.post("/loans", data);
			return response.data;
		},
		onSuccess: () => {
			toast.success("Книгу успішно видано!");
			setIssueUserId("");
			setIssueBookId("");
			setIssueDays("14");
			void queryClient.invalidateQueries({ queryKey: ["books"] });
			void queryClient.invalidateQueries({ queryKey: ["active-loans"] });
		},
		onError: (error: any) => {
			console.error("Помилка видачі книги:", error);
			const errorMessage =
				error.response?.data?.message || "Не вдалося видати книгу.";
			toast.error(errorMessage);
		},
	});

	// Мутація для повернення книги
	const returnBookMutation = useMutation({
		mutationFn: async (loanId: number) => {
			const response = await apiClient.post(`/loans/${loanId}/return`);
			return response.data;
		},
		onSuccess: () => {
			toast.success("Книгу успішно повернуто!");
			setReturnLoanId("");
			setSearchLoan("");
			void queryClient.invalidateQueries({ queryKey: ["books"] });
			void queryClient.invalidateQueries({ queryKey: ["active-loans"] });
			void refetchLoans();
		},
		onError: (error: any) => {
			console.error("Помилка повернення книги:", error);
			const errorMessage =
				error.response?.data?.message || "Не вдалося повернути книгу.";
			toast.error(errorMessage);
		},
	});

	const handleIssueBook = (e: React.FormEvent): void => {
		e.preventDefault();

		if (!issueUserId || !issueBookId) {
			toast.error("Будь ласка, оберіть користувача та книгу");
			return;
		}

		const days = Number.parseInt(issueDays, 10);
		if (days <= 0 || Number.isNaN(days)) {
			toast.error("Будь ласка, введіть коректну кількість днів");
			return;
		}

		issueBookMutation.mutate({
			userId: Number(issueUserId),
			bookId: Number(issueBookId),
			days,
		});
	};

	const handleReturnBook = (loanId: number): void => {
		if (confirm("Ви впевнені, що хочете повернути цю книгу?")) {
			returnBookMutation.mutate(loanId);
		}
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("uk-UA", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const availableBooks = booksData.filter(
		(book) => book.availabilitystatus === "Available"
	);

	const filteredLoans = activeLoansData.filter(
		(loan) =>
			loan.username.toLowerCase().includes(searchLoan.toLowerCase()) ||
			loan.booktitle.toLowerCase().includes(searchLoan.toLowerCase()) ||
			loan.loanid.toString().includes(searchLoan)
	);

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<h1 className="text-3xl font-bold text-slate-900">Видача та повернення книг</h1>
				<p className="mt-2 text-slate-500">Керування видачами книг читачам</p>
			</div>

			<div className="grid gap-8 lg:grid-cols-2">
				{/* Форма видачі книги */}
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
					<h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900">
						<span>📤</span> Видати книгу
					</h2>
					<form onSubmit={handleIssueBook} className="space-y-4">
						<div>
							<label htmlFor="issueUserId" className="block text-sm font-medium text-slate-700">
								Користувач <span className="text-red-500">*</span>
							</label>
							<select
								id="issueUserId"
								value={issueUserId}
								onChange={(e) => setIssueUserId(e.target.value)}
								required
								className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							>
								<option value="">Оберіть користувача</option>
								{usersData.filter(u => u.fullname).map((user) => (
									<option key={user.userid} value={user.userid}>
										{user.fullname} ({user.contactinfo})
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="issueBookId" className="block text-sm font-medium text-slate-700">
								Книга <span className="text-red-500">*</span>
							</label>
							<select
								id="issueBookId"
								value={issueBookId}
								onChange={(e) => setIssueBookId(e.target.value)}
								required
								className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							>
								<option value="">Оберіть книгу</option>
								{availableBooks.map((book) => (
									<option key={book.bookid} value={book.bookid}>
										{book.title} - {book.authors}
									</option>
								))}
							</select>
							<p className="mt-1 text-sm text-slate-500">
								Доступно книг: {availableBooks.length}
							</p>
						</div>

						<div>
							<label htmlFor="issueDays" className="block text-sm font-medium text-slate-700">
								Кількість днів <span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								id="issueDays"
								value={issueDays}
								onChange={(e) => setIssueDays(e.target.value)}
								min="1"
								max="90"
								required
								className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							/>
							<p className="mt-1 text-sm text-slate-500">Стандартний термін: 14 днів</p>
						</div>

						<button
							type="submit"
							disabled={issueBookMutation.isPending || availableBooks.length === 0}
							className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-green-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{issueBookMutation.isPending ? "Видача..." : "Видати книгу"}
						</button>
					</form>
				</div>

				{/* Статистика */}
				<div className="space-y-4">
					<div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
						<div className="mb-2 text-sm font-medium opacity-90">Активні видачі</div>
						<div className="text-4xl font-bold">{activeLoansData.length}</div>
					</div>
					<div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
						<div className="mb-2 text-sm font-medium opacity-90">Прострочені</div>
						<div className="text-4xl font-bold">
							{activeLoansData.filter((loan) => loan.is_overdue).length}
						</div>
					</div>
					<div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
						<div className="mb-2 text-sm font-medium opacity-90">Доступні книги</div>
						<div className="text-4xl font-bold">{availableBooks.length}</div>
					</div>
				</div>
			</div>

			{/* Список активних видач для повернення */}
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
				<h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900">
					<span>📥</span> Повернення книг
				</h2>

				{/* Пошук */}
				<div className="mb-4">
					<input
						type="text"
						placeholder="Пошук за користувачем, книгою або ID видачі..."
						value={searchLoan}
						onChange={(e) => setSearchLoan(e.target.value)}
						className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					/>
				</div>

				{filteredLoans.length > 0 ? (
					<div className="space-y-3">
						{filteredLoans.map((loan) => (
							<div
								key={loan.loanid}
								className={`rounded-lg border p-4 transition-all ${
									loan.is_overdue
										? "border-red-300 bg-red-50"
										: "border-slate-200 bg-slate-50 hover:bg-slate-100"
								}`}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold text-slate-900">{loan.booktitle}</h3>
											{loan.is_overdue && (
												<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
													Прострочено
												</span>
											)}
										</div>
										<p className="mt-1 text-sm text-slate-600">Читач: {loan.username}</p>
										<div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
											<div>
												<span className="text-slate-600">ID видачі: </span>
												<span className="font-medium text-slate-900">{loan.loanid}</span>
											</div>
											<div>
												<span className="text-slate-600">Дата видачі: </span>
												<span className="font-medium text-slate-900">{formatDate(loan.issuedate)}</span>
											</div>
											<div>
												<span className="text-slate-600">Термін повернення: </span>
												<span
													className={`font-medium ${
														loan.is_overdue ? "text-red-600" : "text-slate-900"
													}`}
												>
													{formatDate(loan.duedate)}
												</span>
											</div>
											{loan.is_overdue && loan.days_overdue !== undefined && (
												<div>
													<span className="text-slate-600">Прострочено на: </span>
													<span className="font-medium text-red-600">{loan.days_overdue} днів</span>
												</div>
											)}
										</div>
									</div>
									<button
										type="button"
										onClick={() => handleReturnBook(loan.loanid)}
										disabled={returnBookMutation.isPending}
										className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
									>
										Повернути
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-12 text-center">
						<div className="mb-4 text-6xl">📚</div>
						<h3 className="mb-2 text-xl font-bold text-slate-900">
							{searchLoan ? "Нічого не знайдено" : "Немає активних видач"}
						</h3>
						<p className="text-slate-600">
							{searchLoan
								? "Спробуйте змінити критерії пошуку"
								: "Всі книги повернуто або ще не видано"}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export const Route = createFileRoute("/librarian/issue-return")({
	component: IssueReturnPage,
});
