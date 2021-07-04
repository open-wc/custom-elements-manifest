// TodoList should have `todo-list` as `tagName` in the output custom-elements.json
// This is also an export of kind: "custom-elements-definition"
@Component({
  tag: 'todo-list'
})
export class TodoList {
  // shows up as attr
  @Prop() color: string;
  // shows up as `is-valid` attr (camelcase to kebab)
  @Prop() isValid: boolean;

  @Prop() controller: MyController;
  // shows up as attr `valid`
  @Prop({ attribute: 'valid' }) isValid: boolean;
  // shows up as attr `message` (probably doesnt even need special handling, but just incase)
  @Prop({ reflects: true }) message = 'Hello';

  // shows up as event `todoCompleted`
  // `todoCompleted` should not be present in the class's members array
  @Event() todoCompleted: EventEmitter<Todo>;
  
  // shows up as event `foo`
  @Event({
    eventName: 'foo',
  }) fooEvent: EventEmitter<Todo>;

  someMethod(){}

  // these should not show up in custom-elements.json
  componentWillLoad(){}
  componentDidLoad(){}
  componentShouldUpdate(){}
  componentWillRender(){}
  componentDidRender(){}
  componentWillUpdate(){}
  componentDidUpdate(){}
}