import axios from "axios";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const apiClient = axios.create({
	baseURL: "/api/v1",
	headers: {
		"Content-Type": "application/json",
	},
});

// Додаємо токен до кожного запиту
apiClient.interceptors.request.use(
	(config) => {
		const token = useAuthStore.getState().token;

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Обробляємо відповіді та помилки
apiClient.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Якщо прийшла помилка 401 (Unauthorized) - виходимо з системи
		if (error.response?.status === 401) {
			useAuthStore.getState().logout();
			toast.error("Authentication expired. Please log in again.");
		} else if (error.response?.status === 400) {
			toast.error("Bad request. Please check your input.");
		} else if (error.response?.status === 403) {
			toast.error("You don't have permission to perform this action.");
		} else if (error.response?.status === 404) {
			toast.error("The requested resource was not found.");
		} else if (error.response?.status >= 500) {
			toast.error("An unexpected error occurred on the server.");
		}
		return Promise.reject(error);
	}
);

export default apiClient;
