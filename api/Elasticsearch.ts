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
export type NestedQuery = {
  nested: {
    path: string;
    query: Query;
  }
}

type GeoShape = GeoShapePolygon | GeoShapeCircle | GeoShapeLineString;

type GeoShapePolygon = {
  type: "polygon";
  coordinates: Array<[number, number]>;
}

type GeoShapeLineString = {
  type: "linestring";
  coordinates: Array<[number, number]>;
};

type GeoShapeCircle = {
  type: "circle";
  radius: string;
  coordinates: [number, number];
}

export type GeoShapeQuery = {
  geo_shape: {
    [key: string]: {
      shape: GeoShape;
      relation: "intersects" | "disjoint" | "within" | "contains";
    }
  }
}
export type Query = MatchAllQuery | BoolQuery | RangeQuery | TermQuery | NestedQuery | GeoShapeQuery;

export class Elasticsearch {
  constructor(
    readonly origin: string,
    readonly indexName: string,
    readonly user: string = "elastic",
    readonly password: string = "password"
  ) {}

  async healthCheck() {
    try {
      return await this.fetch("/_cluster/health?wait_for_status=yellow&timeout=10s").then(it => it.ok)
    } catch {
      return false;
    }
  }

  async isExistIndex() {
    const result = await this.get(`/${this.indexName}`);
    return result.ok;
  }

  async createIndex(mapping: object = {}) {
    if (!await this.isExistIndex()) {
      return this.put(`/${this.indexName}`, { mappings: { properties: mapping } });
    }
  }

  async fetch(path: string, req: any = {}) {
    try {
      const url = `${this.origin}${path}`;
      console.log(`fetch(${url})`, req);
      req.headers = { ...req.headers ?? {}, "Authorization": `Basic ${Buffer.from(`${this.user}:${this.password}`).toString("base64")}` };
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
    return this.fetch(path, { method: "POST", headers: {"content-type": "application/json"}, body: typeof body === "object" ? JSON.stringify(body) : body });
  }

  index(document: object) {
    return this.post(`/${this.indexName}/_doc`, document);
  }

  bulkIndex(documents: object[]) {
    return this.post(
      `/_bulk`,
      documents
        .map(it => `${JSON.stringify({index: { _index: this.indexName } })}\n${JSON.stringify(it)}`)
        .join("\n") + "\n",
    )
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
