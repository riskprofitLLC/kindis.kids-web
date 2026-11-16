import { lazy } from 'react'

// Ленивые страницы: каждая грузится отдельным чанком по своему роуту
export const HomePage = lazy(() => import('@/pages/home/ui/home-page'))
export const CatalogPage = lazy(() => import('@/pages/catalog/ui/catalog-page'))
export const ProductPage = lazy(() => import('@/pages/product/ui/product-page'))
export const SellerPage = lazy(() => import('@/pages/seller/ui/seller-page'))
export const SearchPage = lazy(() => import('@/pages/search/ui/search-page'))
export const CartPage = lazy(() => import('@/pages/cart/ui/cart-page'))
export const CheckoutPage = lazy(() => import('@/pages/checkout/ui/checkout-page'))
export const LoginPage = lazy(() => import('@/pages/login/ui/login-page'))
export const RegisterPage = lazy(() => import('@/pages/register/ui/register-page'))
export const VerifyEmailPage = lazy(() => import('@/pages/verify-email/ui/verify-email-page'))
export const ForgotPasswordPage = lazy(
  () => import('@/pages/forgot-password/ui/forgot-password-page'),
)
export const ResetPasswordPage = lazy(() => import('@/pages/reset-password/ui/reset-password-page'))
export const ConsentPage = lazy(() => import('@/pages/consent/ui/consent-page'))
export const NotFoundPage = lazy(() => import('@/pages/not-found/ui/not-found-page'))
