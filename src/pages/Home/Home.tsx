import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import DeliveryGateModal from "../Home/DeliveryGateModal"
import { getAuthSession } from "@/utils/authStorage"
import { orderContextStorage } from "@/utils/orderStorage"
import type { CustomerOrderContext } from "@/types/order.type"
import type { HomeCategoryItem } from "@/types/home.type"

import { CART_ROUTE, LOGIN_ROUTE, ALL_CATEGORY_KEY, ALL_MARKET_KEY } from "@/constants/home.constants"
import { useHomeBootstrap } from "@/hooks/useHomeBootstrap"
import { useHomeDerived } from "@/hooks/useHomeDerived"
import { useHomeCart } from "@/hooks/useHomeCart"

import HomeLocationSection from "./HomeLocationSection"
import HomeStatsSection from "./HomeStatsSection"
import HomeMobileCartBar from "./HomeMobileCartBar"
import HomeSidebar from "./HomeSidebar"
import HomeProductSection from "./HomeProductSection"

const isUserLoggedIn = () => !!getAuthSession()?.accessToken

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const productSectionRef = useRef<HTMLElement | null>(null)

  const [gateOpen, setGateOpen] = useState(false)
  const [deliveryCtx, setDeliveryCtx] = useState<CustomerOrderContext>(() =>
    orderContextStorage.get()
  )

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_KEY)
  const [activeSupermarketId, setActiveSupermarketId] = useState(ALL_MARKET_KEY)
  const [supermarketSortBy, setSupermarketSortBy] = useState<"distance" | "count">("distance")
  const [showEmptyCategories, setShowEmptyCategories] = useState(false)

  const { cartCount, getCartQty, addToCart, increaseCart, decreaseCart } = useHomeCart()

  const { productsRaw, availableSupermarkets, categoriesMaster, loading, error } =
    useHomeBootstrap(deliveryCtx)

  const {
    filteredProducts,
    visibleCategories,
    supermarketOptions,
    stats,
    noMatchedSupermarket,
    currentLocationText,
  } = useHomeDerived({
    deliveryCtx,
    productsRaw,
    availableSupermarkets,
    categoriesMaster,
    activeCategory,
    activeSupermarketId,
    supermarketSortBy,
    showEmptyCategories,
  })

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const queryView = searchParams.get("view") ?? ""
  const queryKeyword = searchParams.get("q")?.trim() ?? ""
  const queryCategory = searchParams.get("category")?.trim() ?? ""
  const queryLotId = searchParams.get("lotId")?.trim() ?? ""

  const isSearchMode =
    queryView === "shop" || !!queryKeyword || !!queryCategory || !!queryLotId

  const selectedLotProduct = useMemo(() => {
    if (!queryLotId) return null
    return filteredProducts.find((item) => item.lotId === queryLotId) ?? null
  }, [filteredProducts, queryLotId])

  const searchedProducts = useMemo(() => {
    const normalizedKeyword = normalizeText(queryKeyword)
    const normalizedCategory = normalizeText(queryCategory)

    let result = [...filteredProducts]

    if (queryLotId) {
      const exactLot = result.find((item) => item.lotId === queryLotId)
      return exactLot ? [exactLot] : []
    }

    if (normalizedCategory) {
      result = result.filter(
        (item) => normalizeText(item.category || "Thực phẩm") === normalizedCategory
      )
    }

    if (normalizedKeyword) {
      result = result.filter((item) => {
        const name = normalizeText(item.name)
        const category = normalizeText(item.category || "Thực phẩm")
        const market = normalizeText(item.supermarketName || "")
        const brand = normalizeText(item.brand || "")
        const subtitle = normalizeText(item.subtitle || "")

        return (
          name.includes(normalizedKeyword) ||
          category.includes(normalizedKeyword) ||
          market.includes(normalizedKeyword) ||
          brand.includes(normalizedKeyword) ||
          subtitle.includes(normalizedKeyword)
        )
      })
    }

    return result
  }, [filteredProducts, queryKeyword, queryCategory, queryLotId])

  const displayedProducts = useMemo(() => {
    return isSearchMode ? searchedProducts : filteredProducts
  }, [filteredProducts, searchedProducts, isSearchMode])

  const displayedVisibleCategories = useMemo(() => {
    const countMap = displayedProducts.reduce<Record<string, number>>((acc, item) => {
      const label = item.category || "Thực phẩm"
      acc[label] = (acc[label] ?? 0) + 1
      return acc
    }, {})

    const displayedCategories: HomeCategoryItem[] = visibleCategories.displayedCategories.map(
      (item) => ({
        ...item,
        count: countMap[item.label] ?? 0,
      })
    )

    const nonEmptyCategories = displayedCategories.filter((item) => item.count > 0)
    const emptyCategories = displayedCategories.filter((item) => item.count <= 0)

      return {
      ...visibleCategories,
      displayedCategories,
      nonEmptyCategories,
      emptyCategories,
    }
  }, [displayedProducts, visibleCategories])

  const appliedCriteria = useMemo(() => {
    const items: Array<{ key: string; label: string; value: string }> = []

    if (queryKeyword) {
      items.push({
        key: "keyword",
        label: "Từ khóa",
        value: queryKeyword,
      })
    }

    if (queryCategory) {
      items.push({
        key: "category",
        label: "Danh mục",
        value: queryCategory,
      })
    }

    if (queryLotId && selectedLotProduct) {
      items.push({
        key: "lot",
        label: "Sản phẩm",
        value: selectedLotProduct.name,
      })
    } else if (queryLotId) {
      items.push({
        key: "lot",
        label: "Mã lô",
        value: queryLotId,
      })
    }

    return items
  }, [queryKeyword, queryCategory, queryLotId, selectedLotProduct])

  useEffect(() => {
    const categoryCountMap = filteredProducts.reduce<Record<string, number>>((acc, item) => {
      const label = item.category || "Thực phẩm"
      acc[label] = (acc[label] ?? 0) + 1
      return acc
    }, {})

    const payload = {
      products: filteredProducts.map((item) => ({
        type: "product" as const,
        lotId: item.lotId,
        productId: item.productId,
        name: item.name,
        category: item.category || "Thực phẩm",
        supermarketId: item.supermarketId,
        supermarketName: item.supermarketName,
        imageUrl: item.imageUrl,
        price: item.price,
      })),
      categories: visibleCategories.displayedCategories.map((item) => ({
        type: "category" as const,
        key: item.value,
        label: item.label,
        count: categoryCountMap[item.label] ?? item.count ?? 0,
      })),
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem("customer_visible_search_index_v1", JSON.stringify(payload))
    window.dispatchEvent(new Event("customer:search-index-updated"))
  }, [filteredProducts, visibleCategories.displayedCategories])

  useEffect(() => {
    if (!orderContextStorage.isReady(deliveryCtx)) {
      setGateOpen(true)
    }
  }, [deliveryCtx])

  useEffect(() => {
    if (!queryCategory) {
      setActiveCategory(ALL_CATEGORY_KEY)
      return
    }

    const matchedCategory = visibleCategories.displayedCategories.find(
      (item) => normalizeText(item.label) === normalizeText(queryCategory)
    )

    if (matchedCategory) {
      setActiveCategory(matchedCategory.value)
      return
    }

    setActiveCategory(ALL_CATEGORY_KEY)
  }, [queryCategory, visibleCategories.displayedCategories])

  useEffect(() => {
    const shouldScroll = isSearchMode

    if (!shouldScroll) return

    const timer = window.setTimeout(() => {
      productSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [isSearchMode, queryKeyword, queryCategory, queryLotId])

  useEffect(() => {
    const handleScrollProducts = () => {
      productSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

    window.addEventListener("home:scroll-products", handleScrollProducts as EventListener)

    return () => {
      window.removeEventListener("home:scroll-products", handleScrollProducts as EventListener)
    }
  }, [])

  const handleDoneGate = (value: CustomerOrderContext) => {
    orderContextStorage.set(value)
    setDeliveryCtx(value)
    setGateOpen(false)
    setActiveCategory(ALL_CATEGORY_KEY)
    setActiveSupermarketId(ALL_MARKET_KEY)
  }

  const handleReset = () => {
    orderContextStorage.clear()
    setDeliveryCtx({})
    setActiveCategory(ALL_CATEGORY_KEY)
    setActiveSupermarketId(ALL_MARKET_KEY)
    setGateOpen(true)
  }

  const handleViewCart = () => {
    if (!isUserLoggedIn()) {
      navigate(LOGIN_ROUTE, {
        state: { redirectTo: CART_ROUTE },
      })
      return
    }

    navigate(CART_ROUTE)
  }

  const updateSearchParams = (mutate: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(location.search)
    mutate(next)
    const query = next.toString()
    navigate(query ? `/?${query}` : "/")
  }

  const clearSearchQuery = () => {
    updateSearchParams((next) => {
      next.delete("q")
      next.delete("category")
      next.delete("lotId")
      next.delete("view")
    })
  }

  const removeSingleCriteria = (key: "keyword" | "category" | "lot") => {
    updateSearchParams((next) => {
      if (key === "keyword") next.delete("q")
      if (key === "category") next.delete("category")
      if (key === "lot") next.delete("lotId")

      const stillHasSearch =
        !!next.get("q") || !!next.get("category") || !!next.get("lotId")

      if (!stillHasSearch) {
        next.delete("view")
      } else {
        next.set("view", "shop")
      }
    })
  }

  const handleChangeSupermarket = (supermarketId: string) => {
    setActiveSupermarketId(supermarketId)
    setActiveCategory(ALL_CATEGORY_KEY)

    if (!isSearchMode) return

    updateSearchParams((next) => {
      next.delete("lotId")
      next.delete("category")

      const hasKeyword = !!next.get("q")
      if (hasKeyword) {
        next.set("view", "shop")
      } else {
        next.delete("view")
      }
    })
  }

  const handleChangeCategory = (categoryValue: string) => {
    setActiveCategory(categoryValue)

    const matchedCategory = visibleCategories.displayedCategories.find(
      (item) => item.value === categoryValue
    )

    if (categoryValue === ALL_CATEGORY_KEY || !matchedCategory) {
      updateSearchParams((next) => {
        next.delete("category")
        next.delete("lotId")

        const hasKeyword = !!next.get("q")
        if (hasKeyword) {
          next.set("view", "shop")
      } else {
          next.delete("view")
        }
      })
      return
    }

    updateSearchParams((next) => {
      next.set("view", "shop")
      next.set("category", matchedCategory.label)
      next.delete("lotId")
    })
  }

  const resultSummaryText = useMemo(() => {
    if (queryLotId && selectedLotProduct) {
      return `Đang ưu tiên hiển thị đúng món "${selectedLotProduct.name}".`
    }

    if (queryLotId) {
      return "Đang ưu tiên hiển thị theo sản phẩm đã chọn."
    }

    if (queryKeyword && queryCategory) {
      return `Đang tìm theo từ khóa "${queryKeyword}" trong danh mục "${queryCategory}".`
    }

    if (queryKeyword) {
      return `Đang tìm theo từ khóa "${queryKeyword}".`
    }

    if (queryCategory) {
      return `Đang lọc theo danh mục "${queryCategory}".`
    }

    return "Đang xem khu vực cửa hàng theo lựa chọn hiện tại."
  }, [queryKeyword, queryCategory, queryLotId, selectedLotProduct])

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(180deg,#f8fafc_0%,#f7fbfa_45%,#ffffff_100%)]">
      <DeliveryGateModal
        open={gateOpen}
        initialValue={deliveryCtx}
        onDone={handleDoneGate}
        onClose={() => setGateOpen(false)}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-4">
          <HomeLocationSection
            deliveryCtx={deliveryCtx}
            currentLocationText={currentLocationText}
            onOpenGate={() => setGateOpen(true)}
            onReset={handleReset}
          />

          <HomeStatsSection stats={stats} />

          {isSearchMode && (
            <section className="rounded-[28px] border border-emerald-100 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-xl">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Kết quả đang hiển thị
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {resultSummaryText} Hiện có {displayedProducts.length} kết quả phù hợp.
                </p>
              </div>

                <button
                  type="button"
                    onClick={clearSearchQuery}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                    Xóa bộ lọc tìm kiếm
                </button>
              </div>

                {appliedCriteria.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {appliedCriteria.map((item) => (
                      <div
                        key={item.key}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5"
                      >
                        <span className="text-xs font-medium text-emerald-700">
                          {item.label}: <span className="font-semibold">{item.value}</span>
              </span>

                      <button
                        type="button"
                          onClick={() =>
                            removeSingleCriteria(
                              item.key as "keyword" | "category" | "lot"
                            )
                          }
                          className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
                        >
                          ×
                      </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          )}

          <section ref={productSectionRef} className="flex flex-col gap-4 xl:flex-row">
            <HomeSidebar
              filteredCount={displayedProducts.length}
              activeSupermarketId={activeSupermarketId}
              activeCategory={activeCategory}
              supermarketSortBy={supermarketSortBy}
              supermarketOptions={supermarketOptions}
              visibleCategories={displayedVisibleCategories}
              allMarketKey={ALL_MARKET_KEY}
              allCategoryKey={ALL_CATEGORY_KEY}
              showEmptyCategories={showEmptyCategories}
              onChangeSupermarket={handleChangeSupermarket}
              onChangeCategory={handleChangeCategory}
              onChangeSupermarketSort={setSupermarketSortBy}
              onToggleEmptyCategories={() => setShowEmptyCategories((prev) => !prev)}
            />

            <HomeProductSection
              loading={loading}
              error={error}
              noMatchedSupermarket={noMatchedSupermarket}
              filteredProducts={displayedProducts}
              allCategoryKey={ALL_CATEGORY_KEY}
              getCartQty={getCartQty}
              onAddToCart={addToCart}
              onIncreaseCart={increaseCart}
              onDecreaseCart={decreaseCart}
              onOpenGate={() => setGateOpen(true)}
              onResetCategory={setActiveCategory}
            />
          </section>

          <HomeMobileCartBar cartCount={cartCount} onViewCart={handleViewCart} />
        </div>
      </main>
    </div>
  )
}

export default Home
