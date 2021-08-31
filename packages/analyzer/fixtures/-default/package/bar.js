
import { LitElement } from 'lit-element';

export class MyElement extends LitElement {
    public managePresenceObservedSlot = (): void => {
        lightDomSelectors.forEach((selector) => {
            this[slotContentIsPresent].set(
                selector,
                !!this.querySelector(selector)
            );
        });
        this.requestUpdate();
    };
}
