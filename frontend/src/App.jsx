// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";
import { GuestRoute } from "./routes/GuestRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { SelectRolePage } from "./pages/auth/SelectRolePage";
import { LandingPage } from "./pages/LandingPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { SuccessRedirectPage } from "./pages/SuccessRedirectPage";

import { CustomerLayout, CustomerDashboardHome } from "./pages/customer/CustomerDashboard";
import { CustomerOrdersPage } from "./pages/customer/CustomerOrdersPage";
import { OrderDetailsPage } from "./pages/customer/OrderDetailsPage";
import { WishlistPage } from "./pages/customer/WishlistPage";
import { BasketPage } from "./pages/customer/BasketPage";
import { ReviewsPage } from "./pages/customer/ReviewsPage";
import { AddressesPage } from "./pages/customer/AddressesPage";
import { NotificationsPage } from "./pages/customer/NotificationsPage";
import { SettingsPage } from "./pages/customer/SettingsPage";
import { CartProvider } from "./context/CartContext";
import { CartDrawer } from "./components/CartDrawer";
import { CartToast } from "./components/CartToast";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { SellerLayout } from "./layouts/SellerLayout";
import { SellerOverviewPage } from "./pages/seller/SellerOverviewPage";
import { SellerProductsPage } from "./pages/seller/SellerProductsPage";
import { SellerOrdersPage } from "./pages/seller/SellerOrdersPage";
import { SellerStorePage } from "./pages/seller/SellerStorePage";
import { SellerSettingsPage } from "./pages/seller/SellerSettingsPage";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminSellersPage } from "./pages/admin/AdminSellersPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage";
import { AdminProductDetailPage } from "./pages/admin/AdminProductDetailPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { AddProductPage } from "./pages/seller/AddProductPage";
import { ProductViewPage } from "./pages/seller/ProductViewPage";
import { EditProductPage } from "./pages/seller/EditProductPage";
import { ToastProvider } from "./context/ToastContext";

import { SellerOrderDetailPage } from "./pages/seller/SellerOrderDetailPage";
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/select-role" element={<SelectRolePage />} />
              <Route path="/success" element={<SuccessRedirectPage />} />

              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/account/change-password" element={<ChangePasswordPage />} />

                <Route element={<RoleRoute allowedRoles={["customer"]} />}>
                  <Route element={<CustomerLayout />}>
                    <Route path="/customer" element={<CustomerDashboardHome />} />
                    <Route path="/customer/orders" element={<CustomerOrdersPage />} />
                    <Route path="/customer/orders/:orderId" element={<OrderDetailsPage />} />
                    <Route path="/customer/wishlist" element={<WishlistPage />} />
                    <Route path="/customer/basket" element={<BasketPage />} />
                    <Route path="/customer/reviews" element={<ReviewsPage />} />
                    <Route path="/customer/addresses" element={<AddressesPage />} />
                    <Route path="/customer/notifications" element={<NotificationsPage />} />
                    <Route path="/customer/settings" element={<SettingsPage />} />
                    <Route path="/customer/orders" element={<CustomerOrdersPage />} />
                    <Route path="/customer/orders/:orderId" element={<OrderDetailsPage />} />
                  </Route>
                </Route>

                <Route element={<RoleRoute allowedRoles={["seller"]} />}>
                  <Route element={<SellerLayout />}>
                    <Route path="/seller" element={<SellerOverviewPage />} />
                    <Route path="/seller/products" element={<SellerProductsPage />} />
                    <Route path="/seller/orders" element={<SellerOrdersPage />} />
                    <Route path="/seller/store" element={<SellerStorePage />} />
                    <Route path="/seller/settings" element={<SellerSettingsPage />} />
                    <Route path="/seller/products/add" element={<AddProductPage />} />
                    <Route path="/seller/products/:id" element={<ProductViewPage />} />
                    <Route path="/seller/products/:id/edit" element={<EditProductPage />} />
                    <Route path="/seller/orders/:id" element={<SellerOrderDetailPage />} />
                  </Route>
                </Route>
                <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminOverviewPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/sellers" element={<AdminSellersPage />} />
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="/admin/products/:id" element={<AdminProductDetailPage />} />

                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <CartDrawer />
            <CartToast />

          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
export default App;