import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleMap, LoadScript, Marker, Polygon } from "@react-google-maps/api";
import debounce from "debounce";

function queryString(object: object) {
  return Object.entries(object).map(([k, v]) => `${k}=${v}`).join("&");
}

function search(lat: number, lng: number, radius: number) {
  return fetch(`/api/v1/addresses?${queryString({ lat, lng, radius })}`);
}

type Location = { name: string, lat: number, lng: number };

function useLocations({ lat, lng }: { lat: number, lng: number }) {
  const [center, setCenter] = useState({ lat, lng });
  const [locations, setLocations] = useState<Location[]>([]);
  const [range, setRange] = useState<{ [key: string]: { from: number; to: number; } }>();
  useEffect(() => {
    search(center.lat, center.lng, 5000)
    .then<{
      area: {
        lat: {
          from: number;
          to: number;
        };
        lng: {
          from: number;
          to: number;
        };
      };
      addresses: Location[];
    }>(it => it.json())
    .then(it => {
      setRange(it.area);
      setLocations(it.addresses);
    });
  }, [center.lat, center.lng]);
  return {
    range,
    center,
    locations,
    setCenter(lat: number, lng: number) {
      setCenter({ lat, lng })
    }
  }
}


const App = () => {
  const [map, setMap] = useState<google.maps.Map>()
  const { setCenter, center, locations, range } = useLocations({ lat: 35.69575, lng: 139.77521 })
  const onChange = debounce(() => {
    const coor = map?.getCenter()?.toJSON();
    coor && setCenter(coor.lat, coor.lng);
  }, 300);

  return (
    <div>
      <ul style={{ position: "fixed", fontSize: 10, left: 20, top: 20, width: 240, height: 320, overflow: "auto", zIndex: 1, background: "#fff" }}>
        {locations.map(it => <li key={it.name}>{it.name}</li>)}
      </ul>
      <LoadScript googleMapsApiKey="AIzaSyDtoF5sQx1NimzgaaAWCsoN5L1icxY2iM0">
        <GoogleMap
          onLoad={it => setMap(it)}
          mapContainerStyle={{ height: "100vh", width: "100%" }}
          center={center}
          zoom={17}
          onCenterChanged={onChange}
        >
          {range && <Polygon path={[
            { lat: range.lat.from, lng: range.lng.from },
            { lat: range.lat.from, lng: range.lng.to },
            { lat: range.lat.to, lng: range.lng.to },
            { lat: range.lat.to, lng: range.lng.from },
          ]}></Polygon>}
          {locations.map(({ lat, lng }) => <Marker position={{ lat, lng }}/>)}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

const root = createRoot(document.body);

root.render(<App />)
