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
});
