import { z } from "zod";

export const createGenreSchema = z.object({
	genrename: z.string().min(1, "Назва жанру обов'язкова").max(50, "Максимум 50 символів"),
});

export const updateGenreSchema = createGenreSchema;
