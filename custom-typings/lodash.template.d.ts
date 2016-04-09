declare namespace lodash_template {
  interface Static {
    template(tmpl: string): (locals: Object) => string;
  }
}

declare module "lodash.template" {
  const _tmp: lodash_template.Static;
  export default _tmp.template;
}
