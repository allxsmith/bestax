import React from "react";
import "bulma/css/bulma.css";
import "./styles.scss";
import { Elements } from "./elements";
import { Components } from "./components";
import { FormControls } from "./form";
import { Layout } from "./layout";
import { Grid } from "./grid";
import { Helpers } from "./helpers";

export const App = () => (
  <>
    <Elements />
    <Components open={false} />
    <FormControls />
    <Layout />
    <Grid />
    <Helpers />
  </>
);
