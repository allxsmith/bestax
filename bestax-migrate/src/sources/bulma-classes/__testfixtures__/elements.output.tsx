import {
  Block,
  Button,
  Buttons,
  Delete,
  Notification,
  Paragraph,
  Progress,
  Table,
  Tag,
  Tags,
} from "@allxsmith/bestax-bulma";

export function Elements() {
  return (
    <Block>
      <Buttons size="small" hasAddons>
        <Button color="primary" isOutlined>Save</Button>
        <Button as="a" color="link" isLight href="/docs">
          Docs
        </Button>
        <Button isLoading disabled>
          Wait
        </Button>
      </Buttons>
      <Tags hasAddons>
        <Tag color="dark">npm</Tag>
        <Tag color="success" isRounded>v5</Tag>
      </Tags>
      <Notification color="danger" isLight>
        <Delete aria-label="Dismiss"></Delete>
        Something broke
      </Notification>
      <Progress color="info" size="small" value={40} max={100}>
        40%
      </Progress>
      <Table isStriped isFullwidth>
        <tbody>
          <tr>
            <td>Cell</td>
          </tr>
        </tbody>
      </Table>
      <Paragraph textAlign="centered">An expression string</Paragraph>
      <Paragraph textAlign="right">A template with no expressions</Paragraph>
    </Block>
  );
}
