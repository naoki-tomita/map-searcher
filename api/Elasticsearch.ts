export type MatchAllQuery = { match_all: {} };
export type Query = MatchAllQuery;

export class Elasticsearch {
  constructor(readonly origin: string, readonly indexName: string) {}

  async healthCheck() {
    try {
      return await fetch(this.origin).then(it => it.ok)
    } catch {
      return false;
    }
  }

  async isExistIndex() {
    const result = await this.get(`/${this.indexName}`);
    return result.ok;
  }

  async createIndex() {
    if (!await this.isExistIndex()) {
      await this.put(`/${this.indexName}`);
    }
  }

  async fetch(path: string, req: any = {}) {
    try {
      const url = `${this.origin}${path}`;
      console.log(`fetch(${url})`, req);
      return await fetch(url, req);
      // return await axios.request({ url: `${this.origin}${path}`, data: req.body, headers: req.headers, method: req.method })
    } catch (e: any) {
      throw e;
    }
  }

  get(path: string) {
    return this.fetch(path);
  }

  put(path: string, body: any = {}) {
    return this.fetch(path, { method: "PUT", headers: {"content-type": "application/json"}, body: JSON.stringify(body) });
  }

  post(path: string, body: any = {}) {
    return this.fetch(path, { method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body) });
  }

  index(document: object, id?: string) {
    if (id) {
      return this.put(`/${this.indexName}/_doc/${id}`, document);
    }
    return this.post(`/${this.indexName}/_doc`, document);
  }

  deleteByQuery(query: Query) {
    return this.post(`/${this.indexName}/_delete_by_query`, { query });
  }

  refresh() {
    return this.get("/_refresh");
  }

  setRefreshInterval(interval: number | `${number}s`) {
    return this.put("/_settings", { "index.refresh_interval": interval })
  }
}
