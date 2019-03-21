import React from "react";
import renderer from "react-test-renderer";

import RoutePoint from "../components/route-point";

test("Renders correctly without geo data", () => {
    const routePoint = renderer.create(<RoutePoint />);
    expect(routePoint.toJSON()).toMatchSnapshot();
});

test("Renders correctly with geo data provided", () => {
    const geoData = { name: "name", description: "description" };
    const routePoint = renderer.create(<RoutePoint geoDataShown={true} geoData={geoData} />)
    expect(routePoint.toJSON()).toMatchSnapshot();
});

test("Renders correctly when drag started", () => {
    const routePoint = renderer.create(<RoutePoint dragStarted={true}/>);
    expect(routePoint.toJSON()).toMatchSnapshot();
});

test("Renders correctly when drag entered", () => {
    const routePoint = renderer.create(<RoutePoint dragEntered={true}/>);
    expect(routePoint.toJSON()).toMatchSnapshot();
});