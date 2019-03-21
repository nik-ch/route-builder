import React from "react";
import renderer from "react-test-renderer";
import { toast } from "react-toastify";

import App from "../components/app";
import RoutePointsList from "../components/route-points-list";
import YandexMapApiWrapper from "../ymap-api-wrapper";

jest.mock("../ymap-api-wrapper");
jest.mock("react-toastify");

describe("Handles route point adding and dragging correctly", () => {
    let testRendInst, app, ymapWrapperInstance, 
        rpListInstance, mockPlacemark, name;

    beforeAll(() => {
        testRendInst = renderer.create(<App />);
        app = testRendInst.getInstance();
        ymapWrapperInstance = YandexMapApiWrapper.mock.instances[0];
        rpListInstance = testRendInst.root.findByType(RoutePointsList);
        mockPlacemark = {};
        name = "name";
        ymapWrapperInstance.createPlacemark.mockReturnValueOnce(mockPlacemark);

        app.addRoutePoint(name);
    });

    afterAll(() => YandexMapApiWrapper.mockClear());

    test("Calls placemark creation with correct args", () => {
        expect(ymapWrapperInstance.createPlacemark).toHaveBeenCalledTimes(1);
        expect(ymapWrapperInstance.createPlacemark.mock.calls[0][0]).toBe(name);
        expect(typeof ymapWrapperInstance.createPlacemark.mock.calls[0][1]).toBe("function");
    });

    test("Calls polyline updating with new placemark", () => {
        expect(ymapWrapperInstance.updatePolyline).toHaveBeenCalledTimes(1);
        expect(ymapWrapperInstance.updatePolyline.mock.calls[0][0][0]).toBe(mockPlacemark);
    });

    test("Sets route point with necessary properties", () => {
        expect(rpListInstance.props.routePoints.length).toBe(1);
        expect(rpListInstance.props.routePoints[0]).toHaveProperty("id");
        expect(rpListInstance.props.routePoints[0]).toHaveProperty("name");
    });

    test("Shows notification on error", () => {
        ymapWrapperInstance.createPlacemark.mockImplementationOnce(() => { throw new Error });
        app.addRoutePoint("name");
        expect(toast).toHaveBeenCalled();
    });

    describe("Handles dragging correctly", () => {
        let routePoint;

        beforeAll(() => {
            routePoint = rpListInstance.props.routePoints[0];
            ymapWrapperInstance.updatePolyline.mockClear();
            app.placemarkDragEndHandler(routePoint.id);
        });

        test("Calls polyline update after dragging route point on the map", () => {
            expect(ymapWrapperInstance.updatePolyline).toHaveBeenCalledTimes(1);
            expect(ymapWrapperInstance.updatePolyline.mock.calls[0][0][0]).toBe(mockPlacemark);
        });

        test("Deletes geo data for dragged placemark", () => {
            expect(routePoint.geoData).toBeFalsy();
            expect(routePoint.geoDataShown).toBe(false);
        });

        test("Shows notification on error", () => {
            ymapWrapperInstance.updatePolyline.mockImplementationOnce(() => { throw new Error });
            app.placemarkDragEndHandler(routePoint.id);
            expect(toast).toHaveBeenCalled();
        });
    });
});

describe("Handles removing route point correctly", () => {
    let testRendInst, app, ymapWrapperInstance, 
        rpListInstance, mockPlacemark;

    beforeAll(() => {
        testRendInst = renderer.create(<App />);
        app = testRendInst.getInstance();
        ymapWrapperInstance = YandexMapApiWrapper.mock.instances[0];
        rpListInstance = testRendInst.root.findByType(RoutePointsList);
        mockPlacemark = {};
        ymapWrapperInstance.createPlacemark.mockReturnValueOnce(mockPlacemark);
        app.addRoutePoint("name");
        ymapWrapperInstance.updatePolyline.mockClear();

        app.removeRoutePoint(0);
    });

    afterAll(() => YandexMapApiWrapper.mockClear());

    test("Calls placemark removing with correct args", () => {
        expect(ymapWrapperInstance.removePlacemark).toHaveBeenCalledTimes(1);
        expect(ymapWrapperInstance.removePlacemark).toHaveBeenCalledWith(mockPlacemark);
    });

    test("Calls polyline updating without previously removed placemark", () => {
        expect(ymapWrapperInstance.updatePolyline).toHaveBeenCalledTimes(1);
        expect(ymapWrapperInstance.updatePolyline.mock.calls[0][0].length).toBe(0);
    });

    test("Sets route points list without removed route point", () => {
        expect(rpListInstance.props.routePoints.length).toBe(0);
    });

    test("Shows notification on error", () => {
        app.removeRoutePoint(0);
        expect(toast).toHaveBeenCalled();
    });
});

