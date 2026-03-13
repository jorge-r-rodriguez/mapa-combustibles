# FuelMap España

Aplicación web con Next.js 14, Prisma, SQLite y Leaflet para visualizar gasolineras de España y sus precios oficiales.

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

La primera carga sincroniza automáticamente las estaciones desde el dataset oficial.

## Scripts

- `npm run dev`: inicia Next.js y aplica el esquema Prisma.
- `npm run ingest:stations`: fuerza una sincronización manual del dataset oficial.
- `npm run build`: prepara Prisma y genera la aplicación para producción.

## Stack

- Next.js 14 App Router
- TypeScript estricto
- TailwindCSS
- React Leaflet + MarkerCluster
- Prisma + SQLite
- Blog MDX
