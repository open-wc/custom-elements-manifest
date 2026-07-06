/**
 * Tests that identifiers passed to subclassed events are NOT extracted as event names
 * This addresses GitHub issue #149:
 * https://github.com/open-wc/custom-elements-manifest/issues/149
 *
 * The bug: When dispatching subclassed events like `new MyEvent(someArg)`,
 * the analyzer incorrectly extracted 'someArg' as the event name.
 * It should instead extract the event name from the super() call in MyEvent's constructor.
 */
class DataChangeEvent extends Event {
  constructor(newValue, oldValue) {
    super('data-change', { bubbles: true });
    this.newValue = newValue;
    this.oldValue = oldValue;
  }
}

/**
 * Subclassed event with object parameter
 */
class StatusEvent extends CustomEvent {
  constructor(statusData) {
    super('status-update', { detail: statusData });
  }
}

class MyElement extends HTMLElement {
  updateData(newValue, oldValue) {
    // This should NOT extract 'newValue' as the event name
    this.dispatchEvent(new DataChangeEvent(newValue, oldValue));
  }

  updateStatus(statusData) {
    // This should NOT extract 'statusData' as the event name
    this.dispatchEvent(new StatusEvent(statusData));
  }

  // For comparison: this is the old way that should still work
  dispatchOldWay() {
    this.dispatchEvent(new CustomEvent('old-way-event', { detail: {} }));
  }
}

customElements.define('my-element', MyElement);
