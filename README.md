# Backend REST API

API REST de una tienda con usuarios, productos y pedidos. Construida con Node.js, TypeScript, Express y PostgreSQL usando Prisma ORM.

## Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma ORM
- AutenticaciÃ³n con JWT (bcrypt para las contraseÃ±as)
- ValidaciÃ³n con Zod
- helmet, cors y rate limiting
- Tests con Vitest + Supertest
- Docker para PostgreSQL

## Requisitos

- Node.js 20 o superior
- PostgreSQL 15 o superior (o Docker)

## Puesta en marcha

1. Instalar dependencias

```bash
npm install
```

2. Crear el archivo `.env` a partir del ejemplo

```bash
cp .env.example .env
```

| Variable | DescripciÃ³n | Valor por defecto |
| --- | --- | --- |
| `PORT` | Puerto donde corre el servidor | `3000` |
| `NODE_ENV` | Entorno de ejecuciÃ³n | `development` |
| `DATABASE_URL` | ConexiÃ³n a la base de datos principal | `postgresql://postgres:postgres@localhost:5432/backend_db?schema=public` |
| `TEST_DATABASE_URL` | ConexiÃ³n a la base de datos de tests | `postgresql://postgres:postgres@localhost:5432/backend_test_db?schema=public` |
| `JWT_SECRET` | Clave secreta para firmar los tokens | â€” |
| `JWT_EXPIRES_IN` | DuraciÃ³n del token | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Ventana del rate limit en ms | `900000` |
| `RATE_LIMIT_MAX` | MÃ¡ximo de peticiones por ventana | `100` |

3. Levantar PostgreSQL con Docker (o usar una instalaciÃ³n local)

```bash
docker compose up -d db
```

4. Crear la base de datos y aplicar las migraciones

```bash
npm run db:migrate
```

5. Cargar los datos iniciales

```bash
npm run db:seed
```

El seed crea dos usuarios y seis productos:

- Administrador: `admin@example.com` / `admin123`
- Usuario normal: `user@example.com` / `user123`

6. Arrancar el servidor en modo desarrollo

```bash
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`.

## Scripts

| Script | DescripciÃ³n |
| --- | --- |
| `npm run dev` | Arranca el servidor con tsx en modo desarrollo |
| `npm run build` | Compila el proyecto a `dist/` |
| `npm start` | Arranca el servidor desde `dist/` |
| `npm run typecheck` | Revisa los tipos con TypeScript |
| `npm test` | Ejecuta los tests |
| `npm run db:migrate` | Crea una migraciÃ³n y la aplica |
| `npm run db:deploy` | Aplica las migraciones pendientes |
| `npm run db:seed` | Carga los datos iniciales |
| `npm run db:studio` | Abre Prisma Studio |

## Estructura

```
.
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ schema.prisma        # Modelos de datos
â”‚   â”œâ”€â”€ migrations/          # Migraciones
â”‚   â””â”€â”€ seed.ts              # Datos iniciales
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ controllers/         # Controladores HTTP
â”‚   â”œâ”€â”€ routes/              # DefiniciÃ³n de rutas
â”‚   â”œâ”€â”€ middlewares/         # ValidaciÃ³n, auth, errores
â”‚   â”œâ”€â”€ services/            # LÃ³gica de negocio
â”‚   â”œâ”€â”€ schemas/             # Esquemas Zod
â”‚   â”œâ”€â”€ lib/                 # ConfiguraciÃ³n y utilidades
â”‚   â”œâ”€â”€ app.ts               # ConfiguraciÃ³n de Express
â”‚   â””â”€â”€ server.ts            # Arranque del servidor
â”œâ”€â”€ tests/                   # Tests con Vitest + Supertest
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ docker-compose.yml
â””â”€â”€ .env.example
```

## AutenticaciÃ³n

La mayorÃ­a de los endpoints requieren un token. Se envÃ­a en el header:

```http
Authorization: Bearer <token>
```

## Endpoints

### AutenticaciÃ³n

#### Registrarse

```http
POST /auth/register
```

Request:

```json
{
  "name": "Pepe",
  "email": "pepe@example.com",
  "password": "secret123"
}
```

Respuesta `201 Created`:

```json
{
  "id": "4520a36b-ac35-40ba-b6f0-e848199d4790",
  "name": "Pepe",
  "email": "pepe@example.com",
  "role": "USER",
  "createdAt": "2026-09-07T04:29:49.985Z",
  "updatedAt": "2026-09-07T04:29:49.985Z"
}
```

Si el email ya existe responde `409 Conflict`.

#### Iniciar sesiÃ³n

