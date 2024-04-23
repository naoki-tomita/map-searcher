import { Area, Coordinator, Coordinators, Degree, LatLng, Name } from "./Domain";
import { Elasticsearch } from "./Elasticsearch";

export class CoordinatorSearchUseCase {
  constructor(readonly es: Elasticsearch) {}
  async findCoordinatorsInArea(area: Area) {
    const coordinatorsInSquare = await this.findCoordinatorsInSquare(area.leftTop, area.rightBottom);
    return coordinatorsInSquare
      .excludeOutOfArea(area)
      .sortFromNorthWest();
  }

  private findCoordinatorsInSquare(leftTop: LatLng, rightBottom: LatLng) {
    return this.es.search<{
      name: string,
      location: {
        lat: number,
        lng: number
      }
    }>({
      nested: {
        path: "location",
        query: {
          bool: {
            must: [
              {
                range: {
                  "location.lat": {
                    gte: leftTop.lat.value,
                    lte: rightBottom.lat.value,
                  }
                }
              },
              {
                range: {
                  "location.lng": {
                    gte: leftTop.lng.value,
                    lte: rightBottom.lng.value,
                  }
                }
              }
            ]
          }
        }
      },
    }, 1000)
    .then(it => it.hits.hits.map(it => it._source))
    .then(it => it.map(c => new Coordinator(new Name(c.name), new LatLng(new Degree(c.location.lat), new Degree(c.location.lng)))))
    .then(it => new Coordinators(it));
  }
}
