import { z } from "zod";

export const eventFormSchema = z
  .object({
    name: z.string().trim().min(1, "Bitte gib einen Eventnamen ein."),

    description: z.string().trim().min(1, "Bitte gib eine Beschreibung ein."),

    location: z.string().trim().min(1, "Bitte gib einen Ort ein."),

    event_date: z.string().min(1, "Bitte wähle ein Datum aus."),

    event_time: z.string().min(1, "Bitte wähle eine Uhrzeit aus."),

    category: z.string().trim().min(1, "Bitte wähle eine Kategorie aus."),

    /*
     * Bei normalen Events kann die Altersgruppe leer bleiben.
     * Bei 3x3 wird sie unten in superRefine verpflichtend.
     */
    age_group: z.string().trim(),

    /*
     * max_teams ist laut Datenmodell NOT NULL.
     *
     * 0 bedeutet im bestehenden Frontend:
     * keine aktive Teambegrenzung.
     *
     * Bei 3x3 muss der Wert mindestens 1 sein.
     */
    max_teams: z.coerce
      .number()
      .int("Die maximale Teamanzahl muss eine ganze Zahl sein.")
      .min(0, "Die maximale Teamanzahl darf nicht negativ sein."),

    /*
     * court_id ist laut Datenmodell NOT NULL.
     */
    court_id: z.string().uuid("Bitte wähle einen gültigen Court aus."),
  })
  .superRefine((values, context) => {
    /*
     * Nur 3x3 benötigt eine Altersgruppe.
     */
    if (
      values.category.toLowerCase() === "3x3" &&
      values.age_group.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["age_group"],
        message: "Bitte wähle eine Altersgruppe aus.",
      });
    }

    /*
     * Nur 3x3 benötigt eine positive maximale Teamanzahl.
     */
    if (values.category.toLowerCase() === "3x3" && values.max_teams < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_teams"],
        message: "Für ein 3x3-Event muss mindestens 1 Team zugelassen werden.",
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
