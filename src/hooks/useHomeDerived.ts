import { useMemo } from "react"

import { orderContextStorage } from "@/utils/orderStorage"
import {
  getHoursUntilCutoff21,
  isProductVisibleByExpiry,
  mapProductLotFromApi,
} from "@/utils/home"

import type { CustomerOrderContext } from "@/types/order.type"
import type {
  HomeCategoryItem,
  HomeProductLotApiItem,
  HomeProductView,
} from "@/types/home.type"
import { ALL_CATEGORY_KEY, ALL_MARKET_KEY, buildHomeStats } from "@/constants/home.constants"

type Params = {
  deliveryCtx: CustomerOrderContext
  productsRaw: HomeProductLotApiItem[]
  availableSupermarkets: NonNullable<CustomerOrderContext["nearbySupermarkets"]>
  categoriesMaster: HomeCategoryItem[]
  activeCategory: string
  activeSupermarketId: string
  supermarketSortBy: "distance" | "count"
  showEmptyCategories: boolean
}

export const useHomeDerived = ({
  deliveryCtx,
  productsRaw,
  availableSupermarkets,
  categoriesMaster,
  activeCategory,
  activeSupermarketId,
  supermarketSortBy,
  showEmptyCategories,
}: Params) => {
  const noMatchedSupermarket =
    orderContextStorage.isReady(deliveryCtx) &&
    Array.isArray(deliveryCtx.nearbySupermarkets) &&
    deliveryCtx.nearbySupermarkets.length === 0

  const supermarketNameMap = useMemo(() => {
    const map = new Map<string, string>()

    availableSupermarkets.forEach((item) => {
      map.set(item.supermarketId, item.name)
    })

    return map
  }, [availableSupermarkets])

  const categoryNameMap = useMemo(() => {
    return new Map(
      categoriesMaster
        .filter((item) => item.value !== ALL_CATEGORY_KEY)
        .map((item) => [item.value, item.label])
    )
  }, [categoriesMaster])

  const products = useMemo(() => {
    return productsRaw
      .map((item) => {
        const mapped = mapProductLotFromApi(item, supermarketNameMap)
        if (!mapped.categoryId) return mapped

        const masterCategoryName = categoryNameMap.get(mapped.categoryId)
        if (!masterCategoryName) return mapped

        return {
          ...mapped,
          category: masterCategoryName,
        }
      })
      .filter((item) =>
        isProductVisibleByExpiry(item.daysToExpiry ?? undefined, item.hoursRemaining ?? undefined)
      )
      .sort((a, b) => {
        const aDays = a.daysToExpiry ?? Number.MAX_SAFE_INTEGER
        const bDays = b.daysToExpiry ?? Number.MAX_SAFE_INTEGER

        if (aDays !== bDays) return aDays - bDays

        const aHours =
          aDays === 0 ? (a.hoursRemaining ?? getHoursUntilCutoff21()) : Number.MAX_SAFE_INTEGER
        const bHours =
          bDays === 0 ? (b.hoursRemaining ?? getHoursUntilCutoff21()) : Number.MAX_SAFE_INTEGER

        if (aHours !== bHours) return aHours - bHours

        return a.name.localeCompare(b.name, "vi")
      })
  }, [productsRaw, supermarketNameMap, categoryNameMap])

  const matchedSupermarketIds = useMemo(() => {
    return new Set((deliveryCtx.nearbySupermarkets ?? []).map((item) => item.supermarketId))
  }, [deliveryCtx.nearbySupermarkets])

  const visibleProducts = useMemo(() => {
    if (!orderContextStorage.isReady(deliveryCtx)) return []
    if (noMatchedSupermarket) return []

    if (matchedSupermarketIds.size > 0) {
      return products.filter((item) => matchedSupermarketIds.has(item.supermarketId))
    }

    return products
  }, [deliveryCtx, matchedSupermarketIds, products, noMatchedSupermarket])

  const supermarketOptions = useMemo(() => {
    const counts = new Map<string, number>()

    visibleProducts.forEach((item) => {
      counts.set(item.supermarketId, (counts.get(item.supermarketId) ?? 0) + 1)
    })

    const nearbyMarkets = deliveryCtx.nearbySupermarkets ?? []

    const masterMarkets = nearbyMarkets.map((market) => ({
      supermarketId: market.supermarketId,
      name: market.name,
      distanceKm: market.distanceKm,
      count: counts.get(market.supermarketId) ?? 0,
    }))

    const knownIds = new Set(masterMarkets.map((item) => item.supermarketId))

    const fallbackMarkets = Array.from(counts.entries())
      .filter(([supermarketId]) => !knownIds.has(supermarketId))
      .map(([supermarketId, count]) => ({
        supermarketId,
        name: supermarketNameMap.get(supermarketId) || "Siêu thị khác",
        distanceKm: undefined,
        count,
      }))

    const merged = [...masterMarkets, ...fallbackMarkets]

    const sorted = [...merged].sort((a, b) => {
      if (supermarketSortBy === "distance") {
        const aDistance = typeof a.distanceKm === "number" ? a.distanceKm : Number.MAX_SAFE_INTEGER
        const bDistance = typeof b.distanceKm === "number" ? b.distanceKm : Number.MAX_SAFE_INTEGER

        if (aDistance !== bDistance) return aDistance - bDistance
        if (b.count !== a.count) return b.count - a.count
        return a.name.localeCompare(b.name, "vi")
      }

      if (b.count !== a.count) return b.count - a.count

      const aDistance = typeof a.distanceKm === "number" ? a.distanceKm : Number.MAX_SAFE_INTEGER
      const bDistance = typeof b.distanceKm === "number" ? b.distanceKm : Number.MAX_SAFE_INTEGER

      if (aDistance !== bDistance) return aDistance - bDistance
      return a.name.localeCompare(b.name, "vi")
    })

    return [
      {
        supermarketId: ALL_MARKET_KEY,
        name: "Tất cả siêu thị",
        distanceKm: undefined,
        count: visibleProducts.length,
      },
      ...sorted,
    ]
  }, [visibleProducts, deliveryCtx.nearbySupermarkets, supermarketNameMap, supermarketSortBy])

  const marketScopedProducts = useMemo(() => {
    if (noMatchedSupermarket) return []
    if (activeSupermarketId === ALL_MARKET_KEY) return visibleProducts
    return visibleProducts.filter((item) => item.supermarketId === activeSupermarketId)
  }, [activeSupermarketId, visibleProducts, noMatchedSupermarket])

  const categories: HomeCategoryItem[] = useMemo(() => {
    const counts = new Map<string, number>()

    marketScopedProducts.forEach((item) => {
      const value = item.categoryId?.trim() || `label:${item.category}`
      counts.set(value, (counts.get(value) ?? 0) + 1)
    })

    const mergedMaster = categoriesMaster.map((item) => ({
      ...item,
      count: counts.get(item.value) ?? 0,
    }))

    const knownCategoryValues = new Set(mergedMaster.map((item) => item.value))

    const fallbackCategories: HomeCategoryItem[] = Array.from(counts.entries())
      .filter(([value]) => !knownCategoryValues.has(value))
      .map(([value, count]) => {
        const matchedProduct = marketScopedProducts.find(
          (item) => (item.categoryId?.trim() || `label:${item.category}`) === value
        )

        return {
          value,
          label: matchedProduct?.category || "Khác",
          count,
        }
      })

    const sortedMaster = [...mergedMaster].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.label.localeCompare(b.label, "vi")
    })

    const sortedFallback = [...fallbackCategories].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.label.localeCompare(b.label, "vi")
    })

    return [
      { value: ALL_CATEGORY_KEY, label: "Tất cả", count: marketScopedProducts.length },
      ...sortedMaster,
      ...sortedFallback,
    ]
  }, [marketScopedProducts, categoriesMaster])

  const visibleCategories = useMemo(() => {
    const allCategory = categories.find((item) => item.value === ALL_CATEGORY_KEY)
    const nonAllCategories = categories.filter((item) => item.value !== ALL_CATEGORY_KEY)

    const nonEmptyCategories = nonAllCategories.filter((item) => item.count > 0)
    const emptyCategories = nonAllCategories.filter((item) => item.count === 0)

    return {
      allCategory,
      nonEmptyCategories,
      emptyCategories,
      displayedCategories: showEmptyCategories ? nonAllCategories : nonEmptyCategories,
    }
  }, [categories, showEmptyCategories])

  const filteredProducts: HomeProductView[] = useMemo(() => {
    if (noMatchedSupermarket) return []
    if (activeCategory === ALL_CATEGORY_KEY) return marketScopedProducts

    return marketScopedProducts.filter((item) => {
      const itemCategoryValue = item.categoryId?.trim() || `label:${item.category}`
      return itemCategoryValue === activeCategory
    })
  }, [activeCategory, marketScopedProducts, noMatchedSupermarket])

  const highlightCount = visibleProducts.filter(
    (item) =>
      item.daysToExpiry === 0 ||
      (typeof item.daysToExpiry === "number" && item.daysToExpiry <= 3)
  ).length

  const stats = buildHomeStats(
    visibleProducts.length,
    highlightCount,
    deliveryCtx.nearbySupermarkets?.length ?? 0
  )

  const currentLocationText =
    deliveryCtx.deliveryMethodId === "DELIVERY"
      ? deliveryCtx.addressText || "Chưa chọn"
      : deliveryCtx.pickupPointAddress || "Chưa chọn"

  return {
    filteredProducts,
    visibleCategories,
    supermarketOptions,
    stats,
    noMatchedSupermarket,
    currentLocationText,
  }
}
