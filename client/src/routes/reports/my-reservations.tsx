import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMyReservations, useCancelReservation } from "@/features/reservations/reservationsApi";

function MyReservationsPage(): React.JSX.Element {
	const { data: reservations, isLoading, error } = useMyReservations();
	const cancelReservationMutation = useCancelReservation();

	const handleCancelReservation = (reservationId: number): void => {
		if (confirm("Ви впевнені, що хочете скасувати це бронювання?")) {
			cancelReservationMutation.mutate(reservationId);
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
				<h1 className="text-3xl font-bold text-slate-900">Мої бронювання</h1>
				<p className="text-slate-500">
					Перегляд та управління вашими бронюваннями книг
				</p>
			</div>

			{reservations && reservations.length > 0 ? (
				<>
					{/* Статистика */}
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg">
							<div className="mb-2 text-sm font-medium opacity-90">
								Всього бронювань
							</div>
							<div className="text-4xl font-bold">{reservations.length}</div>
						</div>
						<div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
							<div className="mb-2 text-sm font-medium opacity-90">
								Підтверджено
							</div>
							<div className="text-4xl font-bold">
								{reservations.filter((r) => r.isconfirmed).length}
							</div>
						</div>
						<div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
							<div className="mb-2 text-sm font-medium opacity-90">
								Очікують підтвердження
							</div>
							<div className="text-4xl font-bold">
								{reservations.filter((r) => !r.isconfirmed && !r.iscompleted).length}
							</div>
						</div>
					</div>

					{/* Список бронювань */}
					<div className="space-y-4">
						{reservations.map((reservation) => {
							const statusInfo = reservation.iscompleted
								? { label: "Завершено", color: "gray" }
								: reservation.isconfirmed
								? { label: "Підтверджено", color: "green" }
								: { label: "Очікує підтвердження", color: "orange" };

							return (
								<div
									key={reservation.reservationid}
									className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md"
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
														Дата бронювання: {formatDate(reservation.reservationdate)}
													</p>
												</div>
											</div>

											<div className="grid gap-2 text-sm sm:grid-cols-2">
												<div>
													<span className="font-medium text-slate-700">Статус: </span>
													<span
														className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
															statusInfo.color === "green"
																? "bg-green-100 text-green-800"
																: statusInfo.color === "orange"
																? "bg-orange-100 text-orange-800"
																: "bg-gray-100 text-gray-800"
														}`}
													>
														{statusInfo.label}
													</span>
												</div>
												{reservation.pickupdate && (
													<div>
														<span className="font-medium text-slate-700">
															Дата отримання:{" "}
														</span>
														<span className="text-slate-900">
															{formatDate(reservation.pickupdate)}
														</span>
													</div>
												)}
											</div>

											{reservation.isconfirmed && reservation.pickupdate && !reservation.iscompleted && (
												<div className="mt-3 rounded-lg bg-blue-50 p-3 ring-1 ring-blue-100">
													<p className="text-sm text-blue-700">
														✨ Ваше бронювання підтверджено! Ви можете отримати книгу{" "}
														<strong>{formatDate(reservation.pickupdate)}</strong>
													</p>
												</div>
											)}
										</div>

										{!reservation.iscompleted && !reservation.isconfirmed && (
											<button
												type="button"
												onClick={() => handleCancelReservation(reservation.reservationid)}
												disabled={cancelReservationMutation.isPending}
												className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Скасувати
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Інформація */}
					<div className="rounded-xl bg-blue-50 p-6 ring-1 ring-blue-100">
						<div className="mb-2 flex items-center gap-2">
							<span className="text-xl">ℹ️</span>
							<h3 className="font-semibold text-blue-900">
								Інформація про бронювання
							</h3>
						</div>
						<ul className="space-y-1 text-sm text-blue-700">
							<li>
								• Після створення бронювання воно очікує підтвердження бібліотекаря
							</li>
							<li>
								• Після підтвердження ви отримаєте дату, коли можна прийти за книгою
							</li>
							<li>
								• Ви можете скасувати бронювання до його підтвердження
							</li>
						</ul>
					</div>
				</>
			) : (
				<div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-12 text-center">
					<div className="mb-4 text-6xl">📚</div>
					<h2 className="mb-2 text-2xl font-bold text-slate-900">
						Немає активних бронювань
					</h2>
					<p className="text-slate-600">
						Ви ще не створили жодного бронювання. Перейдіть до каталогу, щоб
						забронювати книгу!
					</p>
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/reports/my-reservations")({
	component: MyReservationsPage,
});
