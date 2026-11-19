import React from "react";
import { Level, Title } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): Bulma v1 dropped the `.heading` styles, so the `heading` class on this plain <p> styles nothing; restyle it with bestax helpers (e.g. `<Paragraph textSize="7" textTransform="uppercase" textWeight="semibold" mb="1">`) or a `.heading` rule of your own
export const Stats = () => (
  <Level>
    <Level.Item textAlign="centered">
      <div>
        <p className="heading">Followers</p>
        <Title>456K</Title>
      </div>
    </Level.Item>
  </Level>
);
