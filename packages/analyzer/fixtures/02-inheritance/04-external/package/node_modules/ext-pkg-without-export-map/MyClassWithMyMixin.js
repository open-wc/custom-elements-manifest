import {MyMixin} from '@ext-scoped/with-export-map';
import {MyClass} from './MyClass.js';

export class MyClassWithMyMixin extends MyMixin(MyClass) {}
