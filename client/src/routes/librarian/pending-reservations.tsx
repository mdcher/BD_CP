import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePendingReservations, useConfirmReservation } from "@/features/reservations/reservationsApi";
import { useState } from "react";

function PendingReservationsPage(): React.JSX.Element {
	const { data: reservations, isLoading, error } = usePendingReservations();
	const confirmReservationMutation = useConfirmReservation();
	const [selectedReservation, setSelectedReservation] = useState<number | null>(null);
	const [pickupDate, setPickupDate] = useState<string>("");

	const handleConfirmReservation = (reservationId: number): void => {
		setSelectedReservation(reservationId);
		// Встановлюємо дату отримання через 3 дні за замовчуванням
		const defaultDate = new Date();
		defaultDate.setDate(defaultDate.getDate() + 3);
		setPickupDate(defaultDate.toISOString().split("T")[0]);
	};

	const submitConfirmation = (): void => {
		if (selectedReservation) {
			confirmReservationMutation.mutate({
				reservationId: selectedReservation,
				pickupDate: pickupDate || undefined,
			}, {
				onSuccess: () => {
					setSelectedReservation(null);
					setPickupDate("");
				},
			});
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

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
					<p className="text-slate-600">Завантаження бронювань...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-xl bg-red-50 p-8 text-center">
				<div className="mb-4 text-4xl">❌</div>
				<h2 className="mb-2 text-xl font-semibold text-red-900">
					Помилка завантаження
				</h2>
				<p className="text-red-700">
					Не вдалося завантажити інформацію про бронювання. Спробуйте пізніше.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<h1 className="text-3xl font-bold text-slate-900">Непідтверджені бронювання</h1>
				<p className="text-slate-500">
					Підтвердження бронювань читачів
				</p>
			</div>

			{reservations && reservations.length > 0 ? (
				<>
					{/* Статистика */}
					<div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
						<div className="mb-2 text-sm font-medium opacity-90">
							Очікують підтвердження
						</div>
						<div className="text-4xl font-bold">{reservations.length}</div>
					</div>

					{/* Список бронювань */}
					<div className="space-y-4">
						{reservations.map((reservation) => (
							<div
								key={reservation.reservationid}
								className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<div className="mb-3 flex items-center gap-3">
											<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
												📖
											</div>
											<div>
												<h3 className="font-semibold text-slate-900">
													{reservation.book_title || `Книга ID: ${reservation.bookid}`}
												</h3>
												<p className="text-sm text-slate-500">
													Читач: {reservation.user_name || `ID: ${reservation.userid}`}
												</p>
											</div>
										</div>

										<div className="grid gap-2 text-sm sm:grid-cols-2">
											<div>
												<span className="font-medium text-slate-700">Дата бронювання: </span>
												<span className="text-slate-900">
													{formatDate(reservation.reservationdate)}
												</span>
											</div>
											{reservation.days_waiting !== undefined && (
												<div>
													<span className="font-medium text-slate-700">Очікує: </span>
													<span className="text-slate-900">
														{reservation.days_waiting} днів
													</span>
												</div>
											)}
											{reservation.contactinfo && (
												<div className="sm:col-span-2">
													<span className="font-medium text-slate-700">Контакт: </span>
													<span className="text-slate-900">
														{reservation.contactinfo}
													</span>
												</div>
											)}
											{reservation.availability_status && (
												<div className="sm:col-span-2">
													<span className="font-medium text-slate-700">Доступність: </span>
													<span className={`${
														reservation.availability_status === "Книга доступна"
															? "text-green-700"
															: "text-red-700"
													}`}>
														{reservation.availability_status}
													</span>
												</div>
											)}
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleConfirmReservation(reservation.reservationid)}
										className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
									>
										Підтвердити
									</button>
								</div>
							</div>
						))}
					</div>
				</>
			) : (
				<div className="rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-12 text-center">
					<div className="mb-4 text-6xl">✅</div>
					<h2 className="mb-2 text-2xl font-bold text-slate-900">
						Немає непідтверджених бронювань
					</h2>
					<p className="text-slate-600">
						Всі бронювання опрацьовані!
					</p>
				</div>
			)}

			{/* Модальне вікно підтвердження */}
			{selectedReservation && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
						<h2 className="mb-4 text-2xl font-bold text-slate-900">
							Підтвердження бронювання
						</h2>
						<div className="mb-4">
							<label htmlFor="pickupDate" className="mb-2 block text-sm font-medium text-slate-700">
								Дата отримання книги
							</label>
							<input
								type="date"
								id="pickupDate"
								value={pickupDate}
								onChange={(e) => setPickupDate(e.target.value)}
								className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
							/>
							<p className="mt-2 text-xs text-slate-500">
								Якщо не вказати дату, буде встановлено +3 дні від поточної дати
							</p>
						</div>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setSelectedReservation(null)}
								className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
							>
								Скасувати
							</button>
							<button
								type="button"
								onClick={submitConfirmation}
								disabled={confirmReservationMutation.isPending}
								className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
							>
								{confirmReservationMutation.isPending ? "Підтвердження..." : "Підтвердити"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/librarian/pending-reservations")({
	component: PendingReservationsPage,
});
