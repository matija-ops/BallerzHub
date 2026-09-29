import { z } from "zod";

export const eventFormSchema = z
  .object({
    name: z.string().trim().min(1, "Bitte gib einen Eventnamen ein."),

    description: z.string().trim().min(1, "Bitte gib eine Beschreibung ein."),

    location: z.string().trim().min(1, "Bitte gib einen Ort ein."),

    event_date: z.string().min(1, "Bitte wähle ein Datum aus."),

    event_time: z.string().min(1, "Bitte wähle eine Uhrzeit aus."),

    category: z.string().trim().min(1, "Bitte wähle eine Kategorie aus."),

    age_group: z.string().trim(),

    max_teams: z.coerce
      .number()
      .int("Die Teamanzahl muss eine ganze Zahl sein.")
      .min(0, "Die maximale Teamanzahl darf nicht negativ sein."),

    court_id: z.string().uuid("Bitte wähle einen gültigen Court aus."),
  })
  .superRefine((values, context) => {
    if (
      values.category.toLowerCase() === "3x3" &&
      values.age_group.trim().length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["age_group"],
        message: "Bitte wähle mindestens eine Altersgruppe aus.",
      });
    }

    if (values.category.toLowerCase() === "3x3" && values.max_teams < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_teams"],
        message: "Bitte gib mindestens 1 Team als maximale Teamanzahl an.",
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
