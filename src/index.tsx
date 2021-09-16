import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./App";

// Webpack is handling the creation of index.html via the HtmlWebpackPlugin. Because we're not using a
// template, we create the React target element here. Saves having a template file full of html boilerplate.
const element = document.createElement("div");
element.id = "app";

document.body.appendChild(element);

ReactDOM.render(<App />, document.getElementById("app"));
