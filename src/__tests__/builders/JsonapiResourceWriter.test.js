import JsonapiResourceWriter from '../../builders/JsonapiResourceWriter';

describe(JsonapiResourceWriter, () => {
  describe('constructor', () => {
    test('can assign most parameters', () => {
      const messageSidepost = new JsonapiResourceWriter({
        jsonapiType: 'conversation',
        attributes: { text: 'Hello World!' },
      });
      const userAssociation = new JsonapiResourceWriter({
        jsonapiType: 'conversation',
        method: 'associate',
      });
      const userDisassociation = new JsonapiResourceWriter({
        jsonapiType: 'conversation',
        method: 'disassociate',
      });
      const instance = new JsonapiResourceWriter({
        jsonapiType: 'conversation',
        meta: { type: 'redCarpet' },
        id: 'cafebabe',
        method: 'update',
        attributes: { recipient: 'cafebabe' },
        sideposts: { messages: [messageSidepost] },
        associations: { initiator: userAssociation },
        disassociations: { recipient: userDisassociation },
      });

      expect(instance.jsonapiType).toBe('conversation');
      expect(instance.meta).toMatchObject({ type: 'redCarpet' });
      expect(instance.sideposts).toMatchObject({ messages: [messageSidepost] });
      expect(instance.associations).toMatchObject({ initiator: userAssociation });
      expect(instance.disassociations).toMatchObject({ recipient: userDisassociation });
    });
  });

  describe('instances', () => {
    let instance;
    beforeEach(() => {
      instance = new JsonapiResourceWriter({ attributes: { inConstructor: true }, jsonapiType: 'conversation' });
    });

    describe('addAttributes', () => {
      describe('appends attributes to existing ones', () => {
        test('merges appropriately nested sortings', () => {
          // ?sort=-educations.school.name
          instance.addAttributes({ addedVia: 'addAttribute' });
          expect(instance.attributes).toMatchObject({
            inConstructor: true,
            addedVia: 'addAttribute',
          });
        });
      });
    });

    describe('sidepost', () => {
      describe('appends sideposts to existing ones', () => {
        const messageSidepost = new JsonapiResourceWriter({
          jsonapiType: 'message',
          attributes: { text: 'Hello World!' },
        });
        const secondMessageSidepost = new JsonapiResourceWriter({
          jsonapiType: 'message',
          attributes: { text: 'Magic World!' },
        });
        const thirdMessageSidepost = new JsonapiResourceWriter({
          jsonapiType: 'message',
          attributes: { text: 'Fantastic World!' },
        });

        test('merges appropriately has-one sideposts', () => {
          instance.sidepost('messages', messageSidepost);

          expect(instance.sideposts).toMatchObject({
            messages: messageSidepost,
          });
        });

        test('merges appropriately has-many sideposts', () => {
          instance.sidepost('messages', [messageSidepost]);

          expect(instance.sideposts).toMatchObject({
            messages: [messageSidepost],
          });
        });

        test('merges multiple sideposts on same relationship', () => {
          instance.sidepost('messages', [messageSidepost]);
          instance.sidepost('messages', [secondMessageSidepost, thirdMessageSidepost]);

          expect(instance.sideposts).toMatchObject({
            messages: [messageSidepost, secondMessageSidepost, thirdMessageSidepost],
          });
        });
      });
    });

    describe('associate', () => {
      describe('appends attributes to existing ones', () => {
        test('merges appropriately nested sortings', () => {
          // ?sort=-educations.school.name
          instance.addAttributes({ addedVia: 'addAttribute' });
          expect(instance.attributes).toMatchObject({
            inConstructor: true,
            addedVia: 'addAttribute',
          });
        });
      });
    });

    describe('disassociate', () => {
      describe('appends attributes to existing ones', () => {
        test('merges appropriately nested sortings', () => {
          // ?sort=-educations.school.name
          instance.addAttributes({ addedVia: 'addAttribute' });
          expect(instance.attributes).toMatchObject({
            inConstructor: true,
            addedVia: 'addAttribute',
          });
        });
      });
    });

    describe('representations', () => {
      describe('asJsonapiDataJson', () => {
        describe('for already persisted objects', () => {
          test('jsonapi compliance', () => {
            instance.id = 'cafebabe';
            instance.method = 'update';

            expect(instance.asJsonapiDataJson()).toMatchObject({
              type: 'conversation',
              attributes: { inConstructor: true },
              id: 'cafebabe',
              meta: {},
              relationships: {},
            });
          });
        });

        describe('for never persisted objects', () => {
          test('jsonapi compliance', () => {
            expect(instance.asJsonapiDataJson()).toMatchObject({
              type: 'conversation',
              attributes: { inConstructor: true },
              meta: {},
              relationships: {},
            });
          });
        });
      });

      describe('asJsonapiRelationshipJson', () => {
        describe('for already persisted objects', () => {
          test('jsonapi compliance', () => {
            instance.id = 'cafebabe';
            instance.method = 'update';

            expect(instance.asJsonapiRelationshipJson()).toMatchObject({
              type: 'conversation',
              id: 'cafebabe',
              method: 'update',
            });
          });
        });

        describe('for never persisted sideposted objects', () => {
          test('jsonapi sideposting draft compliance', () => {
            instance.method = 'create';

            expect(instance.asJsonapiRelationshipJson()).toMatchObject({
              type: 'conversation',
              'temp-id': expect.any(String),
              method: 'create',
            });
          });
        });
      });
    });
  });
});
