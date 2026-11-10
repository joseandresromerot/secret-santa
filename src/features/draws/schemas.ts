import { z } from "zod";
import { routing } from "@/i18n/routing";
export { MAX_GROUPS, MAX_PARTICIPANTS } from "./constants";


const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const drawDetailsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  eventDate: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v))
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  budget: optionalText(40),
  message: optionalText(1000),
  locale: z.enum(routing.locales),
});

export type DrawDetailsInput = z.input<typeof drawDetailsSchema>;

export const participantSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type ParticipantInput = z.input<typeof participantSchema>;

export const groupNameSchema = z.string().trim().min(1).max(40);
