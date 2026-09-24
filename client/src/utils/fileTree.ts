// Directory & Multi-File Drag-and-Drop Parser
// Traverses FileSystemDirectoryEntry recursively and produces Flat File items with relative paths

export interface FileItem {
  file: File;
  relativePath: string;
}

export async function parseDroppedItems(dataTransfer: DataTransfer): Promise<FileItem[]> {
  const items = dataTransfer.items;
  const results: FileItem[] = [];

  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    const queue: { entry: any; path: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        queue.push({ entry, path: '' });
      }
    }

    while (queue.length > 0) {
      const { entry, path } = queue.shift()!;

      if (entry.isFile) {
        const file = await getFileFromEntry(entry);
        results.push({
          file,
          relativePath: path ? `${path}/${file.name}` : file.name,
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const entries = await readAllDirectoryEntries(dirReader);
        const newPath = path ? `${path}/${entry.name}` : entry.name;
        for (const child of entries) {
          queue.push({ entry: child, path: newPath });
        }
      }
    }
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    // Fallback standard multi-file
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      results.push({
        file,
        relativePath: (file as any).webkitRelativePath || file.name,
      });
    }
  }

  return results;
}

function getFileFromEntry(fileEntry: any): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

function readAllDirectoryEntries(dirReader: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const entries: any[] = [];
    const readEntries = () => {
      dirReader.readEntries((results: any[]) => {
        if (!results || results.length === 0) {
          resolve(entries);
        } else {
          entries.push(...results);
          readEntries();
        }
      }, reject);
    };
    readEntries();
  });
}
