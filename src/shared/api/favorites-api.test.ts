import { beforeEach, describe, expect, it, vi } from "vitest"

// Избранное зовёт только GET/POST/DELETE клиента — мокаем лишь их.
const get = vi.fn()
const post = vi.fn()
const del = vi.fn()

vi.mock("@/shared/api/client", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}))

const { favoritesApi } = await import("@/shared/api/favorites-api")

// Сырой товар бэкенда — приводится к карточке общим маппером каталога.
function rawProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "p-1",
    title: "Шкатулка",
    description: "Из дерева",
    priceKopecks: 45000,
    stock: 2,
    createdAt: "2026-11-01T00:00:00.000Z",
    category: { id: "c-1", name: "Роспись", slug: "wood-painting" },
    childProfile: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("favoritesApi.list", () => {
  it("маппит вложенные товары в карточки каталога", async () => {
    get.mockResolvedValueOnce({ data: [{ productId: "p-1", product: rawProduct() }] })

    const list = await favoritesApi.list()

    expect(get).toHaveBeenCalledWith("/favorites")
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: "p-1", title: "Шкатулка", media: [] })
  })

  it("отбрасывает записи без товара или без id", async () => {
    get.mockResolvedValueOnce({
      data: [{ productId: "x-1", product: null }, { productId: "y-1" }],
    })

    const list = await favoritesApi.list()

    // Пустой товар и запись без продукта вычищаются до маппинга.
    expect(list).toEqual([])
  })

  it("пустая выдача отдаёт пустой массив", async () => {
    get.mockResolvedValueOnce({ data: [] })

    await expect(favoritesApi.list()).resolves.toEqual([])
  })

  it("отсутствующий массив не ломает список", async () => {
    // Ветка ??: сервер может отдать null вместо массива избранного.
    get.mockResolvedValueOnce({ data: null })

    await expect(favoritesApi.list()).resolves.toEqual([])
  })
})

describe("favoritesApi.add / remove", () => {
  it("add шлёт POST на товар избранного", async () => {
    post.mockResolvedValueOnce({ data: null })

    await favoritesApi.add("p-1")

    expect(post).toHaveBeenCalledWith("/favorites/p-1")
  })

  it("remove удаляет товар из избранного", async () => {
    del.mockResolvedValueOnce({ data: null })

    await favoritesApi.remove("p-2")

    expect(del).toHaveBeenCalledWith("/favorites/p-2")
  })
})