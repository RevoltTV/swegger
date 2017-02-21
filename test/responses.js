import { expect } from 'chai';
import Joi from 'joi';

import getResponse from '../src/responses';

describe('responses', () => {
    it('should handle a Joi array as a response type', () => {
        let schema = Joi.array().items(Joi.any());
        let middleware = {
            description: 'test',
            schema: schema,
            original: schema
        };

        let parsed = getResponse(middleware);

        expect(parsed.description).to.equal('test');
        expect(parsed.schema).to.exist;
        expect(parsed.schema.type).to.exist.and.equal('array');
        expect(parsed.schema.items).to.exist;
        expect(parsed.schema.items.type).to.equal('string');
    });

    it('should handle a Joi object as a response type', () => {
        let schema = Joi.object().keys({
            a: Joi.string().required(),
            b: Joi.number().min(1).max(10)
        });

        let middleware = {
            description: 'test2',
            schema: schema,
            original: schema
        };

        let parsed = getResponse(middleware);
        expect(parsed.description).to.equal('test2');
        expect(parsed.schema).to.exist;
        expect(parsed.schema.type).to.exist.and.equal('object');
    });
});
