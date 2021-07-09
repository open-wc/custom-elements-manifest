### `my-element.js`:

#### class: `MyElement`, `my-element`

##### Fields

| Name  | Privacy | Type | Default | Description | Inherited From |
| ----- | ------- | ---- | ------- | ----------- | -------------- |
| prop1 | public  |      |         |             |                |

##### Methods

| Name           | Privacy | Description                         | Parameters            | Return | Inherited From |
| -------------- | ------- | ----------------------------------- | --------------------- | ------ | -------------- |
| instanceMethod | public  | Some description of the method here | `e: Event, a: string` |        |                |

##### Events

| Name     | Type    | Description | Inherited From |
| -------- | ------- | ----------- | -------------- |
| my-event | `Event` |             |                |

##### CSS Properties

| Name               | Default         | Description               |
| ------------------ | --------------- | ------------------------- |
| --background-color | `rebeccapurple` | Controls the color of bar |

<hr/>

#### Functions

| Name           | Description               | Parameters              | Return    |
| -------------- | ------------------------- | ----------------------- | --------- |
| functionExport | This is a function export | `a: string, b: boolean` | `boolean` |

<hr/>

#### Exports

| Kind                      | Name           | Declaration    | Module          | Package |
| ------------------------- | -------------- | -------------- | --------------- | ------- |
| custom-element-definition | my-element     | MyElement      | ./my-element.js |         |
| js                        | functionExport | functionExport | ./my-element.js |         |
