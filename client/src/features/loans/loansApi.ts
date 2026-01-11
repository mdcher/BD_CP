import {
	useQuery,
	useMutation,
	useQueryClient,
	type UseQueryResult,
	type UseMutationResult,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";
import apiClient from "@/lib/axios";
import type { Loan, CreateLoanDto, UpdateLoanDto } from "./types";

const getLoans = async (): Promise<Loan[]> => {
	const response = await apiClient.get<Loan[]>("/loans");
	return response.data;
};

const getLoanById = async (id: string): Promise<Loan> => {
	const response = await apiClient.get<Loan>(`/loans/${id}`);
	return response.data;
};

const createLoan = async (data: CreateLoanDto): Promise<Loan> => {
	const response = await apiClient.post<Loan>("/loans", data);
	return response.data;
};

const updateLoan = async ({
	id,
	data,
}: {
	id: string;
	data: UpdateLoanDto;
}): Promise<Loan> => {
	const response = await apiClient.put<Loan>(`/loans/${id}`, data);
	return response.data;
};

const deleteLoan = async (id: string): Promise<void> => {
	await apiClient.delete(`/loans/${id}`);
};

export const useLoans = (): UseQueryResult<Loan[], Error> => {
	return useQuery<Loan[], Error>({ queryKey: ["loans"], queryFn: getLoans });
};

export const useLoan = (id: string): UseQueryResult<Loan, Error> => {
	return useQuery<Loan, Error>({
		queryKey: ["loans", id],
		queryFn: () => getLoanById(id),
		enabled: !!id,
	});
};

export const useCreateLoan = (): UseMutationResult<
	Loan,
	Error,
	CreateLoanDto
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<Loan, Error, CreateLoanDto>({
		mutationFn: createLoan,
		onSuccess: () => {
			toast.success("Видачу успішно створено!");
			void queryClient.invalidateQueries({ queryKey: ["loans"] });
			void queryClient.invalidateQueries({ queryKey: ["books"] });
			void navigate({ to: "/loans" });
		},
		onError: (error) => {
			console.error("Помилка створення видачі:", error);
			toast.error("Не вдалося створити видачу.");
		},
	});
};

export const useUpdateLoan = (): UseMutationResult<
	Loan,
	Error,
	{ id: string; data: UpdateLoanDto }
> => {
	const queryClient = useQueryClient();

	return useMutation<Loan, Error, { id: string; data: UpdateLoanDto }>({
		mutationFn: updateLoan,
		onSuccess: (updatedLoan) => {
			toast.success("Видачу успішно оновлено!");
			void queryClient.invalidateQueries({ queryKey: ["loans"] });
			void queryClient.invalidateQueries({ queryKey: ["books"] });
			queryClient.setQueryData(
				["loans", updatedLoan.id.toString()],
				updatedLoan
			);
		},
		onError: (error) => {
			console.error("Помилка оновлення видачі:", error);
			toast.error("Не вдалося оновити видачу.");
		},
	});
};

export const useDeleteLoan = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: deleteLoan,
		onSuccess: () => {
			toast.success("Видачу видалено.");
			void queryClient.invalidateQueries({ queryKey: ["loans"] });
			void queryClient.invalidateQueries({ queryKey: ["books"] });
		},
		onError: (error) => {
			console.error("Помилка видалення видачі:", error);
			toast.error("Не вдалося видалити видачу.");
		},
	});
};