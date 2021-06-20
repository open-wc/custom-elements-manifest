@customElement("customelement-schema-viewer")
export class CustomElementSchemaViewerElement extends LitElement {
  /**
   * Any valid path to load a JSON file that adheres to the custom element manifest schema: {@link https://github.com/webcomponents/custom-elements-manifest/}
   */
  src;
}