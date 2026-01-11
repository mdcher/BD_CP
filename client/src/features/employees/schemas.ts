import { z } from "zod";

export const createEmployeeSchema = z.object({
	userid: z.number().int().positive("ID користувача обов'язковий"),
	position: z.string().min(1, "Посада обов'язкова").max(50, "Максимум 50 символів"),
	salaryrate: z.number().nonnegative("Ставка зарплати має бути >= 0"),
	workedhours: z.number().int().nonnegative("Години роботи мають бути >= 0"),
});

export const updateEmployeeSchema = z.object({
	position: z.string().min(1, "Посада обов'язкова").max(50, "Максимум 50 символів").optional(),
	salaryrate: z.number().nonnegative("Ставка зарплати має бути >= 0").optional(),
	workedhours: z.number().int().nonnegative("Години роботи мають бути >= 0").optional(),
});
