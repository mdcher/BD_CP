import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePendingPayments, useConfirmPayment } from "@/features/fines/finesApi";

function PendingPaymentsPage(): React.JSX.Element {
	const { data: fines, isLoading, error } = usePendingPayments();
	const confirmPaymentMutation = useConfirmPayment();

	const handleConfirmPayment = (fineId: number, approve: boolean): void => {
		const message = approve
			? "Ви впевнені, що хочете підтвердити цю оплату?"
			: "Ви впевнені, що хочете відхилити цю оплату?";

		if (confirm(message)) {
			confirmPaymentMutation.mutate({ fineId, approve });
		}
	};

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat("uk-UA", {
			style: "currency",
			currency: "UAH",
		}).format(amount);
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
					<p className="text-slate-600">Завантаження платежів...</p>
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
					Не вдалося завантажити інформацію про платежі. Спробуйте пізніше.
				</p>
			</div>
		);
	}

	const totalAmount = fines?.reduce((sum, fine) => sum + Number(fine.amount || 0), 0) ?? 0;

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<h1 className="text-3xl font-bold text-slate-900">Непідтверджені платежі</h1>
				<p className="text-slate-500">
					Підтвердження або відхилення оплати штрафів
				</p>
			</div>

			{fines && fines.length > 0 ? (
				<>
					{/* Статистика */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
							<div className="mb-2 text-sm font-medium opacity-90">
								Очікують підтвердження
							</div>
							<div className="text-4xl font-bold">{fines.length}</div>
						</div>
						<div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
							<div className="mb-2 text-sm font-medium opacity-90">
								Загальна сума
							</div>
							<div className="text-4xl font-bold">{formatCurrency(totalAmount)}</div>
						</div>
					</div>

					{/* Список платежів */}
					<div className="space-y-4">
						{fines.map((fine) => (
							<div
								key={fine.fineid}
								className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<div className="mb-3 flex items-center gap-3">
											<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
												💳
											</div>
											<div>
												<h3 className="font-semibold text-slate-900">
													{fine.user_name || `Користувач ID: ${fine.userid}`}
												</h3>
												<p className="text-sm text-slate-500">
													{fine.book_title || "Штраф"}
												</p>
											</div>
										</div>

										<div className="grid gap-2 text-sm sm:grid-cols-2">
											<div>
												<span className="font-medium text-slate-700">Сума: </span>
												<span className="text-lg font-bold text-orange-600">
													{formatCurrency(fine.amount)}
												</span>
											</div>
											<div>
												<span className="font-medium text-slate-700">Дата виникнення: </span>
												<span className="text-slate-900">
													{formatDate(fine.issuedate)}
												</span>
											</div>
											{fine.payment_initiated_date && (
												<div>
													<span className="font-medium text-slate-700">Дата ініціації: </span>
													<span className="text-slate-900">
														{formatDate(fine.payment_initiated_date)}
													</span>
												</div>
											)}
											{fine.days_pending !== undefined && (
												<div>
													<span className="font-medium text-slate-700">Очікує: </span>
													<span className="text-slate-900">
														{fine.days_pending} днів
													</span>
												</div>
											)}
											{fine.contactinfo && (
												<div className="sm:col-span-2">
													<span className="font-medium text-slate-700">Контакт: </span>
													<span className="text-slate-900">
														{fine.contactinfo}
													</span>
												</div>
											)}
										</div>
									</div>

									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => handleConfirmPayment(fine.fineid, false)}
											disabled={confirmPaymentMutation.isPending}
											className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Відхилити
										</button>
										<button
											type="button"
											onClick={() => handleConfirmPayment(fine.fineid, true)}
											disabled={confirmPaymentMutation.isPending}
											className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Підтвердити
										</button>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Інформація */}
					<div className="rounded-xl bg-blue-50 p-6 ring-1 ring-blue-100">
						<div className="mb-2 flex items-center gap-2">
							<span className="text-xl">ℹ️</span>
							<h3 className="font-semibold text-blue-900">
								Інформація для бухгалтера
							</h3>
						</div>
						<ul className="space-y-1 text-sm text-blue-700">
							<li>
								• Підтвердження оплати означає, що штраф буде позначено як оплачений
							</li>
							<li>
								• Відхилення оплати поверне штраф у статус "неоплачений"
							</li>
							<li>
								• Читач зможе повторно ініціювати оплату після відхилення
							</li>
						</ul>
					</div>
				</>
			) : (
				<div className="rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-12 text-center">
					<div className="mb-4 text-6xl">✅</div>
					<h2 className="mb-2 text-2xl font-bold text-slate-900">
						Немає непідтверджених платежів
					</h2>
					<p className="text-slate-600">
						Всі платежі опрацьовані!
					</p>
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/accountant/pending-payments")({
	component: PendingPaymentsPage,
});
