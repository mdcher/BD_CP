import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./styles/tailwind.css";

// 1. Створюємо клієнт для React Query
const queryClient = new QueryClient(); // 👈 Створення клієнта

// 2. Створюємо роутер
const router = createRouter({ routeTree });

// Реєстрація типів
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");

if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);

	root.render(
		<React.StrictMode>
			{/* 👇 Обгортаємо весь додаток у провайдер */}
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</React.StrictMode>
	);
}
