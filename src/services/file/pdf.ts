import { ERROR_MESSAGES } from "@/schema/messageSchema";
import {
    PDF_PROCESSING,
    type PdfPageCountResult,
    type PdfSingleFileResult,
    type PdfMultipleFilesResult,
    type PdfLongImageResult,
    type PdfSinglePageOptions,
    type PdfMultiPageOptions,
    type PdfLongImageOptions,
    type PdfSmartProcessingOptions,
    validatePdfSinglePageOptions,
    validatePdfMultiPageOptions,
    validatePdfLongImageOptions,
    validatePdfSmartProcessingOptions,
} from "@/schema/pdfSchema";
import { logError, logInfo } from "@/utils/sys/log";
/**
 * Client-side PDF processing utilities
 * Handles PDF to image conversion using PDF.js for browser compatibility
 */

// PDF.js types (dynamic import)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfjs: any = null;

/**
 * Initialize PDF.js with worker configuration
 * Uses dynamic import to avoid SSR issues
 */
const initPdfJs = async () => {
    if (pdfjs) return pdfjs;

    try {
        // Dynamic import for client-side only
        // Set worker source for PDF.js
        const { GlobalWorkerOptions, getDocument, version } = await import(
            "pdfjs-dist"
        );
        if (typeof window !== "undefined") {
            GlobalWorkerOptions.workerSrc = PDF_PROCESSING.PDF_JS_URL.replace(
                "{version}",
                version,
            );
        }

        logInfo("PDF.js initialized successfully", { version });
        return { getDocument };
    } catch (error) {
        logError("Failed to initialize PDF.js", { error });
        throw new Error(ERROR_MESSAGES.PDF_PROCESSING_NOT_AVAILABLE);
    }
};

/**
 * Check if browser supports PDF processing
 */
export const supportsPdfProcessing = (): boolean => {
    try {
        return (
            typeof window !== "undefined" &&
            !!document.createElement("canvas").getContext &&
            !!window.FileReader
        );
    } catch {
        return false;
    }
};

/**
 * Extract page count from PDF file
 */
export const getPdfPageCount = async (
    pdfFile: File,
): Promise<PdfPageCountResult> => {
    try {
        if (!supportsPdfProcessing()) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_PROCESSING_NOT_AVAILABLE,
            };
        }

        const { getDocument } = await initPdfJs();
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;

        logInfo("PDF page count extracted", {
            fileName: pdfFile.name,
            pageCount: pdf.numPages,
        });

        return {
            success: true,
            pageCount: pdf.numPages,
        };
    } catch (error) {
        logError("Failed to get PDF page count", {
            error,
            fileName: pdfFile.name,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.PDF_LOAD_FAILED,
        };
    }
};

/**
 * Convert PDF to high-quality image
 * Supports single page (default: first page) or specific page selection
 */
export const convertPdfToImage = async (
    pdfFile: File,
    options: Partial<PdfSinglePageOptions> = {},
): Promise<PdfSingleFileResult> => {
    try {
        if (!supportsPdfProcessing()) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_PROCESSING_NOT_AVAILABLE,
            };
        }

        const validatedOptions = validatePdfSinglePageOptions(options);
        const {
            pageNumber,
            scale,
            outputFormat,
            quality,
            maxWidth,
            maxHeight,
        } = validatedOptions;

        const { getDocument } = await initPdfJs();
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;

        // Validate page number
        if (pageNumber < 1 || pageNumber > pdf.numPages) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_PAGE_NUMBER_OUT_OF_RANGE.replace(
                    "{wanted}",
                    pageNumber.toString(),
                ).replace("{max}", pdf.numPages.toString()),
            };
        }

        // Get the specified page
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        // Calculate dimensions with max width/height constraints
        let { width, height } = viewport;
        if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
        }
        if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
        }

        // Create canvas for rendering
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            return {
                success: false,
                error: ERROR_MESSAGES.CANVAS_2D_CONTEXT_NOT_SUPPORTED,
            };
        }

        canvas.width = width;
        canvas.height = height;

        // Render PDF page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: page.getViewport({
                scale: scale * (width / viewport.width),
            }),
        };

        await page.render(renderContext).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, outputFormat, quality);
        });

        if (!blob) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_RENDER_FAILED,
            };
        }

        // Create File object from blob
        const originalName = pdfFile.name.replace(/\.pdf$/i, "");
        const extension = outputFormat.split("/")[1]; //.jpg or .png
        const imageFileName = `${originalName}_page${pageNumber}${extension}`;

        const imageFile = new File([blob], imageFileName, {
            type: outputFormat,
            lastModified: Date.now(),
        });

        logInfo("PDF converted to image successfully", {
            originalFileName: pdfFile.name,
            imageFileName: imageFile.name,
            pageNumber,
            originalSize: pdfFile.size,
            imageSize: imageFile.size,
            dimensions: { width, height },
        });

        return {
            success: true,
            imageFile,
        };
    } catch (error) {
        logError("Failed to convert PDF to image", {
            error,
            fileName: pdfFile.name,
            pageNumber: options.pageNumber,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.PDF_PROCESSING_FAILED,
        };
    }
};

