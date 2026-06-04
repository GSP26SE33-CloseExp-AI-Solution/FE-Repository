import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import MainLayout from "@/components/layouts/MainLayout"
import PublicLayout from "@/components/layouts/PublicLayout"
import PrivateRoute from "@/routes/PrivateRoute"
import RoleRoute from "@/routes/RoleRoute"
import RoleRedirect from "@/routes/RoleRedirect"

import Login from "@/pages/Auth/Login"
import Register from "@/pages/Auth/Register"
import ForgotPassword from "@/pages/Auth/ForgotPassword"
import VerifyOtp from "@/pages/Auth/VerifyOtp"
import PartnerRegister from "@/pages/Auth/PartnerRegister"

import Home from "@/pages/Home/Home"
import AboutPage from "@/pages/Home/AboutPage"
import BuyerPolicyPage from "@/pages/Home/BuyerPolicyPage"
import ProductDetailPage from "@/pages/Home/ProductDetailPage"

import CartPage from "@/pages/Vendor/CartPage"
import CheckoutPage from "@/pages/Vendor/CheckoutPage"
import PaymentReturnPage from "@/pages/Vendor/PaymentReturnPage"
import VendorProfile from "@/pages/Vendor/vProfile"
import MyOrdersPage from "@/pages/Vendor/MyOrdersPage"
import MyOrderDetailPage from "@/pages/Vendor/MyOrderDetailPage"
import NotificationsPage from "@/pages/Vendor/NotificationsPage"

import SupermarketDashboard from "@/pages/SupermarketStaff/sDashboard"
import ProductsLotsPage from "@/pages/SupermarketStaff/sLotsPageTable"
import ProductWorkflowPage from "@/pages/SupermarketStaff/sWorkflowPage"
import SupermarketPurchaseUnitsPage from "@/pages/SupermarketStaff/sPurchaseUnitsPage"
import SupermarketNotification from "@/pages/SupermarketStaff/sNotification"
import ProfilePage from "@/pages/SupermarketStaff/sProfile"

import AdminDashboard from "@/pages/Admin/AdminDashboard"
import AdminUsers from "@/pages/Admin/AdminUsers"
import AdminReports from "@/pages/Admin/AdminReports"
import AdminFeedbacks from "@/pages/Admin/AdminFeedbacks"
import AdminSettings from "@/pages/Admin/AdminSettings"
import AdminInternalStaff from "@/pages/Admin/AdminInternalStaff"
import AdminDelivery from "@/pages/Admin/AdminDelivery"
import AdminOperations from "@/pages/Admin/AdminOperations"
import AdminSupermarkets from "@/pages/Admin/AdminSupermarkets"
import AdminProfile from "@/pages/Admin/AdminProfile"
import AdminRefunds from "@/pages/Admin/AdminRefunds"
import AdminNotification from "@/pages/Admin/AdminNotification"
import AdminPromotionAnalytics from "@/pages/Admin/AdminPromotionAnalytics"
import AITokenDashboard from "@/pages/Admin/AITokenDashboard"

import PackageOrders from "@/pages/PackagingStaff/pOrders"
import PackageCollect from "@/pages/PackagingStaff/pCollect"
import PackagePacking from "@/pages/PackagingStaff/pPacking"
import PackageReports from "@/pages/PackagingStaff/pReports"
import PackageNotification from "@/pages/PackagingStaff/pNotification"
import PackageProfile from "@/pages/PackagingStaff/pProfile"

import MarketingProfile from "@/pages/MarketingStaff/mProfile"
import MarketingPromotions from "@/pages/MarketingStaff/mPromotions"
import MarketingReports from "@/pages/MarketingStaff/mReports"
import MarketingCategoryProducts from "@/pages/MarketingStaff/mCategoryProducts"
import MarketingNotification from "@/pages/MarketingStaff/mNotification"

