import {
	useQuery,
	useMutation,
	useQueryClient,
	type UseQueryResult,
	type UseMutationResult,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import apiClient from "@/lib/axios";
import type { Reservation } from "./types";

// Функція для визначення статусу бронювання
const getReservationStatus = (reservation: any): string => {
	if (reservation.iscompleted) return "completed";
	if (reservation.isconfirmed) return "confirmed";
	return "pending";
};

// Отримати мої бронювання
const getMyReservations = async (): Promise<Array<Reservation>> => {
	const response = await apiClient.get<Array<any>>("/reservations/my");
	const reservations = Array.isArray(response.data) ? response.data : [];
	return reservations.map((r: any) => ({
		...r,
		status: getReservationStatus(r)
	}));
};

// Створити бронювання
const createReservation = async (bookId: number): Promise<Reservation> => {
	const response = await apiClient.post<Reservation>("/reservations", { bookId });
	return response.data;
};

// Скасувати бронювання
const cancelReservation = async (reservationId: number): Promise<void> => {
	await apiClient.delete(`/reservations/${reservationId}`);
};

// Отримати непідтверджені бронювання (для бібліотекарів)
const getPendingReservations = async (): Promise<Array<Reservation>> => {
	const response = await apiClient.get<Array<any>>("/reservations/pending");
	const reservations = Array.isArray(response.data) ? response.data : [];
	return reservations.map((r: any) => ({
		...r,
		status: getReservationStatus(r)
	}));
};

// Підтвердити бронювання (для бібліотекарів)
const confirmReservation = async ({
	reservationId,
	pickupDate,
}: {
	reservationId: number;
	pickupDate?: string;
}): Promise<void> => {
	await apiClient.post(`/reservations/${reservationId}/confirm`, { pickupDate });
};

// Завершити бронювання (для бібліотекарів)
const completeReservation = async (reservationId: number): Promise<void> => {
	await apiClient.post(`/reservations/${reservationId}/complete`);
};

// Отримати всі активні бронювання (для бібліотекарів)
const getAllActiveReservations = async (): Promise<Array<Reservation>> => {
	const response = await apiClient.get<Array<any>>("/reservations/all-active");
	const reservations = Array.isArray(response.data) ? response.data : [];
	return reservations.map((r: any) => ({
		...r,
		status: getReservationStatus(r)
	}));
};

export const useMyReservations = (): UseQueryResult<Array<Reservation>, Error> => {
	return useQuery<Array<Reservation>, Error>({
		queryKey: ["reservations", "my"],
		queryFn: getMyReservations,
	});
};

export const useCreateReservation = (): UseMutationResult<Reservation, Error, number> => {
	const queryClient = useQueryClient();

	return useMutation<Reservation, Error, number>({
		mutationFn: createReservation,
		onSuccess: () => {
			toast.success("Бронювання створено! Очікуйте підтвердження бібліотекаря.");
			void queryClient.invalidateQueries({ queryKey: ["reservations", "my"] });
		},
		onError: (error: any) => {
			console.error("Помилка створення бронювання:", error);
			toast.error(error.response?.data?.message || "Не вдалося створити бронювання.");
		},
	});
};

export const useCancelReservation = (): UseMutationResult<void, Error, number> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: cancelReservation,
		onSuccess: () => {
			toast.success("Бронювання скасовано!");
			void queryClient.invalidateQueries({ queryKey: ["reservations", "my"] });
		},
		onError: (error) => {
			console.error("Помилка скасування бронювання:", error);
			toast.error("Не вдалося скасувати бронювання.");
		},
	});
};

export const usePendingReservations = (): UseQueryResult<Array<Reservation>, Error> => {
	return useQuery<Array<Reservation>, Error>({
		queryKey: ["reservations", "pending"],
		queryFn: getPendingReservations,
	});
};

export const useConfirmReservation = (): UseMutationResult<
	void,
	Error,
	{ reservationId: number; pickupDate?: string }
> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { reservationId: number; pickupDate?: string }>({
		mutationFn: confirmReservation,
		onSuccess: () => {
			toast.success("Бронювання підтверджено!");
			void queryClient.invalidateQueries({ queryKey: ["reservations", "pending"] });
			void queryClient.invalidateQueries({ queryKey: ["reservations", "all-active"] });
		},
		onError: (error) => {
			console.error("Помилка підтвердження бронювання:", error);
			toast.error("Не вдалося підтвердити бронювання.");
		},
	});
};

export const useCompleteReservation = (): UseMutationResult<void, Error, number> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: completeReservation,
		onSuccess: () => {
			toast.success("Бронювання завершено!");
			void queryClient.invalidateQueries({ queryKey: ["reservations", "all-active"] });
		},
		onError: (error) => {
			console.error("Помилка завершення бронювання:", error);
			toast.error("Не вдалося завершити бронювання.");
		},
	});
};

export const useAllActiveReservations = (): UseQueryResult<Array<Reservation>, Error> => {
	return useQuery<Array<Reservation>, Error>({
		queryKey: ["reservations", "all-active"],
		queryFn: getAllActiveReservations,
	});
};
