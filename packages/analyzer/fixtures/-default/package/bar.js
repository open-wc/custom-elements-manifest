/**
 * @property {boolean} src this is desc
 */
@customElement("customelement-schema-viewer")
export class CustomElementSchemaViewerElement extends LitElement {


  static get properties() {
    return {
      src: { type: Boolean }
    }
  }
}