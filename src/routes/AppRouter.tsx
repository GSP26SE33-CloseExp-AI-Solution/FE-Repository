import { BrowserRouter, Routes, Route } from "react-router-dom"

import MainLayout from "@/layouts/MainLayout"
import PrivateRoute from "@/routes/PrivateRoute"
import RoleRoute from "@/routes/RoleRoute"

import Login from "@/pages/Auth/Login"
import Register from "@/pages/Auth/Register/Register"

import SDashboard from "@/pages/Supermarket/SDashboard"
import ProductList from "@/pages/Supermarket/SProducts/ProductList/ProductsList"
import AddProduct from "@/pages/Supermarket/SProducts/AddProduct/AddProduct"
import ConfirmProduct from "@/pages/Supermarket/SProducts/ConfirmProduct/ConfirmProduct"
import AiPricingDetailPage from "@/pages/Supermarket/SProducts/ConfirmProduct/components/AiPricing/AiPricingDetail/AiPricingDetailPage"
import ProfilePage from "@/pages/Supermarket/SProfile/ProfilePage"

import AdminDashboard from "@/pages/Admin/AdminDashboard"

import NotFound from "@/pages/Common/NotFound"
import Forbidden from "@/pages/Common/Forbidden"
import Home from "@/pages/Home/Home"

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===== PUBLIC ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== PRIVATE (LOGIN REQUIRED) ===== */}
        <Route element={<PrivateRoute />}>

          {/* ===== ADMIN ===== */}
          <Route element={<RoleRoute allow={["Admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* ===== SUPPLIER STAFF ===== */}
          <Route element={<RoleRoute allow={["SupplierStaff"]} />}>
            <Route element={<MainLayout />}>
              <Route path="/supplier/dashboard" element={<SDashboard />} />
              <Route path="/supplier/products" element={<ProductList />} />
              <Route path="/supplier/products/add" element={<AddProduct />} />
              <Route path="/supplier/products/confirm" element={<ConfirmProduct />} />
              <Route
                path="/supplier/products/:productId/ai-pricing"
                element={<AiPricingDetailPage />}
              />
              <Route path="/supplier/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* ===== VENDOR ===== */}
          <Route element={<RoleRoute allow={["Vendor"]} />}>
            <Route path="/vendor/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* ===== COMMON PRIVATE ===== */}
          <Route path="/forbidden" element={<Forbidden />} />

        </Route>

        {/* ===== NOT FOUND ===== */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
