import * as xml2js from 'xml2js';

const appendRootTag = (template: string) => `<root>${template}</root>`;

export function parseTemplate(template: string): Promise<any> {
  const xml = appendRootTag(template);

  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
