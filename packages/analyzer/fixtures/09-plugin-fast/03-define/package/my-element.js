import { FASTElement, html } from '@microsoft/fast-element';

const template = html<NameTag>`
  <p>Hello</p>
`;

export class NameTag extends FASTElement {}

NameTag.define({
  name: 'name-tag',
  template
});
