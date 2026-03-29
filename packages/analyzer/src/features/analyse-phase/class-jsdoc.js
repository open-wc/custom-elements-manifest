import { parse } from 'comment-parser';
import { handleJsDocType, normalizeDescription } from '../../utils/jsdoc.js';
import { has, safe } from '../../utils/index.js';

/**
 * CLASS-JSDOC
 *
 * Deals with any JSDoc above a class
 */
export function classJsDocPlugin() {
  return {
    name: 'CORE - CLASS-JSDOC',
    analyzePhase({node, moduleDoc}){
      if (node.type === 'ClassDeclaration') {
        const className = node?.id?.name;
        const classDoc = moduleDoc?.declarations?.find(declaration => declaration.name === className);

        /**
         * Because we use a bunch of 'non-standard' JSDoc annotations, we use `comment-parser` to parse the JSDoc.
         *
         * Loops through each JSDoc above a class, and parses every JSDoc annotation.
         */
        const rawJsDocs = node?._rawJsDoc;
        if (rawJsDocs) {
          rawJsDocs.forEach(rawText => {
            const parsed = parse(rawText);
            parsed?.forEach(parsedJsDoc => {

              if(parsedJsDoc?.tags?.some(tag => tag?.tag === 'typedef')) return;

              parsedJsDoc?.tags?.forEach(jsDoc => {
                switch(jsDoc.tag) {
                  case 'attr':
                  case 'attribute':
                    const attributeAlreadyExists = classDoc?.attributes?.find(attr => attr.name === jsDoc.name);
                    let attributeDoc = attributeAlreadyExists || {};
                    attributeDoc = handleClassJsDoc(attributeDoc, jsDoc);
                    if(!attributeAlreadyExists) {
                      classDoc.attributes.push(attributeDoc);
                    }
                    break;
                  case 'prop':
                  case 'property':
                    const fieldAlreadyExists = classDoc?.members?.find(member => member.name === jsDoc.name);
                    let fieldDoc = fieldAlreadyExists || {};
                    fieldDoc = handleClassJsDoc(fieldDoc, jsDoc);
                    fieldDoc.kind = 'field';
                    if(!fieldAlreadyExists) {
                      classDoc.members.push(fieldDoc);
                    }
                    break;
                  case 'fires':
                  case 'event':
                    const eventAlreadyExists = classDoc?.events?.find(event => event.name === jsDoc.name);
                    let eventDoc = eventAlreadyExists || {};
                    eventDoc = handleClassJsDoc(eventDoc, jsDoc);
                    delete eventDoc.privacy;
                    if(!eventAlreadyExists) {
                      classDoc.events.push(eventDoc);
                    }
                    break;
                  case 'csspart':
                  case 'part':
                    let cssPartDoc = {};
                    cssPartDoc = handleClassJsDoc(cssPartDoc, jsDoc);
                    classDoc.cssParts.push(cssPartDoc);
                    break;
                  case 'cssprop':
                  case 'cssproperty':
                    let cssPropertyDoc = {};
                    cssPropertyDoc = handleClassJsDoc(cssPropertyDoc, jsDoc);
                    classDoc.cssProperties.push(cssPropertyDoc);
                    break;
                  case 'slot':
                    let slotDoc = {};
                    slotDoc = handleClassJsDoc(slotDoc, jsDoc);
                    classDoc.slots.push(slotDoc);
                    break;
                  case 'tag':
                  case 'tagname':
                  case 'element':
                  case 'customElement':
                  case 'customelement':
                    classDoc.tagName = jsDoc?.name || '';
                    classDoc.customElement = true;
                    break;
                  case 'cssState':
                  case 'cssstate':
                    let statePropertyDoc = {};
                    statePropertyDoc = handleClassJsDoc(statePropertyDoc, jsDoc);
                    classDoc.cssStates.push(statePropertyDoc);
                    break;
                  case 'deprecated':
                    classDoc.deprecated = jsDoc?.name ? `${jsDoc.name} ${jsDoc?.description}`.trim() : "true";
                    break;
                }
              })
            });

            /**
             * Description - from the parsed JSDoc comment
             */
            const parsedFirst = parsed?.[0];
            if(parsedFirst?.description) {
              classDoc.description = normalizeDescription(parsedFirst.description);
            }

            /**
             * Summary - handled via the parsed JSDoc
             */
            parsedFirst?.tags?.forEach(tag => {
              if (tag.tag === 'summary') {
                classDoc.summary = tag.description ? `${tag.name || ''} ${tag.description}`.trim() : (tag.name || '');
              }
            });
          });
        }

        /**
         * Also check _jsdoc (comment-parser parsed) for description
         */
        if (node?._jsdoc) {
          node._jsdoc.forEach(jsDocComment => {
            if(jsDocComment?.description && !classDoc.description) {
              classDoc.description = normalizeDescription(jsDocComment.description);
            }
            jsDocComment?.tags?.forEach(tag => {
              if (tag.tag === 'summary') {
                classDoc.summary = tag.description ? `${tag.name || ''} ${tag.description}`.trim() : (tag.name || '');
              }
            });
          });
        }
      }
    }
  }
}

function handleClassJsDoc(doc, tag) {
  if(tag?.type) {
    doc.type = { text: handleJsDocType(tag.type) }
  }

  if(tag?.description) {
    doc.description = normalizeDescription(tag.description);
  }

  if(tag?.name) {
    doc.name = tag.name === '-' ? '' : tag.name;
  }

  if(tag?.default) {
    doc.default = tag.default;
  }

  return doc;
}
