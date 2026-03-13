import { syncStations } from "../services/station-ingest";

async function main() {
  const result = await syncStations();
  console.log(
    `Sincronización completada: ${result.total} estaciones actualizadas (${result.updatedAt.toISOString()}).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
