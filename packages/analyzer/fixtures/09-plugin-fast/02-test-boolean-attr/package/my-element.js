import { FASTElement, customElement, attr } from "@microsoft/fast-element";

@customElement("boolean-test")
export class BooleanTest extends FASTElement {
  // Should have name: "normalAttr"
  @attr normalAttr;

  // Should have name: "booleanAttr"
  @attr({ mode: "boolean" }) booleanAttr;

  // Should have name: "customName"
  @attr({ attribute: "customName", mode: "boolean" }) explicitName;
}