import NotFound from "@/pages/Common/NotFound"
import Forbidden from "@/pages/Common/Forbidden"

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/buyer-policy" element={<BuyerPolicyPage />} />
                    <Route path="/products/:productId" element={<ProductDetailPage />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/redirect" element={<RoleRedirect />} />
                <Route path="/forbidden" element={<Forbidden />} />

                <Route element={<PrivateRoute />}>
                    <Route element={<RoleRoute allow={["Admin"]} />}>
                        <Route element={<MainLayout />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route
                                path="/admin/dashboard"
                                element={<Navigate to="/admin" replace />}
                            />
                            <Route
                                path="/admin/users"
                                element={<AdminUsers />}
                            />
                            <Route
                                path="/admin/internal-staff"
                                element={<AdminInternalStaff />}
                            />
                            <Route
                                path="/admin/delivery"
                                element={<AdminDelivery />}
                            />
                            <Route
                                path="/admin/operations"
                                element={<AdminOperations />}
                            />
                            <Route
                                path="/admin/feedbacks"
                                element={<AdminFeedbacks />}
                            />
                            <Route
                                path="/admin/reports"
                                element={<AdminReports />}
                            />
                            <Route
                                path="/admin/supermarkets"
                                element={<AdminSupermarkets />}
                            />
                            <Route
                                path="/admin/settings"
                                element={<AdminSettings />}
                            />
                            <Route
                                path="/admin/notification"
                                element={<AdminNotification />}
                            />
                            <Route
                                path="/admin/promotion-analytics"
                                element={<AdminPromotionAnalytics />}
                            />
                            <Route
                                path="/admin/profile"
                                element={<AdminProfile />}
                            />
                            <Route
                                path="/admin/refunds"
                                element={<AdminRefunds />}
                            />
                        </Route>
                    </Route>

                    <Route element={<RoleRoute allow={["SupermarketStaff"]} />}>
                        <Route element={<MainLayout />}>
                            <Route
                                path="/supermarketStaff"
                                element={
                                    <Navigate
                                        to="/supermarketStaff/dashboard"
                                        replace
                                    />
                                }
                            />
                            <Route
                                path="/supermarketStaff/dashboard"
                                element={<SupermarketDashboard />}
                            />
                            <Route
                                path="/supermarketStaff/products"
                                element={<ProductsLotsPage />}
                            />
                            <Route
                                path="/supermarketStaff/products/workflow"
                                element={<ProductWorkflowPage />}
                            />
                            <Route
                                path="/supermarketStaff/purchase-units"
                                element={<SupermarketPurchaseUnitsPage />}
                            />
                            <Route
                                path="/supermarketStaff/notification"
                                element={<SupermarketNotification />}
                            />
                            <Route
                                path="/supermarketStaff/profile"
                                element={<ProfilePage />}
                            />
                            <Route
                                path="/supermarketStaff/ai-tokens"
                                element={<AITokenDashboard />}
                            />
                        </Route>
                    </Route>

                    <Route element={<RoleRoute allow={["PackagingStaff"]} />}>
                        <Route element={<MainLayout />}>
                            <Route
                                path="/package"
                                element={
                                    <Navigate to="/package/orders" replace />
                                }
                            />
                            <Route
                                path="/package/orders"
                                element={<PackageOrders />}
                            />
                            <Route
                                path="/package/collect"
                                element={<PackageCollect />}
                            />
                            <Route
                                path="/package/packing"
                                element={<PackagePacking />}
                            />
                            <Route
                                path="/package/reports"
                                element={<PackageReports />}
                            />
                            <Route
                                path="/package/notification"
                                element={<PackageNotification />}
                            />
                            <Route
                                path="/package/profile"
                                element={<PackageProfile />}
                            />
                        </Route>
                    </Route>

                    <Route element={<RoleRoute allow={["MarketingStaff"]} />}>
                        <Route element={<MainLayout />}>
                            <Route
                                path="/marketing"
                                element={
                                    <Navigate to="/marketing/promotions" replace />
                                }
                            />
                            <Route
                                path="/marketing/profile"
                                element={<MarketingProfile />}
                            />
                            <Route
                                path="/marketing/promotions"
                                element={<MarketingPromotions />}
                            />
                            <Route
                                path="/marketing/reports"
                                element={<MarketingReports />}
                            />
                            <Route
                                path="/marketing/category-products"
                                element={<MarketingCategoryProducts />}
                            />
                            <Route
                                path="/marketing/purchase-units"
                                element={
                                    <Navigate
                                        to="/marketing/category-products"
                                        replace
                                    />
                                }
                            />
                            <Route
                                path="/marketing/notification"
                                element={<MarketingNotification />}
                            />
                        </Route>
                    </Route>

                    <Route element={<RoleRoute allow={["Vendor"]} />}>
                        <Route element={<PublicLayout />}>
                            <Route path="/cart" element={<CartPage />} />
                            <Route
                                path="/checkout"
                                element={<CheckoutPage />}
                            />
                            <Route
                                path="/payment-return"
                                element={<PaymentReturnPage />}
                            />
                            <Route path="/orders" element={<MyOrdersPage />} />
                            <Route
                                path="/orders/:orderId"
                                element={<MyOrderDetailPage />}
                            />
                            <Route
                                path="/notifications"
                                element={<NotificationsPage />}
                            />
                            <Route path="/vendor" element={<Home />} />
                            <Route
                                path="/vendor/profile"
                                element={<VendorProfile />}
                            />
                            <Route
                                path="/partner/register"
                                element={<PartnerRegister />}
                            />
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRouter
