declare const template: (tmpl: string) => (locals: Object) => string;

declare module 'lodash.template' {
  export = template;
}
