const { Prisma } = require('@prisma/client');

function notFound(req, res) {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = err.meta && err.meta.target;
        return res.status(409).json({
          error: `Запись с таким значением уже существует${target ? ` (${[].concat(target).join(', ')})` : ''}`,
        });
      }
      case 'P2025':
        return res.status(404).json({ error: 'Запись не найдена' });
      case 'P2003':
        return res.status(400).json({ error: 'Связанная запись не существует (например, неверный authorId)' });
      default:
        break;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Некорректные данные запроса' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Внутренняя ошибка сервера' : err.message });
}

module.exports = { notFound, errorHandler };
