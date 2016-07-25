import _ from 'lodash';
import { Route } from 'express';

import joiToSwagger from '@revolttv/joi-to-swagger';

import getResponse from './responses';

function parseMethods(route) {
    let methods = _.pickBy(route.methods, (value, key) => {
        return value && key[0] !== '_';
    });

    _.each(methods, (val, key) => {
        methods[key] = {};
    });

    return methods;
}

function parseMiddleware(spec, middleware) {
    switch (middleware.name) {
        case 'authorized':
            spec.responses['401'] = { $ref: '#/responses/Unauthenticated' };
            spec.responses['403'] = { $ref: '#/responses/Unauthorized' };

            spec.security = [{ auth: middleware.handle.roles }];
            break;
        case 'authenticated':
            spec.responses['401'] = { $ref: '#/responses/Unauthenticated' };
            break;
        case 'joiRequest': {
            spec.responses['400'] = { $ref: '#/responses/BadRequest' };
            let parameters = [].concat(
                _.map(middleware.handle.schema.query, (schema, name) => {
                    return joiToSwagger.getParameterObject(schema, name, 'query');
                })
            ).concat(
                _.map(middleware.handle.schema.params, (schema, name) => {
                    return joiToSwagger.getParameterObject(schema, name, 'path');
                })
            );

            if (middleware.handle.schema.body) {
                parameters.push(joiToSwagger.getBodyParameter(middleware.handle.schema.body));
            }

            spec.parameters = parameters;

            break;
        }
        case 'joiResponse': {
            spec.responses['200'] = getResponse(middleware.handle);

            break;
        }
        default:
            break;
    }

    return spec;
}

function parseMiddlewares(spec, middlewares) {
    let methods = _.groupBy(middlewares, (layer) => {
        return layer.method || 'all';
    });

    _.each(methods.all, (middleware) => {
        _.each(spec, (value, key) => {
            spec[key].responses = spec[key].responses || {};
            spec[key].responses['500'] = { $ref: '#/responses/ServerError' };
            spec[key] = parseMiddleware(spec[key], middleware);
        });
    });


    _.each(_.omit(methods, 'all'), (group, method) => {
        spec[method].responses = spec[method].responses || {};
        spec[method].responses['500'] = { $ref: '#/responses/ServerError' };

        _.each(group, (middleware) => {
            parseMiddleware(spec[method], middleware);
        });
    });

    return spec;
}

function parseRoute(spec, route) {
    let path;

    if (typeof route.path === 'string') {
        path = route.path.replace(/:(\w+)(\(.*\))?([^\\]\/)?/, '{$1}');
    } else {
        path = route.path.toString();
    }

    spec[path] = parseMethods(route);
    spec[path] = parseMiddlewares(spec[path], route.stack);

    return spec;
}

function parseRouter(spec, router) {
    let routeSpec = _.reduce(router.stack, parseLayer, {});

    if (router.tags) {
        _.each(routeSpec, (value, key) => {
            _.each(routeSpec[key], (route, method) => {
                routeSpec[key][method].tags = router.tags;
            });
        });
    }

    return _.extend({}, spec, routeSpec);
}

export default function parseLayer(spec, layer) {
    if (layer.name === 'router') {
        return parseRouter(spec, layer.handle);
    }

    if (layer.route instanceof Route) {
        return parseRoute(spec, layer.route);
    }

    return {};
}
