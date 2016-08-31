import { expect }    from 'chai';
import Sequelize     from 'sequelize';
import SwaggerParser from 'swagger-parser';

import Swegger from '../src';

let swaggerBase = {
    info: {
        title: 'Test',
        description: 'Testing',
        contact: {
            name: '',
            email: 'test@test.com'
        },
        version: '1.0.0'
    }
};

describe('index', () => {
    it('should exist', () => {
        expect(Swegger).to.exist;
    });

    describe('models', () => {
        let sequelize;

        before(() => {
            sequelize = new Sequelize('Test', '', '', {
                dialect: 'sqlite',
                storage: ':memory:'
            });
        });

        it('should create valid models', () => {
            let models = {};

            models.Test = sequelize.define('Test', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                name: {
                    allowNull: false,
                    type: Sequelize.STRING,
                    unique: true
                },
                email: {
                    allowNull: true,
                    type: Sequelize.STRING,
                    validate: {
                        isEmail: true
                    }
                }
            });

            let swegger = new Swegger(swaggerBase);
            swegger.addDefinitions(models);

            return SwaggerParser.validate(swegger.getDocument())
            .then((api) => {
                expect(api).to.exist;
            });
        });
    });
});
