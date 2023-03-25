import { $, sleep } from "zx";

const chars = "abcdefg1234567890";
function random() {
  return Array(8).fill(null).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export class ElasticsearchContainer {
  id: string;
  constructor(readonly port: number) {
    this.id = random();
  }
  run() {
    return $`docker run --rm -v $PWD/.es-data:/usr/share/elasticsearch/data --name elasticsearch_${this.id} -e "discovery.type=single-node" -p ${this.port}:9200 elasticsearch:6.5.0`.catch(() => console.log("Elasticsearch has been shutdown"));
  }

  async healthCheck() {
    return fetch(`http://localhost:${this.port}`).then(it => it.ok).catch(() => false);
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
