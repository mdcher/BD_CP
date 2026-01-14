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
import type { Genre, CreateGenreDto, UpdateGenreDto } from "./types";

const getGenres = async (): Promise<Array<Genre>> => {
	const response = await apiClient.get<Array<Genre>>("/genres");
	return response.data;
};

const getGenreById = async (id: string): Promise<Genre> => {
	const response = await apiClient.get<Genre>(`/genres/${id}`);
	return response.data;
};

const createGenre = async (data: CreateGenreDto): Promise<Genre> => {
	const response = await apiClient.post<Genre>("/genres", data);
	return response.data;
};

const updateGenre = async ({
	id,
	data,
}: {
	id: string;
	data: UpdateGenreDto;
}): Promise<Genre> => {
	const response = await apiClient.put<Genre>(`/genres/${id}`, data);
	return response.data;
};

const deleteGenre = async (id: string): Promise<void> => {
	await apiClient.delete(`/genres/${id}`);
};

export const useGenres = (): UseQueryResult<Array<Genre>, Error> => {
	return useQuery<Array<Genre>, Error>({ queryKey: ["genres"], queryFn: getGenres });
};

export const useGenre = (id: string): UseQueryResult<Genre, Error> => {
	return useQuery<Genre, Error>({
		queryKey: ["genres", id],
		queryFn: () => getGenreById(id),
		enabled: !!id,
	});
};

export const useCreateGenre = (): UseMutationResult<
	Genre,
	Error,
	CreateGenreDto
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<Genre, Error, CreateGenreDto>({
		mutationFn: createGenre,
		onSuccess: () => {
			toast.success("Жанр успішно додано!");
			void queryClient.invalidateQueries({ queryKey: ["genres"] });
			void navigate({ to: "/genres" });
		},
		onError: (error) => {
			console.error("Помилка створення жанру:", error);
			toast.error("Не вдалося додати жанр. Перевірте дані.");
		},
	});
};

export const useUpdateGenre = (): UseMutationResult<
	Genre,
	Error,
	{ id: string; data: UpdateGenreDto }
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<
		Genre,
		Error,
		{ id: string; data: UpdateGenreDto }
	>({
		mutationFn: updateGenre,
		onSuccess: (updatedGenre) => {
			toast.success("Зміни успішно збережено!");
			void queryClient.invalidateQueries({ queryKey: ["genres"] });
			queryClient.setQueryData(
				["genres", updatedGenre.id.toString()],
				updatedGenre
			);
			void navigate({ to: "/genres" });
		},
		onError: (error) => {
			console.error("Помилка оновлення жанру:", error);
			toast.error("Не вдалося зберегти зміни. Перевірте дані.");
		},
	});
};

export const useDeleteGenre = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: deleteGenre,
		onSuccess: () => {
			toast.success("Жанр видалено.");
			void queryClient.invalidateQueries({ queryKey: ["genres"] });
		},
		onError: (error) => {
			console.error("Помилка видалення жанру:", error);
			toast.error("Не вдалося видалити жанр.");
		},
	});
};
