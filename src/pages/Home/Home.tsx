import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import DeliveryGateModal from "../Home/DeliveryGateModal"
import { getAuthSession } from "@/utils/authStorage"
import { orderContextStorage } from "@/utils/orderStorage"
import type { CustomerOrderContext } from "@/types/order.type"

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

const Home = () => {
  const navigate = useNavigate()

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

  useEffect(() => {
    if (!orderContextStorage.isReady(deliveryCtx)) {
      setGateOpen(true)
    }
  }, [deliveryCtx])

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

          <section className="flex flex-col gap-4 xl:flex-row">
            <HomeSidebar
              filteredCount={filteredProducts.length}
              activeSupermarketId={activeSupermarketId}
              activeCategory={activeCategory}
              supermarketSortBy={supermarketSortBy}
              supermarketOptions={supermarketOptions}
              visibleCategories={visibleCategories}
              allMarketKey={ALL_MARKET_KEY}
              allCategoryKey={ALL_CATEGORY_KEY}
              showEmptyCategories={showEmptyCategories}
              onChangeSupermarket={(supermarketId) => {
                setActiveSupermarketId(supermarketId)
                setActiveCategory(ALL_CATEGORY_KEY)
              }}
              onChangeCategory={setActiveCategory}
              onChangeSupermarketSort={setSupermarketSortBy}
              onToggleEmptyCategories={() => setShowEmptyCategories((prev) => !prev)}
            />

            <HomeProductSection
              loading={loading}
              error={error}
              noMatchedSupermarket={noMatchedSupermarket}
              filteredProducts={filteredProducts}
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
