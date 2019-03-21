import axios from "axios";

import YandexMapApiWrapper from "../ymap-api-wrapper";

const getCenterCoordsFuncMock = jest.fn();
const setCenterCoordsFuncMock = jest.fn();
const addGeoObjFuncMock = jest.fn();
const removeGeoObjFuncMock = jest.fn();
const ymapMock = {
    getCenter: getCenterCoordsFuncMock,
    setCenter: setCenterCoordsFuncMock,
    geoObjects: {
        add: addGeoObjFuncMock,
        remove: removeGeoObjFuncMock
    }
} 
window.ymaps = {
    Map: jest.fn(() => ymapMock)
};

jest.mock("axios");

const ymapApiWrapper = new YandexMapApiWrapper();
ymapApiWrapper.createMap();

describe("Handles placemark creation correctly", () => {
    const addPlacemarkEventMock = jest.fn();
    const placemarkMock = jest.fn(() => ({
        events: {
            add: addPlacemarkEventMock
        }
    }));
    window.ymaps.Placemark = placemarkMock;

    const centerCoords = [1, 1];
    getCenterCoordsFuncMock.mockReturnValueOnce(centerCoords);
    const name = "placemark";
    const dragEndHandler = () => {};
    let pm;

    beforeAll(() => {
        pm = ymapApiWrapper.createPlacemark(name, dragEndHandler);
    });

    afterAll(() => {
        addGeoObjFuncMock.mockClear();
    });

    test("Placemark constructor called with proper args", () => {
        expect(placemarkMock.mock.instances.length).toBe(1);
        expect(placemarkMock.mock.calls[0][0]).toBe(centerCoords);
        expect(placemarkMock.mock.calls[0][1]).toHaveProperty("balloonContentBody", name);
        expect(placemarkMock.mock.calls[0][2]).toHaveProperty("draggable", true);
    });
    
    test("Dragend handler added to the placemark", () => {
        expect(addPlacemarkEventMock).toHaveBeenCalledTimes(1);
        expect(addPlacemarkEventMock).toHaveBeenCalledWith("dragend", dragEndHandler);
    });

    test("Placemark added to map geoobject collection", () => {
        expect(addGeoObjFuncMock).toHaveBeenCalledTimes(1); 
        expect(addGeoObjFuncMock).toHaveBeenCalledWith(pm);
    });
});

test("Removes placemark from the map", () => {
    const pm = {};
    ymapApiWrapper.removePlacemark(pm);

    expect(removeGeoObjFuncMock).toHaveBeenCalledTimes(1);
    expect(removeGeoObjFuncMock).toBeCalledWith(pm);

    removeGeoObjFuncMock.mockClear();
});

describe("Handles polyline updating correctly", () => {
    const getCoordsMock = jest.fn();
    const fp = {
        geometry: { getCoordinates: getCoordsMock }
    };
    const sp = {
        geometry: { getCoordinates: getCoordsMock }
    }
    const fpCoords = [1, 1], spCoords = [2, 2];

    const setPolylineCoordsMock = jest.fn();
    const polylineMock = jest.fn(() => ({ 
        geometry: { setCoordinates: setPolylineCoordsMock } 
    }));
    window.ymaps.Polyline = polylineMock;

    test("No creation or update occurs when no placemarks given", () => {
        ymapApiWrapper.updatePolyline([]);

        expect(polylineMock).not.toHaveBeenCalled();
        expect(setPolylineCoordsMock).not.toHaveBeenCalled();
        expect(addGeoObjFuncMock).not.toHaveBeenCalled();
    });

    test("Polyline is created when placemarks given for the first time", () => {
        getCoordsMock
            .mockReturnValueOnce(fpCoords)
            .mockReturnValueOnce(spCoords);
        ymapApiWrapper.updatePolyline([fp, sp]);    

        expect(polylineMock.mock.instances.length).toBe(1);
        expect(polylineMock.mock.calls[0][0][0]).toBe(fpCoords);
        expect(polylineMock.mock.calls[0][0][1]).toBe(spCoords);
        expect(addGeoObjFuncMock).toBeCalledWith(polylineMock.mock.results[0].value);
    });

    test("Polyline is updated when placemarks given", () => {
        addGeoObjFuncMock.mockClear();
        getCoordsMock
            .mockReturnValueOnce(fpCoords)
            .mockReturnValueOnce(spCoords);
        ymapApiWrapper.updatePolyline([fp, sp]);

        expect(addGeoObjFuncMock).not.toHaveBeenCalled();
        expect(setPolylineCoordsMock).toHaveBeenCalledTimes(1);
        expect(setPolylineCoordsMock.mock.calls[0][0][0]).toBe(fpCoords);
        expect(setPolylineCoordsMock.mock.calls[0][0][1]).toBe(spCoords);
    });  
});

describe("Toggles placemark focus", () => {
    const setOptionsMock = jest.fn();
    const getCoordsMock = jest.fn();
    const pm = {
        options: { set: setOptionsMock },
        geometry: { getCoordinates: getCoordsMock }
    };

    test("Placemark changes color and map center set to the placemark coordinates when focus set", () => {
        const pCoords = [1, 1];
        getCoordsMock.mockReturnValueOnce(pCoords);
        ymapApiWrapper.togglePlacemarkFocus(pm, true);

        expect(setOptionsMock).toBeCalledTimes(1);
        expect(setOptionsMock.mock.calls[0][0]).toBe("preset");
        expect(setCenterCoordsFuncMock).toHaveBeenCalledTimes(1);
        expect(setCenterCoordsFuncMock).toBeCalledWith(pCoords);
    });

    test("Placemark changes color and map center doesn't change when focus lost", () => {
        setOptionsMock.mockClear();
        setCenterCoordsFuncMock.mockClear();
        ymapApiWrapper.togglePlacemarkFocus(pm, false);

        expect(setCenterCoordsFuncMock).not.toHaveBeenCalled();
        expect(setOptionsMock).toBeCalledTimes(1);
        expect(setOptionsMock.mock.calls[0][0]).toBe("preset");
    });
});

describe("Gets placemark's geographical address", () => {
    const coords = [1, 1];
    const geoCodeCoords = `${coords[1]},${coords[0]}`;
    const name = "name", description = "description";
    const getResult = {
        data: {
            response: {
                GeoObjectCollection: {
                    featureMember: [
                        {
                            GeoObject: {
                                name,
                                description
                            }
                        }
                    ]
                }
            }
        }
    };
    const getCoordsMock = jest.fn(() => coords);
    const pm = {
        geometry: { getCoordinates: getCoordsMock }
    } 
    let response;

    beforeAll(async () => {
        axios.get.mockResolvedValueOnce(getResult);
        response = await ymapApiWrapper.getPlacemarkGeographicAddress(pm);
    });

    test("Axios get method called with proper args", () => {
        expect(axios.get).toBeCalledTimes(1);
        expect(axios.get.mock.calls[0][0]).toBe("https://geocode-maps.yandex.ru/1.x/");
        expect(axios.get.mock.calls[0][1]).toHaveProperty("params.geocode", geoCodeCoords);
    });

    test("Returns object with name and description of the address", () => {
        expect(response).toHaveProperty("name", name);
        expect(response).toHaveProperty("description", description);
    });
});