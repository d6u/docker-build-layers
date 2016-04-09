declare namespace co {
    interface Static {
        wrap<T>(func: Function): () => Promise<T>
    }
}

declare module "co" {
    var _tmp: co.Static;
    export = _tmp;
}
