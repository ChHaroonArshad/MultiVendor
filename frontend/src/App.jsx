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

import { ProductsPage } from "./pages/ProductsPage";
import { CategoriesPage } from "./pages/CategoriesPage";

import { SellerOrderDetailPage } from "./pages/seller/SellerOrderDetailPage";

import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetailPage";

import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage";
import { StorePage } from "./pages/StorePage";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationsPage } from "./pages/NotificationsPage";
import { CustomerOverviewPage } from "./pages/customer/CustomerOverviewPage";

import { ChatProvider } from "./context/ChatContext";
import { ChatPage } from "./pages/ChatPage";
import { HelpPage } from "./pages/HelpPage";
import { AboutPage } from "./pages/AboutPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminReportDetailPage } from "./pages/admin/AdminReportDetailPage";
import { SellerStoreProvider } from "./context/SellerStoreContext";
import { StoreGate } from "./components/seller/StoreGate";
import { AdminChatMonitorPage } from "./pages/admin/AdminChatMonitorPage";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

import { WishlistProvider } from "./context/WishlistContext";






function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ChatProvider>

          <NotificationProvider>
                <WishlistProvider> 
            <CartProvider>
              <BrowserRouter>
              <AppErrorBoundary>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/store/:id" element={<StorePage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/select-role" element={<SelectRolePage />} />
                  <Route path="/success" element={<SuccessRedirectPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />

                  <Route element={<GuestRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route path="/account/change-password" element={<ChangePasswordPage />} />

                    <Route element={<RoleRoute allowedRoles={["customer"]} />}>
                      <Route element={<CustomerLayout />}>
                        <Route path="/customer" element={<CustomerOverviewPage />} />
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
                        <Route path="/customer/messages" element={<ChatPage />} />   {/* CustomerLayout ke andar */}

                      </Route>
                    </Route>

                    <Route element={<RoleRoute allowedRoles={["seller"]} />}>
                      <Route element={<SellerStoreProvider />}>
                        <Route element={<SellerLayout />}>


                          <Route element={<StoreGate reason="landing" />}>  {/* login lands here, so an unfinished store goes to /seller/store */}
                            <Route path="/seller" element={<SellerOverviewPage />} />
                          </Route>

                          <Route element={<StoreGate reason="add-product" />}>
                            <Route path="/seller/products/add" element={<AddProductPage />} />
                          </Route>


                          <Route path="/seller" element={<SellerOverviewPage />} />
                          <Route path="/seller/products" element={<SellerProductsPage />} />
                          <Route path="/seller/orders" element={<SellerOrdersPage />} />
                          <Route path="/seller/store" element={<SellerStorePage />} />
                          <Route path="/seller/settings" element={<SellerSettingsPage />} />
                          <Route path="/seller/products/add" element={<AddProductPage />} />
                          <Route path="/seller/products/:id" element={<ProductViewPage />} />
                          <Route path="/seller/products/:id/edit" element={<EditProductPage />} />
                          <Route path="/seller/orders/:id" element={<SellerOrderDetailPage />} />
                          <Route path="/seller/notifications" element={<NotificationsPage />} />
                          {/* inside the SellerLayout block */}
                          <Route path="/seller/messages" element={<ChatPage />} />     {/* SellerLayout ke andar */}

                        </Route>
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
                        <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
                        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
                        <Route path="/admin/notifications" element={<NotificationsPage />} />    {/* inside the AdminLayout block */}
                        <Route path="/admin/messages" element={<ChatPage />} />      {/* AdminLayout ke andar */}
                        <Route path="/admin/reports" element={<AdminReportsPage />} />
                        <Route path="/admin/reports/:id" element={<AdminReportDetailPage />} />
                        <Route path="/admin/chat-monitor" element={<AdminChatMonitorPage />} />


                      </Route>
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <CartDrawer />
                <CartToast />
  </AppErrorBoundary>
              </BrowserRouter>
            </CartProvider>
                  </WishlistProvider>
          </NotificationProvider>
        </ChatProvider>

      </AuthProvider>
    </ToastProvider>
  );
}
export default App;