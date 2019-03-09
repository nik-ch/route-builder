import React from "react";
import { render } from "react-dom";
import App from "./components/app";
import ErrorBoundary from "./error-boundary";
import "./styles/main.css";
import 'react-toastify/dist/ReactToastify.css';


render(
    (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    ), 
    document.getElementById("root")
);