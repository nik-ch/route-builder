import React from "react";
import { render } from "react-dom";
import renderer, { act } from "react-test-renderer";

import RoutePointsList from "../components/route-points-list";
import RoutePoint from "../components/route-point";

const routePoints = [
    {
        id: 1,
        name: "name 1"
    }, 
    {
        id: 2,
        name: "name 2"
    }
];

test("Renders correctly", () => {
    const testRendererInstance = renderer.create(<RoutePointsList routePoints={routePoints} />);
    expect(testRendererInstance.toJSON()).toMatchSnapshot(); 
});

describe("Handles drag events correctly", () => {
    const dropMock = jest.fn();
    const testRendererInstance = renderer.create(<RoutePointsList routePoints={routePoints} onPointDropHandler={dropMock} />);
    const rpComponents = testRendererInstance.root.findAllByType(RoutePoint);
    const fp = rpComponents[0], sp = rpComponents[1];

    test("Blurs route point on dragstart", () => {
        const startEvent = new Event("dragstart", { bubbles: true });
        fp.props.onDragStartHandler(startEvent);
        expect(testRendererInstance.toJSON()).toMatchSnapshot();
    });

    test("Highlights route point on dragenter", () => {
        const enterEvent = new Event("dragenter", { bubbles: true });
        sp.props.onDragEnterHandler(enterEvent);
        expect(testRendererInstance.toJSON()).toMatchSnapshot();
    });

    test("Removes highlight from route point on dragleave", () => {
        const leaveEvent = new Event("dragleave", { bubbles: true });
        sp.props.onDragLeaveHandler(leaveEvent);
        expect(testRendererInstance.toJSON()).toMatchSnapshot();
    });

    test("Removes blur from route point on dragend", () => {
        const endEvent = new Event("dragend", { bubbles: true });
        fp.props.onDragEndHandler(endEvent);
        expect(testRendererInstance.toJSON()).toMatchSnapshot();
    });

    test("Prevents default action and returns false on dragover", () => {
        const mockEvent = {
            preventDefault: jest.fn()
        };
        expect(testRendererInstance.getInstance().onDragOver(mockEvent)).toBe(false);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test("Swaps different route points on drop", () => {
        fp.props.onDragStartHandler();
        sp.props.onDropHandler();
        expect(dropMock).toHaveBeenCalled();
    });

    test("Doesn't swap route point with itself on drop", () => {
        dropMock.mockClear();
        fp.props.onDragStartHandler();
        fp.props.onDropHandler();
        expect(dropMock).not.toHaveBeenCalled();
    });
});

describe("Handles route point name input correctly", () => {
    let container;
    const setNameMock = jest.fn();

    act(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        render(<RoutePointsList onNameSetHandler={setNameMock}/>, container);
    });

    const input = container.querySelector("input");

    test("Creating route point isn't called before enter pressed or when empty name set", () => {
        const event = new Event("keyup", { bubbles: true });
        event.keyCode = 32;
        act(() => {
            input.dispatchEvent(event);
        });
        expect(setNameMock).not.toHaveBeenCalled();

        event.keyCode = 13;
        act(() => {
            input.dispatchEvent(event);
        });
        expect(setNameMock).not.toHaveBeenCalled();
    });

    test("Calls route point creating when name set and enter pressed", () => {
        const event = new Event("keyup", { bubbles: true });
        event.keyCode = 13;
        const value = "qwe";
        input.value = value; 
        act(() => {
            input.dispatchEvent(event);
        })
        expect(setNameMock).toHaveBeenCalledWith(value);
    });
});
