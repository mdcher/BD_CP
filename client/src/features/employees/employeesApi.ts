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
import type { Employee, CreateEmployeeDto, UpdateEmployeeDto } from "./types";

const getEmployees = async (): Promise<Array<Employee>> => {
	const response = await apiClient.get<{ message: string; data: Array<Employee> }>("/employees");
	return response.data;
};

const getEmployeeById = async (id: string): Promise<Employee> => {
	const response = await apiClient.get<{ message: string; data: Employee }>(`/employees/${id}`);
	return response.data;
};

const createEmployee = async (data: CreateEmployeeDto): Promise<Employee> => {
	const response = await apiClient.post<{ message: string; data: Employee }>("/employees", data);
	return response.data;
};

const updateEmployee = async ({
	id,
	data,
}: {
	id: string;
	data: UpdateEmployeeDto;
}): Promise<Employee> => {
	const response = await apiClient.put<{ message: string; data: Employee }>(`/employees/${id}`, data);
	return response.data;
};

const deleteEmployee = async (id: string): Promise<void> => {
	await apiClient.delete(`/employees/${id}`);
};

export const useEmployees = (): UseQueryResult<Array<Employee>, Error> => {
	return useQuery<Array<Employee>, Error>({ queryKey: ["employees"], queryFn: getEmployees });
};

export const useEmployee = (id: string): UseQueryResult<Employee, Error> => {
	return useQuery<Employee, Error>({
		queryKey: ["employees", id],
		queryFn: () => getEmployeeById(id),
		enabled: !!id,
	});
};

export const useCreateEmployee = (): UseMutationResult<
	Employee,
	Error,
	CreateEmployeeDto
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<Employee, Error, CreateEmployeeDto>({
		mutationFn: createEmployee,
		onSuccess: () => {
			toast.success("Співробітника успішно додано!");
			void queryClient.invalidateQueries({ queryKey: ["employees"] });
			void navigate({ to: "/employees" });
		},
		onError: (error) => {
			console.error("Помилка створення співробітника:", error);
			toast.error("Не вдалося додати співробітника.");
		},
	});
};

export const useUpdateEmployee = (): UseMutationResult<
	Employee,
	Error,
	{ id: string; data: UpdateEmployeeDto }
> => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation<
		Employee,
		Error,
		{ id: string; data: UpdateEmployeeDto }
	>({
		mutationFn: updateEmployee,
		onSuccess: (updatedEmployee) => {
			toast.success("Зміни успішно збережено!");
			void queryClient.invalidateQueries({ queryKey: ["employees"] });
			queryClient.setQueryData(
				["employees", updatedEmployee.employeeid.toString()],
				updatedEmployee
			);
			void navigate({ to: "/employees" });
		},
		onError: (error) => {
			console.error("Помилка оновлення співробітника:", error);
			toast.error("Не вдалося зберегти зміни.");
		},
	});
};

export const useDeleteEmployee = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: deleteEmployee,
		onSuccess: () => {
			toast.success("Співробітника видалено.");
			void queryClient.invalidateQueries({ queryKey: ["employees"] });
		},
		onError: (error) => {
			console.error("Помилка видалення співробітника:", error);
			toast.error("Не вдалося видалити співробітника.");
		},
	});
};
