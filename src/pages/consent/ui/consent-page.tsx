import { Link } from 'react-router-dom'

import { useSessionStore } from '@/entities/session/model/session-store'
import {
  useChildProfiles,
  useDisabilityConsent,
} from '@/features/consent/model/use-disability-consent'
import { ConsentManager } from '@/features/consent/ui/consent-manager'
import { routes } from '@/shared/config/routes'
import {
  CONSENT_DOCUMENT_DATE,
  CONSENT_DOCUMENT_VERSION,
  consentParagraphs,
} from '@/shared/domain/consent'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export default function ConsentPage() {
  const status = useSessionStore((state) => state.status)
  const authenticated = status === 'authenticated'

  const profiles = useChildProfiles(authenticated)
  const consent = useDisabilityConsent()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-text">
          Согласие на обработку специальных данных
        </h1>
        <p className="text-sm text-text-muted">
          Версия документа: {CONSENT_DOCUMENT_VERSION} · редакция от {CONSENT_DOCUMENT_DATE}
        </p>
      </header>

      <article className="space-y-4 text-text">
        {consentParagraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

      {!authenticated && (
        <Alert variant="info">
          Чтобы дать или отозвать согласие, войдите в аккаунт родителя.{' '}
          <Link className="text-primary hover:underline" to={routes.login}>
            Войти
          </Link>{' '}
          или{' '}
          <Link className="text-primary hover:underline" to={routes.register}>
            зарегистрироваться
          </Link>
          .
        </Alert>
      )}

      {authenticated && profiles.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {authenticated && profiles.isError && (
        <Alert variant="danger">Не удалось загрузить профили детей. Обновите страницу.</Alert>
      )}

      {authenticated && profiles.isSuccess && (
        <ConsentManager profiles={profiles.data} grant={consent.grant} revoke={consent.revoke} />
      )}

      {authenticated && (
        <Button asChild variant="outline">
          <Link to={routes.cabinetChildProfile}>Перейти к профилю ребёнка</Link>
        </Button>
      )}
    </div>
  )
}
