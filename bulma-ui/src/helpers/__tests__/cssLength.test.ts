import { lengthToPx, remPxOf } from '../cssLength';

describe('lengthToPx', () => {
  it('reads a length in pixels: a number, px or rem, and nothing else', () => {
    expect(lengthToPx(200, 16)).toBe(200);
    expect(lengthToPx('200px', 16)).toBe(200);
    expect(lengthToPx(' 12.5rem ', 16)).toBe(200);
    expect(lengthToPx('30vw', 16)).toBeNull();
    expect(lengthToPx(undefined, 16)).toBeNull();
  });
});

describe('remPxOf', () => {
  afterEach(() => {
    document.documentElement.style.fontSize = '';
  });

  it('reads the root font size of the page an element is in', () => {
    document.documentElement.style.fontSize = '20px';
    expect(remPxOf(document.body)).toBe(20);
  });

  it('takes Bulma’s 16 when the page gives no size', () => {
    expect(remPxOf(document.body)).toBe(16);
  });
});
