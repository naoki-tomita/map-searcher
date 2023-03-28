import React, { useEffect, useState } from "react";
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
  const { setCenter, center, locations, radius, setRadius } = useLocations({ lat: 35.68156, lng: 139.767201, radius: 1000 })
  const onChange = debounce(() => {
    const coor = map?.getCenter()?.toJSON();
    coor && setCenter(coor);
  }, 300);
  const onRadiusChange = debounce(e => setRadius(parseInt(e.target.value, 10)), 300);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const onHover = (name: string) => {
    setHoveredMarker(name);
  }
  const onHoverEnd = () => {
    setHoveredMarker(null);
  }

  function calcOpacity(name: string) {
    if (hoveredMarker == null) {
      return 1.0;
    }
    if (name === hoveredMarker) {
      return 1.0;
    }
    return 0.3;

  }

  return (
    <div>
      <div style={{
        padding: "8px 0",
        position: "fixed",
        fontSize: 10,
        left: 20,
        top: 20,
        width: 240,
        height: 320,
        zIndex: 1,
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0, 0, 0, 0.35)",
        borderRadius: 8,
        boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.35)",
        gap: 4,
      }}>
        <div style={{ padding: "0 16px" }}>
          <div>
            <input type="range" min="1" max="10000" defaultValue="1000" onChange={onRadiusChange} />
          </div>
          <div>
            半径: <input value={radius} style={{ width: 80 }} onChange={e => setRadius(parseInt(e.target.value || "0" , 10))}/> m
          </div>
        </div>
        <div style={{ padding: "0 16px" }}>
          {locations.length}件
        </div>
        <style>
          {`
          li:hover {
            background: #ccc;
          }
          `}
        </style>
        <ul style={{
          height: "100%",
          overflow: "auto",
          padding: "0 16px",
          listStyle: "none"
        }}>
          {locations.map(it =>
            <li
              key={it.name}
              onMouseEnter={() => onHover(it.name)}
              onMouseOut={onHoverEnd}
            >{it.name}</li>)}
        </ul>
      </div>
      <LoadScript googleMapsApiKey="AIzaSyDtoF5sQx1NimzgaaAWCsoN5L1icxY2iM0">
        <GoogleMap
          onLoad={it => setMap(it)}
          mapContainerStyle={{ height: "100vh", width: "100%" }}
          center={center}
          zoom={15}
          onCenterChanged={onChange}
          clickableIcons={false}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          <Circle center={center} radius={radius} />
          {locations.map(({ name, lat, lng }) => <Marker opacity={calcOpacity(name)} key={name} position={{ lat, lng }}/>)}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

const root = createRoot(document.getElementById("app")!);

root.render(<App />)
