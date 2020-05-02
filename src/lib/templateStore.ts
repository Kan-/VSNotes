import * as fs from 'fs-extra';
import { JsonDecoder, Result } from 'ts.data.json';
import Template from './template';

interface ConfigFileTemplate {
  name: string;
  body: string[];
  description?: string;
  default?: boolean;
}

const configDecoder = JsonDecoder.array<ConfigFileTemplate>(
  JsonDecoder.object<ConfigFileTemplate>({
    name: JsonDecoder.string,
    body: JsonDecoder.array(JsonDecoder.string, 'body'),
    description: JsonDecoder.optional(JsonDecoder.string),
    default: JsonDecoder.optional(JsonDecoder.boolean),
  }, 'template'), 'template array',
);

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
      const result: Result<ConfigFileTemplate[]> = configDecoder.decode(JSON.parse(data));
      if (!result.isOk()) {
        return [];
      }

      const templates: Template[] = result.value.map((template: ConfigFileTemplate) => ({
        name: template.name,
        description: template.description,
        body: template.body.join('\n'),
        default: template.default || false,
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
}
