import { z } from 'zod'

export const registerSchema = z.object({
    body: z.object({
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(8).refine((password) => {
            const regex = [
                {
                    regex: /[a-z]/,
                    errorMessage: 'Password must contain at least one lowercase letter',
                },
                {
                    regex: /[A-Z]/,
                    errorMessage: 'Password must contain at least one uppercase letter',
                },
                {
                    regex: /\d/,
                    errorMessage: 'Password must contain at least one number',
                },
            ]

            return regex.every((reg) => {
                if (!reg.regex.test(password)) {
                    throw new Error(reg.errorMessage)
                }
                return true;
            })
        }, "Invalid password"),
        full_name: z.string(),
        address: z.string(),
        phone_number: z.string(),
    })
})