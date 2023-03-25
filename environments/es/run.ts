import { ElasticsearchContainer } from "./ElasticsearchContainer";

async function main() {
  const esContainer = new ElasticsearchContainer(9200);
  esContainer.run();
  await esContainer.waitForReady();
  console.log(`Ready to search!`);
}

main();
