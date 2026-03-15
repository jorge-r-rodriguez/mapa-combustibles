const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toCartesianKm(lat: number, lon: number, refLat: number) {
  const x = EARTH_RADIUS_KM * toRad(lon) * Math.cos(toRad(refLat));
  const y = EARTH_RADIUS_KM * toRad(lat);

  return { x, y };
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function getBoundingBoxFromRadius(lat: number, lon: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta
  };
}

export function getBoundingBoxFromPoints(points: Array<[number, number]>, paddingKm = 0) {
  const lats = points.map((point) => point[0]);
  const lons = points.map((point) => point[1]);
  const avgLat = lats.reduce((sum, value) => sum + value, 0) / Math.max(lats.length, 1);
  const latPadding = paddingKm / 111;
  const lonPadding = paddingKm / (111 * Math.cos((avgLat * Math.PI) / 180));

  return {
    minLat: Math.min(...lats) - latPadding,
    maxLat: Math.max(...lats) + latPadding,
    minLon: Math.min(...lons) - lonPadding,
    maxLon: Math.max(...lons) + lonPadding
  };
}

export function pointToRouteDistanceKm(
  point: { lat: number; lon: number },
  route: Array<[number, number]>
) {
  if (route.length < 2) {
    return Number.POSITIVE_INFINITY;
  }

  const refLat = route.reduce((sum, [lat]) => sum + lat, 0) / route.length;
  const p = toCartesianKm(point.lat, point.lon, refLat);
  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < route.length - 1; index += 1) {
    const start = toCartesianKm(route[index][0], route[index][1], refLat);
    const end = toCartesianKm(route[index + 1][0], route[index + 1][1], refLat);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      const distance = Math.hypot(p.x - start.x, p.y - start.y);
      minDistance = Math.min(minDistance, distance);
      continue;
    }

    const t = Math.max(
      0,
      Math.min(1, ((p.x - start.x) * dx + (p.y - start.y) * dy) / lengthSquared)
    );
    const projectedX = start.x + t * dx;
    const projectedY = start.y + t * dy;
    const distance = Math.hypot(p.x - projectedX, p.y - projectedY);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}
