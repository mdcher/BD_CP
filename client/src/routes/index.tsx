import { createFileRoute, Link } from "@tanstack/react-router";

function HomePage(): React.JSX.Element {
	return (
		<div className="space-y-12 animate-in fade-in duration-700">
			{/* Hero Section */}
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 text-white shadow-2xl">
				{/* Decorative Elements */}
				<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
				<div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

				<div className="relative z-10">
					<div className="mb-4 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
						🎉 Вітаємо в системі
					</div>
					<h1 className="mb-4 text-5xl font-bold leading-tight">
						Система управління
						<br />
						бібліотекою LibraryHub
					</h1>
					<p className="mb-8 max-w-2xl text-lg text-blue-100">
						Сучасний інструмент для ефективного управління книжковим фондом,
						відстеження видач та ведення статистики вашої бібліотеки.
					</p>
					<div className="flex gap-4">
						<Link
							className="rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
							to="/books"
						>
							🔍 Переглянути каталог
						</Link>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div>
				<h2 className="mb-6 text-2xl font-bold text-gray-800">
					⚡ Можливості системи
				</h2>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[
						{
							icon: "📚",
							title: "Управління каталогом",
							description:
								"Додавайте, редагуйте та видаляйте книги з простим інтерфейсом",
							color: "blue",
						},
						{
							icon: "🔍",
							title: "Пошук та фільтрація",
							description:
								"Швидко знаходьте потрібні книги за різними параметрами",
							color: "green",
						},
						{
							icon: "📊",
							title: "Статистика видач",
							description:
								"Відстежуйте історію видач кожної книги в режимі реального часу",
							color: "purple",
						},
						{
							icon: "🏷️",
							title: "Статуси книг",
							description:
								"Контролюйте стан книг: нова, хороша, пошкоджена, втрачена",
							color: "orange",
						},
						{
							icon: "📍",
							title: "Локації",
							description:
								"Зберігайте інформацію про місцезнаходження кожної книги",
							color: "pink",
						},
						{
							icon: "🔐",
							title: "Безпека даних",
							description:
								"JWT авторизація та захист від несанкціонованого доступу",
							color: "red",
						},
					].map((feature, index) => (
						<div
							key={feature.title}
							className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-transparent hover:shadow-lg"
							style={{
								animationDelay: `${index * 100}ms`,
							}}
						>
							<div className="mb-4 text-4xl">{feature.icon}</div>
							<h3 className="mb-2 text-lg font-semibold text-gray-800">
								{feature.title}
							</h3>
							<p className="text-sm text-gray-600">{feature.description}</p>
						</div>
					))}
				</div>
			</div>

			{/* Call to Action */}
			<div className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white shadow-2xl">
				<h2 className="mb-4 text-3xl font-bold">Готові почати роботу?</h2>
				<p className="mb-8 text-lg text-blue-100">
					Перегляньте каталог книг або додайте нову книгу до системи
				</p>
				<div className="flex justify-center gap-4">
					<Link
						className="rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 shadow-lg transition-all hover:scale-105"
						to="/books"
					>
						📚 Відкрити каталог
					</Link>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/")({
	component: HomePage,
});
