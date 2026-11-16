import { useState } from 'react'

import type { ChildProfile } from '@/shared/api/children-api'
import { CONSENT_DOCUMENT_VERSION } from '@/shared/domain/consent'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { Dialog } from '@/shared/ui/dialog/dialog'

interface ConsentManagerProps {
  profiles: ChildProfile[]
  onGrant: (childId: string) => void
  onRevoke: (childId: string) => void
  pendingChildId: string | null
}

// Управление согласием на спецданные по каждому профилю ребёнка
export function ConsentManager({
  profiles,
  onGrant,
  onRevoke,
  pendingChildId,
}: ConsentManagerProps) {
  const [revokeTarget, setRevokeTarget] = useState<ChildProfile | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (profiles.length === 0) {
    return (
      <Alert variant="info">
        Профилей ребёнка пока нет. Согласие оформляется вместе с профилем в личном кабинете.
      </Alert>
    )
  }

  return (
    <section aria-labelledby="consent-manager-title" className="flex flex-col gap-4">
      <h2 id="consent-manager-title" className="text-lg font-semibold text-text">
        Ваши профили детей
      </h2>

      <div aria-live="polite">{message && <Alert variant="success">{message}</Alert>}</div>

      <ul className="flex flex-col gap-3">
        {profiles.map((profile) => {
          const busy = pendingChildId === profile.id
          return (
            <li key={profile.id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-text">{profile.name}</span>
                {profile.hasDisability ? (
                  <Badge variant="success">Согласие дано</Badge>
                ) : (
                  <Badge variant="secondary">Согласие не дано</Badge>
                )}
                {profile.disabilityVerified && <Badge variant="default">Подтверждено</Badge>}
              </div>

              <p className="mt-1 text-sm text-text-muted">
                Версия документа: {CONSENT_DOCUMENT_VERSION}
                {profile.consentDocumentVersion &&
                  ` · подписано: ${profile.consentDocumentVersion}`}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {!profile.hasDisability && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setMessage(null)
                      onGrant(profile.id)
                      setMessage(`Согласие для «${profile.name}» сохранено.`)
                    }}
                  >
                    Согласен
                  </Button>
                )}
                {profile.hasDisability && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setRevokeTarget(profile)}
                  >
                    Отозвать согласие
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Отозвать согласие?"
        description={
          revokeTarget
            ? `После отзыва сведения о состоянии здоровья «${revokeTarget.name}» перестанут ` +
              'использоваться: профиль потеряет отметку «Приоритетный мастер» и будет ' +
              'опубликован без этих данных. Действие нельзя отменить автоматически — ' +
              'согласие нужно будет оформить заново.'
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setRevokeTarget(null)}>
            Оставить согласие
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pendingChildId !== null}
            onClick={() => {
              if (!revokeTarget) return
              const target = revokeTarget
              setRevokeTarget(null)
              onRevoke(target.id)
              setMessage(`Согласие для «${target.name}» отозвано.`)
            }}
          >
            Отозвать
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
