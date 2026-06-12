export function readAuthParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const [withoutHash, hash = ""] = url.split("#");
  const query = withoutHash.split("?")[1] ?? "";

  for (const part of [query, hash]) {
    const search = new URLSearchParams(part);
    search.forEach((value, key) => {
      params[key] = value;
    });
  }

  return params;
}
