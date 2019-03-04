import React from "react";

import YandexMapApiWrapper from "../ymap-api-wrapper";
import RoutePointsList from "./route-points-list";
import DragAndDropTouch from "../dnd-touch";

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            routePoints: [],
            lastUsedId: 0
        };
        this.ymapId = "ymap";
        DragAndDropTouch.createHandlers();
    }

    componentDidMount() {
        window.addEventListener("load", () => {
            this.ymapApiWrapper = new YandexMapApiWrapper(this.ymapId);
        });
    }

    addRoutePoint = (name) => {
        const id = this.state.lastUsedId + 1;
        const placemark = this.ymapApiWrapper.createPlacemark(name, () => this.placemarkDragEndHandler(id));
        const routePoint = { name, id, placemark };
        const routePoints = this.state.routePoints.slice().concat(routePoint);
        this.ymapApiWrapper.updatePolyline(routePoints.map(rp => rp.placemark));

        this.setState({
            routePoints,
            lastUsedId: id
        });
    }

    placemarkDragEndHandler = (id) => {
        const routePoints = this.state.routePoints;
        const routePoint = routePoints.find(rp => rp.id === id);
        routePoint.geoData = null;
        routePoint.geoDataShown = false;
        this.ymapApiWrapper.updatePolyline(this.state.routePoints.map(rp => rp.placemark));

        this.setState({ routePoints });
    }

    removeRoutePoint = (ind) => {
        const currentRoutePoints = this.state.routePoints;
        const placemarkToRemove = currentRoutePoints[ind].placemark;
        const routePoints = currentRoutePoints.slice(0, ind).concat(currentRoutePoints.slice(ind+1));
        this.ymapApiWrapper.removePlacemark(placemarkToRemove);
        this.ymapApiWrapper.updatePolyline(routePoints.map(rp => rp.placemark));

        this.setState({ routePoints });
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

        this.ymapApiWrapper.updatePolyline(routePoints.map(rp => rp.placemark));

        this.setState({ routePoints });
    }

    getGeographicAddress = async (ind) => {
        const routePoints = this.state.routePoints;
        const routePoint = routePoints[ind];
        const placemark = routePoint.placemark;

        const toggleGeoData = () => {
            routePoint.geoDataShown = !routePoint.geoDataShown;
            this.ymapApiWrapper.togglePlacemarkFocus(placemark, routePoint.geoDataShown);

            this.setState({ routePoints });
        }

        if(!routePoint.geoDataShown && !routePoint.geoData) {
            routePoint.geoDataShown = true;
            this.ymapApiWrapper.togglePlacemarkFocus(placemark, routePoint.geoDataShown);
            routePoint.geoData = await this.ymapApiWrapper.getPlacemarkGeographicAddress(placemark);
            
            this.setState({ routePoints });
        } else {
            toggleGeoData();
        }
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
                        onClickHandler={this.getGeographicAddress} 
                    />
                </div>
                <div className={"wrapper__yandex-map"}>
                    <div id={this.ymapId} className={"yandex-map"}></div>
                </div>
            </div>
        )
    }
}