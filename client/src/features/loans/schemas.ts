import { z } from "zod";

export const createLoanSchema = z.object({
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  isReturned: z.boolean().optional(),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
  userId: z.number().int(),
  bookId: z.number().int(),
});

export const updateLoanSchema = createLoanSchema.partial();

export type CreateLoanSchema = z.infer<typeof createLoanSchema>;
export type UpdateLoanSchema = z.infer<typeof updateLoanSchema>;
