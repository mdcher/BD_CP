import {
	useQuery,
	useMutation,
	useQueryClient,
	type UseQueryResult,
	type UseMutationResult,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import apiClient from "@/lib/axios";
import type { Fine } from "./types";

// Отримати мої неоплачені штрафи
const getMyUnpaidFines = async (): Promise<Array<Fine>> => {
	const response = await apiClient.get<Array<Fine>>("/fines/my-unpaid");
	return response.data;
};

// Оплатити штраф
const payFine = async (fineId: number): Promise<void> => {
	await apiClient.post(`/fines/${fineId}/pay`);
};

// Ініціювати оплату штрафу (для читачів)
const initiatePayment = async (fineId: number): Promise<void> => {
	await apiClient.post(`/fines/${fineId}/initiate-payment`);
};

// Підтвердити оплату штрафу (для бухгалтерів)
const confirmPayment = async ({ fineId, approve }: { fineId: number; approve: boolean }): Promise<void> => {
	await apiClient.post(`/fines/${fineId}/confirm-payment`, { approve });
};

// Отримати непідтверджені платежі (для бухгалтерів)
const getPendingPayments = async (): Promise<Array<Fine>> => {
	const response = await apiClient.get<Array<Fine>>("/fines/pending-payments");
	return response.data;
};

// Отримати статистику штрафів (для адмінів/бухгалтерів)
const getFineStatistics = async (): Promise<any> => {
	const response = await apiClient.get("/fines/statistics");
	return response.data;
};

export const useMyUnpaidFines = (): UseQueryResult<Array<Fine>, Error> => {
	return useQuery<Array<Fine>, Error>({
		queryKey: ["fines", "my-unpaid"],
		queryFn: getMyUnpaidFines,
	});
};

export const usePayFine = (): UseMutationResult<void, Error, number> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: payFine,
		onSuccess: () => {
			toast.success("Штраф успішно оплачено!");
			void queryClient.invalidateQueries({ queryKey: ["fines", "my-unpaid"] });
		},
		onError: (error) => {
			console.error("Помилка оплати штрафу:", error);
			toast.error("Не вдалося оплатити штраф.");
		},
	});
};

export const useInitiatePayment = (): UseMutationResult<void, Error, number> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: initiatePayment,
		onSuccess: () => {
			toast.success("Оплату ініційовано. Очікуйте підтвердження бухгалтера.");
			void queryClient.invalidateQueries({ queryKey: ["fines", "my-unpaid"] });
			void queryClient.invalidateQueries({ queryKey: ["fines", "pending-payments"] });
		},
		onError: (error: any) => {
			console.error("Помилка ініціації оплати:", error);
			// Перевіряємо, чи це справжня помилка
			if (error?.response?.status !== 200) {
				toast.error("Не вдалося ініціювати оплату.");
			}
		},
	});
};

export const useConfirmPayment = (): UseMutationResult<void, Error, { fineId: number; approve: boolean }> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { fineId: number; approve: boolean }>({
		mutationFn: confirmPayment,
		onSuccess: (_, variables) => {
			toast.success(variables.approve ? "Оплату підтверджено!" : "Оплату відхилено.");
			void queryClient.invalidateQueries({ queryKey: ["fines", "pending-payments"] });
		},
		onError: (error) => {
			console.error("Помилка підтвердження оплати:", error);
			toast.error("Не вдалося підтвердити оплату.");
		},
	});
};

export const usePendingPayments = (): UseQueryResult<Array<Fine>, Error> => {
	return useQuery<Array<Fine>, Error>({
		queryKey: ["fines", "pending-payments"],
		queryFn: getPendingPayments,
	});
};

export const useFineStatistics = (): UseQueryResult<any, Error> => {
	return useQuery({
		queryKey: ["fines", "statistics"],
		queryFn: getFineStatistics,
	});
};
