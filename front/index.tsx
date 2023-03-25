import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api";
import debounce from "debounce";

function queryString(object: object) {
  return Object.entries(object).map(([k, v]) => `${k}=${v}`).join("&");
}

function search(lat: number, lng: number, radius: number) {
  return fetch(`/api/v1/addresses?${queryString({ lat, lng, radius })}`);
}

type Location = { name: string, lat: number, lng: number };

function useLocations({ lat, lng, radius: defaultRadius }: { lat: number, lng: number, radius: number }) {
  const [center, setCenter] = useState({ lat, lng });
  const [radius, setRadius] = useState(defaultRadius);
  const [locations, setLocations] = useState<Location[]>([]);
  useEffect(() => {
    search(center.lat, center.lng, radius)
    .then<{ addresses: Location[]; }>(it => it.json())
    .then(it => {
      setLocations(it.addresses);
    });
  }, [center.lat, center.lng, radius]);
  return {
    center,
    locations,
    radius,
    setRadius,
    setCenter,
  }
}


const App = () => {
  const [map, setMap] = useState<google.maps.Map>()
  const { setCenter, center, locations, radius, setRadius } = useLocations({ lat: 35.69575, lng: 139.77521, radius: 1000 })
  const onChange = debounce(() => {
    const coor = map?.getCenter()?.toJSON();
    coor && setCenter(coor);
  });
  const onRadiusChange = debounce(e => setRadius(parseInt(e.target.value, 10)));

  return (
    <div>
      <div>
        <input type="range" min="1" max="10000" defaultValue="1000" onChange={onRadiusChange} />半径: <input value={radius} onChange={e => setRadius(parseInt(e.target.value || "0" , 10))}/>m
        <ul style={{ position: "fixed", fontSize: 10, left: 20, top: 20, width: 240, height: 320, overflow: "auto", zIndex: 1, background: "#fff" }}>
          {locations.map(it => <li key={it.name}>{it.name}</li>)}
        </ul>
      </div>
      <LoadScript googleMapsApiKey="AIzaSyDtoF5sQx1NimzgaaAWCsoN5L1icxY2iM0">
        <GoogleMap
          onLoad={it => setMap(it)}
          mapContainerStyle={{ height: "100vh", width: "100%" }}
          center={center}
          zoom={17}
          onCenterChanged={onChange}
        >
          <Circle center={center} radius={radius} />
          {locations.map(({ name, lat, lng }) => <Marker key={name} position={{ lat, lng }}/>)}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

const root = createRoot(document.body);

root.render(<App />)
