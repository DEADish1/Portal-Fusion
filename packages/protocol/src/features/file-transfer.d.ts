import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { FileTransfer, Message } from '@portal-fusion/shared';
export interface FileTransferOptions {
    chunkSize?: number;
    maxConcurrentTransfers?: number;
    timeout?: number;
    downloadPath?: string;
}
/**
 * File Transfer Service
 * Handles chunked file transfers with progress tracking
 */
export declare class FileTransferService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private transfers;
    private localDeviceId?;
    constructor(options?: FileTransferOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string, downloadPath: string): void;
    /**
     * Send file to device
     */
    sendFile(filePath: string, targetDeviceId: string): Promise<string>;
    /**
     * Handle file offer
     */
    handleFileOffer(message: Message): Promise<void>;
    /**
     * Accept file transfer
     */
    acceptTransfer(transferId: string, fromDeviceId: string): Promise<void>;
    /**
     * Handle transfer accepted
     */
    handleTransferAccepted(message: Message): Promise<void>;
    /**
     * Send file chunks
     */
    private sendChunks;
    /**
     * Handle received chunk
     */
    handleChunk(message: Message): Promise<void>;
    /**
     * Assemble file from chunks
     */
    private assembleFile;
    /**
     * Cancel transfer
     */
    cancelTransfer(transferId: string, reason?: string): Promise<void>;
    /**
     * Get active transfers
     */
    getActiveTransfers(): FileTransfer[];
    /**
     * Get transfer by ID
     */
    getTransfer(transferId: string): FileTransfer | undefined;
}
export declare const fileTransferService: FileTransferService;
//# sourceMappingURL=file-transfer.d.ts.map