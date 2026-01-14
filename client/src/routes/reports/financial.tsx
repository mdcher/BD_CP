import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useFinancialSummary } from "@/features/reports/reportsApi.ts";

function FinancialReportPage(): React.JSX.Element {
	const { data: summary, isLoading, isError } = useFinancialSummary();

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-lg bg-red-50 p-4 text-red-600">
				Помилка завантаження звіту.
			</div>
		);
	}

	const stats = [
		{
			label: "Доходи (штрафи)",
			value: summary?.totalincomefines || 0,
			icon: "💵",
			color: "from-green-500 to-green-600",
			bgColor: "bg-green-50",
			textColor: "text-green-600",
		},
		{
			label: "Витрати (книги)",
			value: summary?.expensesbooks || 0,
			icon: "📚",
			color: "from-blue-500 to-blue-600",
			bgColor: "bg-blue-50",
			textColor: "text-blue-600",
		},
		{
			label: "Витрати (зарплати)",
			value: summary?.expensessalaries || 0,
			icon: "👥",
			color: "from-purple-500 to-purple-600",
			bgColor: "bg-purple-50",
			textColor: "text-purple-600",
		},
		{
			label: "Чистий баланс",
			value: summary?.netbalance || 0,
			icon: summary && summary.netbalance >= 0 ? "✅" : "⚠️",
			color: summary && summary.netbalance >= 0 ? "from-green-500 to-green-600" : "from-red-500 to-red-600",
			bgColor: summary && summary.netbalance >= 0 ? "bg-green-50" : "bg-red-50",
			textColor: summary && summary.netbalance >= 0 ? "text-green-600" : "text-red-600",
		},
	];

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<Link
					to="/reports"
					className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-indigo-600"
				>
					← Повернутися до звітів
				</Link>
				<h1 className="text-3xl font-bold text-slate-900">Фінансовий звіт</h1>
				<p className="text-slate-500">
					Станом на {summary?.reportdate ? new Date(summary.reportdate).toLocaleDateString("uk-UA") : ""}
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat, index) => (
					<div
						key={stat.label}
						className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
						style={{
							animationDelay: `${index * 100}ms`,
						}}
					>
						<div
							className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity group-hover:opacity-5`}
						></div>

						<div className="relative z-10">
							<div
								className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${stat.bgColor} text-3xl`}
							>
								{stat.icon}
							</div>
							<div className="mb-1 text-sm font-medium text-gray-600">
								{stat.label}
							</div>
							<div
								className={`text-3xl font-bold ${stat.textColor}`}
							>
								{stat.value.toFixed(2)} грн
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
				<h2 className="mb-4 text-xl font-bold text-slate-900">Деталі</h2>
				<div className="space-y-3">
					<div className="flex justify-between border-b border-slate-200 pb-3">
						<span className="font-medium text-slate-700">Всього доходів:</span>
						<span className="font-semibold text-green-600">
							+{Number(summary?.totalincomefines || 0).toFixed(2)} грн
						</span>
					</div>
					<div className="flex justify-between border-b border-slate-200 pb-3">
						<span className="font-medium text-slate-700">Витрати на книги:</span>
						<span className="font-semibold text-red-600">
							-{Number(summary?.expensesbooks || 0).toFixed(2)} грн
						</span>
					</div>
					<div className="flex justify-between border-b border-slate-200 pb-3">
						<span className="font-medium text-slate-700">Витрати на зарплати:</span>
						<span className="font-semibold text-red-600">
							-{Number(summary?.expensessalaries || 0).toFixed(2)} грн
						</span>
					</div>
					<div className="flex justify-between pt-3">
						<span className="text-lg font-bold text-slate-900">Підсумок:</span>
						<span
							className={`text-lg font-bold ${
								summary && summary.netbalance >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							{summary && summary.netbalance >= 0 ? "+" : ""}
							{(summary?.netbalance ?? 0).toFixed(2)} грн
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/reports/financial")({
	component: FinancialReportPage,
});
