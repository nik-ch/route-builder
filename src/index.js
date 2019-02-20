import React from "react";
import ReactDOM from "react-dom";

import DragAndDropTouch from "./dnd-touch";

import "./styles/main.css";

class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            routePoints: [],
            lastUsedId: 0
        };

        this.yandexMap = null;
        
        DragAndDropTouch.createHandlers();

        this.bindEvents();
    }

    bindEvents() {
        this.onInputKeyUp = this.onInputKeyUp.bind(this);
        this.onPlacemarkDragEnd = this.onPlacemarkDragEnd.bind(this);
        this.onRemovePointClick = this.onRemovePointClick.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    componentDidMount() {
        window.addEventListener("load", () => {
            const ymap = new window.ymaps.Map("map", {
                center: [55.751, 37.6185],
                zoom: 15
            });
    
            this.yandexMap = ymap;
        });
    }

    onRemovePointClick(ind) {
        const currentRoutePoints = this.state.routePoints;
        const placemarkToRemove = currentRoutePoints[ind].placemark;
        const routePoints = currentRoutePoints.slice(0, ind).concat(currentRoutePoints.slice(ind+1));
        this.yandexMap.geoObjects.remove(placemarkToRemove);
        const polyline = this.updatePolyline(this.state.polyline, routePoints);

        this.setState({
            routePoints,
            polyline
        });
    } 

    onInputKeyUp(event) {
        if(event.keyCode !== 13) {
            return;
        }

        const id = this.state.lastUsedId + 1;
        const name = event.currentTarget.value;
        const placemark = this.createPlacemark(name);

        const routePoint = { name, id, placemark };
        const routePoints = this.state.routePoints.slice().concat(routePoint);
        const polyline = this.updatePolyline(this.state.polyline, routePoints);

        event.target.value = "";

        this.setState({
            routePoints,
            polyline,
            lastUsedId: id
        });
    }

    updatePolyline(polyline, routePoints) {
        const placemarks = routePoints.map(rp => rp.placemark);
        if(polyline == null) {
            polyline = new window.ymaps.Polyline([...placemarks.map(p => p.geometry.getCoordinates())]);
            this.yandexMap.geoObjects.add(polyline);
        } else {
            polyline.geometry.setCoordinates([...placemarks.map(p => p.geometry.getCoordinates())]);
        }
        return polyline;
    }

    createPlacemark(name) {
        const placemark = new window.ymaps.Placemark(
            this.yandexMap.getCenter(),
            { balloonContentBody: name },
            { draggable: true }
        );
        placemark.events.add("dragend", this.onPlacemarkDragEnd);
        this.yandexMap.geoObjects.add(placemark);
        return placemark;
    }

    onPlacemarkDragEnd() {
        const polyline = this.updatePolyline(this.state.polyline, this.state.routePoints);
        this.setState({
            polyline
        });
    }

    onDragStart(e, index) {
        e.target.style.opacity = "0.4";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index);
    }

    onDragEnd(e) {
        e.target.style.opacity = "1";
    }

    onDragEnter(e) {
        e.target.classList.add("over");
    }

    onDragLeave(e) {
        e.target.classList.remove("over");
    }

    onDragOver(e) {
        if(e.preventDefault) {
            e.preventDefault();
        }
        return false;
    }

    onDrop(e, index) {
        let startIndex = +e.dataTransfer.getData("text/plain");
        if(index !== startIndex) {
            this.swapRoutePoints(startIndex, index);
        }
    }

    swapRoutePoints(fromInd, toInd) {
        const from = Math.min(fromInd, toInd);
        const to = Math.max(fromInd, toInd);

        const currentRoutePoints = this.state.routePoints;
        const fromPoint = currentRoutePoints[from];
        const toPoint = currentRoutePoints[to];

        const routePoints = currentRoutePoints
            .slice(0, from)
            .concat(toPoint)
            .concat(currentRoutePoints.slice(from + 1, to))
            .concat(fromPoint)
            .concat(currentRoutePoints.slice(to + 1));

        this.swapPlacemarks(fromPoint.placemark, toPoint.placemark);
        const polyline = this.updatePolyline(this.state.polyline, routePoints);

        this.setState({
            routePoints,
            polyline
        });
    }

    swapPlacemarks(fromPlacemark, toPlacemark) {
        const fromCoordinates = fromPlacemark.geometry.getCoordinates();
        fromPlacemark.geometry.setCoordinates(toPlacemark.geometry.getCoordinates());
        toPlacemark.geometry.setCoordinates(fromCoordinates);
    }

    render() {
        console.log("render from App");

        const routePoints = this.state.routePoints.map((p, ind) => (
                <div key={p.id} className={"route-point"} draggable="true"
                    onDragStart={(e) => this.onDragStart(e, ind)}
                    onDragEnd={this.onDragEnd}
                    onDragEnter={this.onDragEnter}
                    onDragLeave={this.onDragLeave}
                    onDragOver={this.onDragOver}
                    onDrop={(e) => this.onDrop(e, ind)}
                >
                    {p.name}
                    <span className="remove-cross" onClick={() => this.onRemovePointClick(ind)}>X</span>
                </div>
            )
        );

        return (
            <div className={"wrapper"}>
                <div className={"input-column"}>
                    <input 
                        type="text"
                        placeholder="Новая точка маршрута"
                        className={"route-input"}
                        onKeyUp={this.onInputKeyUp}
                    />
                    <div>{routePoints}</div>
                </div>
                <div className={"map-column"}>
                    <div id="map" className={"yandex-map"}></div>
                </div>
            </div>
        )
    }
}


ReactDOM.render(
    <App />,
    document.getElementById("root")
);