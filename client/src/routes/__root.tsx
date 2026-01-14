import type * as React from "react";
import {
	createRootRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

function RootComponent(): React.JSX.Element {
	const { isAuthenticated, logout, user } = useAuthStore();
	const navigate = useNavigate();

	const handleLogout = (): void => {
		logout();
		void navigate({ to: "/login" });
	};

	return (
		<div className="min-h-screen bg-slate-50 font-sans text-slate-900">
			<Toaster position="bottom-right" />
			{/* Шапка сайту (Header) */}
			<header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md transition-all">
				<div className="container mx-auto px-4 md:px-6">
					<div className="flex h-16 items-center justify-between">
						{/* Логотип */}
						<div className="flex items-center gap-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl text-white shadow-lg shadow-indigo-500/20">
								📚
							</div>
							<span className="hidden text-xl font-bold tracking-tight text-slate-800 sm:inline-block">
								LibraryHub
							</span>
						</div>

						{/* Навігація */}
						<nav className="flex items-center gap-1 sm:gap-2">
							{/* Головна - доступна всім */}
							<Link
								to="/"
								activeProps={{
									className:
										"bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200",
								}}
								className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
							>
								Головна
							</Link>

							{/* Публічний доступ - каталог доступний всім (включно з гостями) */}
							<Link
								to="/books"
								activeProps={{
									className:
										"bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200",
								}}
								className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
							>
								Каталог
							</Link>

							{isAuthenticated && (
								<>
									{/* Librarian Links */}
									{(user?.role === 'Librarian' || user?.role === 'Admin') && (
										<>
											<Link to="/librarian/issue-return" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Видача/Повернення</Link>
											<Link to="/librarian/pending-reservations" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Бронювання</Link>
											<Link to="/librarian/register-user" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Реєстрація</Link>
											<Link to="/authors" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Автори</Link>
											<Link to="/genres" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Жанри</Link>
										</>
									)}

									{/* Accountant Links */}
									{(user?.role === 'Accountant' || user?.role === 'Admin') && (
										<>
											<Link to="/accountant/pending-payments" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Оплати штрафів</Link>
											<Link to="/employees" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Співробітники</Link>
										</>
									)}

									{/* Admin Links */}
									{user?.role === 'Admin' && (
										<>
											<Link to="/admin/users" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Користувачі</Link>
											<Link to="/admin/orders" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Замовлення</Link>
										</>
									)}

									{/* All Authenticated Users */}
									<Link to="/reports" activeProps={{ className: "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" }} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">Звіти</Link>
								</>
							)}

							<div className="mx-2 h-6 w-px bg-slate-200" />

							{/* Кнопки авторизації */}
							{isAuthenticated ? (
                                <>
                                    <Link
                                        to="/profile"
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        Мій профіль ({user?.fullName})
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-100 hover:border-red-300 hover:shadow-sm active:scale-95"
                                    >
                                        Вийти
                                    </button>
                                </>
							) : (
								<>
									<Link
										to="/login"
										className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
									>
										Увійти
									</Link>
								</>
							)}
						</nav>
					</div>
				</div>
			</header>

			{/* Основний контент */}
			<main className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
				<Outlet />
			</main>
		</div>
	);
}

function NotFound(): React.JSX.Element {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
			<div className="text-8xl">🔍</div>
			<h1 className="text-4xl font-bold text-slate-900">Сторінку не знайдено</h1>
			<p className="text-slate-600">Сторінка, яку ви шукаєте, не існує.</p>
			<Link
				to="/"
				className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-indigo-700"
			>
				← Повернутися на головну
			</Link>
		</div>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
	notFoundComponent: NotFound,
});
