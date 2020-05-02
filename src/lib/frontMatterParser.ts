import * as matter from 'gray-matter';
import { JsonDecoder, Result } from 'ts.data.json';

interface FrontMatter {
  data: FrontMatterTags;
}

interface FrontMatterTags {
  tags: string[];
}

const frontMatterDecoder = JsonDecoder.object<FrontMatter>({
  data: JsonDecoder.object<FrontMatterTags>({
    tags: JsonDecoder.array(JsonDecoder.string, 'tags'),
  }, 'tags'),
},
'FrontMatter');

export default class FrontMatterParser {
  tags: string[] = [];

  constructor(content: string) {
    this.parse(content);
  }

  private parse(content: string): void {
    const result: Result<FrontMatter> = frontMatterDecoder.decode(matter(content));
    if (!result.isOk()) {
      return;
    }
    this.tags = result.value.data.tags.filter((tag) => tag != null).map((tag) => tag.trim());
  }
}
