import _ from 'lodash';

import defaultDocument from './default.json';

import definitions from './definitions';
import paths from './paths';

export default class Swegger {
    constructor(baseDocument) {
        this.document = _.merge({}, defaultDocument, baseDocument);
    }

    addDefinitions(model) {
        this.document.definitions = _.extend({}, this.document.definitions, definitions(model));
    }

    addRoutes(routes) {
        if (routes.name !== 'router') {
            throw new TypeError('routes is not an instance of express.Router');
        }

        this.document.paths = this.document.paths || {};

        this.document.paths = _.reduce(routes.stack, paths, this.document.paths);
    }

    getDocument() {
        return this.document;
    }
}
