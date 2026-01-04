declare module "expo-file-system" {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;

  export interface DownloadProgressData {
    totalBytesWritten: number;
    totalBytesExpectedToWrite: number;
  }

  export type DownloadProgressCallback = (
    progress: DownloadProgressData
  ) => void;

  export function createDownloadResumable(
    uri: string,
    fileUri: string,
    options?: DownloadOptions,
    callback?: DownloadProgressCallback,
    resumeData?: string
  ): DownloadResumable;
}