/**
 * Convert multi-page PDF to multiple images
 * Returns array of image files, one per page
 */
export const convertPdfToImages = async (
    pdfFile: File,
    options: Partial<PdfMultiPageOptions> = {},
): Promise<PdfMultipleFilesResult> => {
    try {
        const validatedOptions = validatePdfMultiPageOptions(options);
        const { maxPages, ...convertOptions } = validatedOptions;

        // Get page count first
        const pageCountResult = await getPdfPageCount(pdfFile);
        if (!pageCountResult.success) {
            return pageCountResult;
        }

        const totalPages = pageCountResult.pageCount!;
        const pagesToConvert = Math.min(totalPages, maxPages);
        const imageFiles: File[] = [];

        // Convert each page
        for (let pageNum = 1; pageNum <= pagesToConvert; pageNum++) {
            const result = await convertPdfToImage(pdfFile, {
                ...convertOptions,
                pageNumber: pageNum,
            });

            if (!result.success) {
                logError("Failed to convert PDF page", {
                    fileName: pdfFile.name,
                    pageNumber: pageNum,
                    error: result.error,
                });
                // Continue with other pages instead of failing completely
                continue;
            }

            if (result.imageFile) {
                imageFiles.push(result.imageFile);
            }
        }

        if (imageFiles.length === 0) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_PROCESSING_FAILED,
            };
        }

        logInfo("Multi-page PDF converted successfully", {
            fileName: pdfFile.name,
            totalPages,
            convertedPages: imageFiles.length,
            pagesToConvert,
        });

        return {
            success: true,
            imageFiles,
            pageCount: totalPages,
        };
    } catch (error) {
        logError("Failed to convert multi-page PDF", {
            error,
            fileName: pdfFile.name,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.PDF_PROCESSING_FAILED,
        };
    }
};

/**
 * Convert multi-page PDF to a single long vertical image
 * Concatenates pages vertically with optional spacing and separators
 */
export const convertPdfToLongImage = async (
    pdfFile: File,
    options: Partial<PdfLongImageOptions> = {},
): Promise<PdfLongImageResult> => {
    try {
        if (!supportsPdfProcessing()) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_PROCESSING_NOT_AVAILABLE,
            };
        }

        const validatedOptions = validatePdfLongImageOptions(options);
        const {
            maxPages,
            scale,
            outputFormat,
            quality,
            maxWidth,
            pageSpacing,
            addPageSeparator,
            separatorColor,
            separatorThickness,
        } = validatedOptions;

        // Get PDF document and page count
        const { getDocument } = await initPdfJs();
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;

        const totalPages = pdf.numPages;
        const pagesToProcess = Math.min(totalPages, maxPages);

        if (pagesToProcess === 0) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_HAS_NO_PAGES_TO_PROCESS,
            };
        }

        logInfo("Starting multi-page PDF to long image conversion", {
            fileName: pdfFile.name,
            totalPages,
            pagesToProcess,
            maxWidth,
            pageSpacing,
        });

        // Render all pages to individual canvases first
        const pageCanvases: {
            canvas: HTMLCanvasElement;
            width: number;
            height: number;
        }[] = [];

        let maxPageWidth = 0;
        let totalContentHeight = 0;

        // Process each page
        for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            // Calculate dimensions with max width constraint
            let { width, height } = viewport;
            if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = height * ratio;
            }

            // Track maximum width and total height
            maxPageWidth = Math.max(maxPageWidth, width);
            totalContentHeight += height;

            // Create canvas for this page
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (!context) {
                // Clean up any previously created canvases
                pageCanvases.forEach((pc) => pc.canvas.remove());
                return {
                    success: false,
                    error: "Canvas 2D context not supported",
                };
            }

            canvas.width = width;
            canvas.height = height;

            // Render page to canvas
            const renderContext = {
                canvasContext: context,
                viewport: page.getViewport({
                    scale: scale * (width / viewport.width),
                }),
            };

            await page.render(renderContext).promise;

            pageCanvases.push({ canvas, width, height });

            logInfo(`Rendered page ${pageNum}/${pagesToProcess}`, {
                pageNumber: pageNum,
                dimensions: { width, height },
            });
        }

        // Calculate final long image dimensions
        const separatorHeight = addPageSeparator ? separatorThickness : 0;
        const totalSpacing =
            (pagesToProcess - 1) * (pageSpacing + separatorHeight);
        const finalHeight = totalContentHeight + totalSpacing;

        // Create the long canvas
        const longCanvas = document.createElement("canvas");
        const longContext = longCanvas.getContext("2d");

        if (!longContext) {
            // Clean up
            pageCanvases.forEach((pc) => pc.canvas.remove());
            return {
                success: false,
                error: "Failed to create final canvas context",
            };
        }

        longCanvas.width = maxPageWidth;
        longCanvas.height = finalHeight;

        // Fill with white background
        longContext.fillStyle = "#ffffff";
        longContext.fillRect(0, 0, maxPageWidth, finalHeight);

        // Composite all pages onto the long canvas
        let currentY = 0;

        for (let i = 0; i < pageCanvases.length; i++) {
            const { canvas, width, height } = pageCanvases[i];

            // Center the page horizontally if it's narrower than maxPageWidth
            const x = (maxPageWidth - width) / 2;

            // Draw the page
            longContext.drawImage(canvas, x, currentY, width, height);

            currentY += height;

            // Add spacing and separator (except after the last page)
            if (i < pageCanvases.length - 1) {
                currentY += pageSpacing / 2;

                // Draw separator line if enabled
                if (addPageSeparator) {
                    longContext.fillStyle = separatorColor;
                    longContext.fillRect(
                        0,
                        currentY,
                        maxPageWidth,
                        separatorThickness,
                    );
                    currentY += separatorThickness;
                }

                currentY += pageSpacing / 2;
            }

            // Clean up individual page canvas
            canvas.remove();
        }

        // Convert long canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => {
            longCanvas.toBlob(resolve, outputFormat, quality);
        });

        // Clean up long canvas
        longCanvas.remove();

        if (!blob) {
            return {
                success: false,
                error: ERROR_MESSAGES.PDF_RENDER_FAILED,
            };
        }

        // Create File object from blob
        const originalName = pdfFile.name.replace(/\.pdf$/i, "");
        const extension = outputFormat === "image/jpeg" ? ".jpg" : ".png";
        const imageFileName = `${originalName}_long_${pagesToProcess}pages${extension}`;

        const imageFile = new File([blob], imageFileName, {
            type: outputFormat,
            lastModified: Date.now(),
        });

        logInfo("PDF converted to long image successfully", {
            originalFileName: pdfFile.name,
            imageFileName: imageFile.name,
            totalPages,
            processedPages: pagesToProcess,
            originalSize: pdfFile.size,
            imageSize: imageFile.size,
            dimensions: { width: maxPageWidth, height: finalHeight },
        });

        return {
            success: true,
            imageFile,
            pageCount: totalPages,
            totalHeight: finalHeight,
            processedPages: pagesToProcess,
        };
    } catch (error) {
        logError("Failed to convert PDF to long image", {
            error,
            fileName: pdfFile.name,
            options,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.PDF_PROCESSING_FAILED,
        };
    }
};

