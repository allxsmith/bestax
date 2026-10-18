import { Table } from "@allxsmith/bestax-bulma";

export default function TablePage() {
  return (
    <Table isBordered isHoverable isResponsive>
      <caption>League</caption>
      <thead>
        <tr><th><abbr title="Position">Pos</abbr></th><th colSpan={2}>Team</th></tr>
      </thead>
      <tbody>
        <tr className="is-selected">
          <td>1</td>
          <td rowSpan={2}>Leicester</td>
          <td>81</td>
        </tr>
        <tr><td>2</td><td>71</td></tr>
      </tbody>
    </Table>
  );
}
