// opfs.d.ts
interface FileSystemFileHandle {
  createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>;
}

interface FileSystemSyncAccessHandle {
  read(buffer: ArrayBuffer, options?: { at?: number }): number;
  write(buffer: ArrayBuffer, options?: { at?: number }): number;
  flush(): void;
  close(): void;
  getSize(): number;
  truncate(size: number): void;
}
