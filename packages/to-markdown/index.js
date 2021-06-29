const has = item => Array.isArray(item) && item.length > 0;
const render = (item, properties) => {
  let md = '|'
  properties.forEach(prop => {
    if(prop === 'declaration') {
      md += `${item?.declaration?.name || ''} | ${item?.declaration?.module || ''} | ${item?.declaration?.package || ''} |`
    }

    if(prop === 'inheritedFrom') {
      if(item?.inheritedFrom?.name) {
        md += `${item?.inheritedFrom?.name} |`
      } else {
        md += ` |`
      }
    }

    if(prop === 'parameters') {
      md += `${item?.parameters?.map(param => `${param.name} ${param?.type?.text?.replace(/\|/g, '\\|') || ''}`).join(', ') || ''} |`
      return `${md}\n`;
    }

    if(prop === 'type') {
      let type;

      if(item?.type?.text) {
        type = `\`${item?.type?.text}\``
      } else {
        type = ''
      }
      md += `${type} |`
      return `${md}\n`;
    }
    
    if(prop === 'return') {
      md += `${item?.return?.type?.text?.replace(/\|/g, '\\|') || ''} |`
      return `${md}\n`;
    }

    if(prop === 'description') {
      md += `${item?.[prop]?.trim()?.replace(/(\r\n|\n|\r)/gm, '<br/>') || ''} |`
      return `${md}\n`;
    } 
    
    if(prop === 'default') {
      let defaultVal;
      if(item?.[prop] !== undefined) {
        defaultVal = `\`${item[prop]}\``
      } else {
        defaultVal = '';
      }
      md += `${defaultVal} |`
      return `${md}\n`;
    }

    md += `${item?.[prop] || ''} |`
  });
  return `${md}\n`;
}

function customElementsManifestToMarkdown(cem) {
  let md = '';
  cem?.modules.forEach(mod => {
    if(!has(mod?.declarations) && !has(mod?.exports)) {
      return;
    }

    md += `# \`${mod.path}\`:`;

    const variables = mod?.declarations?.filter(declaration => declaration.kind === 'variable');
    const functions = mod?.declarations?.filter(declaration => declaration.kind === 'function');

    mod?.declarations.forEach(declaration => {
      const {
        superclass,
        mixins,
        events,
        tagName,
        members,
        attributes,
        slots,
        cssProperties,
        parts,
        kind,
        name,
        parameters
      } = declaration;
      
      if(declaration.kind === 'mixin' || declaration.kind === 'class') {

        md += `\n\n## ${kind}: \`${name}\`${tagName ? `, \`${tagName}\`` : ''} `;

        if(declaration.kind === 'class') {
          if(superclass) {
            md += `
  
  ### Superclass
  
  | name | module | package |
  |------|--------|---------|
  ${render(superclass, ['name', 'module', 'package'])}`
          }
        }

        if(has(mixins)) {
          md += `

### Mixins

| name | module    | package |
|------|-----------|---------|
`
          mixins?.forEach((mixin) => {
            md += render(mixin, ['name', 'module', 'package'])
          });
        }

        const fields = members?.filter(({kind}) => kind === 'field');
        const methods = members?.filter(({kind}) => kind === 'method');
        
        if(has(parameters)) {
          md += `
### Parameters

| name | type | default | description |
|------|------|---------|-------------|
`
          parameters?.forEach(param => {
            md += render(param, ['name', 'type', 'default', 'description']);
          })
        }

        if(has(fields)) {
          md+= `

### Fields

| name | privacy | type | default | description | inheritedFrom |
|------|---------|------|---------|-------------|---------------|
`
          fields?.forEach(member => {
            md += render(member, ['name', 'privacy', 'type', 'default', 'description', 'inheritedFrom']);
          });
        }

        if(has(methods)) {
          md += `

### Methods

| name | privacy | description | parameters | return | inheritedFrom |
|------|---------|-------------|------------|--------|---------------|
`
          methods?.forEach(member => {
            md += render(member, ['name', 'privacy', 'description', 'parameters', 'return', 'inheritedFrom']);
          });
        }

        // @TODO: 
        if(has(events)) {
          md += `

### Events

| name | type | description | inheritedFrom |
|------|------|-------------|---------------|
`
          events?.forEach(event => {
            md += render(event, ['name', 'type', 'description', 'inheritedFrom']);
          });
        }

        if(has(attributes)) {
          md += `

### Attributes

| name | fieldName | inheritedFrom |
|------|-----------|---------------|
`
          attributes?.forEach(attr => {
            md += render(attr, ['name', 'fieldName', 'inheritedFrom']);
          });
        }

        if(has(cssProperties)) {
          md += `

### CSS Properties

| name | description |
|------|-----------|
`
          cssProperties?.forEach(cssProp => {
            md += render(cssProp, ['name', 'description']);
          });
        }

        if(has(parts)) {
          md += `

### CSS Parts

| name | description |
|------|-----------|
`
          parts?.forEach(part => {
            md += render(part, ['name', 'description']);
          });
        }

        if(has(slots)) {
          md += `

### Slots

| name | description |
|------|-----------|
`
          slots?.forEach(slot => {
            md += render(slot, ['name', 'description']);
          });
        }

        md += `\n\n<hr></hr>`
      }
    });

    if(has(variables)) {
      md += `\n\n## Variables
  
  | name | description | type |
  |------|-------------|------|
  `
  
      variables?.forEach(variable => {
        md += render(variable, ['name', 'description', 'type']);
      });
  
      md += `<hr/>`
    }

    if(has(functions)) {
      md += `\n\n## Functions
      
  | name | description | parameters | return |
  |------|-------------|------------|--------|
  `
  
      functions?.forEach(fun => {
        md += render(fun, ['name', 'description', 'parameters', 'return']);
      });
  
      md += `<hr/>`
    }


    if(has(mod?.exports)) {
      md += `
  
## Exports

| kind | name      | declaration | module | package |
|------|-----------|-------------|--------|---------|
`
      mod?.exports?.forEach(xport => {
        md += render(xport, ['kind', 'name', 'declaration', 'module', 'package']);
      });

    }
  });

  return md;
}

module.exports = { 
  customElementsManifestToMarkdown 
}; 
