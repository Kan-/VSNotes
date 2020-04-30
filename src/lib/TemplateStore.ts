import * as fs from 'fs-extra';
import Template from './template';

/**
 * As there is no API currently to read snippets programmatically, we're using a custom template
 * JSON file, similarly to the Emmet plugin. This allows us to replace variables in the template
 * before it is inserted into the editor.
 */
export default class TemplateStore {
  #templateFilePath: string;

  constructor(templateFilePath: string) {
    this.#templateFilePath = templateFilePath;
  }

  async all(): Promise<Template[]> {
    const exists = await fs.pathExists(this.#templateFilePath);
    if (!exists) {
      return [];
    }

    const data = await fs.readFile(this.#templateFilePath, 'utf8');
    try {
      const templateMap: any = JSON.parse(data);

      const templates: Template[] = Object.keys(templateMap)
        .filter((name) => this.hasValidBody(name, templateMap[name]))
        .map((name) => ({
          name,
          description: templateMap[name].description,
          body: templateMap[name].body.join('\n'),
          default: templateMap[name].default || false,
        }));

      return templates;
    } catch (e) {
      throw new Error(`${e.message} in ${this.#templateFilePath}.`);
    }
  }

  async getTemplate(name: string): Promise<Template> {
    const templates = await this.all();

    const template = templates.find((t) => t.name === name);
    if (!template) {
      throw new Error(`Template "${name}" not found in ${this.#templateFilePath}.`);
    }
    return template;
  }

  private hasValidBody(name: string, templateFromFile: any): boolean {
    if (!templateFromFile.body || !Array.isArray(templateFromFile.body)) {
      console.error(`Template "${name}" is invalid in ${this.#templateFilePath}.`);
      return false;
    }
    return true;
  }
}