```http
POST /auth/login
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Respuesta `200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "createdAt": "2026-09-07T04:29:21.000Z",
    "updatedAt": "2026-09-07T04:29:21.000Z"
  }
}
```

Credenciales incorrectas responden `401 Unauthorized`.

#### Ver mi usuario

```http
GET /auth/me
```

Respuesta `200 OK` con el usuario actual (sin datos de la contraseÃ±a).

### Productos

Los productos son pÃºblicos para leer. Crear, editar y borrar requiere rol `ADMIN`.

#### Listar productos

```http
GET /products
```

ParÃ¡metros opcionales:

| ParÃ¡metro | DescripciÃ³n |
| --- | --- |
| `page` | PÃ¡gina a consultar (por defecto `1`) |
| `limit` | Resultados por pÃ¡gina (por defecto `10`, mÃ¡ximo `100`) |
| `q` | BÃºsqueda por nombre |
| `minPrice` | Precio mÃ­nimo |
| `maxPrice` | Precio mÃ¡ximo |
| `sort` | OrdenaciÃ³n por `name`, `price`, `createdAt` o `updatedAt` |
| `order` | `asc` o `desc` |

Ejemplo:

```http
GET /products?q=wireless&sort=price&order=asc&page=1&limit=10
```

Respuesta `200 OK`:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000000",
      "name": "Wireless Mouse",
      "description": "Ergonomic wireless mouse with silent clicks",
      "price": 24.99,
      "stock": 50,
      "createdAt": "2026-09-07T04:29:21.000Z",
      "updatedAt": "2026-09-07T04:29:21.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### Ver un producto

```http
GET /products/:id
```

Respuesta `200 OK` con el producto o `404 Not Found` si no existe.

#### Crear un producto (admin)

```http
POST /products
```

Request:

```json
{
  "name": "Mouse Inalambrico",
  "description": "Comodo para trabajar todo el dia",
  "price": 39.99,
  "stock": 15
}
```

Respuesta `201 Created` con el producto creado.

#### Editar un producto (admin)

```http
PATCH /products/:id
```

Acepta los mismos campos que la creaciÃ³n. Respuesta `200 OK`.

#### Borrar un producto (admin)

```http
DELETE /products/:id
```

Respuesta `204 No Content`.

### Pedidos

Requieren autenticaciÃ³n. Un usuario normal solo ve y cancela sus propios pedidos; el admin puede ver todos.

#### Crear un pedido

```http
POST /orders
```

Request:

```json
{
  "items": [
    { "productId": "00000000-0000-4000-8000-000000000000", "quantity": 2 }
  ]
}
```

El total se calcula en el servidor y el stock se descuenta en una transacciÃ³n. Respuesta `201 Created` con el pedido completo, incluidos sus Ã­tems. Si un producto no existe o no hay stock suficiente responde `400 Bad Request`.

#### Listar pedidos

```http
GET /orders?page=1&limit=10
```

Respuesta `200 OK`:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10
}
```

#### Ver un pedido

```http
GET /orders/:id
```

Respuesta `200 OK`. Un usuario que no es dueÃ±o del pedido recibe `403 Forbidden` (el admin siempre puede verlo).

#### Cancelar un pedido

```http
PATCH /orders/:id/cancel
```

Devuelve el stock de los productos. Respuesta `200 OK` con el pedido en estado `CANCELLED`. Cancelar dos veces responde `400 Bad Request`.

### Usuarios

Requieren autenticaciÃ³n. Cada usuario solo accede a su propio perfil; el admin accede a todos.

#### Listar usuarios (admin)

```http
GET /users
```

Respuesta `200 OK` con un array de usuarios.

#### Ver un usuario

```http
GET /users/:id
```

Respuesta `200 OK`.

#### Editar un usuario

```http
PATCH /users/:id
```

Acepta `name`, `email` o `password`. Respuesta `200 OK`.

#### Borrar un usuario

```http
DELETE /users/:id
```

Respuesta `204 No Content`.

## Errores

Todos los errores usan el mismo formato JSON:

```json
{
  "error": "Mensaje de error"
}
```

| CÃ³digo | CuÃ¡ndo |
| --- | --- |
| `400` | ValidaciÃ³n fallida o stock insuficiente |
| `401` | Falta token o credenciales invÃ¡lidas |
| `403` | Sin permisos o acceso a un recurso ajeno |
| `404` | Recurso no encontrado |
| `409` | Email duplicado |
| `429` | Demasiadas peticiones (rate limit) |

## Test

```bash
npm test
```

Los tests levantan la base de datos de prueba (`TEST_DATABASE_URL`), aplican las migraciones, limpian las tablas entre ejecuciones y cubren autenticaciÃ³n, productos y pedidos.

## Docker

Para compilar y correr la API completa en un contenedor:

```bash
docker build -t backend-rest-api .
docker run -p 3000:3000 --env-file .env backend-rest-api
```

El `docker-compose.yml` levanta el contenedor de PostgreSQL: