import React from "react";
import { ToastContainer, toast } from "react-toastify";

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
        this.ymapApiWrapper = new YandexMapApiWrapper();
        DragAndDropTouch.createHandlers();
    }

    componentDidMount() {
        window.addEventListener("load", () => {
            this.ymapApiWrapper.createMap(this.ymapId, [55.75136970917547, 37.61889271429428], 15);
        });
    }

    addRoutePoint = (name) => {
        try {
            const id = this.state.lastUsedId + 1;
            const placemark = this.ymapApiWrapper.createPlacemark(name, () => this.placemarkDragEndHandler(id));
            const routePoint = { name, id, placemark };
            const routePoints = this.state.routePoints.slice().concat(routePoint);
            this.ymapApiWrapper.updatePolyline(routePoints.map(rp => rp.placemark));

            this.setState({
                routePoints,
                lastUsedId: id
            });
        } catch(error) {
            this.showErrorToast("Error occurred during adding placemark.");
        }
    }

    /**
     * Handles placemark drag ending. 
     * @param id Route point id. 
     */
    placemarkDragEndHandler = (id) => {
        try {
            const routePoints = this.state.routePoints;
            const routePoint = routePoints.find(rp => rp.id === id);
            routePoint.geoData = null;
            routePoint.geoDataShown = false;
            this.ymapApiWrapper.updatePolyline(this.state.routePoints.map(rp => rp.placemark));
    
            this.setState({ routePoints });
        } catch(error) {
            this.showErrorToast("Error occurred during dragging placemark.");
        }
    }

    /**
     * Removes route point from the list and the map.
     * @param ind Index of the route point in the route points list. 
     */
    removeRoutePoint = (ind) => {
        try {
            const currentRoutePoints = this.state.routePoints;
            const placemarkToRemove = currentRoutePoints[ind].placemark;
            const routePoints = currentRoutePoints.slice(0, ind).concat(currentRoutePoints.slice(ind+1));
            this.ymapApiWrapper.removePlacemark(placemarkToRemove);
            this.ymapApiWrapper.updatePolyline(routePoints.map(rp => rp.placemark));

            this.setState({ routePoints });
        } catch(error) {
            this.showErrorToast("Error occurred during removing placemark.");
        }
    } 

    /**
     * Swaps two points in the route points list.
     * @param fromInd "From" index in the route points list.
     * @param toInd "To" index in the route points list.
     */
    swapRoutePoints = (fromInd, toInd) => {
        try{
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
        } catch(error) {
            this.showErrorToast("Error occurred during swapping placemarks.");
        }
    }

    /**
     * Loads geographic data for the route point.
     * @param ind Index of the route point in the route points list.
     */
    getGeographicAddress = async (ind) => {
        try {
            const routePoints = this.state.routePoints;
            const routePoint = routePoints[ind];
            const placemark = routePoint.placemark;
    
            const toggleGeoData = () => {
                const newGeoDataShownState = !routePoint.geoDataShown;
                this.ymapApiWrapper.togglePlacemarkFocus(placemark, newGeoDataShownState);
                routePoint.geoDataShown = newGeoDataShownState;

                this.setState({ routePoints });
            }
            
            if(!routePoint.geoDataShown && !routePoint.geoData) {
                const newGeoDataShownState = true;
                this.ymapApiWrapper.togglePlacemarkFocus(placemark, newGeoDataShownState);
                routePoint.geoData = await this.ymapApiWrapper.getPlacemarkGeographicAddress(placemark);
                routePoint.geoDataShown = newGeoDataShownState;
                
                this.setState({ routePoints });
            } else {
                toggleGeoData();
            }
        } catch(error) {
            this.showErrorToast("Error occurred during loading geographic address.");
        }
    }

    showErrorToast(errorText) {
        toast(errorText, { 
            type: toast.TYPE.ERROR, 
            bodyClassName: "notification-container__notification-body" 
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
                        onClickHandler={this.getGeographicAddress} 
                    />
                </div>
                <div className={"wrapper__yandex-map"}>
                    <div id={this.ymapId} className={"yandex-map"}></div>
                </div>
                <ToastContainer 
                    hideProgressBar={true} 
                    className={"notification-container"}
                />
            </div>
        )
    }
}