import { $, sleep } from "zx";

const chars = "abcdefg1234567890";
function random() {
  return Array(8).fill(null).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export class ElasticsearchContainer {
  id: string;
  constructor(
    readonly port: number,
    readonly user: string = "elastic",
    readonly password: string = "password"
  ) {
    this.id = random();
  }
  run() {
    return $`
      docker run \
      --rm \
      -v $PWD/.es-data:/usr/share/elasticsearch/data \
      --name elasticsearch_${this.id} \
      -e "discovery.type=single-node" \
      -e "ELASTIC_PASSWORD=password" \
      -p ${this.port}:9200 \
      elasticsearch:8.13.0`.catch(() => console.log("Elasticsearch has been shutdown"));
  }

  async healthCheck() {
    return fetch(
      `http://localhost:${this.port}/_cluster/health?wait_for_status=yellow&timeout=60s`,
      { headers: { authorization: `Basic ${Buffer.from(`${this.user}:${this.password}`).toString("base64")}` } })
    .then(it => it.ok).catch(() => false);
  }

  async waitForReady() {
    while (true) {
      const result = await this.healthCheck();
      if (result) {
        return;
      }
      await sleep("2s");
    }
  }

  exit() {
    return $`docker stop elasticsearch_${this.id}`;
  }
}
