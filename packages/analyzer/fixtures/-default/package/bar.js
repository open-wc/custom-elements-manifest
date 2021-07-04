import type Bar from 'bar';

/**
 * Description of the interface
 */
export interface MyInterface extends Foo, Bar implements Baz {
  /** 
   * the name of the class 
   * @summary this is the summary
   */
  name: string;

  /** super classes and mixins */
  superClasses: SuperClass[];

  member: ClassMember;

  baz(a: string): void
}
