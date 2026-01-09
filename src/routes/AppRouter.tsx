import { BrowserRouter, Routes, Route } from 'react-router-dom';

/* ===== ROUTE GUARDS ===== */
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';

/* ===== LAYOUT ===== */
import MainLayout from '@/layouts/MainLayout';

/* ===== AUTH ===== */
import Login from '@/pages/Auth/Login';

/* ===== GUEST ===== */
import GuestHome from '@/pages/Guest/GuestHome';
import GuestProducts from '@/pages/Guest/GuestProducts';
import GuestPromotions from '@/pages/Guest/GuestPromotions';
import GuestAbout from '@/pages/Guest/GuestAbout';

/* ===== VENDOR ===== */
import VendorHome from '@/pages/Vendor/VendorHome';
import VendorOrders from '@/pages/Vendor/VendorOrders';
import VendorPayments from '@/pages/Vendor/VendorPayments';
import VendorProfile from '@/pages/Vendor/VendorProfile';
import VendorFeedback from '@/pages/Vendor/VendorFeedback';

/* ===== ADMIN ===== */
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import AdminUsers from '@/pages/Admin/AdminUsers';
import AdminTransactions from '@/pages/Admin/AdminTransactions';
import AdminFeedbacks from '@/pages/Admin/AdminFeedbacks';
import AdminReports from '@/pages/Admin/AdminReports';
import AdminSettings from '@/pages/Admin/AdminSettings';

/* ===== SUPERMARKET STAFF ===== */
import SupermarketProducts from '@/pages/Supermarket/SupermarketProducts';
import SupermarketProductCreate from '@/pages/Supermarket/SupermarketProductCreate';
import SupermarketPricing from '@/pages/Supermarket/SupermarketPricing';
import SupermarketReports from '@/pages/Supermarket/SupermarketReports';

/* ===== PACKAGE STAFF ===== */
import PackageOrders from '@/pages/Package/PackageOrders';
import PackageCollect from '@/pages/Package/PackageCollect';
import PackagePacking from '@/pages/Package/PackagePacking';
import PackageReports from '@/pages/Package/PackageReports';

/* ===== MARKETING STAFF ===== */
import MarketingPromotions from '@/pages/Marketing/MarketingPromotions';
import MarketingReports from '@/pages/Marketing/MarketingReports';

/* ===== COMMON ===== */
import NotFound from '@/pages/Common/NotFound';
import Forbidden from '@/pages/Common/Forbidden';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC/GUEST ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<GuestHome/>} />

        {/* ================= AUTHENTICATED ================= */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>

            {/* ================= VENDOR ================= */}
            <Route element={<RoleRoute allow={['VENDOR']} />}>
              <Route path="/vendor" element={<VendorHome />} />
              <Route path="/orders" element={<VendorOrders />} />
              <Route path="/payments" element={<VendorPayments />} />
              <Route path="/profile" element={<VendorProfile />} />
              <Route path="/feedback" element={<VendorFeedback />} />
            </Route>

            {/* ================= ADMIN ================= */}
            <Route element={<RoleRoute allow={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/feedbacks" element={<AdminFeedbacks />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* ================= SUPERMARKET STAFF ================= */}
            <Route element={<RoleRoute allow={['SUPERMARKET_STAFF']} />}>
              <Route path="/supermarket/products" element={<SupermarketProducts />} />
              <Route path="/supermarket/products/new" element={<SupermarketProductCreate />} />
              <Route path="/supermarket/pricing" element={<SupermarketPricing />} />
              <Route path="/supermarket/reports" element={<SupermarketReports />} />
            </Route>

            {/* ================= PACKAGE STAFF ================= */}
            <Route element={<RoleRoute allow={['PACKAGE_STAFF']} />}>
              <Route path="/package/orders" element={<PackageOrders />} />
              <Route path="/package/collect" element={<PackageCollect />} />
              <Route path="/package/packing" element={<PackagePacking />} />
              <Route path="/package/reports" element={<PackageReports />} />
            </Route>

            {/* ================= MARKETING STAFF ================= */}
            <Route element={<RoleRoute allow={['MARKETING_STAFF']} />}>
              <Route path="/marketing/promotions" element={<MarketingPromotions />} />
              <Route path="/marketing/reports" element={<MarketingReports />} />
            </Route>

          </Route>
        </Route>

        {/* COMMON */}
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

    </BrowserRouter>
  );
};

export default AppRouter;
