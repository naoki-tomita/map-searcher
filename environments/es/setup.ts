import { parse } from "csv";
import { Elasticsearch } from "api/Elasticsearch";
import { ElasticsearchContainer } from "./ElasticsearchContainer";
import { sleep } from "zx";

const es = new Elasticsearch("http://localhost:9200", "geo");

async function parseAsync(text: string) {
  return new Promise<any[]>((ok, ng) => {
    parse(text, { encoding: "utf-8", columns: true }, (e, r) => e ? ng(e) : ok(r))
  });
}

type Address = {
  都道府県コード: string;
  都道府県名: string;
  都道府県名カナ: string;
  都道府県名ローマ字: string;
  市区町村コード: string;
  市区町村名: string;
  市区町村名カナ: string;
  市区町村名ローマ字: string;
  大字町丁目名: string;
  大字町丁目名カナ: string;
  大字町丁目名ローマ字: string;
  "小字・通称名": string;
  緯度: string;
  経度: string;
}

async function loadData(): Promise<Address[]> {
  const response = await fetch("https://geolonia.github.io/japanese-addresses/latest.csv");
  if (!response.ok) {
    throw Error("Failed to fetch geo data.")
  }
  return response.text().then(text => parseAsync(text));
}

async function main() {
  const esContainer = new ElasticsearchContainer(9200);
  esContainer.run();
  try {
    const [_, data] = await Promise.all([
      esContainer.waitForReady(),
      loadData(),
    ]);

    await es.createIndex({
      name: {
        type: "keyword"
      },
      geo: {
        type: "geo_point"
      },
      location: {
        type: "nested",
        properties: {
          lat: {
            type: "float"
          },
          lng: {
            type: "float"
          }
        }
      }
    }).then(it => it?.json()).then(console.log);
    await es.deleteByQuery({ match_all: {} });
    await es.setRefreshInterval(-1);

    const nameAndCoordinates = data
      .map(it => ({
        name: `${it.都道府県名} ${it.市区町村名} ${it.大字町丁目名}${it["小字・通称名"] !== "" ? `(${it["小字・通称名"]})` : ""}`,
        geo: {
          type: "Point",
          coordinates: [Number.parseFloat(it.経度), Number.parseFloat(it.緯度)]
        },
        location: {
          lat: Number.parseFloat(it.緯度),
          lng: Number.parseFloat(it.経度),
        },
      }));

    const pageSize = parseInt(process.env.PAGE_SIZE ?? "10000");
    for (const page of Array(Math.floor(nameAndCoordinates.length / pageSize) + 1).fill(null).map((_, i) => i)) {
      const current = nameAndCoordinates.slice(page * pageSize, (page + 1) * pageSize);
      console.log(`page: ${page}, count: ${current.length}`);
      await es.bulkIndex(current).then(it => it?.json()).then(it => console.log(it.items[0]));
      await es.refresh();
    }

  } catch (e) {
    console.error(e);
  } finally {
    await es.refresh();
    await es.setRefreshInterval("1s");
    // await esContainer.exit()
  }
}

main();