describe("Handles route points swapping correctly", () => {
    let testRendInst, app, ymapWrapperInstance, 
        rpListInstance, firstMockPlacemark, secondMockPlacemark,
        firstPoint, secondPoint;

    beforeAll(() => {
        testRendInst = renderer.create(<App />);
        app = testRendInst.getInstance();
        ymapWrapperInstance = YandexMapApiWrapper.mock.instances[0];
        rpListInstance = testRendInst.root.findByType(RoutePointsList);
        firstMockPlacemark = {};
        secondMockPlacemark = {};
        ymapWrapperInstance.createPlacemark
            .mockReturnValueOnce(firstMockPlacemark)
            .mockReturnValueOnce(secondMockPlacemark);
        app.addRoutePoint("name 1");
        app.addRoutePoint("name 2");
        ymapWrapperInstance.updatePolyline.mockClear();
        firstPoint = rpListInstance.props.routePoints[0];
        secondPoint = rpListInstance.props.routePoints[1];

        app.swapRoutePoints(0, 1);
    });

    afterAll(() => YandexMapApiWrapper.mockClear());

    test("Calls polyline updating with new placemarks order", () => {
        expect(ymapWrapperInstance.updatePolyline).toHaveBeenCalledTimes(1);
        expect(ymapWrapperInstance.updatePolyline.mock.calls[0][0][0]).toBe(secondMockPlacemark);
        expect(ymapWrapperInstance.updatePolyline.mock.calls[0][0][1]).toBe(firstMockPlacemark);
    });

    test("Updates route points list component with new points order", () => {
        expect(rpListInstance.props.routePoints[0]).toBe(secondPoint);
        expect(rpListInstance.props.routePoints[1]).toBe(firstPoint);
    });

    test("Shows notification on error", () => {
        app.swapRoutePoints(-1, -2);
        expect(toast).toHaveBeenCalled();
    });
});

describe("Handles geo data toggling correctly", () => {
    let testRendInst, app, ymapWrapperInstance, 
        rpListInstance, mockPlacemark;

    beforeAll(() => {
        testRendInst = renderer.create(<App />);
        app = testRendInst.getInstance();
        ymapWrapperInstance = YandexMapApiWrapper.mock.instances[0];
        rpListInstance = testRendInst.root.findByType(RoutePointsList);
        mockPlacemark = {};
        ymapWrapperInstance.createPlacemark.mockReturnValueOnce(mockPlacemark);
        app.addRoutePoint("name");
    });

    afterAll(() => YandexMapApiWrapper.mockClear());

    describe("Loads geo data when clicked for the first time", () => {
        let mockGeoData;

        beforeAll(async () => {
            mockGeoData = { name: "name", description: "description" };
            ymapWrapperInstance.getPlacemarkGeographicAddress.mockReturnValueOnce(mockGeoData);
            await app.getGeographicAddress(0);
        });

        afterAll(() => {
            ymapWrapperInstance.getPlacemarkGeographicAddress.mockClear();
            ymapWrapperInstance.togglePlacemarkFocus.mockClear();
        });

        test("Sets placemarks focus when it clicked for the first time", () => {
            expect(ymapWrapperInstance.togglePlacemarkFocus).toHaveBeenCalledTimes(1);
            expect(ymapWrapperInstance.togglePlacemarkFocus).toHaveBeenCalledWith(mockPlacemark, true);
        });
    
        test("Calls loading data for the placemark when it clicked for the first time", () => {
            expect(ymapWrapperInstance.getPlacemarkGeographicAddress).toHaveBeenCalledTimes(1);
            expect(ymapWrapperInstance.getPlacemarkGeographicAddress).toHaveBeenCalledWith(mockPlacemark);
        });

        test("Sets route point with loaded geo data", () => {
            const routePoint = rpListInstance.props.routePoints[0];
            expect(routePoint).toHaveProperty("geoData");
            expect(routePoint.geoData).toBe(mockGeoData);
            expect(routePoint).toHaveProperty("geoDataShown");
            expect(routePoint.geoDataShown).toBe(true);
        });
    });

    describe("Hides route point geo data when it clicked for the second time", () => {
        beforeAll(async () => {
            await app.getGeographicAddress(0);
        });

        afterAll(() => ymapWrapperInstance.togglePlacemarkFocus.mockClear());

        test("Removes focus from the placemark", () => {
            expect(ymapWrapperInstance.togglePlacemarkFocus).toHaveBeenCalledTimes(1);
            expect(ymapWrapperInstance.togglePlacemarkFocus).toHaveBeenCalledWith(mockPlacemark, false);
        });

        test("Doesn't call geo data loading", () => {
            expect(ymapWrapperInstance.getPlacemarkGeographicAddress).not.toHaveBeenCalled();
        });

        test("Sets geo data shown flag to false", () => {
            expect(rpListInstance.props.routePoints[0].geoDataShown).toBeFalsy();
        });
    });

    test("Doesn't load geo data when it has been saved", async () => {
        await app.getGeographicAddress(0);
        expect(ymapWrapperInstance.getPlacemarkGeographicAddress).not.toHaveBeenCalled();
    });

    test("Shows notification on error", async () => {
        await app.getGeographicAddress(-1);
        expect(toast).toHaveBeenCalled();
    });
});

