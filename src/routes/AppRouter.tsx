import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout";
import PrivateRoute from "@/routes/PrivateRoute";
import RoleRoute from "@/routes/RoleRoute";

import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register/Register";

import SDashboard from "@/pages/Supermarket/SDashboard";
import ProductList from "@/pages/Supermarket/SProducts/ProductList/ProductsList";
import AddProduct from "@/pages/Supermarket/SProducts/AddProduct/AddProduct";
import ConfirmProduct from "@/pages/Supermarket/SProducts/ConfirmProduct/ConfirmProduct";
import AiPricingDetailPage from "@/pages/Supermarket/SProducts/ConfirmProduct/components/AiPricing/AiPricingDetail/AiPricingDetailPage";

import AdminDashboard from "@/pages/Admin/AdminDashboard";

import NotFound from "@/pages/Common/NotFound";
import Forbidden from "@/pages/Common/Forbidden";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== PRIVATE ROUTES (ĐÃ LOGIN) ===== */}
        <Route element={<PrivateRoute />}>

          {/* ===== ADMIN ===== */}
          <Route element={<RoleRoute allow={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* ===== SUPERMARKET ===== */}
          <Route element={<RoleRoute allow={['SUPERMARKET']} />}>
            <Route element={<MainLayout />}>
              <Route path="/supermarket/dashboard" element={<SDashboard />} />
              <Route path="/supermarket/products" element={<ProductList />} />
              <Route path="/supermarket/products/add" element={<AddProduct />} />
              <Route path="/supermarket/products/confirm" element={<ConfirmProduct />} />
              <Route
                path="/supermarket/products/:productId/ai-pricing"
                element={<AiPricingDetailPage />}
              />
            </Route>
          </Route>

          {/* ===== COMMON PRIVATE ===== */}
          <Route path="/forbidden" element={<Forbidden />} />

        </Route>

        {/* ===== NOT FOUND ===== */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
