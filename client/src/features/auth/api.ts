import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import apiClient from "@/lib/axios";
import { useAuthStore, type User } from "@/store/authStore";

// Функція для декодування JWT токена
function decodeJWT(token: string): any {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (error) {
		console.error('Error decoding JWT:', error);
		return null;
	}
}

// Login схема валідації
export const loginSchema = z.object({
	email: z.string().email("Невірний формат email"),
	password: z.string().min(4, "Мінімум 4 символи"),
});

export type LoginDto = z.infer<typeof loginSchema>;

// Register схема валідації (synced with backend)
export const registerSchema = z.object({
	email: z.string().email("Невірний формат email"),
	password: z.string().min(4, "Мінімум 4 символи"),
	passwordConfirm: z.string().min(4, "Мінімум 4 символи"),
}).refine((data) => data.password === data.passwordConfirm, {
	message: "Паролі мають співпадати",
	path: ["passwordConfirm"],
});

export type RegisterDto = z.infer<typeof registerSchema>;

// Change Password схема валідації (synced with backend)
export const changePasswordSchema = z.object({
	password: z.string().min(1, "Поточний пароль обов'язковий"),
	passwordNew: z.string().min(4, "Новий пароль має містити мінімум 4 символи"),
	passwordConfirm: z.string().min(4, "Мінімум 4 символи"),
}).refine((data) => data.passwordNew === data.passwordConfirm, {
	message: "Паролі мають співпадати",
	path: ["passwordConfirm"],
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

// Типи відповідей від сервера
interface LoginResponse {
	token: string;
	user?: {
		id: number;
		email: string;
	};
}

interface RegisterResponse {
	token: string;
	user?: {
		id: number;
		email: string;
	};
}

// Функції запитів
const login = async (data: LoginDto): Promise<LoginResponse> => {
	const response = await apiClient.post("/auth/login", data);

	// Якщо response - це рядок (бекенд повертає просто токен)
	if (typeof response.data === "string") {
		const tokenValue = response.data.startsWith("Bearer ")
			? response.data.replace("Bearer ", "").trim()
			: response.data.trim();
		return { token: tokenValue };
	}

	// Якщо response - це об'єкт з полем token
	if (response.data && typeof response.data === "object" && "token" in response.data) {
		return response.data as LoginResponse;
	}

	// Якщо нічого не підійшло - помилка
	throw new Error("Invalid login response format");
};

const register = async (data: RegisterDto): Promise<RegisterResponse> => {
	const response = await apiClient.post<RegisterResponse>("/auth/register", data);
	return response.data;
};

const changePassword = async (data: ChangePasswordDto): Promise<void> => {
	await apiClient.post("/auth/change-password", data);
};

// React Query Hooks

export const useLogin = (): UseMutationResult<
	LoginResponse,
	Error,
	LoginDto
> => {
	const navigate = useNavigate();
	const setAuth = useAuthStore((state) => state.setAuth);

	return useMutation({
		mutationFn: login,
		onSuccess: (data) => {
			if (data.token) {
				// Декодуємо JWT для отримання user даних
				const payload = decodeJWT(data.token);
				if (payload) {
					const user: User = {
						id: payload.id || payload.userId,
						fullName: payload.fullName || payload.fullname || 'User',
						role: payload.role,
						email: payload.email || payload.contactinfo,
					};
					setAuth(data.token, user);
				}
			}
			void navigate({ to: "/" });
		},
		onError: (error: Error) => {
			console.error("Login failed:", error);
			alert("Невірний email або пароль");
		},
	});
};

export const useRegister = (): UseMutationResult<
	RegisterResponse,
	Error,
	RegisterDto
> => {
	const navigate = useNavigate();
	const setAuth = useAuthStore((state) => state.setAuth);

	return useMutation({
		mutationFn: register,
		onSuccess: (data) => {
			if (data.token) {
				// Декодуємо JWT для отримання user даних
				const payload = decodeJWT(data.token);
				if (payload) {
					const user: User = {
						id: payload.id || payload.userId,
						fullName: payload.fullName || payload.fullname || 'User',
						role: payload.role,
						email: payload.email || payload.contactinfo,
					};
					setAuth(data.token, user);
				}
			}
			void navigate({ to: "/" });
		},
		onError: (error: Error) => {
			console.error("Registration failed:", error);
			alert("Помилка реєстрації. Можливо, email вже використовується.");
		},
	});
};

export const useChangePassword = (): UseMutationResult<
	void,
	Error,
	ChangePasswordDto
> => {
	const navigate = useNavigate();

	return useMutation({
		mutationFn: changePassword,
		onSuccess: () => {
			alert("Пароль успішно змінено");
			void navigate({ to: "/" });
		},
		onError: (error: Error) => {
			console.error("Change password failed:", error);
			alert("Помилка зміни паролю. Перевірте поточний пароль.");
		},
	});
};
