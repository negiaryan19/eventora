import { z } from "zod";

export const paymentSchema = z.object({
    cardName: z
        .string()
        .regex(
            /^[A-Z\s]+$/,
            "Only alphabets allowed"
        )
        .min(3, "Card holder name required"),

    cardNumber: z
        .string()
        .regex(
            /^(\d{4}\s){3}\d{4}$/,
            "Card number must be 16 digits"
        ),

    expiry: z
        .string()
        .regex(
            /^(0[1-9]|1[0-2])\/\d{2}$/,
            "Invalid expiry format"
        ),

    cvv: z
        .string()
        .regex(/^\d{3}$/, "Invalid CVV"),
});