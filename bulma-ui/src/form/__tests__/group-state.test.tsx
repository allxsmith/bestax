import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Radios } from '../Radios';
import { Radio } from '../Radio';
import { Checkboxes } from '../Checkboxes';
import { Checkbox } from '../Checkbox';

describe('Radios group state', () => {
  it('uncontrolled: initializes from defaultValue', () => {
    const { container } = render(
      <Radios name="color" defaultValue="green">
        <Radio value="red">Red</Radio>
        <Radio value="green">Green</Radio>
        <Radio value="blue">Blue</Radio>
      </Radios>
    );
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true); // green
    expect(radios[2].checked).toBe(false);
  });

  it('uncontrolled: clicking updates internal state and fires onChange', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Radios name="color" defaultValue="red" onChange={handleChange}>
        <Radio value="red">Red</Radio>
        <Radio value="green">Green</Radio>
      </Radios>
    );
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    fireEvent.click(radios[1]);
    expect(handleChange).toHaveBeenCalledWith('green');
    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
  });

  it('controlled: derives checked from value prop', () => {
    const { container } = render(
      <Radios name="color" value="blue" onChange={() => {}}>
        <Radio value="red">Red</Radio>
        <Radio value="blue">Blue</Radio>
      </Radios>
    );
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
  });

  it('controlled: clicking fires onChange but state only updates if parent updates value', () => {
    const Wrapper = () => {
      const [v, setV] = useState('red');
      return (
        <>
          <span data-testid="val">{v}</span>
          <Radios name="color" value={v} onChange={setV}>
            <Radio value="red">Red</Radio>
            <Radio value="green">Green</Radio>
          </Radios>
        </>
      );
    };
    const { container } = render(<Wrapper />);
    expect(screen.getByTestId('val').textContent).toBe('red');
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    fireEvent.click(radios[1]);
    expect(screen.getByTestId('val').textContent).toBe('green');
    expect(radios[1].checked).toBe(true);
  });

  it('local checked prop wins over group value', () => {
    const { container } = render(
      <Radios name="color" value="red" onChange={() => {}}>
        <Radio value="red">Red</Radio>
        <Radio value="green" checked={true} onChange={() => {}}>Green</Radio>
      </Radios>
    );
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    // Group says red is selected, but green has its own checked={true}
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(true);
  });

  it('name-only mode (Stage 1): group does NOT control checked', () => {
    const { container } = render(
      <Radios name="color">
        <Radio value="red" defaultChecked>Red</Radio>
        <Radio value="green">Green</Radio>
      </Radios>
    );
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    // Children manage their own state via defaultChecked.
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    // Both inherit name from the group.
    expect(radios[0].getAttribute('name')).toBe('color');
    expect(radios[1].getAttribute('name')).toBe('color');
  });

  it('local onChange still fires alongside group onChange', () => {
    const groupHandler = jest.fn();
    const localHandler = jest.fn();
    const { container } = render(
      <Radios name="color" defaultValue="red" onChange={groupHandler}>
        <Radio value="red">Red</Radio>
        <Radio value="green" onChange={localHandler}>Green</Radio>
      </Radios>
    );
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    fireEvent.click(radios[1]);
    expect(localHandler).toHaveBeenCalled();
    expect(groupHandler).toHaveBeenCalledWith('green');
  });
});

describe('Checkboxes group state', () => {
  it('uncontrolled: initializes from defaultValue array', () => {
    const { container } = render(
      <Checkboxes name="tags" defaultValue={['react', 'vue']}>
        <Checkbox value="react">React</Checkbox>
        <Checkbox value="vue">Vue</Checkbox>
        <Checkbox value="angular">Angular</Checkbox>
      </Checkboxes>
    );
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checks[0].checked).toBe(true); // react
    expect(checks[1].checked).toBe(true); // vue
    expect(checks[2].checked).toBe(false);
  });

  it('uncontrolled: toggling adds/removes from internal array', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Checkboxes name="tags" defaultValue={['react']} onChange={handleChange}>
        <Checkbox value="react">React</Checkbox>
        <Checkbox value="vue">Vue</Checkbox>
      </Checkboxes>
    );
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    // Toggle vue on
    fireEvent.click(checks[1]);
    expect(handleChange).toHaveBeenLastCalledWith(['react', 'vue']);
    expect(checks[1].checked).toBe(true);
    // Toggle react off
    fireEvent.click(checks[0]);
    expect(handleChange).toHaveBeenLastCalledWith(['vue']);
    expect(checks[0].checked).toBe(false);
  });

  it('controlled: derives checked from membership in value array', () => {
    const { container } = render(
      <Checkboxes name="tags" value={['vue', 'angular']} onChange={() => {}}>
        <Checkbox value="react">React</Checkbox>
        <Checkbox value="vue">Vue</Checkbox>
        <Checkbox value="angular">Angular</Checkbox>
      </Checkboxes>
    );
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checks[0].checked).toBe(false);
    expect(checks[1].checked).toBe(true);
    expect(checks[2].checked).toBe(true);
  });

  it('controlled: parent state syncs through full round-trip', () => {
    const Wrapper = () => {
      const [v, setV] = useState<string[]>(['react']);
      return (
        <>
          <span data-testid="val">{v.join(',')}</span>
          <Checkboxes name="tags" value={v} onChange={setV}>
            <Checkbox value="react">React</Checkbox>
            <Checkbox value="vue">Vue</Checkbox>
          </Checkboxes>
        </>
      );
    };
    const { container } = render(<Wrapper />);
    expect(screen.getByTestId('val').textContent).toBe('react');
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    fireEvent.click(checks[1]);
    expect(screen.getByTestId('val').textContent).toBe('react,vue');
    fireEvent.click(checks[0]);
    expect(screen.getByTestId('val').textContent).toBe('vue');
  });

  it('name-only mode (Stage 1): group does NOT control checked', () => {
    const { container } = render(
      <Checkboxes name="tags">
        <Checkbox value="react" defaultChecked>React</Checkbox>
        <Checkbox value="vue">Vue</Checkbox>
      </Checkboxes>
    );
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checks[0].checked).toBe(true);
    expect(checks[1].checked).toBe(false);
    expect(checks[0].getAttribute('name')).toBe('tags');
    expect(checks[1].getAttribute('name')).toBe('tags');
  });

  it('group state propagates through wrapper components', () => {
    const CheckboxCard = ({ value, label }: { value: string; label: string }) => (
      <div className="card">
        <Checkbox value={value}>{label}</Checkbox>
      </div>
    );
    const { container } = render(
      <Checkboxes name="tags" defaultValue={['react', 'angular']}>
        <CheckboxCard value="react" label="React" />
        <CheckboxCard value="vue" label="Vue" />
        <CheckboxCard value="angular" label="Angular" />
      </Checkboxes>
    );
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checks[0].checked).toBe(true); // react
    expect(checks[1].checked).toBe(false); // vue
    expect(checks[2].checked).toBe(true); // angular
  });
});
