import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/axios";

interface Order {
	orderid: number;
	orderdate: string;
	supplier: string;
	status: string;
	totalprice: number;
	items_count?: number;
	items_list?: string;
}

function OrdersPage(): React.JSX.Element {
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");

	// Завантаження замовлень
	const { data: orders = [], isLoading, isError } = useQuery<Order[]>({
		queryKey: ["orders"],
		queryFn: async () => {
			const response = await apiClient.get("/orders");
			return response.data;
		},
	});

	// Мутація для генерації замовлення на основі популярних книг
	const generateOrderMutation = useMutation({
		mutationFn: async () => {
			const response = await apiClient.post("/orders/auto", {
				supplier: "Автоматичне замовлення",
				threshold: 0.5,
				quantity: 5
			});
			return response.data;
		},
		onSuccess: () => {
			toast.success("Замовлення успішно згенеровано!");
			void queryClient.invalidateQueries({ queryKey: ["orders"] });
		},
		onError: (error: any) => {
			console.error("Помилка генерації замовлення:", error);
			const errorMessage = error.response?.data?.message || "Не вдалося згенерувати замовлення";
			toast.error(errorMessage);
		},
	});

	const handleGenerateOrder = (): void => {
		if (confirm("Ви впевнені, що хочете згенерувати замовлення на основі популярних книг?")) {
			generateOrderMutation.mutate();
		}
	};

	const formatDate = (dateString: string): string => {
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

	const getStatusBadge = (status: string): React.JSX.Element => {
		const statusMap: Record<string, { label: string; class: string }> = {
			Pending: { label: "Очікує", class: "bg-yellow-100 text-yellow-800" },
			Created: { label: "Створено", class: "bg-blue-100 text-blue-800" },
			InProgress: { label: "В процесі", class: "bg-indigo-100 text-indigo-800" },
			Completed: { label: "Завершено", class: "bg-green-100 text-green-800" },
			Cancelled: { label: "Скасовано", class: "bg-red-100 text-red-800" },
		};
		const statusInfo = statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800" };
		return (
			<span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.class}`}>
				{statusInfo.label}
			</span>
		);
	};

	const filteredOrders = orders.filter((order) => {
		const query = searchQuery.toLowerCase();
		const supplier = (order.supplier || "").toLowerCase();
		const status = (order.status || "").toLowerCase();
		return (
			supplier.includes(query) ||
			status.includes(query) ||
			order.orderid.toString().includes(query)
		);
	});

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
					<p className="text-slate-600">Завантаження замовлень...</p>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-xl bg-red-50 p-8 text-center">
				<div className="mb-4 text-4xl">❌</div>
				<h2 className="mb-2 text-xl font-semibold text-red-900">
					Помилка завантаження
				</h2>
				<p className="text-red-700">
					Не вдалося завантажити замовлення. Спробуйте пізніше.
				</p>
			</div>
		);
	}

	const totalAmount = filteredOrders.reduce((sum, order) => sum + Number(order.totalprice || 0), 0);

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-slate-900">Замовлення книг</h1>
					<p className="text-slate-500">Управління замовленнями постачальникам</p>
				</div>

				<button
					onClick={handleGenerateOrder}
					disabled={generateOrderMutation.isPending}
					className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span>🎯</span> {generateOrderMutation.isPending ? "Генерація..." : "Згенерувати замовлення"}
				</button>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
					<div className="mb-2 text-sm font-medium opacity-90">Всього замовлень</div>
					<div className="text-4xl font-bold">{filteredOrders.length}</div>
				</div>
				<div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
					<div className="mb-2 text-sm font-medium opacity-90">Завершені</div>
					<div className="text-4xl font-bold">
						{filteredOrders.filter(o => o.status === "Completed").length}
					</div>
				</div>
				<div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
					<div className="mb-2 text-sm font-medium opacity-90">Загальна сума</div>
					<div className="text-4xl font-bold">{formatCurrency(totalAmount)}</div>
				</div>
			</div>

			<div className="relative">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<span className="text-slate-400">🔍</span>
				</div>
				<input
					className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					placeholder="Пошук за постачальником, статусом або ID..."
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{filteredOrders.length > 0 ? (
				<div className="space-y-4">
					{filteredOrders.map((order) => (
						<div
							key={order.orderid}
							className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<div className="mb-3 flex items-center gap-3">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
											📦
										</div>
										<div>
											<h3 className="font-semibold text-slate-900">
												Замовлення #{order.orderid}
											</h3>
											<p className="text-sm text-slate-500">{order.supplier}</p>
										</div>
										{getStatusBadge(order.status)}
									</div>

									<div className="grid gap-2 text-sm sm:grid-cols-2">
										<div>
											<span className="font-medium text-slate-700">Дата замовлення: </span>
											<span className="text-slate-900">{formatDate(order.orderdate)}</span>
										</div>
										<div>
											<span className="font-medium text-slate-700">Сума: </span>
											<span className="text-lg font-bold text-green-600">
												{formatCurrency(order.totalprice)}
											</span>
										</div>
										{order.items_count !== undefined && (
											<div>
												<span className="font-medium text-slate-700">Кількість позицій: </span>
												<span className="text-slate-900">{order.items_count}</span>
											</div>
										)}
										{order.items_list && (
											<div className="sm:col-span-2">
												<span className="font-medium text-slate-700">Книги: </span>
												<span className="text-slate-900">{order.items_list}</span>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 p-12 text-center">
					<div className="mb-4 text-6xl">📋</div>
					<h2 className="mb-2 text-2xl font-bold text-slate-900">
						{searchQuery ? "Нічого не знайдено" : "Немає замовлень"}
					</h2>
					<p className="text-slate-600">
						{searchQuery
							? "Спробуйте змінити критерії пошуку"
							: "Створіть перше замовлення, натиснувши кнопку вгорі"}
					</p>
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/admin/orders")({
	component: OrdersPage,
});
