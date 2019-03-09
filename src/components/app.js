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
        DragAndDropTouch.createHandlers();
    }

    componentDidMount() {
        window.addEventListener("load", () => {
            this.ymapApiWrapper = new YandexMapApiWrapper(this.ymapId);
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
            toast("Error occurred during adding placemark.", 
                { type: toast.TYPE.ERROR, bodyClassName: "notification-container__notification-body" }
            );
        }
    }

    placemarkDragEndHandler = (id) => {
        try {
            const routePoints = this.state.routePoints;
            const routePoint = routePoints.find(rp => rp.id === id);
            routePoint.geoData = null;
            routePoint.geoDataShown = false;
            this.ymapApiWrapper.updatePolyline(this.state.routePoints.map(rp => rp.placemark));
    
            this.setState({ routePoints });
        } catch(error) {
            toast("Error occurred during dragging placemark.", 
                { type: toast.TYPE.ERROR, bodyClassName: "notification-container__notification-body" }
            );
        }
    }

    removeRoutePoint = (ind) => {
        try {
            const currentRoutePoints = this.state.routePoints;
            const placemarkToRemove = currentRoutePoints[ind].placemark;
            const routePoints = currentRoutePoints.slice(0, ind).concat(currentRoutePoints.slice(ind+1));
            this.ymapApiWrapper.removePlacemark(placemarkToRemove);
            this.ymapApiWrapper.updatePolyline(routePoints.map(rp => rp.placemark));
    
            this.setState({ routePoints });
        } catch(error) {
            toast("Error occurred during removing placemark.", 
                { type: toast.TYPE.ERROR, bodyClassName: "notification-container__notification-body" }
            );
        }
    } 

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
            toast("Error occurred during swapping placemarks.", 
                { type: toast.TYPE.ERROR, bodyClassName: "notification-container__notification-body" }
            );
        }
    }

    getGeographicAddress = async (ind) => {
        try {
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
        } catch(error) {
            toast("Error occurred during loading geographic address.", 
                { type: toast.TYPE.ERROR, bodyClassName: "notification-container__notification-body" }
            );
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
                <ToastContainer 
                    hideProgressBar={true} 
                    className={"notification-container"}
                />
            </div>
        )
    }
}