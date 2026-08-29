"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type mapboxgl from "mapbox-gl";

const AddressSearch = dynamic(
  () => import("@mapbox/search-js-react").then((module) => module.Geocoder),
  { loading: () => <p className="map-status">Preparing address search...</p>, ssr: false }
);

type GardenMapProps = { accessToken?: string };
type MapboxGL = typeof mapboxgl;

export function GardenMap({ accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN }: GardenMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map>();
  const [mapbox, setMapbox] = useState<MapboxGL>();
  const [status, setStatus] = useState("Loading satellite map...");

  useEffect(() => {
    if (!accessToken || !containerRef.current) return;

    let instance: mapboxgl.Map | undefined;
    void import("mapbox-gl").then(({ default: library }) => {
      instance = new library.Map({
        accessToken,
        center: [-73.5673, 45.5019],
        container: containerRef.current!,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        zoom: 12
      });
      instance.addControl(new library.NavigationControl(), "top-right");
      instance.on("load", () => setStatus("Search for an address to start confirming your yard."));
      instance.on("error", () => setStatus("The map could not load. Check the local token restriction and refresh."));
      setMap(instance);
      setMapbox(library);
    });

    return () => instance?.remove();
  }, [accessToken]);

  if (!accessToken) {
    return <section className="panel map-panel" aria-labelledby="address-map-heading">
      <div className="map-header"><h2 id="address-map-heading">Address map</h2><p>Add the Mapbox public token to <code>.env.local</code>, then restart the local app.</p></div>
    </section>;
  }

  return <section className="panel map-panel" aria-labelledby="address-map-heading">
    <div className="map-header">
      <h2 id="address-map-heading">Address map</h2>
      <p>Search for an address, inspect the satellite view, then confirm yard geometry in the editor below.</p>
      {map && mapbox ? <AddressSearch accessToken={accessToken} map={map} mapboxgl={mapbox} marker onRetrieve={(result) => setStatus(`Selected: ${result.properties.full_address}`)} onSuggestError={() => setStatus("Address search is unavailable. Check the connection and try again.")} placeholder="Search an address" /> : null}
      <p aria-live="polite" className="map-status" role="status">{status}</p>
    </div>
    <div aria-label="Satellite map" className="map-canvas" ref={containerRef} />
    <p className="map-note">Address results stay in the current map session. Confirmed yard geometry saves in this browser.</p>
  </section>;
}
