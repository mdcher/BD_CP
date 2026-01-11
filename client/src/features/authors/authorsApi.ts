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
import type { Author, CreateAuthorDto, UpdateAuthorDto } from "./types";

const getAuthors = async (): Promise<Array<Author>> => {
	const response = await apiClient.get<{ message: string; data: Array<Author> }>("/authors");
	return response.data.data;
};

const getAuthorById = async (id: string): Promise<Author> => {
	const response = await apiClient.get<{ message: string; data: Author }>(`/authors/${id}`);
	return response.data.data;
};

const createAuthor = async (data: CreateAuthorDto): Promise<Author> => {
	const response = await apiClient.post<{ message: string; data: Author }>("/authors", data);
	return response.data.data;
};

const updateAuthor = async ({
	id,
	data,
}: {
	id: string;
	data: UpdateAuthorDto;
}): Promise<Author> => {
	const response = await apiClient.put<{ message: string; data: Author }>(`/authors/${id}`, data);
	return response.data.data;
};

const deleteAuthor = async (id: string): Promise<void> => {
	await apiClient.delete(`/authors/${id}`);
};

export const useAuthors = (): UseQueryResult<Array<Author>, Error> => {
	return useQuery<Array<Author>, Error>({ queryKey: ["authors"], queryFn: getAuthors });
};

export const useAuthor = (id: string): UseQueryResult<Author, Error> => {
	return useQuery<Author, Error>({
		queryKey: ["authors", id],
		queryFn: () => getAuthorById(id),
		enabled: !!id,
	});
};

export const useCreateAuthor = (): UseMutationResult<
	Author,
	Error,
	CreateAuthorDto
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<Author, Error, CreateAuthorDto>({
		mutationFn: createAuthor,
		onSuccess: () => {
			toast.success("Автора успішно додано!");
			void queryClient.invalidateQueries({ queryKey: ["authors"] });
			void navigate({ to: "/authors" });
		},
		onError: (error) => {
			console.error("Помилка створення автора:", error);
			toast.error("Не вдалося додати автора. Перевірте дані.");
		},
	});
};

export const useUpdateAuthor = (): UseMutationResult<
	Author,
	Error,
	{ id: string; data: UpdateAuthorDto }
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<
		Author,
		Error,
		{ id: string; data: UpdateAuthorDto }
	>({
		mutationFn: updateAuthor,
		onSuccess: (updatedAuthor) => {
			toast.success("Зміни успішно збережено!");
			void queryClient.invalidateQueries({ queryKey: ["authors"] });
			queryClient.setQueryData(
				["authors", updatedAuthor.id.toString()],
				updatedAuthor
			);
			void navigate({ to: "/authors" });
		},
		onError: (error) => {
			console.error("Помилка оновлення автора:", error);
			toast.error("Не вдалося зберегти зміни. Перевірте дані.");
		},
	});
};

export const useDeleteAuthor = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: deleteAuthor,
		onSuccess: () => {
			toast.success("Автора видалено.");
			void queryClient.invalidateQueries({ queryKey: ["authors"] });
		},
		onError: (error) => {
			console.error("Помилка видалення автора:", error);
			toast.error("Не вдалося видалити автора.");
		},
	});
};
