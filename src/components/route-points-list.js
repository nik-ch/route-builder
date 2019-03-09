import React from "react";

import RoutePoint from "./route-point";

export default class RoutePointsList extends React.Component {

    onDragStart(e, index) {
        e.currentTarget.classList.add("list__route-point_drag-started");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index);
    }

    onDragEnd(e) {
        e.currentTarget.classList.remove("list__route-point_drag-started");
    }

    onDragEnter(e) {
        e.currentTarget.classList.add("list__route-point_drag-entered");
    }

    onDragLeave(e) {
        e.currentTarget.classList.remove("list__route-point_drag-entered");
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
            this.props.onPointDropHandler(startIndex, index);
        }
        e.currentTarget.classList.remove("list__route-point_drag-entered");
    }

    onInputKeyUp = (event) => {
        if(event.keyCode !== 13 || !event.target.value) {
            return;
        }
        this.props.onNameSetHandler(event.target.value);
        event.target.value = null;
    }

    render() {
        const routePoints = this.props.routePoints.map((p, ind) => (
            <RoutePoint key={p.id} name={p.name}
                geoDataShown={p.geoDataShown}
                geoData={p.geoData}
                onDragStartHandler={(e) => this.onDragStart(e, ind)}
                onDragEnterHandler={this.onDragEnter}
                onDragEndHandler={this.onDragEnd}
                onDragLeaveHandler={this.onDragLeave}
                onDragOverHandler={this.onDragOver}
                onDropHandler={(e) => this.onDrop(e, ind)}
                onClickHandler={() => this.props.onClickHandler(ind)}
                onRemoveHandler={() => this.props.onRemovePointHandler(ind)}
            />
        ));

        return (
            <div className={"route-points-list"}>
                <div className={"route-points-list__input-wrapper"}>
                    <input type="text"
                        placeholder="New route point"
                        className={"route-points-list__input"}
                        onKeyUp={this.onInputKeyUp}
                    />
                </div>
                <div className={"list"}>{routePoints}</div>
            </div>
        );
    }

}