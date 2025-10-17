import { z } from "zod";

export const applicationSchema = z.object({
    fullName: z
        .string()
        .min(1, "Full name is required")
        .max(15, "Full name must be less than 15 characters"),
    fatherName: z
        .string()
        .min(1, "Father name is required")
        .max(15, "Father name must be less than 15 characters"),
    dateOfBirth: z
        .string()
        .min(1, "Date of birth is required"),
    gender: z
        .string()
        .min(1, "Gender is required")
        .max(10, "Gender must be less than 10 characters"),
    country: z
        .string()
        .min(1, "Country is required")
        .max(10, "Country must be less than 10 characters"),
    identityNumber: z
        .string()
        .min(13, "CNIC must be exactly 13 digits")
        .max(13, "CNIC must be exactly 13 digits")
        .regex(/^\d{13}$/, "CNIC must contain only digits"),
    address: z
        .string()
        .min(1, "Address is required")
        .max(100, "Address must be less than 100 characters"),
    subject: z
        .string()
        .min(1, "Please select a subject"),
    cnicFront: z.any(),
    cnicBack: z.any(),
    studentImage: z.any(),
});

export type ApplicationData = z.infer<typeof applicationSchema>;
