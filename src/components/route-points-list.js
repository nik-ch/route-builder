import React from "react";

import RoutePoint from "./route-point";

export default class RoutePointsList extends React.Component {

    state = {
        startIndex: null,
        enterIndex: null
    };

    onDragStart = (index) => {
        this.setState({
            startIndex: index
        });
    }

    onDragEnd = () => {
        this.setState({
            startIndex: null
        });
    }

    onDragEnter = (index) => {
        this.setState({
            enterIndex: index
        })
    }

    onDragLeave = () => {
        this.setState({
            enterIndex: null
        });
    }

    onDragOver(e) {
        if(e.preventDefault) {
            e.preventDefault();
        }
        return false;
    }

    onDrop = (index) => {
        if(this.state.startIndex !== index) {
            this.props.onPointDropHandler(this.state.startIndex, index);
        }
        this.setState({
            enterIndex: null
        });
    }

    onInputKeyUp = (event) => {
        if(event.keyCode !== 13 || !event.target.value) {
            return;
        }
        this.props.onNameSetHandler(event.target.value);
        event.target.value = null;
    }

    render() {
        const routePoints = (this.props.routePoints || []).map((p, ind) => (
            <RoutePoint key={p.id} name={p.name}
                geoDataShown={p.geoDataShown}
                geoData={p.geoData}
                dragStarted={this.state.startIndex === ind}
                dragEntered={this.state.enterIndex === ind}
                onDragStartHandler={() => this.onDragStart(ind)}
                onDragEnterHandler={() => this.onDragEnter(ind)}
                onDragEndHandler={this.onDragEnd}
                onDragLeaveHandler={this.onDragLeave}
                onDragOverHandler={this.onDragOver}
                onDropHandler={() => this.onDrop(ind)}
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