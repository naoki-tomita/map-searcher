import Koa from "koa";
import Router from "@koa/router";
import { Elasticsearch } from "./Elasticsearch";

const app = new Koa();
const router = new Router();
const es = new Elasticsearch(process.env.ES_HOST ?? "http://localhost:9200", "geo");

const RadiusOfEarth = 6371000;
router.get("/v1/addresses", async (ctx, next) => {
  const { lat = "35.7074051", lng = "139.8090101", radius = "1000" } = ctx.query;
  const [latn, lngn, radiusn] = [parseFloat(lat as string), parseFloat(lng as string), parseFloat(radius as string)];

  // lat_diff = (d / R) * (180 / math.pi)
  const latDegree = (radiusn / RadiusOfEarth) * (180 / Math.PI);
  // lon_diff = (d / R) * (180 / math.pi) / math.cos(lat_center * math.pi / 180)
  const lngDegree = (radiusn / RadiusOfEarth) * (180 / Math.PI) / Math.cos(latn * Math.PI / 180);

  const results = await es.search<{ name: string, lng: number, lat: number }>({
    bool: {
      must: [
        {
          range: {
            lat: {
              gte: latn - latDegree, lte: latn + latDegree,
            }
          }
        },
        {
          range: {
            lng: {
              gte: lngn - lngDegree, lte: lngn + lngDegree,
            }
          }
        }
      ]
    }
  }, 1000);
  ctx.response.body = JSON.stringify({
    area: {
      lat: {
        from: latn - latDegree,
        to: latn + latDegree,
      },
      lng: {
        from: lngn - lngDegree,
        to: lngn + lngDegree,
      }
    },
    addresses: results.hits.hits.map(it => it._source),
  });
  ctx.response.header = { "content-type": "application/json" };
});

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8080);
