# Backend REST API

API REST de una tienda con usuarios, productos y pedidos. Hecha con Node.js, TypeScript, Express y PostgreSQL.

Incluye autenticación con JWT, validación con Zod, rate limiting y un set de tests de integración. Sumé también una página de ejemplo en `public/` para poder probar la API desde el navegador.

## Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- JWT (bcrypt para las contraseñas) + Zod
- Vitest + Supertest

## Requisitos

- Node.js 20+
- PostgreSQL 15+ (o Docker)

## Correrlo en local

```bash
npm install
cp .env.example .env        # o crear el .env a mano
docker compose up -d db     # si usás Docker; si no, levantá un Postgres local
npm run db:migrate
npm run db:seed
npm run dev
```

Con eso la API queda en `http://localhost:3000`. Si abrís esa URL en el navegador ves la página de ejemplo: sirve para login, armar carrito y hacer pedidos sin Postman.

El seed crea dos cuentas:

- Admin: `admin@example.com` / `admin123`
- Usuario: `user@example.com` / `user123`

## Variables de entorno

El `.env.example` tiene todas con sus valores de ejemplo. Las importantes:

- `DATABASE_URL`: conexión a la base principal.
- `TEST_DATABASE_URL`: conexión a la base que usan los tests.
- `JWT_SECRET`: clave para firmar los tokens. Cambiarla en producción.
- `PORT` (3000), `JWT_EXPIRES_IN` (7d) y los límites de rate limiting están con valores sanos por defecto.

## Endpoints

La mayoría de las rutas requieren el header `Authorization: Bearer <token>`.

### Auth

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/auth/register` | Crea un usuario. `{ name, email, password }` |
| POST | `/auth/login` | Devuelve `{ token, user }` |
| GET | `/auth/me` | El usuario de la sesión actual |

### Productos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/products` | Lista pública. Soporta `q`, `minPrice`, `maxPrice`, `sort` (`name`, `price`, `createdAt`, `updatedAt`), `order` (`asc`/`desc`), `page`, `limit` |
| GET | `/products/:id` | Ver uno |
| POST | `/products` | Crear (solo admin) |
| PATCH | `/products/:id` | Editar (solo admin) |
| DELETE | `/products/:id` | Borrar (solo admin) |

### Pedidos

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/orders` | Crea un pedido con `{ items: [{ productId, quantity }] }`. El total lo calcula el servidor y baja el stock |
| GET | `/orders` | Lista los pedidos del usuario (admin ve todos) |
| GET | `/orders/:id` | Detalle de un pedido. Solo su dueño o un admin |
| PATCH | `/orders/:id/cancel` | Cancela y devuelve el stock |

### Usuarios

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/users` | Lista todos (solo admin) |
| GET | `/users/:id` | Ver uno (el propio o admin) |
| PATCH | `/users/:id` | Editar `name`, `email` o `password` (el propio o admin) |
| DELETE | `/users/:id` | Borrar (el propio o admin) |

Ejemplo de login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'
```

Los errores siempre llegan así: `{ "error": "mensaje" }`. Códigos usados: 400 (validación o stock insuficiente), 401 (sin token o credenciales mal), 403 (recursos ajenos), 404, 409 (email duplicado), 429 (rate limit).

## Tests

```bash
npm test
```

Usa la base de `TEST_DATABASE_URL`: aplica las migraciones y limpia las tablas entre corridas, así el entorno de desarrollo no se ensucia. Cubren auth, productos y pedidos (29 tests).

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor en desarrollo (tsx watch) |
| `npm run build` | Compila a `dist/` |
| `npm start` | Corre desde `dist/` |
| `npm test` | Tests de integración |
| `npm run typecheck` | Chequeo de tipos |
| `npm run db:migrate` | Crear/aplicar migraciones |
| `npm run db:deploy` | Aplicar migraciones pendientes |
| `npm run db:seed` | Cargar datos iniciales |
| `npm run db:studio` | Abrir Prisma Studio |

## Estructura

```
.
├── prisma/           # schema, migraciones y seed
├── public/           # página de ejemplo para probar la API
├── src/
│   ├── controllers/  # responden las peticiones
│   ├── routes/       # definición de rutas
│   ├── services/     # lógica de negocio
│   ├── schemas/      # validación con Zod
│   ├── middlewares/  # auth, admin, errores
│   └── lib/          # config y utilidades
└── tests/            # tests de integración
```