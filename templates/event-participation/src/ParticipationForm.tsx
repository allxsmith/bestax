import { useState, type FormEvent } from 'react';
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

/** The program: each talk's time and title, and its box's id and name. */
const TALKS = [
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
  { id: 'vipcoctail', time: '14:00', title: 'Press Conference & VIP Cocktail' },
];

const ALL = TALKS.map(talk => talk.id);

type Feedback = { tone: 'warning' | 'success'; text: string };

/**
 * The program as a table of talks to pick, with a "Select All" box that
 * shows a mixed state while only some are picked, and the confirm button.
 * Submitting stays on the page and says how many talks were confirmed.
 */
function ParticipationForm() {
  const [picked, setPicked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const allPicked = picked.length === ALL.length;

  const toggle = (id: string, checked: boolean) =>
    setPicked(current =>
      checked ? [...current, id] : current.filter(other => other !== id)
    );

  const confirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (picked.length === 0) {
      setFeedback({
        tone: 'warning',
        text: 'Please select at least one talk before confirming.',
      });
      return;
    }
    setFeedback({
      tone: 'success',
      text: `Participation confirmed for ${picked.length} talk${picked.length === 1 ? '' : 's'}.`,
    });
  };

  return (
    <form id="participation-form" onSubmit={confirm}>
      <Columns isVCentered>
        <Column sizeMobile="full">
          <Panel as="section">
            <Panel.Heading>Program</Panel.Heading>
            <Panel.Block as="div">
              <Table isFullwidth>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th scope="col">Time</Table.Th>
                    <Table.Th scope="col">Talk</Table.Th>
                    <Table.Th scope="col" textAlign="centered">
                      Select
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {TALKS.map(talk => (
                    <Table.Tr key={talk.id}>
                      <Table.Td>{talk.time}</Table.Td>
                      <Table.Td>{talk.title}</Table.Td>
                      <Table.Td className="is-icon">
                        <Checkbox
                          id={talk.id}
                          name={talk.id}
                          aria-label={talk.title}
                          checked={picked.includes(talk.id)}
                          onChange={event =>
                            toggle(talk.id, event.target.checked)
                          }
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  <Table.Tr>
                    <Table.Td />
                    <Table.Td textAlign="right">Select All</Table.Td>
                    <Table.Td className="is-icon">
                      <Checkbox
                        id="select-all"
                        name="select-all"
                        aria-label="Select All Talks"
                        checked={allPicked}
                        indeterminate={picked.length > 0 && !allPicked}
                        onChange={() => setPicked(allPicked ? [] : ALL)}
                      />
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Panel.Block>
          </Panel>
        </Column>
      </Columns>
      <Column textAlign="centered">
        <p>
          <Button
            size="medium"
            color="info"
            isOutlined
            type="submit"
            value="Submit"
          >
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
        <Paragraph
          id="form-feedback"
          mt="3"
          textSize="7"
          textColor={feedback?.tone}
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
