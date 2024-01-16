
import { config } from "plugins/skyblock/lib/modules/__config.js"


class I18n {

    constructor() {


        this.i18nFile;

        this.translations = {};

        this.files = [];

        this.init();

        this.loadLanguage(config.get("language"))
    }


    init() {

        if (!File.exists(".\\plugins\\skyblock\\i18n")) {

            File.mkdir(".\\plugins\\skyblock\\i18n")

        }

    }


    loadLanguage(language) {

        this.i18nFile = new JsonConfigFile(`.\\plugins\\skyblock\\i18n\\${language}.json`, '{}');

        this.translations = JSON.parse(this.i18nFile.read());

        this.i18nFile.reload();

    }

    mergeObjects(obj1, obj2) {

        for (let key in obj2) {

            if (!obj1.hasOwnProperty(key)) obj1[key] = obj2[key]
        }

        return obj1;
    }


    registerLanguage(name) {

        let data = new JsonConfigFile(`.\\plugins\\skyblock\\i18n\\${name}.json`, '{}').read();

        this.translations = this.mergeObjects(data, this.translations);

    }


    tr(key, variables = {}) {

        let translation = this.translations[key] || key

        Object.keys(variables).forEach(item => {

            translation = translation.replace(new RegExp(`{${item}}`, 'g'), variables[item])

        })

        return translation
    }

    read() {

        return this.translations;

    }

}

const __i18n = new I18n();


export { __i18n }