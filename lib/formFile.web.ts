/** Adds a picked file to a multipart upload. Browsers need the bytes as a
 *  Blob; a picked file's URI (blob: or data:) is read with fetch. */
export async function appendFile(form: FormData, field: string, uri: string, name: string, type: string): Promise<void> {
  const blob = await (await fetch(uri)).blob();
  form.append(field, new File([blob], name, { type: blob.type || type }));
}
