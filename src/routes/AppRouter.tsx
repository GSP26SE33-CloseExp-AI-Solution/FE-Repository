import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";

import SDashboard from "@/pages/Supermarket/SDashboard";

import SProducts from "@/pages/Supermarket/SProducts";
import SAddProduct from "@/pages/Supermarket/SProducts/SAddProduct";

import NotFound from "@/pages/Common/NotFound";
import Forbidden from "@/pages/Common/Forbidden";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>

          {/* ===== SUPERMARKET ROUTES ===== */}
          <Route path="/supermarket/dashboard" element={<SDashboard />} />
          
          <Route path="/supermarket/products" element={<SProducts />} />
          <Route path="/supermarket/products/add" element={<SAddProduct />} />

          {/* Common */}
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
