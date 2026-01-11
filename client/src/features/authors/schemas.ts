import { z } from "zod";

export const createAuthorSchema = z.object({
	fullname: z.string().min(1, "Ім'я автора обов'язкове").max(100, "Максимум 100 символів"),
});

export const updateAuthorSchema = createAuthorSchema;
