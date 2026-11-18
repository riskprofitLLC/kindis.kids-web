import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { CabinetLayout } from '@/app/layouts/cabinet-layout'
import { PublicLayout } from '@/app/layouts/public-layout'
import {
  AdminAttributesPage,
  AdminAuditPage,
  AdminCategoriesPage,
  AnalyticsPage,
  ChatsPage,
  ChildProfilePage,
  DashboardPage,
  FavoritesPage,
  ModerationPage,
  OrderDetailPage,
  OrdersPage,
  ProfileSettingsPage,
  SellerOrdersPage,
  SellerProductFormPage,
  SellerProductsPage,
} from '@/app/router/lazy-cabinet-pages'
import {
  CartPage,
  CatalogPage,
  CheckoutPage,
  ConsentPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  ProductPage,
  RegisterPage,
  ResetPasswordPage,
  SearchPage,
  SellerPage,
  VerifyEmailPage,
} from '@/app/router/lazy-pages'
import { RequireRole } from '@/app/router/require-role'
import { SessionExpiredHandler } from '@/app/router/session-expired-handler'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

function PageFallback() {
  return (
    <div aria-busy="true" className="mx-auto max-w-3xl space-y-4 p-8">
      <span className="sr-only">Загружаем…</span>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

// Продавец — не отдельная роль: это родитель с профилем ребёнка.
const cabinetRoles = ['parent', 'admin'] as const

export function AppRouter() {
  return (
    <>
      <SessionExpiredHandler />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="product/:slug" element={<ProductPage />} />
            <Route path="seller/:slug" element={<SellerPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="consent" element={<ConsentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<RequireRole roles={[...cabinetRoles]} />}>
            <Route path="cabinet" element={<CabinetLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              <Route path="child-profile" element={<ChildProfilePage />} />
              {/* Кабинет продавца */}
              <Route path="products" element={<SellerProductsPage />} />
              <Route path="products/new" element={<SellerProductFormPage />} />
              <Route path="products/:productId/edit" element={<SellerProductFormPage />} />
              <Route path="seller-orders" element={<SellerOrdersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="chats" element={<ChatsPage />} />
            </Route>
          </Route>

          {/* Кабинет администратора */}
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="admin/moderation" element={<ModerationPage />} />
            <Route path="admin/categories" element={<AdminCategoriesPage />} />
            <Route path="admin/attributes" element={<AdminAttributesPage />} />
            <Route path="admin/audit" element={<AdminAuditPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
