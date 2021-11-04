class MyElementA extends MyMixin(HTMLElement){}

function MyMixin(superClass){
    return class extends superClass {
       foo = 1;
    }
}

customElements.define('my-mixin-element-a', MyElementA);