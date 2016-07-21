import _ from 'lodash';

import defaultDocument from './default.json';
import * as joiParser from './joi-parser';

export default class Swegger {
    constructor(baseDocument) {
        this.document = _.merge({}, defaultDocument, baseDocument);
    }

    addDefinitionsFromSequelizeModel(model) {
        _.each(_.omit(model, 'sequelize'), this.parseModel.bind(this));
    }

    addRoutes(routes) {
        if (_.isObject(routes)) {
            this.parseRoutes(routes.stack);
        } else if (_.isArray(routes)) {
            this.parseRoutes(routes);
        }
    }

    addRouteTags(pathDef, tags) {
        _.each(pathDef, (val, key) => {
            pathDef[key].tags = tags;
        });
    }

    getDocument() {
        return this.document;
    }

    getRouteMethods(route) {
        let methods = _.pickBy(route.route.methods, (value, key) => {
            return value && key[0] !== '_';
        });

        _.each(methods, (val, key) => {
            methods[key] = {};
        });

        return methods;
    }

    mapModelAttributeToProperty(attribute) {
        let type = attribute.type;
        let name = type.key.toLowerCase();
        let property = {};

        switch (name) {
        case 'uuid':
        case 'uuidv1':
        case 'uuidv4':
            property.type = 'string';
            property.format = 'uuid';
            break;
        case 'date':
            property.type = 'string';
            property.format = 'date-time';
            break;
        case 'dateonly':
            property.type = 'string';
            property.format = 'date';
            break;
        default:
            property.type = name;
            break;
        }

        if (attribute._autoGenerated || (attribute.field === 'id' && attribute.defaultValue)) {
            property.readOnly = true;
        }

        if (_.get(attribute, 'validate.isEmail')) {
            property.format = 'email';
        }

        return property;
    }

    parseMiddleware(spec, middleware) {
        switch (middleware.name) {
            case 'authorized':
                spec.security = [{ auth: middleware.handle.roles }];
                break;
            case 'joi': {
                let parameters = [];
                parameters = parameters.concat(_.map(middleware.handle.schema.query, joiParser.parseQuery));
                parameters = parameters.concat(_.map(middleware.handle.schema.params, joiParser.parseParam));

                if (middleware.handle.schema.body) {
                    let body = {};
                    _.each(middleware.handle.schema.body, (schema, name) => {
                        _.merge(body, joiParser.parseBody(schema, name));
                    });

                    parameters.push(body);
                }

                spec.parameters = parameters;
                break;
            }
        }
    }

    parseMiddlewares(pathDef, middlewares) {
        let methods = _.groupBy(middlewares, (layer) => {
            return layer.method || 'all';
        });

        _.each(methods.all, (middleware) => {
            _.each(pathDef, (val, key) => {
                this.parseMiddleware(pathDef[key], middleware);
            });
        });

        _.each(_.omit(methods, 'all'), (group, method) => {
            _.each(group, this.parseMiddleware.bind(this, pathDef[method]));
        });
    }

    parseModel(model, modelName) {
        if (!model.tableAttributes) {
            return;
        }

        let properties = {};
        let required = [];

        _.each(model.tableAttributes, (attr, attrName) => {
            properties[attrName] = this.mapModelAttributeToProperty(attr);

            if (!attr.allowNull && !attr._autoGenerated) {
                required.push(attr.field);
            }
        });

        this.document.definitions[modelName] = {
            type: 'object',
            required,
            properties
        };
    }

    parseRoute(router, route) {
        if (!route.route) {
            return;
        }

        let path = route.route.path.replace(/:(\w+)(\(.*\))?([^\\]\/)?/, '{$1}');

        let pathDef = this.getRouteMethods(route);
        this.addRouteTags(pathDef, router.tags);

        this.parseMiddlewares(pathDef, route.route.stack);

        this.document.paths[path] = pathDef;
    }

    parseRouter(router) {
        _.each(router.handle.stack, this.parseRoute.bind(this, router.handle));
    }

    parseRoutes(routes) {
        _.each(routes, (route) => {
            switch (route.name) {
            case 'router':
                this.parseRouter(route);
                break;

            default:
                break;
            }
        });
    }
}
