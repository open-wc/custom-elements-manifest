/**
 * FIELD-DENY-LIST
 * 
 * Excludes fields from the manifest
 */
export function fieldDenyListPlugin() {
  const FIELD_DENY_LIST = [
    'observedAttributes',
  ];

  return {
    moduleLinkPhase({moduleDoc}){
      const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class' || declaration.kind === 'mixin');

      classes?.forEach(klass => {
        klass.members = klass?.members?.filter(member => !FIELD_DENY_LIST.includes(member.name));
      });
    },
  }
}

