import React from "react";

export default class YandexMap extends React.Component {

    componentDidMount() {
        window.addEventListener("load", () => {
            this.yandexMap = new window.ymaps.Map("map", {
                center: [55.751, 37.6185],
                zoom: 15
            });
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

    swapPlacemarks(fromPlacemark, toPlacemark) {
        const fromCoordinates = fromPlacemark.geometry.getCoordinates();
        fromPlacemark.geometry.setCoordinates(toPlacemark.geometry.getCoordinates());
        toPlacemark.geometry.setCoordinates(fromCoordinates);
    }

    removePlacemark(placemark) {
        this.yandexMap.geoObjects.remove(placemark);
    }

    render() {
        return (
            <div id="map" className={"yandex-map"}></div>
        )
    }

}