# kt03 — REST API блог-платформы (Express + Prisma + SQLite)

## Запуск

Требуется Node.js 18+.

```bash
npm install
cp .env.example .env        # если .env ещё нет
npx prisma migrate dev --name init   # создаст БД prisma/dev.db и миграцию
npm start                   # или npm run dev
```

Сервер: `http://localhost:3000`. Просмотр данных: `npx prisma studio`.

Для PostgreSQL: в `schema.prisma` поменять `provider` на `postgresql`, в `.env` указать
`DATABASE_URL="postgresql://user:pass@localhost:5432/blog"`, заново выполнить миграцию.

## Проверка

```bash
# пользователь
curl -X POST localhost:3000/api/users -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","name":"Anna"}'

# пост с тегами (теги создаются через connectOrCreate)
curl -X POST localhost:3000/api/posts -H "Content-Type: application/json" \
  -d '{"title":"Hello Prisma","content":"text","published":true,"authorId":1,"tags":["js","orm"]}'

# список: поиск, фильтры, пагинация → { data, meta: { total, page, limit, pages } }
curl "localhost:3000/api/posts?search=hello&published=true&authorId=1&page=1&limit=5"

# пост с автором и тегами
curl localhost:3000/api/posts/1

# пользователь с постами (новые сверху)
curl localhost:3000/api/users/1

# обновление, удаление
curl -X PATCH localhost:3000/api/posts/1 -H "Content-Type: application/json" -d '{"tags":["node"]}'
curl -X DELETE localhost:3000/api/posts/1
```

Ошибки:

| Запрос | Ответ |
|--------|-------|
| `POST /api/posts` без `title` или с нечисловым `authorId` | 400, массив `details` |
| `POST /api/posts` с несуществующим `authorId` | 400 |
| `POST /api/users` с уже занятым email | 409 |
| `GET /api/users/999` | 404 |
| `PATCH /api/posts/999` | 404 |
| `GET /api/users/abc` | 400 |
