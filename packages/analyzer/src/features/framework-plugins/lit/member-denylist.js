/**
 * MEMBER-DENY-LIST
 * 
 * Excludes members from the manifest
 */
export function memberDenyListPlugin() {
  const MEMBER_DENY_LIST = ['properties', 'styles'];

  return {
    moduleLinkPhase({moduleDoc}){
      const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class');

      classes?.forEach(klass => {
        if(!klass?.members) return;
        klass.members = klass?.members?.filter(member => !MEMBER_DENY_LIST.includes(member.name));
      });
    },
  }
}

