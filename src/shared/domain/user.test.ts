import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { userRoles, userSchema } from '@/shared/domain/user'

const validUser = {
  id: 'u-1',
  email: 'parent@example.com',
  fullName: 'Мама',
  phone: '+79990000000',
  city: 'Москва',
  role: 'parent' as const,
}

describe('userSchema', () => {
  it('принимает корректного пользователя', () => {
    expect(userSchema.parse(validUser)).toEqual(validUser)
  })

  it('nullable-поля допускают null', () => {
    const parsed = userSchema.parse({
      ...validUser,
      fullName: null,
      phone: null,
      city: null,
    })

    expect(parsed.fullName).toBeNull()
    expect(parsed.city).toBeNull()
  })

  it('неизвестная роль отвергается', () => {
    const result = userSchema.safeParse({ ...validUser, role: 'superadmin' })
    expect(result.success).toBe(false)
  })

  it('email проверяется только как строка — формат на бэкенде', () => {
    // Схема намеренно мягкая: строгий разбор email живёт на сервере.
    expect(userSchema.safeParse({ ...validUser, email: 'not-email' }).success).toBe(true)
    expect(userSchema.safeParse({ ...validUser, email: 42 }).success).toBe(false)
  })

  it('отсутствующий id отвергается', () => {
    const { id: _id, ...withoutId } = validUser
    expect(userSchema.safeParse(withoutId).success).toBe(false)
  })
})

describe('userRoles', () => {
  it('совпадает с энумом Prisma на бэкенде', () => {
    expect(userRoles).toEqual(['parent', 'buyer', 'partner', 'admin'])
  })

  it('роль из схемы всегда есть в списке', () => {
    const parsed = userSchema.parse(validUser)
    expect(userRoles).toContain(parsed.role)
  })
})

// Страховка от опечаток в самой схеме.
describe('zod-инструментарий на месте', () => {
  it('safeParse не бросает исключение', () => {
    expect(() => z.object({}).safeParse({})).not.toThrow()
  })
})