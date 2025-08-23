import { render, screen } from '@testing-library/react';
import { Section } from '../Section';
import { Title } from '../../elements/Title';
import { SubTitle } from '../../elements/SubTitle';
import { ConfigProvider } from '../../helpers/Config';

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

  it('applies classPrefix when provided', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Section data-testid="section-test">Test Section</Section>
      </ConfigProvider>
    );
    const section = screen.getByTestId('section-test');
    expect(section).toHaveClass('custom-section');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Section data-testid="section">Section content</Section>
        </ConfigProvider>
      );
      const section = screen.getByTestId('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('bulma-section');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Section data-testid="section">Section content</Section>);
      const section = screen.getByTestId('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('section');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Section data-testid="section">Section content</Section>
        </ConfigProvider>
      );
      const section = screen.getByTestId('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('section');
    });

    it('applies prefix to both main class and section modifiers', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Section data-testid="section" size="large" textColor="primary" m="3">
            Section content
          </Section>
        </ConfigProvider>
      );
      const section = screen.getByTestId('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('bulma-section');
      expect(section).toHaveClass('bulma-is-large');
      expect(section).toHaveClass('bulma-has-text-primary');
      expect(section).toHaveClass('bulma-m-3');
    });

    it('works without prefix', () => {
      render(
        <Section data-testid="section" size="medium" bgColor="light" p="4">
          Section content
        </Section>
      );
      const section = screen.getByTestId('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('section');
      expect(section).toHaveClass('is-medium');
      expect(section).toHaveClass('has-background-light');
      expect(section).toHaveClass('p-4');
    });
  });
});
