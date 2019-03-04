import axios from "axios";

export default class YandexMapApiWrapper {

    constructor(mapContainerRef) {
        this.yandexMap = new window.ymaps.Map(mapContainerRef, {
            center: [55.75136970917547, 37.61889271429428],
            zoom: 15
        });
    }

    createPlacemark(name, dragEndHandler) {
        const placemark = new window.ymaps.Placemark(
            this.yandexMap.getCenter(),
            { balloonContentBody: name },
            { draggable: true }
        );
        if(dragEndHandler) {
            placemark.events.add("dragend", dragEndHandler);
        }
        this.yandexMap.geoObjects.add(placemark);
        return placemark;
    }

    updatePolyline(placemarks) {
        if(this.polyline != null) {
            this.polyline.geometry.setCoordinates([...placemarks.map(p => p.geometry.getCoordinates())]);
        } else if(placemarks.length > 1) {
            this.polyline = new window.ymaps.Polyline([...placemarks.map(p => p.geometry.getCoordinates())]);
            this.yandexMap.geoObjects.add(this.polyline);
        }
    }

    async getPlacemarkGeographicAddress(placemark) {
        const coordinates = placemark.geometry.getCoordinates(); 
        const answer = await axios.get("https://geocode-maps.yandex.ru/1.x/", {
            params: {
                apikey: "9f0d1ea1-8932-41ba-a54e-612efe8507b1",
                geocode: `${coordinates[1]},${coordinates[0]}`,
                format: "json",
                results: 1,
                lang: "en_RU"
            }
        });
        return {
            name: answer.data.response.GeoObjectCollection.featureMember[0].GeoObject.name,
            description: answer.data.response.GeoObjectCollection.featureMember[0].GeoObject.description
        };
    }

    togglePlacemarkFocus(placemark, isShown) {
        if(isShown) {
            placemark.options.set("preset", "islands#orangeIcon");
            this.yandexMap.setCenter(placemark.geometry.getCoordinates());
        } else {
            placemark.options.set("preset", "islands#blueIcon");
        }
    }

    removePlacemark(placemark) {
        this.yandexMap.geoObjects.remove(placemark);
    }

}