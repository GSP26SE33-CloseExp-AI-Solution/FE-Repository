import { BrowserRouter, Routes, Route } from "react-router-dom"

import MainLayout from "@/components/layouts/MainLayout"
import PublicLayout from "@/components/layouts/PublicLayout"
import PrivateRoute from "@/routes/PrivateRoute"
import RoleRoute from "@/routes/RoleRoute"
import RoleRedirect from "@/routes/RoleRedirect"

import Login from "@/pages/Auth/Login"
import Register from "@/pages/Auth/Register/Register"

import Home from "@/pages/Home/Home"

import SDashboard from "@/pages/Supplier/SDashboard"
import ProductList from "@/pages/Supplier/SProducts/ProductList/ProductsList"
import AddProduct from "@/pages/Supplier/SProducts/AddProduct/AddProduct"
import ConfirmProduct from "@/pages/Supplier/SProducts/ConfirmProduct/ConfirmProduct"
import PricingProduct from "@/pages/Supplier/SProducts/PricingProduct/PricingProduct"
import PublishProduct from "@/pages/Supplier/SProducts/PublishProduct/PublishPage"
import ProfilePage from "@/pages/Supplier/SProfile/ProfilePage"
import ProductsLotsPage from "@/pages/Supplier/SProducts/ProductList/ProductsLotsPage"

import AdminDashboard from "@/pages/Admin/AdminDashboard"

import NotFound from "@/pages/Common/NotFound"
import Forbidden from "@/pages/Common/Forbidden"

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<PublicLayout />}>
          {/* ===== HOME ===== */}
          <Route path="/" element={<Home />} />
        </Route>
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
              <Route path="/supplier/products/:productId/confirm" element={<ConfirmProduct />} />
              <Route path="/supplier/products/:productId/pricing" element={<PricingProduct />} />
              <Route path="/supplier/products/:productId/publish" element={<PublishProduct />} />
              <Route path="/supplier/profile" element={<ProfilePage />} />
              <Route path="/supplier/setting" element={<ProductsLotsPage />} />
            </Route>
          </Route>

          {/* ===== VENDOR ===== */}
          <Route element={<RoleRoute allow={["Vendor"]} />}>
            <Route element={<PublicLayout />}>
              <Route path="/vendor" element={<Home />} />
            </Route>
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
