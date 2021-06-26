/**
 * METHOD-DENY-LIST
 * 
 * Excludes methods from the manifest
 */
export function methodDenyListPlugin() {
  const METHOD_DENY_LIST = ['requestUpdate', 'performUpdate', 'shouldUpdate', 'update', 'render', 'firstUpdated', 'updated', 'willUpdate'];

  return {
    name: 'CORE - LIT-METHOD-DENYLIST',
    moduleLinkPhase({moduleDoc}){
      const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class');

      classes?.forEach(klass => {
        if(!klass?.members) return;
        klass.members = klass?.members?.filter(member => !METHOD_DENY_LIST.includes(member.name));
      });
    },
  }
}

