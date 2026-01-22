import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import mkdirp from 'mkdirp';
import { globStream } from 'glob';
import { Logger } from '@nestjs/common';
import type { IStorageAdapterV2, XcFile } from '~/types/nc-plugin';
import { validateAndNormaliseLocalPath } from '~/helpers/attachmentHelpers';
import { NcError } from '~/helpers/ncError';

export default class Local implements IStorageAdapterV2 {
  name = 'Local';
  protected logger = new Logger(Local.name);

  public async fileCreate(key: string, file: XcFile): Promise<any> {
    const destPath = validateAndNormaliseLocalPath(key);
    try {
      await mkdirp(path.dirname(destPath));
      const data = await promisify(fs.readFile)(file.path);
      await promisify(fs.writeFile)(destPath, data);
      await promisify(fs.unlink)(file.path);
      // await fs.promises.rename(file.path, destPath);
    } catch (e) {
      NcError._.storageFileCreateError(e.message);
    }
  }

  async fileCreateByUrl(
    key: string,
    _url: string,
    { fetchOptions: { buffer } = { buffer: false } },
  ): Promise<any> {
    if (buffer) {
      NcError._.storageFileCreateError('URL file upload is not supported');
    }

    NcError._.storageFileCreateError('URL file upload is not supported');
  }

  public async fileCreateByStream(
    key: string,
    stream: Readable,
  ): Promise<string | null> {
    const destPath = validateAndNormaliseLocalPath(key);

    try {
      await mkdirp(path.dirname(destPath));

      await new Promise<void>((resolve, reject) => {
        const writableStream = fs.createWriteStream(destPath);

        writableStream.on('finish', () => resolve());
        writableStream.on('error', reject);

        stream.on('error', reject);
        stream.pipe(writableStream);
      });

      // Verify file was written successfully
      await this.fileRead(destPath);

      return null;
    } catch (e) {
      NcError._.storageFileStreamError(e.message);
    }
  }

  public async fileReadByStream(
    key: string,
    options: { encoding?: string },
  ): Promise<Readable> {
    try {
      const srcPath = validateAndNormaliseLocalPath(key);

      // Check if file exists before creating stream
      await fs.promises.access(srcPath, fs.constants.R_OK);

      return fs.createReadStream(srcPath, {
        ...(options?.encoding && {
          encoding: options.encoding as BufferEncoding,
        }),
      });
    } catch (e) {
      NcError._.storageFileStreamError(e.message);
    }
  }

  public async getDirectoryList(key: string): Promise<string[]> {
    try {
      const destDir = validateAndNormaliseLocalPath(key);
      return await fs.promises.readdir(destDir);
    } catch (e) {
      NcError._.storageFileReadError(`Failed to list directory: ${e.message}`);
    }
  }

  async fileDelete(path: string): Promise<any> {
    try {
      return await fs.promises.unlink(validateAndNormaliseLocalPath(path));
    } catch (e) {
      NcError._.storageFileDeleteError(e.message);
    }
  }

  public async fileRead(filePath: string): Promise<any> {
    try {
      const fileData = await fs.promises.readFile(
        validateAndNormaliseLocalPath(filePath, true),
      );
      return fileData;
    } catch (e) {
      NcError._.storageFileReadError(e.message);
    }
  }

  public async scanFiles(globPattern: string) {
    try {
      // Normalize the path separator
      globPattern = globPattern.replace(/\//g, path.sep);

      // remove all dots from the glob pattern
      globPattern = globPattern.replace(/\./g, '');

      // remove the leading slash
      globPattern = globPattern.replace(/^\//, '');

      // Ensure the pattern starts with 'nc/uploads/'
      if (!globPattern.startsWith(path.join('nc', 'uploads'))) {
        globPattern = path.join('nc', 'uploads', globPattern);
      }

      const globStreamInstance = globStream(globPattern, {
        nodir: true,
      });

      const stream = Readable.from(globStreamInstance);

      // Forward errors from glob stream
      globStreamInstance.on('error', (error) => {
        stream.destroy(error as any);
      });

      return stream;
    } catch (e) {
      NcError._.storageFileReadError(`Failed to scan files: ${e.message}`);
    }
  }

  init(): Promise<any> {
    return Promise.resolve(undefined);
  }

  test(): Promise<boolean> {
    return Promise.resolve(false);
  }

  getUploadedPath(filePath: string): { path?: string; url?: string } {
    const usePath = filePath.startsWith('/')
      ? filePath.replace(/^\/+/, '')
      : filePath;

    return {
      path: path.join('download', usePath),
    };
  }
}
