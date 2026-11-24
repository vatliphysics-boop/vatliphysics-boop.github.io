export async function createWordDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  return { url, name };
}

export function startWordDownload(file: { url: string; name: string }) {
  const link = document.createElement("a");
  link.href = file.url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(file.url), 60_000);
}
