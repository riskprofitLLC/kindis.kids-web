import { z } from 'zod'

// Доменный слой: типы и схемы без DOM и React — общие с будущим RN-приложением.
// Роли совпадают с Prisma-энумом UserRole на бэкенде.
export const userRoles = ['parent', 'buyer', 'partner', 'admin'] as const
export type UserRole = (typeof userRoles)[number]

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string().nullable(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  role: z.enum([...userRoles]),
})

export type User = z.infer<typeof userSchema>
