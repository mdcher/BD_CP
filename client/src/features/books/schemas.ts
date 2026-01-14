import { z } from "zod";
import { LanguageEnum, BookStatus } from "./types";

const yearSchema = z.union([
  z.number().int("Рік має бути цілим числом").min(1900, "Рік має бути >= 1900"),
  z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int("Рік має бути цілим числом").min(1900, "Рік має бути >= 1900"))
]);

export const createBookSchema = z.object({
  bookTitle: z.string().min(1, "Назва обов'язкова"),
  publisher: z.string().min(1, "Видавництво обов'язкове"),
  language: z.nativeEnum(LanguageEnum, {
    message: "Оберіть мову",
  }),
  year: yearSchema,
  location: z.string().min(1, "Локація обов'язкова"),
  status: z.nativeEnum(BookStatus, {
    message: "Оберіть статус",
  }),
  authorIds: z.array(z.number()).min(1, "Оберіть хоча б одного автора"),
  genreIds: z.array(z.number()).min(1, "Оберіть хоча б один жанр"),
});

export const updateBookSchema = z.object({
  bookTitle: z.string().min(1, "Назва обов'язкова").optional(),
  publisher: z.string().min(1, "Видавництво обов'язкове").optional(),
  language: z.nativeEnum(LanguageEnum, {
    message: "Оберіть мову",
  }).optional(),
  year: yearSchema.optional(),
  location: z.string().min(1, "Локація обов'язкова").optional(),
  status: z.nativeEnum(BookStatus, {
    message: "Оберіть статус",
  }).optional(),
  authorIds: z.array(z.number()).min(1, "Оберіть хоча б одного автора").optional(),
  genreIds: z.array(z.number()).min(1, "Оберіть хоча б один жанр").optional(),
});
