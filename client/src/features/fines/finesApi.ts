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
