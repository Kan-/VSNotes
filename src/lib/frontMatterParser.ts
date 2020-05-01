import matter = require('gray-matter');

export default class FrontMatterParser {
  tags: string[] = [];

  constructor(content: string) {
    this.parse(content);
  }

  private parse(content: string): void {
    try {
      const file = matter(content);
      if (file.data && file.data.tags && Array.isArray(file.data.tags)) {
        this.tags = file.data.tags.filter((tag) => tag != null).map((tag) => tag.trim());
      }
    } catch (e) {
      console.error(e);
    }
  }
}
