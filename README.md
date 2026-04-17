# TableCRM Mobile Order

Мобильный webapp для создания заказа/продажи в TableCRM.

## Стек

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn-style UI components

## Запуск

```bash
npm install
npm run dev
```

Открыть: `http://localhost:3000/order`

## Структура

```txt
app/
  api/tablecrm/
  order/page.tsx
components/
  order/
    order-app.tsx
    sections/
lib/
  mappers/
  order/
  payload.ts
  tablecrm.ts
types/
  tablecrm.ts
```

## Что уже реализовано

- подключение по токену;
- загрузка организаций, счетов, складов и типов цен;
- поиск клиента по телефону;
- поиск товаров;
- корзина с редактированием количества и цены;
- создание продажи;
- создание и проведение продажи.

## Важный момент по payload

Проект использует реальный формат payload для `POST /docs_sales/`, который вытащен из Network:

- корень — массив заказов;
- товары — в `goods`;
- проведение документа — через boolean `status`;
- `dated` отправляется unix timestamp в секундах.

Если в конкретной кассе есть дополнительные обязательные поля, их нужно добавить в `lib/payload.ts`.
