import Koa from "koa";
import Router from "@koa/router";

const app = new Koa();
const router = new Router();

router.get("/v1/addresses", (ctx, next) => {
  const { lat = "35.7074051", lng = "139.8090101", radius = "1000" } = ctx.query;

});

app.listen(8080);
