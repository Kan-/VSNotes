import * as path from 'path';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import TestDirectory from '../../util/notesDirectory';
import TemplateStore from '../../../src/lib/templateStore';

chai.should();
chai.use(chaiAsPromised);


suite('TemplateStore', () => {
  const templateDir = new TestDirectory('templates');
  const templateFilePath = path.join(templateDir.path(), 'templates.json');
  const store = new TemplateStore(templateFilePath);
  templateDir.empty();

  teardown(() => {
    templateDir.empty();
  });

  suiteTeardown(() => {
    templateDir.remove();
  });

  suite('Getting a specific template', () => {
    test('Fails if the template definition file does not exist', async () => {
      await store.getTemplate('template')
        .should.be.rejectedWith(`Template "template" not found in ${templateFilePath}`);
    });

    test('Fails if the template definition file is invalid', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json', 'invalid');

      await store.getTemplate('nonExisting')
        .should.be.rejectedWith(`Unexpected token i in JSON at position 0 in ${templateFilePath}`);
    });

    test('Fails if the specified template is not defined', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json', '{"template":{"body":["templateBody"]}}');

      await store.getTemplate('nonExisting')
        .should.be.rejectedWith(`Template "nonExisting" not found in ${templateFilePath}`);
    });

    test('Fails if the specified template does not have a body', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json', '{"template":{}}');

      await store.getTemplate('template')
        .should.be.rejectedWith(`Template "template" not found in ${templateFilePath}`);
    });

    test('Fails if the specified template body is not an array', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json', '{"template":{"body":{}}}');

      await store.getTemplate('template')
        .should.be.rejectedWith(`Template "template" not found in ${templateFilePath}`);
    });

    test('Returns the specified template', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json',
        JSON.stringify({ template: { body: ['body'], description: 'description', default: true } }));

      await store.getTemplate('template').should.eventually.deep.equal({
        name: 'template',
        body: 'body',
        description: 'description',
        default: true,
      });
    });

    test('Returns the specified template, defaults description to undefined and default to false', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json', '{"template":{"body":["templateBody"]}}');

      await store.getTemplate('template').should.eventually.deep.equal({
        name: 'template',
        body: 'templateBody',
        description: undefined,
        default: false,
      });
    });

    test('Returns the specified template, joins all lines of the body into a string', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json', '{"template":{"body":["line1","line2"]}}');

      await store.getTemplate('template').should.eventually.deep.equal({
        name: 'template',
        body: 'line1\nline2',
        description: undefined,
        default: false,
      });
    });
  });

  suite('Getting all templates', () => {
    test('Returns empty array if the templates file is missing', async () => {
      await store.all().should.be.eventually.be.empty;
    });

    test('Returns all templates', async () => {
      templateDir.createDirectory('templates');
      templateDir.createFile('templates.json',
        JSON.stringify({
          template1: { body: ['line1', 'line2'] },
          template2: { body: ['line1', 'line2'] },
        }));

      await store.all().should.eventually.deep.equal([{
        name: 'template1', body: 'line1\nline2', description: undefined, default: false,
      }, {
        name: 'template2', body: 'line1\nline2', description: undefined, default: false,
      },
      ]);
    });
  });
});
