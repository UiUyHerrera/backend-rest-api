# Backend REST API

API REST para una tienda online hecha con Node.js, TypeScript, Express y PostgreSQL.

## Funciones

- Registro e inicio de sesión
- JWT y roles de usuario
- CRUD de productos
- Carrito y pedidos
- Control de stock
- Panel de administración mediante API
- Validación con Zod
- Tests de integración
- Docker
- Swagger

## Tecnologías

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- JWT
- Zod
- Vitest
- Docker

## Instalación

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

## Cuentas de prueba

El seed crea dos cuentas, solo para uso en desarrollo local:

- `manolo@example.com` / `admin123` (admin)
- `pepeito@example.com` / `cliente123` (cliente)

No usar estas credenciales en producción.