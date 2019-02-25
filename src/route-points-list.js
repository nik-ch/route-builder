import React from "react";

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
        if(event.keyCode !== 13) {
            return;
        }
        this.props.onNameSetHandler(event.target.value);
        event.target.value = null;
    }

    render() {
        const routePoints = this.props.routePoints.map((p, ind) => (
            <div key={p.id} className={"route-point list__route-point"} draggable="true"
                onDragStart={(e) => this.onDragStart(e, ind)}
                onDragEnd={this.onDragEnd}
                onDragEnter={this.onDragEnter}
                onDragLeave={this.onDragLeave}
                onDragOver={this.onDragOver}
                onDrop={(e) => this.onDrop(e, ind)}
            >
                <span className={"route-point__name"}>{p.name}</span>
                <span className={"route-point__remove-cross"} title={"Remove route point"} 
                    onClick={() => this.props.onRemovePointHandler(ind)}>x</span>
            </div>
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