# Function: useBulmaClasses()

> **useBulmaClasses**\<`T`\>(`props`): `object`

A hook that generates Bulma helper classes from props and separates unhandled props.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `props` | [`BulmaClassesProps`](../interfaces/BulmaClassesProps.md) & `T` | Combination of BulmaClassesProps and additional props. |

## Returns

`object`

An object containing the Bulma helper classes and unhandled props.

### bulmaHelperClasses

> **bulmaHelperClasses**: `string`

### rest

> **rest**: `Omit`\<`T`, keyof [`BulmaClassesProps`](../interfaces/BulmaClassesProps.md)\>

## Example

```ts
const { bulmaHelperClasses, rest } = useBulmaClasses({
  color: 'primary',
  textSize: '3',
  className: 'custom-class'
});
// bulmaHelperClasses: 'has-text-primary is-size-3'
// rest: { className: 'custom-class' }
```
