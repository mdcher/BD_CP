import {
	useQuery,
	useMutation,
	useQueryClient,
	type UseQueryResult,
	type UseMutationResult,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import apiClient from "@/lib/axios";
import type { User, UpdateUserDto } from "./types";

const getUsers = async (): Promise<User[]> => {
	const response = await apiClient.get<User[]>("/users");
	return response.data;
};

const getUserById = async (id: string): Promise<User> => {
	const response = await apiClient.get<User>(`/users/${id}`);
	return response.data;
};

const updateUser = async ({
	id,
	data,
}: {
	id: string;
	data: UpdateUserDto;
}): Promise<User> => {
	const response = await apiClient.patch<User>(`/users/${id}`, data);
	return response.data;
};

const deleteUser = async (id: string): Promise<void> => {
	await apiClient.delete(`/users/${id}`);
};

export const useUsers = (): UseQueryResult<User[], Error> => {
	return useQuery<User[], Error>({
		queryKey: ["users"],
		queryFn: getUsers,
	});
};

export const useUser = (id: string): UseQueryResult<User, Error> => {
	return useQuery<User, Error>({
		queryKey: ["users", id],
		queryFn: () => getUserById(id),
		enabled: !!id,
	});
};

export const useUpdateUser = (): UseMutationResult<
	User,
	Error,
	{ id: string; data: UpdateUserDto }
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<User, Error, { id: string; data: UpdateUserDto }>({
		mutationFn: updateUser,
		onSuccess: (updatedUser) => {
			void queryClient.invalidateQueries({ queryKey: ["users"] });
			queryClient.setQueryData(
				["users", updatedUser.id.toString()],
				updatedUser
			);
			void navigate({ to: "/users" });
		},
	});
};

export const useDeleteUser = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: deleteUser,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
};
