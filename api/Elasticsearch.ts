export type MatchAllQuery = { match_all: {} };
export type TermQuery = {
  term : { [key: string]: string; }
}
export type RangeQuery = {
  range: {
    [key: string]: {
      gt?: number;
      gte?: number;
      lt?: number;
      lte?: number;
      boost?: number;
    }
  }
}
export type BoolQuery = {
  bool: {
    must?: Query[];
    filter?: Query[];
    should?: Query[];
    must_not?: Query[];
    minimum_should_match?: number;
    boost?: number;
  }
}
export type Query = MatchAllQuery | BoolQuery | RangeQuery | TermQuery;

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

  search<T>(query: Query, size?: number): Promise<SearchResponse<T>> {
    return this.post(`/${this.indexName}/_search`, { query, size }).then(it => it.json());
  }
}
type SearchResponse<T = any> = {
  took: number,
  timed_out: boolean,
  hits:{
    total: number,
    max_score: number,
    hits: Array<{
      _index: string,
      _type: string,
      _id: string,
      _score: number,
      _source: T
    }>
  }
}
