import { lazy } from 'react'

// Ленивые страницы кабинетов (роли: родитель, продавец, админ)
export const DashboardPage = lazy(() => import('@/pages/cabinet/ui/dashboard-page'))
export const OrdersPage = lazy(() => import('@/pages/cabinet/ui/orders-page'))
export const OrderDetailPage = lazy(() => import('@/pages/cabinet/ui/order-detail-page'))
export const FavoritesPage = lazy(() => import('@/pages/cabinet/ui/favorites-page'))
export const ProfileSettingsPage = lazy(() => import('@/pages/cabinet/ui/profile-settings-page'))
export const ChildProfilePage = lazy(() => import('@/pages/cabinet/ui/child-profile-page'))
export const SellerProductsPage = lazy(() => import('@/pages/cabinet/ui/seller-products-page'))
export const SellerProductFormPage = lazy(
  () => import('@/pages/cabinet/ui/seller-product-form-page'),
)
export const SellerOrdersPage = lazy(() => import('@/pages/cabinet/ui/seller-orders-page'))
export const AnalyticsPage = lazy(() => import('@/pages/cabinet/ui/analytics-page'))
export const ChatsPage = lazy(() => import('@/pages/cabinet/ui/chats-page'))
export const ModerationPage = lazy(() => import('@/pages/admin/ui/moderation-page'))
export const AdminCategoriesPage = lazy(() => import('@/pages/admin/ui/admin-categories-page'))
export const AdminAttributesPage = lazy(() => import('@/pages/admin/ui/admin-attributes-page'))
export const AdminAuditPage = lazy(() => import('@/pages/admin/ui/admin-audit-page'))