/**
 * Detect if file is PDF and needs processing
 */
export const shouldProcessAsPdf = (file: File): boolean =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

/**
 * Smart PDF processing - automatically choose best strategy
 * For single page PDFs: convert to single image
 * For multi-page PDFs (≤3 pages): create long image
 * For multi-page PDFs (>3 pages): convert first page only
 */
export const smartPdfProcessing = async (
    pdfFile: File,
    options: Partial<PdfSmartProcessingOptions> = {},
): Promise<PdfSingleFileResult> => {
    try {
        const validatedOptions = validatePdfSmartProcessingOptions(options);
        const { maxPages, ...convertOptions } = validatedOptions;

        // Get page count
        const pageCountResult = await getPdfPageCount(pdfFile);
        if (!pageCountResult.success) {
            return pageCountResult;
        }

        const pageCount = pageCountResult.pageCount!;

        // Auto-determine processing strategy
        let result;
        let strategy: string;

        if (pageCount === 1) {
            // Single page: convert to image
            result = await convertPdfToImage(pdfFile, {
                ...convertOptions,
                pageNumber: 1,
            });
            strategy = "single-page";

            logInfo("Smart PDF processing completed", {
                fileName: pdfFile.name,
                pageCount,
                selectedPage: 1,
                strategy,
            });

            return {
                success: result.success,
                imageFile: result.imageFile,
                pageCount,
                selectedPage: 1,
                strategy,
                error: result.error,
            };
        } else if (pageCount <= maxPages) {
            // Short multi-page: create long image
            result = await convertPdfToLongImage(pdfFile, {
                maxPages,
                ...convertOptions,
            });
            strategy = `long-image-${result.processedPages || 0}-pages`;

            return {
                ...result,
                strategy,
            };
        } else {
            // Long multi-page: use first page only
            result = await convertPdfToImage(pdfFile, {
                ...convertOptions,
                pageNumber: 1,
            });
            strategy = "first-page";

            logInfo("Smart PDF processing completed", {
                fileName: pdfFile.name,
                pageCount,
                selectedPage: 1,
                strategy,
            });

            return {
                success: result.success,
                imageFile: result.imageFile,
                pageCount,
                selectedPage: 1,
                strategy,
                error: result.error,
            };
        }
    } catch (error) {
        logError("Smart PDF processing failed", {
            error,
            fileName: pdfFile.name,
            options,
        });
        return {
            success: false,
            error: ERROR_MESSAGES.PDF_PROCESSING_FAILED,
        };
    }
};
