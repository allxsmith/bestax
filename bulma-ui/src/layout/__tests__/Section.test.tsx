import { render, screen } from '@testing-library/react';
import { Section } from '../Section';
import { Title } from '../../elements/Title';
import { SubTitle } from '../../elements/SubTitle';

describe('Section', () => {
  it('renders section with children and region role when labelled', () => {
    render(
      <Section aria-label="Main Section">
        <Title>Section</Title>
        <SubTitle>
          Divide your content into into <strong>sections</strong>. Tada!
        </SubTitle>
      </Section>
    );
    expect(screen.getByRole('region')).toHaveClass('section');
    expect(screen.getByText('Section')).toBeInTheDocument();

    // Use a function matcher for split text nodes
    expect(
      screen.getByText(
        (_content, node) =>
          node?.textContent === 'Divide your content into into sections. Tada!'
      )
    ).toBeInTheDocument();

    expect(screen.getByText('sections')).toBeInTheDocument();
  });

  it('applies is-medium size', () => {
    render(
      <Section size="medium" data-testid="section">
        <Title>Medium</Title>
      </Section>
    );
    expect(screen.getByTestId('section')).toHaveClass('section', 'is-medium');
  });

  it('applies is-large size', () => {
    render(
      <Section size="large" data-testid="section">
        <Title>Large</Title>
      </Section>
    );
    expect(screen.getByTestId('section')).toHaveClass('section', 'is-large');
  });

  it('allows custom className', () => {
    render(<Section className="custom" data-testid="section" />);
    expect(screen.getByTestId('section')).toHaveClass('custom');
  });
});
