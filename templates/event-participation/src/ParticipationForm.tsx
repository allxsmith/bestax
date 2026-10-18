import { useState } from 'react';
import {
  Button,
  Checkbox,
  Column,
  Columns,
  Icon,
  Panel,
  Paragraph,
  Table,
} from '@allxsmith/bestax-bulma';

/** The program: each talk's start, its title, and the name its box sends. */
const talks = [
  { id: 'grandopening', time: '9:00', title: 'Grand Opening' },
  {
    id: 'makinghistory',
    time: '9:45',
    title: 'Launching of the theme MAKING HISTORY TOGETHER',
  },
  { id: 'foundersspeech', time: '10:00', title: 'The Founders Speech' },
  { id: 'brand', time: '10:15', title: 'Brand' },
  { id: 'skincare', time: '10:25', title: 'Brand - SkinCare' },
  { id: 'digital', time: '11:00', title: 'Brand - Digital' },
  {
    id: 'colorandfragrance',
    time: '12:20',
    title: 'Brand - Color & Fragrance',
  },
  { id: 'grandclosing', time: '13:00', title: 'HALL OF FAME / GRAND CLOSING' },
  {
    id: 'vipcoctail',
    time: '14:00',
    title: 'Press Conference & VIP Cocktail',
  },
];

interface Feedback {
  color: 'warning' | 'success';
  text: string;
}

/**
 * The talks to pick, with a "Select All" box that shows the mixed state
 * while only some are picked, and the confirm button. Confirming stays on
 * the page and says how it went in the status line under the button; send
 * the picks from `confirm`.
 */
function ParticipationForm() {
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const allSelected = selected.length === talks.length;
  const someSelected = selected.length > 0 && !allSelected;

  const pick = (id: string, checked: boolean) =>
    setSelected(current =>
      checked ? [...current, id] : current.filter(talk => talk !== id)
    );

  const confirm = () => {
    const count = selected.length;
    setFeedback(
      count === 0
        ? {
            color: 'warning',
            text: 'Please select at least one talk before confirming.',
          }
        : {
            color: 'success',
            text: `Participation confirmed for ${count} talk${count === 1 ? '' : 's'}.`,
          }
    );
  };

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        confirm();
      }}
    >
      <Columns isVCentered>
        <Column sizeMobile="full">
          {/* Panel renders a <nav>, and this panel holds no navigation, so
              role="none" leaves it the plain box the original's <section>
              is. The table sits right in it: the original wraps it in a
              .panel-block with its padding and border taken off, and
              Panel.Block is a link, which can't hold the checkboxes. */}
          <Panel role="none">
            <Panel.Heading>Program</Panel.Heading>
            <Table isFullwidth>
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Talk</th>
                  <th scope="col" className="has-text-centered">
                    Select
                  </th>
                </tr>
              </thead>
              <tbody>
                {talks.map(talk => (
                  <tr key={talk.id}>
                    <td>{talk.time}</td>
                    <td>{talk.title}</td>
                    <td className="is-icon">
                      <Checkbox
                        id={talk.id}
                        name={talk.id}
                        aria-label={talk.title}
                        checked={selected.includes(talk.id)}
                        onChange={event => pick(talk.id, event.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td />
                  <td className="has-text-right">Select All</td>
                  <td className="is-icon">
                    <Checkbox
                      id="select-all"
                      name="select-all"
                      aria-label="Select All Talks"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={event =>
                        setSelected(
                          event.target.checked ? talks.map(talk => talk.id) : []
                        )
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
          </Panel>
        </Column>
      </Columns>
      <Column textAlign="centered">
        <p>
          <Button type="submit" size="medium" color="info" isOutlined>
            <Icon name="paper-plane" />
            <span>Confirm Participation</span>
          </Button>
        </p>
        <Paragraph mt="2">
          If you cannot attend our event, click{' '}
          <a
            href="https://github.com/aldi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>HERE</strong>
          </a>
          .
        </Paragraph>
        {/* Mounted from the start, so a screen reader hears each change. */}
        <Paragraph
          mt="3"
          textSize="7"
          textColor={feedback?.color}
          role="status"
          aria-live="polite"
        >
          {feedback?.text}
        </Paragraph>
      </Column>
    </form>
  );
}

export default ParticipationForm;
