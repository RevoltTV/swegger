import _ from 'lodash';

function parseCommon(schema) {
    let param = {};

    switch (schema._type) {
    default:
        param.type = schema._type;
    }

    param.description = schema._description || '';
    param.required = _.get(schema, '_flags.presence') === 'required';

    if (schema._flags.default) {
        param.default = schema._flags.default;
    }

    _.each(schema._tests, (test) => {
        switch (test.name) {
        case 'email':
            param.format = 'email';
            break;
        case 'guid':
            param.format = 'uuid';
            break;
        case 'integer':
            param.type = 'integer';
            break;
        case 'min':
            param.minimum = test.arg;
            break;
        case 'max':
            param.maximum = test.arg;
            break;
        }
    });

    if (schema._valids && schema._valids._set.length > 0) {
        param.enum = schema._valids._set;
    }

    return param;
}

export function parseBody(schema, name) {
    let body = {};
    body[name] = parseCommon(schema);

    return {
        name: 'body',
        in: 'body',
        schema: {
            type: 'object',
            properties: body
        }
    };
}

export function parseQuery(schema, name) {
    return _.extend({
        name,
        in: 'query'
    }, parseCommon(schema));
}

export function parseParam(schema, name) {
    return _.extend({
        name,
        in: 'path'
    }, parseCommon(schema));
}
