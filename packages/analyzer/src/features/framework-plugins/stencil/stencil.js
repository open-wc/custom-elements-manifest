import { decorator, toKebabCase, getNodeText } from '../../../utils/index.js'

export function stencilPlugin() {
  let events = [];

  const METHOD_DENYLIST = ['componentWillLoad', 'componentDidLoad', 'componentShouldUpdate', 'componentWillRender', 'componentDidRender', 'componentWillUpdate', 'componentDidUpdate'];

  return {
    name: 'CORE - STENCIL',
    analyzePhase({node, moduleDoc}){
      if (node.type === 'ClassDeclaration') {
        /**
         * Add tagName to classDoc, extracted from `@Component({tag: 'foo-bar'})` decorator
         */
        const componentDecorator = node?.decorators?.find(decorator('Component'))?.expression;

        const tagName = componentDecorator?.arguments?.[0]?.properties?.find(prop => {
          return (prop?.key?.name || prop?.key?.value) === 'tag'
        })?.value?.value;

        const className = node?.id?.name;
        const currClass = moduleDoc?.declarations?.find(declaration => declaration.name === className);
        if(tagName) {
          currClass.tagName = tagName;
          moduleDoc.exports.push({
            kind: "custom-element-definition",
            name: tagName,
            declaration: {
              name: className,
              module: moduleDoc.path
            }
          });
        }

        /**
         * Collect fields with `@Event()` decorator
         */
        const members = node?.body?.body || [];
        const eventFields = members
          ?.filter(member => member?.decorators?.find(decorator('Event')))
          ?.map(member => {
            const eventDecorator = member?.decorators?.find(decorator('Event'));
            const eventName = eventDecorator?.expression?.arguments?.[0]?.properties?.find(prop => {
              return (prop?.key?.name || prop?.key?.value) === 'eventName'
            })?.value?.value;

            return { field: member?.key?.name || '', as: eventName || member?.key?.name || '' }
          });
        events = [...(eventFields || [])];

        /**
         * Handle `@Prop` decorator
         */
        members
          ?.filter(member => member?.decorators?.find(decorator('Prop')))
          ?.forEach(property => {
            const fieldName = property?.key?.name || '';
            const propDecorator = property?.decorators?.find(decorator('Prop'));
            const attrNameFromDecorator = propDecorator?.expression?.arguments?.[0]?.properties?.find(prop => (prop?.key?.name || prop?.key?.value) === 'attribute')?.value?.value;
            const attrName = attrNameFromDecorator || toKebabCase(fieldName);

            const reflectsVal = propDecorator?.expression?.arguments?.[0]?.properties?.find(prop => (prop?.key?.name || prop?.key?.value) === 'reflects')?.value?.value === true;
            const member = currClass?.members?.find(mem => mem?.name === fieldName);
            if(reflectsVal) {
              member.reflects = true;
              member.attribute = attrName;
            }

            if(!currClass.attributes) currClass.attributes = [];
            const typeAnnotation = property?.typeAnnotation?.typeAnnotation;
            const hasType = !!typeAnnotation;

              currClass.attributes.push({
                name: attrName,
                fieldName,
                ...(member?.default ? { default: member.default } : {}),
                ...(member?.description ? { description: member.description } : {}),
                ...(hasType ? {
                  type: { text: getNodeText(typeAnnotation, property._sourceText) }
                } : {})
              })
          });
      }
    },

    moduleLinkPhase({moduleDoc}){
      const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class');

      classes?.forEach(klass => {
        if(!klass?.members) return;
        klass.members = klass?.members?.filter(member => {
          return !METHOD_DENYLIST.includes(member.name)
        });
      });

      classes?.forEach(klass => {
        if(!klass?.members) return;
        const eventsAsFields = klass.members
          ?.filter(member => events.some(event => event.field === member.name))
          ?.map(member => {
            delete member.privacy;
            delete member.kind;
            member.name = events.find(event => event.field === member.name).as;
            return member;
          }) || [];

        klass.events = [...(klass?.events || []), ...eventsAsFields]
        klass.members = klass?.members?.filter(member => !events.some(event => event.field === member.name || event.as === member.name));
      });
    }
  }
}
