import { SubTitle, Title } from "@allxsmith/bestax-bulma";

export function Titles() {
  // TODO(bestax-migrate): Bulma v1 dropped the `.heading` styles, so the `heading` class on this plain <h1> styles nothing; restyle it with bestax helpers (e.g. `<Paragraph textSize="7" textTransform="uppercase" textWeight="semibold" mb="1">`) or a `.heading` rule of your own
  return (
    <div>
      <SubTitle>a</SubTitle>
      <Title>b</Title>
      <Title>c</Title>
      <Title textSize="3">d</Title>
      <h1 className="heading subtitle">e</h1>
    </div>
  );
}
