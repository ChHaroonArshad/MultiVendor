import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { SuccessRedirectPage } from "./pages/SuccessRedirectPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/success" element={<SuccessRedirectPage />} />

          {/* Any logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account/change-password" element={<ChangePasswordPage />} />

            {/* Role-specific (placeholder pages until the marketplace phases) */}
            <Route element={<RoleRoute allowedRoles={["customer"]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["seller"]} />}>
              <Route path="/dashboard/seller" element={<DashboardPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/dashboard/admin" element={<DashboardPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;