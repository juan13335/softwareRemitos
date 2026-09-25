# softwareRemitos

Sistema de gestión para remitos, productos, pagos y socios, pensado para controlar cobranzas y liquidaciones de manera centralizada.

La aplicación está dividida en dos partes:
- Frontend en React + Vite para la interfaz de usuario.
- Backend en Node.js + Express para la API y conexión con Supabase.

## Descripción del proyecto

softwareRemitos permite:
- Registrar y listar remitos.
- Gestionar productos y clientes/socios.
- Registrar pagos y consultar saldos pendientes.
- Visualizar un dashboard con indicadores clave de cobro.
- Editar o consultar detalles de remitos individualmente.

El repositorio está orientado a un flujo de trabajo de administración comercial simple y eficiente, con la lógica principal agrupada por recursos: remitos, productos, pagos y socios.

## Stack tecnológico

### Frontend
- React 19
- Vite
- React Router
- Axios
- Lucide React
- Tailwind CSS

### Backend
- Node.js
- Express
- Supabase JavaScript SDK
- CORS
- dotenv
- Multer

## Estructura del repositorio

```text
softwareRemitos/
├── client/
│   ├── src/
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── vercel.json
├── server/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
├── README.md
└── package.json (si aplica en tu entorno local)
```

## Funcionalidades principales

- Dashboard con resumen general de remitos y pagos.
- Listado de remitos con paginación.
- Detalle por remito.
- Carga y edición de remitos.
- Registro de productos.
- Registro de pagos.
- Consulta de socios y saldo a favor.
- Integración con Supabase para persistencia de datos.

## Requisitos previos

- Node.js 18 o superior
- npm
- Cuenta de Supabase configurada
- Variables de entorno definidas

## Configuración de variables de entorno

### Backend (`server/.env`)

```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:3000
```

> El backend se ejecuta normalmente en el puerto 3000, y el frontend usa ese valor para consumir la API.

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/juan13335/softwareRemitos.git
cd softwareRemitos
```

2. Instalar dependencias del frontend:

```bash
cd client
npm install
```

3. Instalar dependencias del backend:

```bash
cd ../server
npm install
```

## Ejecución local

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

Luego abrí la URL que te indique Vite, normalmente algo como:

```text
http://localhost:5173
```

## Scripts disponibles

### Frontend (`client`)
- `npm run dev`: inicia el entorno de desarrollo
- `npm run build`: genera la build de producción
- `npm run preview`: sirve la build localmente

### Backend (`server`)
- `npm run dev`: inicia el servidor con nodemon
- `npm run start`: inicia el servidor en producción

## Endpoints principales

La API del backend expone distintos recursos:

- `/socios`
- `/remitos`
- `/productos`
- `/pagos`

Ejemplos de uso:

```http
GET /remitos
POST /remitos
GET /remitos/detalle/:id
PUT /remitos/editar/:id
DELETE /remitos/:id
```

## Estado del proyecto

Este repositorio se encuentra en desarrollo activo y se utiliza como sistema de control interno para gestión de remitos y pagos.

## Licencia

Este proyecto no especifica licencia en el repositorio actual.

## Autor

- juan13335

## Enlace de la app

- https://software-remitos.vercel.app

## Contribuciones

Si querés colaborar con el proyecto:
1. Hacé un fork del repositorio.
2. Creá una rama para tu cambio.
3. Realizá tus modificaciones.
4. Abrí un pull request con una descripción clara del cambio.

## Nota

El proyecto utiliza Supabase como backend de datos. Asegurate de tener correctamente configurado tu proyecto y las credenciales en el archivo `.env` antes de correr la aplicación.
