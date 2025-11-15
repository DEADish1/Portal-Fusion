"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileTransferService = exports.FileTransferService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const shared_4 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * File Transfer Service
 * Handles chunked file transfers with progress tracking
 */
class FileTransferService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.transfers = new Map();
        this.options = {
            chunkSize: options.chunkSize || shared_4.CHUNK_SIZE,
            maxConcurrentTransfers: options.maxConcurrentTransfers || shared_4.MAX_CONCURRENT_TRANSFERS,
            timeout: options.timeout || shared_4.TRANSFER_TIMEOUT,
            downloadPath: options.downloadPath || '',
        };
    }
    /**
     * Initialize service
     */
    initialize(localDeviceId, downloadPath) {
        this.localDeviceId = localDeviceId;
        this.options.downloadPath = downloadPath;
        electron_log_1.default.info('File transfer service initialized');
    }
    /**
     * Send file to device
     */
    async sendFile(filePath, targetDeviceId) {
        if (!this.localDeviceId) {
            throw new Error('Service not initialized');
        }
        // Check concurrent transfers
        const activeTransfers = Array.from(this.transfers.values()).filter(t => t.status === shared_2.FileTransferStatus.TRANSFERRING);
        if (activeTransfers.length >= this.options.maxConcurrentTransfers) {
            throw new Error('Maximum concurrent transfers reached');
        }
        // Get file info
        const stats = await fs.stat(filePath);
        const fileName = path.basename(filePath);
        const fileSize = stats.size;
        // Check size limit
        if (fileSize > shared_4.MAX_FILE_SIZE) {
            throw new Error(`File size exceeds limit (${(0, shared_3.formatFileSize)(shared_4.MAX_FILE_SIZE)})`);
        }
        // Calculate checksum
        const fileData = await fs.readFile(filePath);
        const checksum = (0, shared_3.generateChecksum)(fileData);
        // Create transfer
        const transferId = (0, shared_3.generateId)();
        const chunks = Math.ceil(fileSize / this.options.chunkSize);
        const transfer = {
            id: transferId,
            fileName,
            fileSize,
            mimeType: (0, shared_3.getMimeType)(fileName),
            checksum,
            chunks: chunks,
            chunkSize: this.options.chunkSize,
            currentChunk: 0,
            progress: 0,
            speed: 0,
            status: shared_2.FileTransferStatus.PENDING,
            startedAt: new Date(),
            chunksMap: new Map(),
            file: { path: filePath },
        };
        this.transfers.set(transferId, transfer);
        // Send offer
        const offerMessage = (0, shared_3.createMessage)(shared_2.MessageType.FILE_OFFER, {
            transferId,
            fileName,
            fileSize,
            mimeType: transfer.mimeType,
            checksum,
            chunks,
            chunkSize: this.options.chunkSize,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
            requiresAck: true,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, offerMessage);
        electron_log_1.default.info(`File transfer offered: ${fileName} (${(0, shared_3.formatFileSize)(fileSize)})`);
        this.emit('file:transfer:start', transfer);
        return transferId;
    }
    /**
     * Handle file offer
     */
    async handleFileOffer(message) {
        const { transferId, fileName, fileSize, mimeType, checksum, chunks, chunkSize } = message.payload;
        // Create transfer
        const transfer = {
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
            status: shared_2.FileTransferStatus.PENDING,
            startedAt: new Date(),
            chunksMap: new Map(),
        };
        this.transfers.set(transferId, transfer);
        electron_log_1.default.info(`File transfer offer received: ${fileName} (${(0, shared_3.formatFileSize)(fileSize)})`);
        this.emit('file:transfer:start', transfer);
        // Auto-accept for now (in production, show UI confirmation)
        await this.acceptTransfer(transferId, message.from);
    }
    /**
     * Accept file transfer
     */
    async acceptTransfer(transferId, fromDeviceId) {
        const transfer = this.transfers.get(transferId);
        if (!transfer || !this.localDeviceId) {
            throw new Error('Transfer not found');
        }
        transfer.status = shared_2.FileTransferStatus.ACCEPTED;
        // Prepare file path
        const filePath = path.join(this.options.downloadPath, transfer.fileName);
        transfer.file = { path: filePath };
        // Send accept message
        const acceptMessage = (0, shared_3.createMessage)(shared_2.MessageType.FILE_ACCEPT, { transferId }, {
            from: this.localDeviceId,
            to: fromDeviceId,
        });
        await connection_1.connectionManager.sendMessage(fromDeviceId, acceptMessage);
        // Set timeout
        transfer.timeout = setTimeout(() => {
            this.cancelTransfer(transferId, 'Timeout');
        }, this.options.timeout * (transfer.chunksMap.size || 1));
        electron_log_1.default.info(`File transfer accepted: ${transfer.fileName}`);
    }
    /**
     * Handle transfer accepted
     */
    async handleTransferAccepted(message) {
        const { transferId } = message.payload;
        const transfer = this.transfers.get(transferId);
        if (!transfer || !transfer.file) {
            return;
        }
        transfer.status = shared_2.FileTransferStatus.TRANSFERRING;
        // Start sending chunks
        await this.sendChunks(transferId, message.from);
    }
    /**
     * Send file chunks
     */
    async sendChunks(transferId, targetDeviceId) {
        const transfer = this.transfers.get(transferId);
        if (!transfer || !transfer.file || !this.localDeviceId) {
            return;
        }
        const fileHandle = await fs.open(transfer.file.path, 'r');
        const startTime = Date.now();
        try {
            for (let chunkIndex = 0; chunkIndex < transfer.chunks; chunkIndex++) {
                // Check if transfer was cancelled
                if (transfer.status === shared_2.FileTransferStatus.CANCELLED) {
                    break;
                }
                // Read chunk
                const buffer = Buffer.allocUnsafe(this.options.chunkSize);
                const { bytesRead } = await fileHandle.read(buffer, 0, this.options.chunkSize, chunkIndex * this.options.chunkSize);
                const chunk = buffer.slice(0, bytesRead);
                // Send chunk
                const chunkMessage = (0, shared_3.createMessage)(shared_2.MessageType.FILE_CHUNK, {
                    transferId,
                    chunkIndex,
                    chunk: chunk.toString('base64'),
                    checksum: (0, shared_3.generateChecksum)(chunk),
                }, {
                    from: this.localDeviceId,
                    to: targetDeviceId,
                    compressed: false, // Already binary data
                });
                await connection_1.connectionManager.sendMessage(targetDeviceId, chunkMessage);
                // Update progress
                transfer.currentChunk = chunkIndex + 1;
                transfer.progress = (transfer.currentChunk / transfer.chunks) * 100;
                transfer.speed = (transfer.currentChunk * this.options.chunkSize) / ((Date.now() - startTime) / 1000);
                this.emit('file:transfer:progress', transfer);
            }
            // Send complete message
            if (transfer.status !== shared_2.FileTransferStatus.CANCELLED) {
                const completeMessage = (0, shared_3.createMessage)(shared_2.MessageType.FILE_COMPLETE, { transferId }, {
                    from: this.localDeviceId,
                    to: targetDeviceId,
                });
                await connection_1.connectionManager.sendMessage(targetDeviceId, completeMessage);
                transfer.status = shared_2.FileTransferStatus.COMPLETED;
                transfer.progress = 100;
                electron_log_1.default.info(`File transfer completed: ${transfer.fileName}`);
                this.emit('file:transfer:complete', transfer);
            }
        }
        catch (error) {
            electron_log_1.default.error('Failed to send chunks:', error);
            transfer.status = shared_2.FileTransferStatus.ERROR;
            this.emit('file:transfer:complete', transfer);
        }
        finally {
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
    async handleChunk(message) {
        const { transferId, chunkIndex, chunk, checksum } = message.payload;
        const transfer = this.transfers.get(transferId);
        if (!transfer) {
            return;
        }
        try {
            // Decode chunk
            const chunkBuffer = Buffer.from(chunk, 'base64');
            // Verify checksum
            const actualChecksum = (0, shared_3.generateChecksum)(chunkBuffer);
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
        }
        catch (error) {
            electron_log_1.default.error('Failed to handle chunk:', error);
            this.cancelTransfer(transferId, 'Chunk error');
        }
    }
    /**
     * Assemble file from chunks
     */
    async assembleFile(transferId) {
        const transfer = this.transfers.get(transferId);
        if (!transfer || !transfer.file) {
            return;
        }
        try {
            // Sort chunks and combine
            const sortedChunks = [];
            for (let i = 0; i < transfer.chunks; i++) {
                const chunk = transfer.chunksMap.get(i);
                if (!chunk) {
                    throw new Error(`Missing chunk ${i}`);
                }
                sortedChunks.push(chunk);
            }
            const fileData = Buffer.concat(sortedChunks);
            // Verify checksum
            const actualChecksum = (0, shared_3.generateChecksum)(fileData);
            if (actualChecksum !== transfer.checksum) {
                throw new Error('File checksum mismatch');
            }
            // Write file
            await fs.writeFile(transfer.file.path, fileData);
            transfer.status = shared_2.FileTransferStatus.COMPLETED;
            transfer.progress = 100;
            // Clear timeout
            if (transfer.timeout) {
                clearTimeout(transfer.timeout);
            }
            electron_log_1.default.info(`File assembled: ${transfer.fileName} at ${transfer.file.path}`);
            this.emit('file:transfer:complete', transfer);
            // Cleanup after delay
            setTimeout(() => {
                this.transfers.delete(transferId);
            }, 5000);
        }
        catch (error) {
            electron_log_1.default.error('Failed to assemble file:', error);
            transfer.status = shared_2.FileTransferStatus.ERROR;
            this.emit('file:transfer:complete', transfer);
        }
    }
    /**
     * Cancel transfer
     */
    async cancelTransfer(transferId, reason) {
        const transfer = this.transfers.get(transferId);
        if (!transfer) {
            return;
        }
        transfer.status = shared_2.FileTransferStatus.CANCELLED;
        // Clear timeout
        if (transfer.timeout) {
            clearTimeout(transfer.timeout);
        }
        electron_log_1.default.info(`File transfer cancelled: ${transfer.fileName}${reason ? ` (${reason})` : ''}`);
        this.emit('file:transfer:complete', transfer);
        // Cleanup
        this.transfers.delete(transferId);
    }
    /**
     * Get active transfers
     */
    getActiveTransfers() {
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
    getTransfer(transferId) {
        const transfer = this.transfers.get(transferId);
        if (!transfer)
            return undefined;
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
exports.FileTransferService = FileTransferService;
// Export singleton instance
exports.fileTransferService = new FileTransferService();
//# sourceMappingURL=file-transfer.js.map