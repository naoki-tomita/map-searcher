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
    return this.es.search<{ name: string, lat: number, lng: number }>({
      bool: {
        must: [
          {
            range: {
              lat: {
                gte: leftTop.lat.value,
                lte: rightBottom.lat.value,
              }
            }
          },
          {
            range: {
              lng: {
                gte: leftTop.lng.value,
                lte: rightBottom.lng.value,
              }
            }
          }
        ]
      }
    }, 1000)
    .then(it => it.hits.hits.map(it => it._source))
    .then(it => it.map(c => new Coordinator(new Name(c.name), new LatLng(new Degree(c.lat), new Degree(c.lng)))))
    .then(it => new Coordinators(it));
  }
}
