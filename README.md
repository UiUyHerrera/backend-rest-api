# Backend REST API

API REST de una tienda con usuarios, productos y pedidos. Hecha con Node.js, TypeScript, Express y PostgreSQL.

Incluye autenticación con JWT, validación con Zod, rate limiting y un set de tests de integración. Trae dos cosas para probarla sin Postman: una página de ejemplo en `public/` y la documentación interactiva con Swagger.

## Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- JWT (bcrypt para las contraseñas) + Zod
- Swagger UI para documentar la API
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

Con eso la API queda en `http://localhost:3000`. En el navegador:

- `http://localhost:3000/` → página de ejemplo para probar login, carrito y pedidos.
- `http://localhost:3000/docs` → documentación interactiva de la API (Swagger UI). También podés bajar el spec en `http://localhost:3000/openapi.json`.

El seed crea dos cuentas:

- Admin: `admin@example.com` / `admin123`
- Usuario: `user@example.com` / `user123`

## Variables de entorno

El `.env.example` tiene todas con sus valores de ejemplo. Las importantes:

- `DATABASE_URL`: conexión a la base principal.
- `TEST_DATABASE_URL`: conexión a la base que usan los tests.
- `JWT_SECRET`: clave para firmar los tokens. Cambiarla en producción.
- `PORT` (3000), `JWT_EXPIRES_IN` (7d) y los límites de rate limiting están con valores sanos por defecto.

## Arquitectura

Una petición entra por `app.ts` (middlewares globales: helmet, cors, json, rate limit, estáticos) y de ahí a las rutas. Las rutas validan el body y los params con Zod y pasan la petición al controlador. El controlador llama al service, que hace la lógica de negocio contra Prisma/PostgreSQL y responde.

```
Request → app.ts → routes → middlewares (auth/admin/validate) → controllers → services → Prisma → PostgreSQL
```

Lo más relevante de la lógica de negocio:

- **Auth**: bcrypt con 10 rondas para las contraseñas; JWT de 7 días. El `passwordHash` nunca sale en las respuestas.
- **Productos**: la lectura es pública; escribir (crear/editar/borrar) es solo admin. Listado con búsqueda, precio mínimo/máximo, orden y paginación.
- **Pedidos**: al crear, el servidor valida existencias, calcula el total con los precios actuales y descuenta stock, todo en una transacción. Cancelar devuelve el stock. Un usuario normal solo ve/cancela sus propios pedidos; el admin ve todos.
- **Usuarios**: cada usuario accede a su propio perfil; el admin accede a todos.
- **Errores**: todos con el mismo formato `{ "error": "mensaje" }` para que el cliente los maneje parejo.

## Endpoints

La mayoría de las rutas requieren el header `Authorization: Bearer <token>`. La lista completa, con parámetros y ejemplos, está en `http://localhost:3000/docs`.

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

## Docker

Para levantar la base y la API juntas:

```bash
docker compose up --build
```

El contenedor de la API aplica las migraciones al arrancar. La API queda en `http://localhost:3000` y el Postgres en el puerto `5432`. Si querés correr la imagen sola:

```bash
docker build -t backend-rest-api .
docker run -p 3000:3000 -e DATABASE_URL=postgresql://postgres:postgres@tu_db/backend_db?schema=public backend-rest-api
```

## Estructura

```
.
├── prisma/           # schema, migraciones y seed
├── public/           # página de ejemplo para probar la API
├── docs/             # spec OpenAPI (swagger)
├── src/
│   ├── controllers/  # responden las peticiones
│   ├── routes/       # definición de rutas
│   ├── services/     # lógica de negocio
│   ├── schemas/      # validación con Zod
│   ├── middlewares/  # auth, admin, errores
│   └── lib/          # config y utilidades
└── tests/            # tests de integración
```