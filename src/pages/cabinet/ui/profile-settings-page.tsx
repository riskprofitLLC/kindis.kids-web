import { useSessionStore } from '@/entities/session/model/session-store'
import { AccessibilityControls } from '@/features/accessibility/ui/a11y-controls'
import { AddressBook } from '@/features/profile/ui/address-book'
import { PasswordForm } from '@/features/profile/ui/password-form'
import { ProfileForm } from '@/features/profile/ui/profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'

export default function ProfileSettingsPage() {
  const user = useSessionStore((state) => state.user)
  const setSession = useSessionStore((state) => state.setSession)

  if (!user) return null

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Настройки профиля</h1>

      <Card>
        <CardHeader>
          <CardTitle>Личные данные</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} onSaved={(values) => setSession({ ...user, ...values })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Доступность</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-text-muted">
            Размер текста и контрастность применяются ко всем страницам и сохраняются на этом
            устройстве.
          </p>
          <AccessibilityControls />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Адреса доставки</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressBook />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Смена пароля</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </section>
  )
}
