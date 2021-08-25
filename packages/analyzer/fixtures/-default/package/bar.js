
class MyElement extends HTMLElement {
}
customElements.define('my-element', MyElement);

// This works:
function emptyFunction() {}
function returnValue() {
    return "anything";
}
function returnUndefined() {
    return undefined;
}
function conditionalEmptyReturn() {
    if(Math.random() > 0.5) {
        return;
    }
    return true;
}

// This breaks:
function emptyReturn() {
    // empty return statements breaks the parser
    return;
}