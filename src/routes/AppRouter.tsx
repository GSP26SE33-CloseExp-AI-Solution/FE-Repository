import { BrowserRouter, Routes, Route } from "react-router-dom"

import MainLayout from "@/layouts/MainLayout"
import PrivateRoute from "@/routes/PrivateRoute"
import RoleRoute from "@/routes/RoleRoute"
import RoleRedirect from "@/routes/RoleRedirect"

import Login from "@/pages/Auth/Login"
import Register from "@/pages/Auth/Register/Register"

import Home from "@/pages/Home/Home"

import SDashboard from "@/pages/Supermarket/SDashboard"
import ProductList from "@/pages/Supermarket/SProducts/ProductList/ProductsList"
import AddProduct from "@/pages/Supermarket/SProducts/AddProduct/AddProduct"
import ConfirmProduct from "@/pages/Supermarket/SProducts/ConfirmProduct/ConfirmProduct"
import AiPricingDetailPage from "@/pages/Supermarket/SProducts/ConfirmProduct/components/AiPricing/AiPricingDetail/AiPricingDetailPage"
import ProfilePage from "@/pages/Supermarket/SProfile/ProfilePage"

import AdminDashboard from "@/pages/Admin/AdminDashboard"

import NotFound from "@/pages/Common/NotFound"
import Forbidden from "@/pages/Common/Forbidden"

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===== HOME ===== */}
        <Route path="/" element={<Home />} />

        {/* ===== PUBLIC ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/redirect" element={<RoleRedirect />} />
        
        {/* ===== PRIVATE ===== */}
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

          {/* ===== COMMON ===== */}
          <Route path="/forbidden" element={<Forbidden />} />

        </Route>

        {/* ===== NOT FOUND ===== */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
