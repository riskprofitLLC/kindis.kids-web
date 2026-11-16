import { describe, expect, it } from 'vitest'

import { parseJwtPayload } from '@/shared/lib/jwt'

// Реальный токен бэкенда: payload { sub, email, role }
const realToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2U1NmQ4NS05NDY5LTQzMWEtYTI4ZS00YTVi' +
  'YThiZmU5MDciLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoicGFyZW50IiwiaWF0IjoxN' +
  'zk0NTYyNzgyLCJleHAiOjE3OTQ1NjM2ODJ9.XOyQvpQP37RTbq7znmtmT8Xy-ldIrPi1JldRVDysvSE'

describe('parseJwtPayload', () => {
  it('читает claims настоящего токена', () => {
    expect(parseJwtPayload(realToken)).toMatchObject({
      sub: '07e56d85-9469-431a-a28e-4a5ba8bfe907',
      email: 'test@example.com',
      role: 'parent',
    })
  })

  it('читает токен, у которого payload требует паддинга', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2U1NmQ4NS05NDY5LTQzMWEtYTI4ZS00YTVi' +
      'YThiZmU5MDciLCJlbWFpbCI6InRlc3QxNzk0NTYyNzE0QGV4YW1wbGUuY29tIiwicm9sZSI6InBhcmVudCIs' +
      'ImlhdCI6MTc5NDU2Mzk2MSwiZXhwIjoxNzk0NTY0ODYxfQ.8w9b8-ju6p4jxT0wyJuShzDONI6dRZ7Ps7tE9F7he6Y'
    expect(parseJwtPayload(token)).toMatchObject({
      sub: '07e56d85-9469-431a-a28e-4a5ba8bfe907',
      email: 'test1794562714@example.com',
      role: 'parent',
    })
  })

  it('возвращает null на мусоре', () => {
    expect(parseJwtPayload('')).toBeNull()
    expect(parseJwtPayload('not-a-token')).toBeNull()
    expect(parseJwtPayload('aaa.!!!.bbb')).toBeNull()
  })
})
