document.addEventListener("DOMContentLoaded", () => {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  const coordinates = JSON.parse(mapDiv.dataset.coordinates || "[]");
  const placeName = mapDiv.dataset.place;

  const map = new maplibregl.Map({
    container: "map",
    style: "https://api.maptiler.com/maps/streets/style.json?key=vk2gofC8agHQj21gpIo4",
    center: coordinates.length === 2 ? coordinates : [77.209, 28.6139],
    zoom: coordinates.length === 2 ? 10 : 5,
  });

  map.addControl(new maplibregl.NavigationControl());

   if (coordinates.length === 2) {
    new maplibregl.Marker()
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup().setText(placeName))
      .addTo(map);
  }
});

// Forward geocoding (Nominatim)
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    name: data[0].display_name,
  };
}

// Priority 1: use DB coordinates if they exist
if (typeof coordinates !== "undefined" && coordinates.length === 2) {
  const [lon, lat] = coordinates;

  map.flyTo({ center: [lon, lat], zoom: 10 });

  new maplibregl.Marker()
    .setLngLat([lon, lat])
    .setPopup(new maplibregl.Popup().setText(placeName))
    .addTo(map);
}
// Priority 2: else fall back to geocoding
else if (typeof placeName !== "undefined") {
  (async () => {
    const result = await geocode(placeName);
    if (result) {
      const { lat, lon, name } = result;

      map.flyTo({ center: [lon, lat], zoom: 10 });

      new maplibregl.Marker()
        .setLngLat([lon, lat])
        .setPopup(new maplibregl.Popup().setText(name))
        .addTo(map);
    }
  })();
}
// If nothing available, just log
else {
  console.warn("No location data available for this listing.");
}
