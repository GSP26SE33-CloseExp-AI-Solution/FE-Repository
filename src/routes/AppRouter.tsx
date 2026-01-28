import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";

import SDashboard from "@/pages/Supermarket/SDashboard";

import ProductList from "@/pages/Supermarket/SProducts/ProductList";
import AddProduct from "@/pages/Supermarket/SProducts/AddProduct";

import NotFound from "@/pages/Common/NotFound";
import Forbidden from "@/pages/Common/Forbidden";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>

          {/* ===== SUPERMARKET ROUTES ===== */}
          <Route path="/supermarket/dashboard" element={<SDashboard />} />
          
          <Route path="/supermarket/products" element={<ProductList />} />
          <Route path="/supermarket/products/add" element={<AddProduct />} />

          {/* Common */}
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
