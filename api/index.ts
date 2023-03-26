import Koa from "koa";
import Router from "@koa/router";
import { Elasticsearch } from "./Elasticsearch";
import { CoordinatorSearchUseCase } from "./CoordinatorSearchUseCase";
import { Area, Degree, LatLng, Meter } from "./Domain";

const app = new Koa();
const router = new Router();
const es = new Elasticsearch(process.env.ES_ORIGIN ?? "http://localhost:9200", "geo");
const usecase = new CoordinatorSearchUseCase(es);

router.get("/v1/addresses", async (ctx, next) => {
  const { lat = "35.7074051", lng = "139.8090101", radius = "1000" } = ctx.query;
  const [latn, lngn, radiusn] = [parseFloat(lat as string), parseFloat(lng as string), parseFloat(radius as string)];
  const coordinators = await usecase.findCoordinatorsInArea(new Area(new LatLng(new Degree(latn), new Degree(lngn)), new Meter(radiusn)));

  ctx.response.body = JSON.stringify({
    addresses: coordinators.map(it => ({
      name: it.name.value,
      lat: it.center.lat.value,
      lng: it.center.lng.value,
    })),
  });
  ctx.response.header = { "content-type": "application/json" };
});

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8080);
console.log("Server started on localhost:8080");
