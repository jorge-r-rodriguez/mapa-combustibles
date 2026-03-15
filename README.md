# FuelMap España

Aplicación web con Next.js 14, Prisma, SQLite y Leaflet para visualizar gasolineras de España con precios oficiales, analítica nacional y herramientas de optimización de repostaje.

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

La primera carga sincroniza automáticamente las estaciones desde el dataset oficial.

## Funcionalidades destacadas

- Marcadores con precio y color según nivel de coste.
- Mapa de calor de precios con activación manual.
- Vista `Mapa | Lista` con ordenación por precio o distancia.
- Índice nacional de combustible con variación semanal.
- Optimizador de repostaje en ruta usando OSRM.
- Página nacional de estaciones más baratas.
- Blog SEO con plantillas MDX reutilizables.

## Scripts

- `npm run dev`: inicia Next.js y aplica el esquema Prisma.
- `npm run ingest:stations`: fuerza una sincronización manual del dataset oficial.
- `npm run build`: prepara Prisma y genera la aplicación para producción.

## Stack

- Next.js 14 App Router
- TypeScript estricto
- TailwindCSS
- React Leaflet + MarkerCluster + Leaflet.heat
- Prisma + SQLite
- Recharts
- Blog MDX

## Variables opcionales

- `OSRM_API_URL`: endpoint base de OSRM para cálculo de rutas.
