/** Adds a picked file to a multipart upload. React Native's fetch reads the
 *  file from its URI itself (formFile.web.ts reads it into a Blob instead). */
export async function appendFile(form: FormData, field: string, uri: string, name: string, type: string): Promise<void> {
  form.append(field, { uri, name, type } as any);
}
