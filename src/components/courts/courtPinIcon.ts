import L from "leaflet";

export const courtPinIcon = L.divIcon({
  className: "court-pin-icon",
  html: `
    <span class="court-pin-icon__shape" aria-hidden="true"></span>
    <img class="court-pin-icon__ball" src="/Basketball.png" alt="" />
  `,
  iconSize: [42, 54],
  iconAnchor: [21, 54],
  popupAnchor: [0, -50],
});
