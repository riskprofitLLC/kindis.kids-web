import { useState } from 'react'

import { useAddresses } from '@/features/profile/model/use-addresses'
import { Button } from '@/shared/ui/button/button'

// Адресная книга:сохранённые адреса покупателя для оформления заказа.
export function AddressBook() {
  const { items, add, remove } = useAddresses()
  const [label, setLabel] = useState('')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [house, setHouse] = useState('')
  const [apartment, setApartment] = useState('')
  const [zip, setZip] = useState('')

  const canSave = Boolean(label.trim() && city.trim() && street.trim() && house.trim())

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">Сохранённых адресов пока нет.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3 text-sm"
            >
              <span className="text-text">
                {item.label}: {item.city}, {item.street}, {item.house}
                {item.apartment ? `, кв. ${item.apartment}` : ''}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(item.id)}>
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Форма добавления — компактная сетка */}
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="min-h-11 rounded-md border border-border px-3 text-sm"
          placeholder="Название (дом, работа)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <input
          className="min-h-11 rounded-md border border-border px-3 text-sm"
          placeholder="Город"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
        <input
          className="min-h-11 rounded-md border border-border px-3 text-sm"
          placeholder="Улица"
          value={street}
          onChange={(event) => setStreet(event.target.value)}
        />
        <input
          className="min-h-11 rounded-md border border-border px-3 text-sm"
          placeholder="Дом"
          value={house}
          onChange={(event) => setHouse(event.target.value)}
        />
        <input
          className="min-h-11 rounded-md border border-border px-3 text-sm"
          placeholder="Квартира"
          value={apartment}
          onChange={(event) => setApartment(event.target.value)}
        />
        <input
          className="min-h-11 rounded-md border border-border px-3 text-sm"
          placeholder="Индекс"
          value={zip}
          onChange={(event) => setZip(event.target.value)}
        />
      </div>

      <Button
        type="button"
        className="self-start"
        disabled={!canSave}
        onClick={() => {
          add({
            label: label.trim(),
            city: city.trim(),
            street: street.trim(),
            house: house.trim(),
            apartment: apartment.trim(),
            zip: zip.trim(),
          })
          setLabel('')
          setCity('')
          setStreet('')
          setHouse('')
          setApartment('')
          setZip('')
        }}
      >
        Добавить адрес
      </Button>
    </div>
  )
}
