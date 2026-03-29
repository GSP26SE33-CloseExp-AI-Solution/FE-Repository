import { BrowserRouter, Routes, Route } from "react-router-dom"

import MainLayout from "@/components/layouts/MainLayout"
import PublicLayout from "@/components/layouts/PublicLayout"
import PrivateRoute from "@/routes/PrivateRoute"
import RoleRoute from "@/routes/RoleRoute"
import RoleRedirect from "@/routes/RoleRedirect"

import Login from "@/pages/Auth/Login"
import Register from "@/pages/Auth/Register/Register"
import SelectStaffContext from "@/pages/Auth/SelectStaffContext"

import Home from "@/pages/Home/Home"

import CartPage from "@/pages/Vendor/VendorOrders/CartPage"
import CheckoutPage from "@/pages/Vendor/VendorPayments/CheckoutPage"
import PaymentReturnPage from "@/pages/Vendor/VendorPayments"
import VendorSupermarketApplicationPage from "@/pages/Vendor/VendorSupermarketApplicationPage"
import VendorSupermarketGate from "@/routes/VendorSupermarketGate"

import SDashboard from "@/pages/Supplier/SDashboard"
import ProductList from "@/pages/Supplier/SProducts/ProductList/ProductsList"
import AddProduct from "@/pages/Supplier/SProducts/AddProduct/AddProduct"
import ConfirmProduct from "@/pages/Supplier/SProducts/ConfirmProduct/ConfirmProduct"
import PricingProduct from "@/pages/Supplier/SProducts/PricingProduct/PricingProduct"
import PublishProduct from "@/pages/Supplier/SProducts/PublishProduct/PublishPage"
import ProfilePage from "@/pages/Supplier/SProfile/ProfilePage"
import ProductsLotsPage from "@/pages/Supplier/SProducts/ProductList/ProductsLotsPage"

import AdminDashboard from "@/pages/Admin/AdminDashboard"
import AdminUsers from "@/pages/Admin/AdminUsers"

import NotFound from "@/pages/Common/NotFound"
import Forbidden from "@/pages/Common/Forbidden"

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* ===== PUBLIC ===== */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/redirect" element={<RoleRedirect />} />
                <Route path="/forbidden" element={<Forbidden />} />

                {/* ===== PRIVATE ===== */}
                <Route element={<PrivateRoute />}>
                    <Route path="/select-staff-context" element={<SelectStaffContext />} />

                    {/* ===== ADMIN ===== */}
                    <Route element={<RoleRoute allow={["Admin"]} />}>
                        <Route element={<MainLayout />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<AdminUsers />} />
                            {/* <Route path="/admin/approvals" element={<AdminApprovals />} /> */}
                            {/* <Route path="/admin/internal-staff" element={<AdminInternalStaff />} /> */}
                            {/* <Route path="/admin/roles" element={<AdminRoles />} /> */}
                            {/* <Route path="/admin/transactions" element={<AdminTransactions />} /> */}
                            {/* <Route path="/admin/delivery" element={<AdminDelivery />} /> */}
                            {/* <Route path="/admin/operations" element={<AdminOperations />} /> */}
                            {/* <Route path="/admin/moderation" element={<AdminModeration />} /> */}
                            {/* <Route path="/admin/feedbacks" element={<AdminFeedbacks />} /> */}
                            {/* <Route path="/admin/reports" element={<AdminReports />} /> */}
                            {/* <Route path="/admin/settings" element={<AdminSettings />} /> */}
                        </Route>
                    </Route>

                    {/* ===== SUPPLIER STAFF ===== */}
                    <Route element={<RoleRoute allow={["SupplierStaff", "SupermarketStaff"]} />}>
                        <Route element={<MainLayout />}>
                            <Route path="/supplier/dashboard" element={<SDashboard />} />
                            <Route path="/supplier/products" element={<ProductList />} />
                            <Route path="/supplier/products/add" element={<AddProduct />} />
                            <Route path="/supplier/products/confirm" element={<ConfirmProduct />} />
                            <Route
                                path="/supplier/products/:productId/confirm"
                                element={<ConfirmProduct />}
                            />
                            <Route
                                path="/supplier/products/:productId/pricing"
                                element={<PricingProduct />}
                            />
                            <Route
                                path="/supplier/products/:productId/publish"
                                element={<PublishProduct />}
                            />
                            <Route path="/supplier/profile" element={<ProfilePage />} />
                            <Route path="/supplier/setting" element={<ProductsLotsPage />} />
                            {/* <Route path="/supplier/notification" element={<SupplierNotification />} /> */}
                            {/* <Route path="/supplier/statistic" element={<SupplierStatistic />} /> */}
                        </Route>
                    </Route>

                    {/* ===== PACKAGE STAFF ===== */}
                    <Route element={<RoleRoute allow={["PackageStaff"]} />}>
                        <Route element={<MainLayout />}>
                            {/* <Route path="/package/dashboard" element={<PackageDashboard />} /> */}
                            {/* <Route path="/package/orders" element={<PackageOrders />} /> */}
                            {/* <Route path="/package/checking" element={<PackageChecking />} /> */}
                            {/* <Route path="/package/handover" element={<PackageHandover />} /> */}
                            {/* <Route path="/package/notification" element={<PackageNotification />} /> */}
                            {/* <Route path="/package/profile" element={<PackageProfile />} /> */}
                            {/* <Route path="/package/setting" element={<PackageSetting />} /> */}
                        </Route>
                    </Route>

                    {/* ===== MARKETING STAFF ===== */}
                    <Route element={<RoleRoute allow={["MarketingStaff"]} />}>
                        <Route element={<MainLayout />}>
                            {/* <Route path="/marketing/dashboard" element={<MarketingDashboard />} /> */}
                            {/* <Route path="/marketing/campaigns" element={<MarketingCampaigns />} /> */}
                            {/* <Route path="/marketing/promotions" element={<MarketingPromotions />} /> */}
                            {/* <Route path="/marketing/statistic" element={<MarketingStatistic />} /> */}
                            {/* <Route path="/marketing/feedbacks" element={<MarketingFeedbacks />} /> */}
                            {/* <Route path="/marketing/notification" element={<MarketingNotification />} /> */}
                            {/* <Route path="/marketing/profile" element={<MarketingProfile />} /> */}
                            {/* <Route path="/marketing/setting" element={<MarketingSetting />} /> */}
                        </Route>
                    </Route>

                    {/* ===== VENDOR / CUSTOMER FLOW ===== */}
                    <Route element={<RoleRoute allow={["Vendor"]} />}>
                        <Route element={<VendorSupermarketGate />}>
                            <Route element={<PublicLayout />}>
                                <Route
                                    path="/vendor/supermarket-application"
                                    element={<VendorSupermarketApplicationPage />}
                                />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/checkout" element={<CheckoutPage />} />
                                <Route
                                    path="/payment-return"
                                    element={<PaymentReturnPage />}
                                />
                                <Route path="/vendor" element={<Home />} />
                            </Route>
                        </Route>
                    </Route>
                </Route>

                {/* ===== NOT FOUND ===== */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRouter
