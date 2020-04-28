const fs = require('fs-extra');

/**
 * As there is no API currently to read snippets programmatically, we're using a custom template JSON file, similarly to
 * the Emmet plugin. This allows us to replace variables in the template before it is inserted into the editor.
 */
class TemplateStore {

  constructor(templateFilePath) {
    this.templateFilePath = templateFilePath;
  }

  async all() {
    const exists = await fs.pathExists(this.templateFilePath)
    if (!exists) {
      return [];
    }

    const data = await fs.readFile(this.templateFilePath, 'utf8');
    try {
      const templates = [];
      const templateMap = JSON.parse(data);

      for (let [name, template] of Object.entries(templateMap)) {
        if (!template['body'] || !Array.isArray(template['body'])) {
          console.error(`Template "${name}" is invalid in ${this.templateFilePath}.`);
          continue;
        }

        templates.push({
          name: name,
          description: template.description || null,
          body: template.body.join('\n'),
          default: template.default || false
        });
      }
      return templates;
    } catch(e) {
      throw new Error(`${e.message} in ${this.templateFilePath}.`);
    }
  }

  async getTemplate(name) {
    const templates = await this.all();

    const template = templates.find(template => template.name === name);
    if (!template) {
      throw new Error(`Template "${name}" not found in ${this.templateFilePath}.`);
    }
    return template;
  }
}

module.exports = TemplateStore;
