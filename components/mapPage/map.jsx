import mapboxgl from "mapbox-gl";
import { useState, useEffect, useRef } from "react";

import "mapbox-gl/dist/mapbox-gl.css";
import s from "../../styles/map/map.module.css";
import AsideInfo from "./asideInfo";
import { colors, layersTitles, images, layersDescription  } from "./consts";

function MapboxMap({ places }) {
  const [myMap, setMap] = useState();
  const [tags, setTags] = useState();

  const [currentPoint, setCurrentPoint] = useState({});
  const [currentLayer, setCurrentLayer] = useState({});
  const [asideVisible, setAsideVisible] = useState(false);

  const mapNode = useRef(null);

  const types = Array.from(
    new Set(places.features.map((p) => p.properties.type))
  );

  useEffect(() => {
    const node = mapNode.current;
    const tagObj = {};

    types.forEach((t) => (tagObj[t] = true));
    setTags(tagObj);

    if (typeof window === "undefined" || node === null) return;

    const mapboxMap = new mapboxgl.Map({
      container: node,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      style: "mapbox://styles/mapbox/light-v10",
      center: [37.215213, 54.872224],
      zoom: 13,
    });

    mapboxMap.once("load", (e) => {
      e.target.resize();
      setMap(mapboxMap);

      places.features.map((p) => {
        const t1 = p.geometry.coordinates[0];
        const t2 = p.geometry.coordinates[1];

        const newPoint = { ...p };
        newPoint.geometry.coordinates = [t2, t1];
        return newPoint;
      });

      types.map((type) => {
        const filteredPoints = places.features.filter((p) => {
          return p.geometry.coordinates[0] && p.properties.type === type;
        });

        mapboxMap.addSource(`${type}-src`, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: filteredPoints,
          },
        });

        mapboxMap.addLayer({
          id: type,
          type: "circle",
          source: `${type}-src`,
          layout: {
            visibility: "none",
          },
          paint: {
            "circle-radius": 8,
            "circle-color": colors[type],
          },
        });
      });
    });

    types.map((tag) => {
      mapboxMap.on("click", tag, (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        setCurrentPoint({
          title: e.features[0].properties.title,
          description: e.features[0].properties.description,
          image: e.features[0].properties.image,
          type: e.features[0].properties.type,
        });

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        setAsideVisible(true);
      });

      mapboxMap.on("mouseenter", tag, () => {
        mapboxMap.getCanvas().style.cursor = "pointer";
      });

      mapboxMap.on("mouseleave", tag, () => {
        mapboxMap.getCanvas().style.cursor = "";
      });
    });

    return () => {
      mapboxMap.remove();
    };
  }, []);

  const filterPoints = (name) => {
    const visibility =
      myMap.getLayoutProperty(name, "visibility") === "none"
        ? "visible"
        : "none";

    myMap.setLayoutProperty(name, "visibility", visibility);

    const updatedTags = { ...tags };
    updatedTags[name] = visibility === "visible" ? false : true;

    setTags(updatedTags);

    if (!updatedTags[name]) {
      setCurrentPoint({
        title: layersTitles[name],
        description: layersDescription[name],
        type: name,
      });
      setAsideVisible(true);
    }

    if (asideVisible && updatedTags[name]) {
      setAsideVisible(false);
    }
  };

  return (
    <>
      <AsideInfo
        title={currentPoint.title}
        description={currentPoint.description}
        onClose={() => setAsideVisible(false)}
        visible={asideVisible}
        image={currentPoint.image}
        type={currentPoint.type}
      />
      <div className={s.mapToolBar}>
        <div className={s.mapToolBarTagList}>
          {types.map((name) => (
            <span
              className={`${s.mapToolBarTag} ${
                tags && tags[name] ? "" : s.active
              }`}
              key={name}
              style={
                tags && tags[name]
                  ? { borderColor: colors[name] }
                  : { background: colors[name] }
              }
              onClick={() => filterPoints(name)}
            >
              {layersTitles[name]}
            </span>
          ))}
        </div>
      </div>
      <section className={s.mapWrapper}>
        <div ref={mapNode} className={s.mapContainer} />
      </section>
    </>
  );
}

export default MapboxMap;
