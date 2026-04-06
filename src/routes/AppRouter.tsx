import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "@/components/layouts/MainLayout";
import PublicLayout from "@/components/layouts/PublicLayout";
import PrivateRoute from "@/routes/PrivateRoute";
import RoleRoute from "@/routes/RoleRoute";
import RoleRedirect from "@/routes/RoleRedirect";

import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import PartnerRegister from "@/pages/Auth/PartnerRegister";

import Home from "@/pages/Home/Home";

import CartPage from "@/pages/Vendor/CartPage";
import CheckoutPage from "@/pages/Vendor/CheckoutPage";
import PaymentReturnPage from "@/pages/Vendor/PaymentReturnPage";
import VendorProfile from "@/pages/Vendor/vProfile";
import MyOrdersPage from "@/pages/Vendor/MyOrdersPage";
import MyOrderDetailPage from "@/pages/Vendor/MyOrderDetailPage";

import SupermarketDashboard from "@/pages/SupermarketStaff/sDashboard";
import ProductsLotsPage from "@/pages/SupermarketStaff/sProducts/ProductsLotsPage";
import AddProduct from "@/pages/SupermarketStaff/sProducts/step1_AddProduct";
import ConfirmProduct from "@/pages/SupermarketStaff/sProducts/step2_ConfirmProduct";
import PricingProduct from "@/pages/SupermarketStaff/sProducts/step3_PricingPage";
import PublishProduct from "@/pages/SupermarketStaff/sProducts/step4_PublishPage";
import ProfilePage from "@/pages/SupermarketStaff/sProfile";

import AdminDashboard from "@/pages/Admin/AdminDashboard";
import AdminUsers from "@/pages/Admin/AdminUsers";
import AdminTransactions from "@/pages/Admin/AdminTransactions";
import AdminReports from "@/pages/Admin/AdminReports";
import AdminFeedbacks from "@/pages/Admin/AdminFeedbacks";
import AdminSettings from "@/pages/Admin/AdminSettings";
import AdminApprovals from "@/pages/Admin/AdminApprovals";
import AdminInternalStaff from "@/pages/Admin/AdminInternalStaff";
import AdminDelivery from "@/pages/Admin/AdminDelivery";
import AdminOperations from "@/pages/Admin/AdminOperations";
import AdminSupermarkets from "@/pages/Admin/AdminSupermarkets";
import AdminProfile from "@/pages/Admin/AdminProfile";

import PackageOrders from "@/pages/PackagingStaff/pOrders";
import PackageCollect from "@/pages/PackagingStaff/pCollect";
import PackagePacking from "@/pages/PackagingStaff/pPacking";
import PackageReports from "@/pages/PackagingStaff/pReports";
import PackageProfile from "@/pages/PackagingStaff/pProfile";

import MarketingProfile from "@/pages/MarketingStaff/mProfile";
import MarketingPromotions from "@/pages/MarketingStaff/mPromotions";
import MarketingReports from "@/pages/MarketingStaff/mReports";

import NotFound from "@/pages/Common/NotFound";
import Forbidden from "@/pages/Common/Forbidden";

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
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
                                path="/admin/approvals"
                                element={<AdminApprovals />}
                            />
                            <Route
                                path="/admin/internal-staff"
                                element={<AdminInternalStaff />}
                            />
                            <Route
                                path="/admin/transactions"
                                element={<AdminTransactions />}
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
                                path="/admin/profile"
                                element={<AdminProfile />}
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
                                path="/supermarketStaff/products/add"
                                element={<AddProduct />}
                            />
                            <Route
                                path="/supermarketStaff/products/confirm"
                                element={<ConfirmProduct />}
                            />
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
                            <Route
                                path="/supermarketStaff/profile"
                                element={<ProfilePage />}
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
                                    <Navigate to="/marketing/profile" replace />
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
    );
};

export default AppRouter;
