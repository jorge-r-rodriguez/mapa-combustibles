import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  GOV_FUEL_DATASET_URL: z
    .string()
    .url()
    .default(
      "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/"
    ),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_CENTER_LAT: z.coerce.number().default(40.4168),
  NEXT_PUBLIC_DEFAULT_CENTER_LON: z.coerce.number().default(-3.7038),
  NEXT_PUBLIC_DEFAULT_ZOOM: z.coerce.number().default(6)
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  GOV_FUEL_DATASET_URL: process.env.GOV_FUEL_DATASET_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DEFAULT_CENTER_LAT: process.env.NEXT_PUBLIC_DEFAULT_CENTER_LAT,
  NEXT_PUBLIC_DEFAULT_CENTER_LON: process.env.NEXT_PUBLIC_DEFAULT_CENTER_LON,
  NEXT_PUBLIC_DEFAULT_ZOOM: process.env.NEXT_PUBLIC_DEFAULT_ZOOM
});
