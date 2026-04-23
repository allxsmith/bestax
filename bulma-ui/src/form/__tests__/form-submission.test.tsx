import { render } from '@testing-library/react';
import React from 'react';
import { Rate } from '../Rate';
import { Taginput } from '../Taginput';
import { Autocomplete } from '../Autocomplete';
import { Slider } from '../Slider';
import { Radios } from '../Radios';
import { Radio } from '../Radio';

describe('Form submission integration', () => {
  it('Rate with name renders hidden input', () => {
    const { container } = render(<Rate name="rating" defaultValue={3} />);
    const hidden = container.querySelector('input[type="hidden"]');
    expect(hidden).toHaveAttribute('name', 'rating');
    expect(hidden).toHaveAttribute('value', '3');
  });

  it('Rate without name renders NO hidden input', () => {
    const { container } = render(<Rate defaultValue={3} />);
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('Taginput with name renders one hidden input per tag', () => {
    const { container } = render(
      <Taginput name="tags" defaultValue={['a', 'b', 'c']} />
    );
    const hidden = container.querySelectorAll('input[type="hidden"]');
    expect(hidden).toHaveLength(3);
    expect(hidden[0]).toHaveAttribute('name', 'tags');
    expect(hidden[0]).toHaveAttribute('value', 'a');
    expect(hidden[2]).toHaveAttribute('value', 'c');
  });

  it('Autocomplete forwards name to inner input', () => {
    const { container } = render(
      <Autocomplete name="city" data={['NY', 'LA']} />
    );
    const input = container.querySelector('input[type="text"]');
    expect(input).toHaveAttribute('name', 'city');
  });

  it('Slider single mode forwards name from rest', () => {
    const { container } = render(<Slider name="vol" defaultValue={50} />);
    const input = container.querySelector('input[type="range"]');
    expect(input).toHaveAttribute('name', 'vol');
  });

  it('Slider range mode applies nameLow/nameHigh to each thumb', () => {
    const { container } = render(
      <Slider range nameLow="lo" nameHigh="hi" defaultValue={[10, 90]} />
    );
    const inputs = container.querySelectorAll('input[type="range"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute('name', 'lo');
    expect(inputs[1]).toHaveAttribute('name', 'hi');
  });

  it('Radios spreads name to each Radio child without own name', () => {
    const { container } = render(
      <Radios name="color">
        <Radio value="r">Red</Radio>
        <Radio value="g">Green</Radio>
        <Radio value="b" name="override">Blue</Radio>
      </Radios>
    );
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios[0]).toHaveAttribute('name', 'color');
    expect(radios[1]).toHaveAttribute('name', 'color');
    expect(radios[2]).toHaveAttribute('name', 'override');
  });

  it('Radios name reaches Radios wrapped in custom components (context, not cloneElement)', () => {
    // This would have failed under React.Children.map + cloneElement, since
    // the inner Radio is not a direct child of <Radios>. Context propagates
    // through any wrapper depth.
    const RadioCard = ({ value, label }: { value: string; label: string }) => (
      <div className="card">
        <Radio value={value}>{label}</Radio>
      </div>
    );
    const { container } = render(
      <Radios name="plan">
        <RadioCard value="basic" label="Basic" />
        <RadioCard value="pro" label="Pro" />
        <>
          <RadioCard value="enterprise" label="Enterprise" />
        </>
      </Radios>
    );
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute('name', 'plan');
    expect(radios[1]).toHaveAttribute('name', 'plan');
    expect(radios[2]).toHaveAttribute('name', 'plan');
  });
});
