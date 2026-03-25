import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import MainLayout from "@/components/layouts/MainLayout"
import PublicLayout from "@/components/layouts/PublicLayout"
import PrivateRoute from "@/routes/PrivateRoute"
import RoleRoute from "@/routes/RoleRoute"
import RoleRedirect from "@/routes/RoleRedirect"

import Login from "@/pages/Auth/Login"
import Register from "@/pages/Auth/Register/Register"

import Home from "@/pages/Home/Home"

import CartPage from "@/pages/Vendor/VendorOrders/CartPage"
import CheckoutPage from "@/pages/Vendor/VendorPayments/CheckoutPage"
import PaymentReturnPage from "@/pages/Vendor/VendorPayments"

import SDashboard from "@/pages/SupermarketStaff/SDashboard"
import ProductList from "@/pages/SupermarketStaff/SProducts/ProductList/ProductsList"
import AddProduct from "@/pages/SupermarketStaff/SProducts/AddProduct/AddProduct"
import ConfirmProduct from "@/pages/SupermarketStaff/SProducts/ConfirmProduct/ConfirmProduct"
import PricingProduct from "@/pages/SupermarketStaff/SProducts/PricingProduct/PricingProduct"
import PublishProduct from "@/pages/SupermarketStaff/SProducts/PublishProduct/PublishPage"
import ProfilePage from "@/pages/SupermarketStaff/SProfile/ProfilePage"
import ProductsLotsPage from "@/pages/SupermarketStaff/SProducts/ProductList/ProductsLotsPage"

import AdminDashboard from "@/pages/Admin/AdminDashboard"
import AdminUsers from "@/pages/Admin/AdminUsers"
import AdminTransactions from "@/pages/Admin/AdminTransactions"
import AdminReports from "@/pages/Admin/AdminReports"
import AdminFeedbacks from "@/pages/Admin/AdminFeedbacks"
import AdminSettings from "@/pages/Admin/AdminSettings"
import AdminApprovals from "@/pages/Admin/AdminApprovals"
import AdminInternalStaff from "@/pages/Admin/AdminInternalStaff"
import AdminRoles from "@/pages/Admin/AdminRoles"
import AdminDelivery from "@/pages/Admin/AdminDelivery"
import AdminOperations from "@/pages/Admin/AdminOperations"
import AdminSupermarkets from "@/pages/Admin/AdminSupermarkets"
import AdminProfile from "@/pages/Admin/AdminProfile"

import PackageOrders from "@/pages/PackagingStaff/PackageOrders"
import PackageCollect from "@/pages/PackagingStaff/PackageCollect"
import PackagePacking from "@/pages/PackagingStaff/PackagePacking"
import PackageReports from "@/pages/PackagingStaff/PackageReports"

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
                    {/* ===== ADMIN ===== */}
                    <Route element={<RoleRoute allow={["Admin"]} />}>
                        <Route element={<MainLayout />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route
                                path="/admin/dashboard"
                                element={<Navigate to="/admin" replace />}
                            />
                            <Route path="/admin/users" element={<AdminUsers />} />
                            <Route path="/admin/approvals" element={<AdminApprovals />} />
                            <Route
                                path="/admin/internal-staff"
                                element={<AdminInternalStaff />}
                            />
                            <Route path="/admin/roles" element={<AdminRoles />} />
                            <Route path="/admin/transactions" element={<AdminTransactions />} />
                            <Route path="/admin/delivery" element={<AdminDelivery />} />
                            <Route path="/admin/operations" element={<AdminOperations />} />
                            <Route path="/admin/feedbacks" element={<AdminFeedbacks />} />
                            <Route path="/admin/reports" element={<AdminReports />} />
                            <Route path="/admin/supermarkets" element={<AdminSupermarkets />} />
                            <Route path="/admin/settings" element={<AdminSettings />} />
                            <Route path="/admin/profile" element={<AdminProfile />} />
                        </Route>
                    </Route>

                    {/* ===== SUPERMARKET STAFF ===== */}
                    <Route element={<RoleRoute allow={["SupermarketStaff"]} />}>
                        <Route element={<MainLayout />}>
                            <Route path="/supermarketStaff/dashboard" element={<SDashboard />} />
                            <Route path="/supermarketStaff/products" element={<ProductList />} />
                            <Route path="/supermarketStaff/products/add" element={<AddProduct />} />
                            <Route path="/supermarketStaff/products/confirm" element={<ConfirmProduct />} />
                            <Route
                                path="/supermarketStaff/products/:productId/confirm"
                                element={<ConfirmProduct />}
                            />
                            <Route
                                path="/supermarketStaff/products/:productId/pricing"
                                element={<PricingProduct />}
                            />
                            <Route
                                path="/supermarketStaff/products/:productId/publish"
                                element={<PublishProduct />}
                            />
                            <Route path="/supermarketStaff/profile" element={<ProfilePage />} />
                            <Route path="/supermarketStaff/setting" element={<ProductsLotsPage />} />
                        </Route>
                    </Route>

                    {/* ===== PACKAGE STAFF ===== */}
                    <Route element={<RoleRoute allow={["PackagingStaff"]} />}>
                        <Route element={<MainLayout />}>
                            <Route path="/package/orders" element={<PackageOrders />} />
                            <Route path="/package/collect" element={<PackageCollect />} />
                            <Route path="/package/packing" element={<PackagePacking />} />
                            <Route path="/package/reports" element={<PackageReports />} />
                        </Route>
                    </Route>

                    {/* ===== MARKETING STAFF ===== */}
                    <Route element={<RoleRoute allow={["MarketingStaff"]} />}>
                        <Route element={<MainLayout />}>
                            {/* thêm sau */}
                        </Route>
                    </Route>

                    {/* ===== VENDOR / CUSTOMER FLOW ===== */}
                    <Route element={<RoleRoute allow={["Vendor"]} />}>
                        <Route element={<PublicLayout />}>
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/payment-return" element={<PaymentReturnPage />} />
                            <Route path="/vendor" element={<Home />} />
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
