import React from "react";
import ReactDOM from "react-dom";

import YandexMap from "./ymap";
import RoutePointsList from "./route-points-list";
import DragAndDropTouch from "./dnd-touch";

import "./styles/main.css";

class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            routePoints: [],
            lastUsedId: 0
        };
        this.yandexMapRef = React.createRef();
        DragAndDropTouch.createHandlers();
    }

    addRoutePoint = (name) => {
        const id = this.state.lastUsedId + 1;
        const placemark = this.yandexMapRef.current.createPlacemark(name, this.placemarkDragEndHandler);
        const routePoint = { name, id, placemark };
        const routePoints = this.state.routePoints.slice().concat(routePoint);
        this.yandexMapRef.current.updatePolyline(routePoints.map(rp => rp.placemark));

        this.setState({
            routePoints,
            lastUsedId: id
        });
    }

    placemarkDragEndHandler = () => {
        this.yandexMapRef.current.updatePolyline(this.state.routePoints.map(rp => rp.placemark));
    }

    removeRoutePoint = ind => {
        const currentRoutePoints = this.state.routePoints;
        const placemarkToRemove = currentRoutePoints[ind].placemark;
        const routePoints = currentRoutePoints.slice(0, ind).concat(currentRoutePoints.slice(ind+1));
        this.yandexMapRef.current.removePlacemark(placemarkToRemove);
        this.yandexMapRef.current.updatePolyline(routePoints.map(rp => rp.placemark));

        this.setState({
            routePoints,
        });
    } 

    swapRoutePoints = (fromInd, toInd) => {
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

        this.yandexMapRef.current.swapPlacemarks(fromPoint.placemark, toPoint.placemark);
        this.yandexMapRef.current.updatePolyline(routePoints.map(rp => rp.placemark));

        this.setState({
            routePoints,
        });
    }

    render() {
        return (
            <div className={"wrapper"}>
                <div className={"wrapper__route-points-list"}>
                    <RoutePointsList 
                        routePoints={this.state.routePoints}
                        onPointDropHandler={this.swapRoutePoints}
                        onRemovePointHandler={this.removeRoutePoint}
                        onNameSetHandler={this.addRoutePoint} 
                    />
                </div>
                <div className={"wrapper__yandex-map"}>
                    <YandexMap ref={this.yandexMapRef} />
                </div>
            </div>
        )
    }
}


ReactDOM.render(
    <App />,
    document.getElementById("root")
);