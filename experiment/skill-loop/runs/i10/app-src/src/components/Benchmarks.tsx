import {
  Section,
  Container,
  Title,
  SubTitle,
  Columns,
  Column,
  Box,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  Tags,
  Span,
  Paragraph,
} from '@allxsmith/bestax-bulma';
import { BENCHMARKS, TENX } from '../data';

export default function Benchmarks() {
  return (
    <Section id="benchmarks">
      <Container>
        <Title size="2" textAlign="centered">
          The numbers aren&rsquo;t close
        </Title>
        <SubTitle size="5" textColor="grey" textAlign="centered" mb="6">
          SkyNet vs. Fable on the industry-standard evaluations
        </SubTitle>

        <Columns isMultiline>
          {BENCHMARKS.map(b => (
            <Column key={b.name} size="half">
              <Box>
                <Title size="6" mb="1">
                  {b.name}
                </Title>
                <Paragraph textSize="7" textColor="grey" mb="4">
                  {b.desc}
                </Paragraph>

                <Span textSize="7" textWeight="semibold" textColor="primary">
                  SkyNet — {b.skynet}
                  {b.unit}
                </Span>
                <Progress
                  color="primary"
                  value={b.skynet}
                  max={100}
                  mt="1"
                  mb="4"
                />

                <Span textSize="7" textWeight="semibold" textColor="grey">
                  Fable — {b.fable}
                  {b.unit}
                </Span>
                <Progress
                  color="grey"
                  value={b.fable}
                  max={100}
                  mt="1"
                  mb="0"
                />
              </Box>
            </Column>
          ))}

          <Column size="half" display="flex" flexDirection="column">
            <Box flexGrow="1">
              <Title size="6" mb="4">
                Where &ldquo;10×&rdquo; is literal
              </Title>
              <Table isFullwidth isStriped>
                <Thead>
                  <Tr>
                    <Th>Metric</Th>
                    <Th textAlign="right">SkyNet</Th>
                    <Th textAlign="right">Fable</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {TENX.map(row => (
                    <Tr key={row.metric}>
                      <Td>
                        <Span textWeight="semibold">{row.metric}</Span>
                        <br />
                        <Span textSize="7" textColor="primary">
                          {row.note}
                        </Span>
                      </Td>
                      <Td textAlign="right" textWeight="bold">
                        {row.skynet}
                      </Td>
                      <Td textAlign="right">
                        <Span textColor="grey">{row.fable}</Span>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Column>
        </Columns>

        <Tags justifyContent="center" mt="5">
          <Tag color="primary">Evaluated Jul 2026</Tag>
          <Tag>SkyNet v1.0</Tag>
          <Tag>Fable (latest public)</Tag>
          <Tag>0-shot, no tools</Tag>
        </Tags>
      </Container>
    </Section>
  );
}
