import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Auth/Login";
import PrivateRoute from "@/routes/PrivateRoute";

import SDashboard from "@/pages/Supermarket/SDashboard";

import ProductList from "@/pages/Supermarket/SProducts/ProductList/ProductsList";
import AddProduct from "@/pages/Supermarket/SProducts/AddProduct/AddProduct";
import ConfirmProduct from "@/pages/Supermarket/SProducts/ConfirmProduct/ConfirmProduct";
import AiPricingDetailPage from "@/pages/Supermarket/SProducts/ConfirmProduct/components/AiPricing/AiPricingDetail/AiPricingDetailPage";

import NotFound from "@/pages/Common/NotFound";
import Forbidden from "@/pages/Common/Forbidden";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTE */}
        <Route path="/login" element={<Login />} />

        {/* PRIVATE ROUTES */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>

            {/* ===== SUPERMARKET ROUTES ===== */}
            <Route path="/supermarket/dashboard" element={<SDashboard />} />
            <Route path="/supermarket/products" element={<ProductList />} />
            <Route path="/supermarket/products/add" element={<AddProduct />} />
            <Route path="/supermarket/products/confirm" element={<ConfirmProduct />} />
            <Route
              path="/supermarket/products/:productId/ai-pricing"
              element={<AiPricingDetailPage />}
            />

            {/* Common */}
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
