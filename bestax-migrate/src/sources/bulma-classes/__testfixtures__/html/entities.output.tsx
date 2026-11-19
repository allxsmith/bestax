import { Content, Paragraph } from "@allxsmith/bestax-bulma";

export default function EntitiesPage() {
  return (
    <Content>
      <Paragraph textWeight="bold">Fish & chips &lt;3 © Example&nbsp;Ltd — since 2001</Paragraph>
      <p>Braces {"{"} and {"}"} and a lone &gt; stay text.</p>
      <p>Literal &amp;amp; and &amp;nbsp; and AT&T</p>
      <p title={"\"Quoted\" & done"}>Soft&shy;hyphen and zero&#x200B;width</p>
    </Content>
  );
}
