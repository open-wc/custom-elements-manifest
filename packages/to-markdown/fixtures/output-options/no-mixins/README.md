# `./fixtures/-TEST/package/my-element.js`:

## class: `SuperClass`

### Superclass

| Name         | Module | Package     |
| ------------ | ------ | ----------- |
| `LitElement` |        | lit-element |

### Methods

| Name               | Privacy | Description | Parameters | Return | Inherited From |
| ------------------ | ------- | ----------- | ---------- | ------ | -------------- |
| `superClassMethod` | public  |             |            |        |                |

### Events

| Name           | Type               | Description    | Inherited From |
| -------------- | ------------------ | -------------- | -------------- |
| `custom-event` | `SuperCustomEvent` | this is custom |                |

<hr/>

## class: `MyElement`, `my-element`

### Superclass

| Name         | Module                                 | Package |
| ------------ | -------------------------------------- | ------- |
| `SuperClass` | ./fixtures/-TEST/package/my-element.js |         |

### Static Fields

| Name         | Privacy | Type     | Default | Description | Inherited From |
| ------------ | ------- | -------- | ------- | ----------- | -------------- |
| `properties` |         | `object` |         |             |                |

### Static Methods

| Name           | Privacy | Description | Parameters | Return | Inherited From |
| -------------- | ------- | ----------- | ---------- | ------ | -------------- |
| `staticMethod` |         |             |            |        |                |

### Fields

| Name        | Privacy   | Type      | Default | Description           | Inherited From |
| ----------- | --------- | --------- | ------- | --------------------- | -------------- |
| `prop1`     | public    |           |         |                       |                |
| `prop2`     | public    |           |         |                       |                |
| `prop3`     | public    | `boolean` | `true`  |                       |                |
| `foo`       | private   | `string`  | `'bar'` | description goes here |                |
| `mixinProp` | protected | `number`  | `1`     |                       | Mixin          |

### Methods

| Name               | Privacy | Description                         | Parameters            | Return | Inherited From |
| ------------------ | ------- | ----------------------------------- | --------------------- | ------ | -------------- |
| `instanceMethod`   | public  | Some description of the method here | `e: Event, a: string` |        |                |
| `superClassMethod` | public  |                                     |                       |        | SuperClass     |

### Events

| Name           | Type               | Description    | Inherited From |
| -------------- | ------------------ | -------------- | -------------- |
| `my-event`     | `Event`            |                |                |
| `custom-event` | `SuperCustomEvent` | this is custom | SuperClass     |

### Attributes

| Name     | Field | Inherited From |
| -------- | ----- | -------------- |
| `prop-1` | prop1 |                |
| `prop2`  | prop2 |                |

### CSS Properties

| Name                 | Default         | Description               |
| -------------------- | --------------- | ------------------------- |
| `--background-color` | `rebeccapurple` | Controls the color of bar |

### CSS Parts

| Name  | Description             |
| ----- | ----------------------- |
| `bar` | Styles the color of bar |

### Slots

| Name        | Description                    |
| ----------- | ------------------------------ |
| `container` | You can put some elements here |

<hr/>

## Variables

| Name                   | Description                 | Type      |
| ---------------------- | --------------------------- | --------- |
| `variableExport`       | this is a var export        | `boolean` |
| `stringVariableExport` | this is a string var export | `string`  |

<hr/>

## Functions

| Name             | Description               | Parameters              | Return    |
| ---------------- | ------------------------- | ----------------------- | --------- |
| `functionExport` | This is a function export | `a: string, b: boolean` | `boolean` |

<hr/>

## Exports

| Kind                        | Name                   | Declaration          | Module                                 | Package |
| --------------------------- | ---------------------- | -------------------- | -------------------------------------- | ------- |
| `js`                        | `SuperClass`           | SuperClass           | ./fixtures/-TEST/package/my-element.js |         |
| `custom-element-definition` | `my-element`           | MyElement            | ./fixtures/-TEST/package/my-element.js |         |
| `js`                        | `variableExport`       | variableExport       | ./fixtures/-TEST/package/my-element.js |         |
| `js`                        | `stringVariableExport` | stringVariableExport | ./fixtures/-TEST/package/my-element.js |         |
| `js`                        | `functionExport`       | functionExport       | ./fixtures/-TEST/package/my-element.js |         |
