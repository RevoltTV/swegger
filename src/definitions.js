import _ from 'lodash';

import sequelizeToJoi from '@revolttv/sequelize-to-joi';
import joiToSwagger   from '@revolttv/joi-to-swagger';

function parseModel(model) {
    let schema = sequelizeToJoi(model, { omitAssociations: true });

    return joiToSwagger.getSchemaObject(schema);
}

export default function addDefinitions(model) {
    return _.mapValues(_.omit(model, 'sequelize'), parseModel);
}
