import React from "react";

const RoutePoint = (props) => {

    const onRemoveClickHandler = (event) => {
        //prevent loading geo data for placemark
        event.stopPropagation();
        props.onRemoveHandler();
    }

    const showGeoData = props.geoDataShown && props.geoData;

    let rpClassName = "route-point list__route-point";
    if(props.dragStarted) {
        rpClassName += " list__route-point_drag-started";
    }
    if(props.dragEntered) {
        rpClassName += " list__route-point_drag-entered";
    }

    return (
        <div className={rpClassName} draggable="true"
            onDragStart={props.onDragStartHandler}
            onDragEnd={props.onDragEndHandler}
            onDragEnter={props.onDragEnterHandler}
            onDragLeave={props.onDragLeaveHandler}
            onDragOver={props.onDragOverHandler}
            onDrop={props.onDropHandler}
        >
            <div className={"route-point__main-info"}>
                <span className={"route-point__name"}>{props.name}</span>
                <span className={"route-point__remove-cross"} title={"Remove route point"} 
                    onClick={onRemoveClickHandler}>✖</span>
            </div>
            <div className={"route-point__address-link"} onClick={props.onClickHandler}>
                {showGeoData ? "Hide address" : "View address"}
            </div>
            <div className={`route-point__geo-data-info${(showGeoData && " route-point__geo-data-info_shown") || ""}`}>
                {showGeoData && `${props.geoData.name}. ${props.geoData.description}.`}
            </div>
        </div>
    )
}

export default RoutePoint;