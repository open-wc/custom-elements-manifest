import * as h from './helpers.js';

export class CustomElementsJson {
  schemaVersion;
  readme;
  modules;
  
  _classes = new Map();
  _tagNames = new Map();
  _definitions = new Map();
  _mixins = new Map();

  constructor(
    { schemaVersion, readme, modules } = {
      schemaVersion: '0.1.0',
      readme: '',
      modules: [],
    },
  ) {
    this.schemaVersion = schemaVersion;
    this.readme = readme;
    this.modules = modules;
    this.init();
  }

  init() {
    this.loopAll((item) => {
      if (h.isClass(item)) {
        this._classes.set(item.name, item);
      }

      if (h.isMixin(item)) {
        this._mixins.set(item.name, item);
      }

      if (h.isCustomElementExport(item)) {
        this._tagNames.set(
          item.name,
          this._classes.get(item.declaration.name),
        );

        this._definitions.set(item.name, item);
      }
    });
  }

  loopAll(cb) {
    this.modules.forEach((mod) => {
      mod?.exports?.forEach((ex) => {
        cb(ex);
      });

      mod?.declarations?.forEach((declaration) => {
        cb(declaration);
      });
    });
  }

  getByTagName(tagName) {
    return this._tagNames.get(tagName);
  }

  getByClassName(className) {
    return this._classes.get(className);
  }

  getByMixinName(mixinName) {
    return this._mixins.get(mixinName);
  }

  /** Gets all classes from declarations */
  getClasses() {
    return [...this._classes.values()];
  }

  /** Gets registered custom elements, so elements that have customElements.define called, returns class including tagName */
  getTagNames() {
    return [...this._tagNames.values()];
  }

  /** Gets all CustomElementDefinitions */
  getDefinitions() {
    return [...this._definitions.values()];
  }


  getMixins() {
    return [...this._mixins.values()];
  }

  // @TODO
  getInheritanceTree(className) {
    const tree = [];

    let klass = this._classes.get(className);

    if (klass) {
      tree.push(klass);

      klass?.mixins?.forEach((mixin) => {
        tree.push(this._mixins.get(mixin.name));
      });

      while (this._classes.has(klass.superclass.name)) {
        const newKlass = this._classes.get(klass.superclass.name);

        newKlass?.mixins?.forEach((mixin) => {
          tree.push(this._mixins.get(mixin.name));
        });

        tree.push(newKlass);
        klass = newKlass;
      }

      return tree;
    }
    return [];
  }

  getModuleForClass(className) {
    let result = undefined;

    this.modules.forEach((mod) => {
      mod?.declarations?.forEach((declaration) => {
        if (h.isClass(declaration) && declaration.name === className) {
          result = mod.path;
        }
      });
    });

    return result;
  }

  getModuleForMixin(className) {
    let result = undefined;

    this.modules.forEach((mod) => {
      mod?.declarations?.forEach((declaration) => {
        if (h.isMixin(declaration) && declaration.name === className) {
          result = mod.path;
        }
      });
    });

    return result;
  }
}
