import Map from "../components/mapPage/map";

import { promises as fs } from "fs";
import path from "path";

export default function Home({ points }) {
  return <Map places={points} />;
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "/public/assets/points.json");
  const fileContents = await fs.readFile(filePath, "utf-8");
  const parsed = await JSON.parse(fileContents);

  const mapboxPoints = parsed.map((p) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: p.coordinates,
    },
    properties: {
      exist: true,
      type: p.type,
      title: p.title,
      image: p?.image || null,
      description: p.description,
    },
  }));

  return {
    props: {
      points: {
        type: "FeatureCollection",
        features: [...mapboxPoints],
      },
    },
  };
}
