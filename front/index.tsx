import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleMap, LoadScript, Marker, Polygon } from "@react-google-maps/api";
import debounce from "debounce";

function search(query: any) {
  return fetch("/es/geo/_search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      size: 100,
      query
    })
  });
}

function filter(...args: any[]) {
  return {
    filter: args
  }
}

function rangeQuery(key: string, from: number, to: number) {
  return {
    range: {
      [key]: {
        lte: to,
        gte: from,
      }
    }
  };
}

type Location = { name: string, lat: number, lng: number };

function useLocations({ lat, lng }: { lat: number, lng: number }) {
  const [center, setCenter] = useState({ lat, lng });
  const [locations, setLocations] = useState<Location[]>([]);
  const range = {
    lat: { from: center.lat - 0.003, to: center.lat + 0.003 },
    lng: { from: center.lng - 0.003, to: center.lng + 0.003 },
  }
  useEffect(() => {
    search({
      bool: filter(
        rangeQuery("lat", range.lat.from, range.lat.to),
        rangeQuery("lng", range.lng.from, range.lng.to),
      )
    })
    .then<{ hits: { hits: Array<{ _source: Location }> }}>(it => it.json())
    .then(it => it.hits.hits.map(it => it._source))
    .then(setLocations);
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
          <Polygon path={[
            { lat: range.lat.from, lng: range.lng.from },
            { lat: range.lat.from, lng: range.lng.to },
            { lat: range.lat.to, lng: range.lng.to },
            { lat: range.lat.to, lng: range.lng.from },
          ]}></Polygon>
          {locations.map(({ lat, lng }) => <Marker position={{ lat, lng }}/>)}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

const root = createRoot(document.body);

root.render(<App />)
