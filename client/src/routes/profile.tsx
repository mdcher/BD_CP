import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { useMyReservations, useCancelReservation } from "@/features/reservations/reservationsApi";
import { useMyUnpaidFines, useInitiatePayment } from "@/features/fines/finesApi";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

interface Loan {
	loanid: number;
	book_title: string;
	issuedate: string;
	duedate: string;
	returndate: string | null;
	is_overdue: boolean;
	days_until_due?: number;
}

function ProfilePage(): React.JSX.Element {
	const { user } = useAuthStore();
	const { data: reservations, isLoading: loadingReservations } = useMyReservations();
	const { data: fines, isLoading: loadingFines } = useMyUnpaidFines();
	const cancelReservationMutation = useCancelReservation();
	const initiatePaymentMutation = useInitiatePayment();

	// Завантажуємо активні видачі (loans)
	const { data: loans = [], isLoading: loadingLoans } = useQuery({
		queryKey: ["loans", "my"],
		queryFn: async () => {
			const response = await apiClient.get("/loans/my");
			return response.data;
		},
	});

	const handleCancelReservation = (reservationId: number): void => {
		if (confirm("Ви впевнені, що хочете скасувати це бронювання?")) {
			cancelReservationMutation.mutate(reservationId);
		}
	};

	const handleInitiatePayment = (fineId: number): void => {
		if (confirm("Ви впевнені, що хочете ініціювати оплату цього штрафу?")) {
			initiatePaymentMutation.mutate(fineId);
		}
	};

	const formatDate = (dateString: string | null): string => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("uk-UA", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat("uk-UA", {
			style: "currency",
			currency: "UAH",
		}).format(amount);
	};

	const getReservationStatusBadge = (status: string): React.JSX.Element => {
		const statusMap: Record<string, { label: string; class: string }> = {
			pending: { label: "Очікує", class: "bg-yellow-100 text-yellow-800" },
			confirmed: { label: "Підтверджено", class: "bg-green-100 text-green-800" },
			completed: { label: "Завершено", class: "bg-blue-100 text-blue-800" },
			cancelled: { label: "Скасовано", class: "bg-red-100 text-red-800" },
		};
		const statusInfo = statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800" };
		return (
			<span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.class}`}>
				{statusInfo.label}
			</span>
		);
	};

	const getFineStatusBadge = (fine: any): React.JSX.Element => {
		if (fine.ispaid) {
			return <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Оплачено</span>;
		}
		if (fine.payment_initiated_date) {
			return <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Очікує підтвердження</span>;
		}
		return <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">Неоплачено</span>;
	};

	if (loadingLoans || loadingReservations || loadingFines) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
					<p className="text-slate-600">Завантаження профілю...</p>
				</div>
			</div>
		);
	}

	const activeLoans = loans.filter((loan: Loan) => !loan.returndate);
	const completedLoans = loans.filter((loan: Loan) => loan.returndate);

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			{/* Заголовок профілю */}
			<div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white shadow-xl">
				<div className="flex items-center gap-4">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl backdrop-blur-sm">
						👤
					</div>
					<div>
						<h1 className="text-3xl font-bold">{user?.fullName}</h1>
						<p className="text-indigo-100">{user?.contactInfo}</p>
						<p className="mt-1 text-sm text-indigo-200">Роль: {user?.role === "Reader" ? "Читач" : user?.role}</p>
					</div>
				</div>
			</div>

			{/* Статистика */}
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
					<div className="mb-2 text-sm font-medium opacity-90">Активні видачі</div>
					<div className="text-4xl font-bold">{activeLoans.length}</div>
				</div>
				<div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
					<div className="mb-2 text-sm font-medium opacity-90">Бронювання</div>
					<div className="text-4xl font-bold">{reservations?.length || 0}</div>
				</div>
				<div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
					<div className="mb-2 text-sm font-medium opacity-90">Неоплачені штрафи</div>
					<div className="text-4xl font-bold">{fines?.filter(f => !f.ispaid && !f.payment_initiated_date).length || 0}</div>
				</div>
			</div>

			{/* Активні видачі */}
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
				<h2 className="mb-4 text-2xl font-bold text-slate-900">📚 Активні видачі</h2>
				{activeLoans.length > 0 ? (
					<div className="space-y-3">
						{activeLoans.map((loan: Loan) => (
							<div
								key={loan.loanid}
								className={`rounded-lg border p-4 ${loan.is_overdue ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="font-semibold text-slate-900">{loan.book_title}</h3>
										<div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
											<div>
												<span className="text-slate-600">Дата видачі: </span>
												<span className="font-medium text-slate-900">{formatDate(loan.issuedate)}</span>
											</div>
											<div>
												<span className="text-slate-600">Термін повернення: </span>
												<span className={`font-medium ${loan.is_overdue ? "text-red-600" : "text-slate-900"}`}>
													{formatDate(loan.duedate)}
												</span>
											</div>
										</div>
										{loan.is_overdue && (
											<div className="mt-2 text-sm font-semibold text-red-600">⚠️ Прострочено!</div>
										)}
										{!loan.is_overdue && loan.days_until_due !== undefined && (
											<div className="mt-2 text-sm text-slate-600">
												Залишилось днів: {loan.days_until_due}
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-slate-500">У вас немає активних видач</p>
				)}
			</div>

			{/* Бронювання */}
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
				<h2 className="mb-4 text-2xl font-bold text-slate-900">📖 Мої бронювання</h2>
				{reservations && reservations.length > 0 ? (
					<div className="space-y-3">
						{reservations.map((reservation) => (
							<div key={reservation.reservationid} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="font-semibold text-slate-900">{reservation.book_title}</h3>
										<div className="mt-2 space-y-1 text-sm">
											<div>
												<span className="text-slate-600">Дата бронювання: </span>
												<span className="font-medium text-slate-900">{formatDate(reservation.reservationdate)}</span>
											</div>
											{reservation.pickupdate && (
												<div>
													<span className="text-slate-600">Дата отримання: </span>
													<span className="font-medium text-slate-900">{formatDate(reservation.pickupdate)}</span>
												</div>
											)}
											<div className="flex items-center gap-2">
												<span className="text-slate-600">Статус: </span>
												{getReservationStatusBadge(reservation.status)}
											</div>
										</div>
									</div>
									{reservation.status === "pending" && (
										<button
											type="button"
											onClick={() => handleCancelReservation(reservation.reservationid)}
											disabled={cancelReservationMutation.isPending}
											className="ml-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
										>
											Скасувати
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-slate-500">У вас немає бронювань</p>
				)}
			</div>

			{/* Штрафи */}
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
				<h2 className="mb-4 text-2xl font-bold text-slate-900">💰 Мої штрафи</h2>
				{fines && fines.length > 0 ? (
					<div className="space-y-3">
						{fines.map((fine) => (
							<div key={fine.fineid} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-3">
											<h3 className="font-semibold text-slate-900">{fine.book_title || "Штраф"}</h3>
											{getFineStatusBadge(fine)}
										</div>
										<div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
											<div>
												<span className="text-slate-600">Сума: </span>
												<span className="text-lg font-bold text-orange-600">{formatCurrency(fine.amount)}</span>
											</div>
											<div>
												<span className="text-slate-600">Дата виникнення: </span>
												<span className="font-medium text-slate-900">{formatDate(fine.issuedate)}</span>
											</div>
										</div>
										{fine.payment_initiated_date && (
											<div className="mt-2 text-sm text-blue-600">
												Оплату ініційовано {formatDate(fine.payment_initiated_date)}. Очікується підтвердження бухгалтера.
											</div>
										)}
									</div>
									{!fine.ispaid && !fine.payment_initiated_date && (
										<button
											type="button"
											onClick={() => handleInitiatePayment(fine.fineid)}
											disabled={initiatePaymentMutation.isPending}
											className="ml-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-green-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
										>
											Ініціювати оплату
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-8 text-center">
						<div className="mb-4 text-6xl">✅</div>
						<h3 className="mb-2 text-xl font-bold text-slate-900">Немає штрафів</h3>
						<p className="text-slate-600">У вас відсутні неоплачені штрафи</p>
					</div>
				)}
			</div>

			{/* Історія повернених книг */}
			{completedLoans.length > 0 && (
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
					<h2 className="mb-4 text-2xl font-bold text-slate-900">📜 Історія повернень</h2>
					<div className="space-y-2">
						{completedLoans.slice(0, 5).map((loan: Loan) => (
							<div key={loan.loanid} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<h3 className="text-sm font-semibold text-slate-900">{loan.book_title}</h3>
										<p className="text-xs text-slate-600">
											Видано: {formatDate(loan.issuedate)} • Повернуто: {formatDate(loan.returndate)}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});
