// Helper script to add classPrefix tests to remaining components
const componentsToAdd = [
  'Content',
  'Delete',
  'Icon',
  'IconText',
  'Image',
  'Notification',
  'Progress',
  'SubTitle',
  'Tag',
  'Tags',
];

const classPrefixTestTemplate = (componentName, mainClass, testId = null) => {
  const testElement = testId
    ? `screen.getByTestId('${testId}')`
    : `screen.getByText('Test')`;

  return `
  describe('ClassPrefix', () => {
    test('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <${componentName}${testId ? ` data-testid="${testId}"` : ''}>Test</${componentName}>
        </ConfigProvider>
      );
      expect(${testElement}).toHaveClass('my-prefix-${mainClass}');
    });

    test('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <${componentName}${testId ? ` data-testid="${testId}"` : ''}>Test</${componentName}>
        </ConfigProvider>
      );
      expect(${testElement}).toHaveClass('${mainClass}');
    });

    test('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <${componentName}${testId ? ` data-testid="${testId}"` : ''}>Test</${componentName}>
        </ConfigProvider>
      );
      expect(${testElement}).toHaveClass('${mainClass}');
    });
  });`;
};

console.log('Template ready for adding to test files');
