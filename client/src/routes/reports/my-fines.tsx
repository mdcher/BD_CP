import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMyUnpaidFines, usePayFine } from "@/features/fines/finesApi";

function MyFinesPage(): React.JSX.Element {
	const { data: fines, isLoading, error } = useMyUnpaidFines();
	const payFineMutation = usePayFine();

	const handlePayFine = (fineId: number): void => {
		if (confirm("Ви впевнені, що хочете оплатити цей штраф?")) {
			payFineMutation.mutate(fineId);
		}
	};

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat("uk-UA", {
			style: "currency",
			currency: "UAH",
		}).format(amount);
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("uk-UA", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const totalAmount = fines?.reduce((sum, fine) => sum + fine.amount, 0) ?? 0;

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
					<p className="text-slate-600">Завантаження штрафів...</p>
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
					Не вдалося завантажити інформацію про штрафи. Спробуйте пізніше.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<h1 className="text-3xl font-bold text-slate-900">Мої штрафи</h1>
				<p className="text-slate-500">
					Перегляд та оплата неоплачених штрафів
				</p>
			</div>

			{fines && fines.length > 0 ? (
				<>
					{/* Загальна інформація */}
					<div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white shadow-lg">
						<div className="mb-2 text-sm font-medium opacity-90">
							Загальна сума до сплати
						</div>
						<div className="text-4xl font-bold">{formatCurrency(totalAmount)}</div>
						<div className="mt-4 text-sm opacity-75">
							Неоплачених штрафів: {fines.length}
						</div>
					</div>

					{/* Список штрафів */}
					<div className="space-y-4">
						{fines.map((fine) => (
							<div
								key={fine.fineid}
								className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<div className="mb-2 flex items-center gap-3">
											<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
												💳
											</div>
											<div>
												<h3 className="font-semibold text-slate-900">
													{fine.reason || "Штраф"}
												</h3>
												<p className="text-sm text-slate-500">
													Дата виникнення: {formatDate(fine.issuedate)}
												</p>
											</div>
										</div>
									</div>

									<div className="text-right">
										<div className="mb-3 text-2xl font-bold text-orange-600">
											{formatCurrency(fine.amount)}
										</div>
										<button
											type="button"
											onClick={() => handlePayFine(fine.fineid)}
											disabled={payFineMutation.isPending}
											className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
										>
											{payFineMutation.isPending ? "Оплата..." : "Оплатити"}
										</button>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Інформація про оплату */}
					<div className="rounded-xl bg-blue-50 p-6 ring-1 ring-blue-100">
						<div className="mb-2 flex items-center gap-2">
							<span className="text-xl">ℹ️</span>
							<h3 className="font-semibold text-blue-900">
								Інформація про оплату
							</h3>
						</div>
						<p className="text-sm text-blue-700">
							Після натискання кнопки "Оплатити" штраф буде позначено як оплачений.
							Зверніть увагу: це демо-версія, реальна оплата не здійснюється.
						</p>
					</div>
				</>
			) : (
				<div className="rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-12 text-center">
					<div className="mb-4 text-6xl">✅</div>
					<h2 className="mb-2 text-2xl font-bold text-slate-900">
						Немає неоплачених штрафів
					</h2>
					<p className="text-slate-600">
						У вас немає боргів перед бібліотекою. Продовжуйте своєчасно
						повертати книги!
					</p>
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/reports/my-fines")({
	component: MyFinesPage,
});
