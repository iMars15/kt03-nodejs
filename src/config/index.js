require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

const prisma = new PrismaClient();

// Данные для поля meta в ответах со списками
function buildMeta(total, page, limit) {
  return { total, page, limit, pages: Math.ceil(total / limit) };
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl,
  // mode: 'insensitive' поддерживается только PostgreSQL
  isPostgres: /^postgres(ql)?:/.test(databaseUrl),
  prisma,
  buildMeta,
};
