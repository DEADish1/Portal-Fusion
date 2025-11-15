import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import {
  FileTransfer,
  FileTransferStatus,
  Message,
  MessageType,
} from '@portal-fusion/shared';
import {
  createMessage,
  generateId,
  generateChecksum,
  getMimeType,
  formatFileSize,
} from '@portal-fusion/shared';
import {
  CHUNK_SIZE,
  MAX_FILE_SIZE,
  TRANSFER_TIMEOUT,
  MAX_CONCURRENT_TRANSFERS,
} from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import * as fs from 'fs/promises';
import * as path from 'path';
import log from 'electron-log';

export interface FileTransferOptions {
  chunkSize?: number;
  maxConcurrentTransfers?: number;
  timeout?: number;
  downloadPath?: string;
}

interface ActiveTransfer extends FileTransfer {
  file?: {
    path: string;
    handle?: fs.FileHandle;
  };
  chunksMap: Map<number, Buffer>;
  timeout?: NodeJS.Timeout;
}

/**
 * File Transfer Service
 * Handles chunked file transfers with progress tracking
 */
export class FileTransferService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<FileTransferOptions>;
  private transfers: Map<string, ActiveTransfer> = new Map();
  private localDeviceId?: string;

  constructor(options: FileTransferOptions = {}) {
    super();

    this.options = {
      chunkSize: options.chunkSize || CHUNK_SIZE,
      maxConcurrentTransfers: options.maxConcurrentTransfers || MAX_CONCURRENT_TRANSFERS,
      timeout: options.timeout || TRANSFER_TIMEOUT,
      downloadPath: options.downloadPath || '',
    };
  }

  /**
   * Initialize service
   */
  initialize(localDeviceId: string, downloadPath: string): void {
    this.localDeviceId = localDeviceId;
    this.options.downloadPath = downloadPath;
    log.info('File transfer service initialized');
  }

  /**
   * Send file to device
   */
  async sendFile(filePath: string, targetDeviceId: string): Promise<string> {
    if (!this.localDeviceId) {
      throw new Error('Service not initialized');
    }

    // Check concurrent transfers
    const activeTransfers = Array.from(this.transfers.values()).filter(
      t => t.status === FileTransferStatus.TRANSFERRING
    );

    if (activeTransfers.length >= this.options.maxConcurrentTransfers) {
      throw new Error('Maximum concurrent transfers reached');
    }

    // Get file info
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileSize = stats.size;

    // Check size limit
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit (${formatFileSize(MAX_FILE_SIZE)})`);
    }

    // Calculate checksum
    const fileData = await fs.readFile(filePath);
    const checksum = generateChecksum(fileData);

    // Create transfer
    const transferId = generateId();
    const chunks = Math.ceil(fileSize / this.options.chunkSize);

    const transfer: ActiveTransfer = {
      id: transferId,
      fileName,
      fileSize,
      mimeType: getMimeType(fileName),
      checksum,
      chunks: chunks,
      chunkSize: this.options.chunkSize,
      currentChunk: 0,
      progress: 0,
      speed: 0,
      status: FileTransferStatus.PENDING,
      startedAt: new Date(),
      chunksMap: new Map(),
      file: { path: filePath },
    };

    this.transfers.set(transferId, transfer);

    // Send offer
    const offerMessage = createMessage(
      MessageType.FILE_OFFER,
      {
        transferId,
        fileName,
        fileSize,
        mimeType: transfer.mimeType,
        checksum,
        chunks,
        chunkSize: this.options.chunkSize,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
        requiresAck: true,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, offerMessage);

    log.info(`File transfer offered: ${fileName} (${formatFileSize(fileSize)})`);
    this.emit('file:transfer:start', transfer);

    return transferId;
  }

  /**
   * Handle file offer
   */
  async handleFileOffer(message: Message): Promise<void> {
    const { transferId, fileName, fileSize, mimeType, checksum, chunks, chunkSize } = message.payload;

    // Create transfer
    const transfer: ActiveTransfer = {
      id: transferId,
      fileName,
      fileSize,
      mimeType,
      checksum,
      chunks,
      chunkSize,
      currentChunk: 0,
      progress: 0,
      speed: 0,
      status: FileTransferStatus.PENDING,
      startedAt: new Date(),
      chunksMap: new Map(),
    };

    this.transfers.set(transferId, transfer);

    log.info(`File transfer offer received: ${fileName} (${formatFileSize(fileSize)})`);
    this.emit('file:transfer:start', transfer);

    // Auto-accept for now (in production, show UI confirmation)
    await this.acceptTransfer(transferId, message.from);
  }

  /**
   * Accept file transfer
   */
  async acceptTransfer(transferId: string, fromDeviceId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);

    if (!transfer || !this.localDeviceId) {
      throw new Error('Transfer not found');
    }

    transfer.status = FileTransferStatus.ACCEPTED;

    // Prepare file path
    const filePath = path.join(this.options.downloadPath, transfer.fileName);
    transfer.file = { path: filePath };

    // Send accept message
    const acceptMessage = createMessage(
      MessageType.FILE_ACCEPT,
      { transferId },
      {
        from: this.localDeviceId,
        to: fromDeviceId,
      }
    );

    await connectionManager.sendMessage(fromDeviceId, acceptMessage);

    // Set timeout
    transfer.timeout = setTimeout(() => {
      this.cancelTransfer(transferId, 'Timeout');
    }, this.options.timeout * (transfer.chunksMap.size || 1));

    log.info(`File transfer accepted: ${transfer.fileName}`);
  }

  /**
   * Handle transfer accepted
   */
  async handleTransferAccepted(message: Message): Promise<void> {
    const { transferId } = message.payload;
    const transfer = this.transfers.get(transferId);

    if (!transfer || !transfer.file) {
      return;
    }

    transfer.status = FileTransferStatus.TRANSFERRING;

    // Start sending chunks
    await this.sendChunks(transferId, message.from);
  }

  /**
   * Send file chunks
   */
  private async sendChunks(transferId: string, targetDeviceId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);

    if (!transfer || !transfer.file || !this.localDeviceId) {
      return;
    }

    const fileHandle = await fs.open(transfer.file.path, 'r');
    const startTime = Date.now();

    try {
      for (let chunkIndex = 0; chunkIndex < transfer.chunks; chunkIndex++) {
        // Check if transfer was cancelled
        if (transfer.status === FileTransferStatus.CANCELLED) {
          break;
        }

        // Read chunk
        const buffer = Buffer.allocUnsafe(this.options.chunkSize);
        const { bytesRead } = await fileHandle.read(
          buffer,
          0,
          this.options.chunkSize,
          chunkIndex * this.options.chunkSize
        );

        const chunk = buffer.slice(0, bytesRead);

        // Send chunk
        const chunkMessage = createMessage(
          MessageType.FILE_CHUNK,
          {
            transferId,
            chunkIndex,
            chunk: chunk.toString('base64'),
            checksum: generateChecksum(chunk),
          },
          {
            from: this.localDeviceId,
            to: targetDeviceId,
            compressed: false, // Already binary data
          }
        );

        await connectionManager.sendMessage(targetDeviceId, chunkMessage);

        // Update progress
        transfer.currentChunk = chunkIndex + 1;
        transfer.progress = (transfer.currentChunk / transfer.chunks) * 100;
        transfer.speed = (transfer.currentChunk * this.options.chunkSize) / ((Date.now() - startTime) / 1000);

        this.emit('file:transfer:progress', transfer);
      }

      // Send complete message
      if (transfer.status !== FileTransferStatus.CANCELLED) {
        const completeMessage = createMessage(
          MessageType.FILE_COMPLETE,
          { transferId },
          {
            from: this.localDeviceId,
            to: targetDeviceId,
          }
        );

        await connectionManager.sendMessage(targetDeviceId, completeMessage);

        transfer.status = FileTransferStatus.COMPLETED;
        transfer.progress = 100;

        log.info(`File transfer completed: ${transfer.fileName}`);
        this.emit('file:transfer:complete', transfer);
      }
    } catch (error) {
      log.error('Failed to send chunks:', error);
      transfer.status = FileTransferStatus.ERROR;
      this.emit('file:transfer:complete', transfer);
    } finally {
      await fileHandle.close();

      // Cleanup after delay
      setTimeout(() => {
        this.transfers.delete(transferId);
      }, 5000);
    }
  }

  /**
   * Handle received chunk
   */
  async handleChunk(message: Message): Promise<void> {
    const { transferId, chunkIndex, chunk, checksum } = message.payload;
    const transfer = this.transfers.get(transferId);

    if (!transfer) {
      return;
    }

    try {
      // Decode chunk
      const chunkBuffer = Buffer.from(chunk, 'base64');

      // Verify checksum
      const actualChecksum = generateChecksum(chunkBuffer);
      if (actualChecksum !== checksum) {
        throw new Error('Chunk checksum mismatch');
      }

      // Store chunk
      transfer.chunksMap.set(chunkIndex, chunkBuffer);

      // Update progress
      transfer.currentChunk = chunkIndex + 1;
      transfer.progress = (transfer.chunksMap.size / transfer.chunks) * 100;

      this.emit('file:transfer:progress', transfer);

      // Check if all chunks received
      if (transfer.chunksMap.size === transfer.chunks) {
        await this.assembleFile(transferId);
      }
    } catch (error) {
      log.error('Failed to handle chunk:', error);
      this.cancelTransfer(transferId, 'Chunk error');
    }
  }

  /**
   * Assemble file from chunks
   */
  private async assembleFile(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);

    if (!transfer || !transfer.file) {
      return;
    }

    try {
      // Sort chunks and combine
      const sortedChunks: Buffer[] = [];
      for (let i = 0; i < transfer.chunks; i++) {
        const chunk = transfer.chunksMap.get(i);
        if (!chunk) {
          throw new Error(`Missing chunk ${i}`);
        }
        sortedChunks.push(chunk);
      }

      const fileData = Buffer.concat(sortedChunks);

      // Verify checksum
      const actualChecksum = generateChecksum(fileData);
      if (actualChecksum !== transfer.checksum) {
        throw new Error('File checksum mismatch');
      }

      // Write file
      await fs.writeFile(transfer.file.path, fileData);

      transfer.status = FileTransferStatus.COMPLETED;
      transfer.progress = 100;

      // Clear timeout
      if (transfer.timeout) {
        clearTimeout(transfer.timeout);
      }

      log.info(`File assembled: ${transfer.fileName} at ${transfer.file.path}`);
      this.emit('file:transfer:complete', transfer);

      // Cleanup after delay
      setTimeout(() => {
        this.transfers.delete(transferId);
      }, 5000);
    } catch (error) {
      log.error('Failed to assemble file:', error);
      transfer.status = FileTransferStatus.ERROR;
      this.emit('file:transfer:complete', transfer);
    }
  }

  /**
   * Cancel transfer
   */
  async cancelTransfer(transferId: string, reason?: string): Promise<void> {
    const transfer = this.transfers.get(transferId);

    if (!transfer) {
      return;
    }

    transfer.status = FileTransferStatus.CANCELLED;

    // Clear timeout
    if (transfer.timeout) {
      clearTimeout(transfer.timeout);
    }

    log.info(`File transfer cancelled: ${transfer.fileName}${reason ? ` (${reason})` : ''}`);
    this.emit('file:transfer:complete', transfer);

    // Cleanup
    this.transfers.delete(transferId);
  }

  /**
   * Get active transfers
   */
  getActiveTransfers(): FileTransfer[] {
    return Array.from(this.transfers.values()).map(t => ({
      id: t.id,
      fileName: t.fileName,
      fileSize: t.fileSize,
      mimeType: t.mimeType,
      checksum: t.checksum,
      chunks: t.chunks,
      chunkSize: t.chunkSize,
      currentChunk: t.currentChunk,
      progress: t.progress,
      speed: t.speed,
      status: t.status,
      startedAt: t.startedAt,
      estimatedCompletion: t.estimatedCompletion,
    }));
  }

  /**
   * Get transfer by ID
   */
  getTransfer(transferId: string): FileTransfer | undefined {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return undefined;

    return {
      id: transfer.id,
      fileName: transfer.fileName,
      fileSize: transfer.fileSize,
      mimeType: transfer.mimeType,
      checksum: transfer.checksum,
      chunks: transfer.chunks,
      chunkSize: transfer.chunkSize,
      currentChunk: transfer.currentChunk,
      progress: transfer.progress,
      speed: transfer.speed,
      status: transfer.status,
      startedAt: transfer.startedAt,
      estimatedCompletion: transfer.estimatedCompletion,
    };
  }
}

// Export singleton instance
export const fileTransferService = new FileTransferService();
