import { useParams } from 'react-router-dom'

import { useProductForm } from '@/features/seller/model/use-product-form'
import { ProductFormFields } from '@/features/seller/ui/product-form-fields'
import { ProductMediaEditor } from '@/features/seller/ui/product-media-editor'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Страница товара:тонкая сборка из фич seller — форма,кнопки,медиа.
export default function SellerProductFormPage() {
  const { productId } = useParams()
  const form = useProductForm(productId)

  if (form.profilesPending) {
    return (
      <LoadingRegion>
        <Skeleton className="h-32 w-full" />
      </LoadingRegion>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">
        {form.isEdit ? 'Редактирование товара' : 'Новый товар'}
      </h1>

      {form.error && (
        <Alert variant="danger" title="Ошибка">
          {form.error}
        </Alert>
      )}

      {/* Место не сохранилось,пока бэкенд не принимает поля — остальное сохранено */}
      {form.locationNotice && <Alert>{form.locationNotice}</Alert>}

      <form className="flex flex-col gap-3">
        <ProductFormFields values={form.values} onChange={form.setValues} />

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={form.save.isPending}
            onClick={() => form.save.mutate(false)}
          >
            Сохранить черновик
          </Button>
          <Button
            type="button"
            disabled={form.save.isPending}
            onClick={() => form.save.mutate(true)}
          >
            {form.save.isPending ? 'Сохраняем…' : 'Опубликовать на модерацию'}
          </Button>
        </div>
      </form>

      {/* Медиа товара — только у сохранённого товара */}
      {form.isEdit && productId && <ProductMediaEditor productId={productId} />}
    </div>
  )
}
