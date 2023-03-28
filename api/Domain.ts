
export class Name {
  constructor(readonly value: string) {}
}
export class Coordinator {
  constructor(readonly name: Name, readonly center: LatLng) {}
  isMoreNorthThan(other: Coordinator): boolean {
    const a = this.center.lat.value - other.center.lat.value;
    if (a > 0) {
      return true;
    }
    return false;
  }

  isMoreWestThan(other: Coordinator): boolean {
    const a = this.center.lng.value - other.center.lng.value;
    if (a < 0) {
      return true;
    }
    return false;
  }
}
export class Coordinators {
  constructor(readonly values: Coordinator[]) {}
  excludeOutOfArea(area: Area): Coordinators {
    return new Coordinators(this.values.filter(it => area.isIn(it.center)))
  }
  map<U>(callbackfn: (value: Coordinator, index: number, array: Coordinator[]) => U, thisArg?: any): U[] {
    return this.values.map(callbackfn, thisArg);
  }
  sortFromNorthWest() {
    const result = [...this.values]
      .sort((a, b) => a.isMoreWestThan(b) ? -1 : 1)
      .sort((a, b) => a.isMoreNorthThan(b) ? -1 : 1)
    return new Coordinators(result);
  }
}

export class Area {
  static readonly DEG_TO_RAD = Math.PI / 180
  constructor(readonly center: LatLng, readonly radius: Meter) {}
  get leftTop(): LatLng {
    return this.center.moveTo(this.degreeOfLatitude.invertSign(), this.degreeOfLongitude.invertSign());
  }
  get rightBottom(): LatLng {
    return this.center.moveTo(this.degreeOfLatitude, this.degreeOfLongitude);
  }
  get degreeOfLatitude(): Degree {
    return this.radius.toLatitudeDegree();
  }
  get degreeOfLongitude(): Degree {
    return this.radius.toLongitudeDegree(this.center.lat);
  }
  isIn(pos: LatLng) {
    const distanceOfOtherPointFromCenter = this.center.distanceTo(pos);
    return distanceOfOtherPointFromCenter.isLessThan(this.radius);
  }
}

export class Degree {
  constructor(readonly value: number) {}
  div(other: Degree) {
    return new Degree(this.value / other.value);
  }
  mul(other: Degree) {
    return new Degree(this.value * other.value);
  }
  sub(other: Degree) {
    return new Degree(this.value - other.value);
  }
  add(other: Degree) {
    return new Degree(this.value + other.value);
  }
  invertSign() {
    return new Degree(- this.value);
  }
  static zero() {
    return new Degree(0);
  }
}

export class Meter {
  static readonly RadiusOfEarth = 6371000;
  constructor(readonly value: number) {}
  toLatitudeDegree(): Degree {
    // lat_diff = (d / R) * (180 / math.pi)
    return new Degree((this.value / Meter.RadiusOfEarth) * (180 / Math.PI)) ;
  }
  toLongitudeDegree(latitude: Degree): Degree {
    // lon_diff = (d / R) * (180 / math.pi) / math.cos(lat_center * math.pi / 180)
    return new Degree((this.value / Meter.RadiusOfEarth) * (180 / Math.PI) / Math.cos(latitude.value * Math.PI / 180));
  }
  isLessThan(other: Meter) {
    return this.value < other.value;
  }
}

export class LatLng {
  constructor(readonly lat: Degree, readonly lng: Degree) {}
  moveTo(lat: Degree, lng: Degree): LatLng {
    return new LatLng(this.lat.add(lat), this.lng.add(lng));
  }

  distanceTo(other: LatLng): Meter {
    /*
    lat1_rad, lon1_rad = lat1 * DEG_TO_RAD, lon1 * DEG_TO_RAD
    lat2_rad, lon2_rad = lat2 * DEG_TO_RAD, lon2 * DEG_TO_RAD
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS * c
    */
    const [lat1_rad, lng1_rad] = [this.lat.value * Area.DEG_TO_RAD, this.lng.value * Area.DEG_TO_RAD];
    const [lat2_rad, lng2_rad] = [other.lat.value * Area.DEG_TO_RAD, other.lng.value * Area.DEG_TO_RAD];
    const [dlat, dlng] = [lat2_rad - lat1_rad, lng2_rad - lng1_rad];
    const x = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.pow(Math.sin(dlng / 2), 2);
    return new Meter(2 * Math.asin(Math.sqrt(x)) * Meter.RadiusOfEarth);
  }
}
