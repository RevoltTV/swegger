import _         from 'lodash';
import Sequelize from 'sequelize';

import joiToSwagger from '@revolttv/joi-to-swagger';

function process(schema, original) {
    if (original instanceof Sequelize.Model) {
        return {
            $ref: '#/definitions/' + original.name
        };
    } else if (_.isArray(original) && _.first(original) instanceof Sequelize.Model) {
        return {
            type: 'array',
            items: {
                $ref: '#/definitions/' + _.first(original).name
            }
        };
    }

    return {
        type: 'object',
        properties: _.mapValues(original, (value, key) => {
            if (value.isJoi) {
                return joiToSwagger.parse(schema[key]);
            }

            return process(schema[key], original[key]);
        })
    };
}

// Middleware is a joiResponse object
export default function getResponse(middleware) {
    return {
        description: middleware.description || '',
        schema: process(middleware.schema, middleware.original)
    };
}
