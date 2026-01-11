import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";

function ReportsPage(): React.JSX.Element {
	const { user } = useAuthStore();

	const reports = [
		{
			title: "Боржники",
			description: "Користувачі з простроченими книгами",
			icon: "⚠️",
			link: "/reports/debtors",
			roles: ["Librarian", "Admin"],
			color: "from-red-500 to-red-600",
			bgColor: "bg-red-50",
		},
		{
			title: "Фінансовий звіт",
			description: "Доходи, витрати та баланс",
			icon: "💰",
			link: "/reports/financial",
			roles: ["Accountant", "Admin"],
			color: "from-green-500 to-green-600",
			bgColor: "bg-green-50",
		},
		{
			title: "Статистика читання",
			description: "Середня тривалість читання",
			icon: "📊",
			link: "/reports/reading-stats",
			roles: ["Librarian", "Admin"],
			color: "from-blue-500 to-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			title: "Топ читачів",
			description: "Найактивніші користувачі",
			icon: "🏆",
			link: "/reports/top-readers",
			roles: ["Librarian", "Admin"],
			color: "from-yellow-500 to-yellow-600",
			bgColor: "bg-yellow-50",
		},
		{
			title: "Рейтинг авторів",
			description: "Популярність авторів",
			icon: "✍️",
			link: "/reports/authors",
			roles: ["Reader", "Librarian", "Admin", "Accountant"],
			color: "from-purple-500 to-purple-600",
			bgColor: "bg-purple-50",
		},
		{
			title: "Популярність жанрів",
			description: "Найпопулярніші жанри",
			icon: "📚",
			link: "/reports/genres",
			roles: ["Reader", "Librarian", "Admin", "Accountant"],
			color: "from-indigo-500 to-indigo-600",
			bgColor: "bg-indigo-50",
		},
	];

	const filteredReports =
		!user?.role || !Array.isArray(reports)
			? []
			: reports.filter(
					(report) =>
						Array.isArray(report.roles) && user?.role && report.roles.includes(user.role),
				);

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<h1 className="text-3xl font-bold text-slate-900">Звіти</h1>
				<p className="text-slate-500">Аналітика та статистика бібліотеки</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{filteredReports.map((report) => (
					<Link
						key={report.link}
						to={report.link}
						className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-xl hover:ring-indigo-500/20 hover:-translate-y-1"
					>
						<div
							className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 transition-opacity group-hover:opacity-5`}
						></div>

						<div className="relative z-10">
							<div
								className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${report.bgColor} text-3xl`}
							>
								{report.icon}
							</div>
							<h3 className="mb-2 text-lg font-semibold text-slate-900">
								{report.title}
							</h3>
							<p className="text-sm text-slate-600">{report.description}</p>
						</div>

						<div className="absolute bottom-4 right-4 text-2xl opacity-0 transition-opacity group-hover:opacity-100">
							→
						</div>
					</Link>
				))}
			</div>

			{filteredReports.length === 0 && (
				<div className="rounded-lg bg-slate-50 p-12 text-center text-slate-500">
					Немає доступних звітів для вашої ролі.
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/reports/")({
	component: ReportsPage,
});
