import type C from 'bar';
import F from 'b.js';

export interface G {
  g: boolean;
}
export interface B extends F, G {
  b: string;
}

/**
 * Description of the interface
 */
export interface A extends B, C implements D {
  a: string;
}


// import type Bar from 'bar';

// /**
//  * Description of the interface
//  */
// export interface MyInterface extends Foo, Bar implements Baz {
//   /** 
//    * the name of the class 
//    * @summary this is the summary
//    */
//   name: string;

//   /** super classes and mixins */
//   superClasses: SuperClass[];

//   member: ClassMember;

//   baz(a: string): void
// }
