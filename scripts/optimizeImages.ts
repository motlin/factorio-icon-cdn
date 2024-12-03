/* eslint-disable no-console */
import fs from 'fs/promises';
import path from 'path';
import {exit} from 'process';

import sharp from 'sharp';

const CONFIG = {
    INPUT_DIR: 'script-output',
    OUTPUT_DIR: 'icon',
    SUPPORTED_FORMATS: ['.png', '.jpg', '.jpeg'] as const,
    WEBP_OPTIONS: {
        quality: 90,
        lossless: false,
        nearLossless: true,
    } as const
};

interface ConversionResult {
    success: boolean;
    sourcePath: string;
    outputPath: string;
    error?: Error;
}

/**
 * Converts a single image file to WebP format while maintaining directory structure
 * @param sourcePath - Path to the source image file
 * @param outputPath - Path where the WebP file should be saved
 * @returns Promise containing the conversion result
 */
async function convertToWebP(sourcePath: string, outputPath: string): Promise<ConversionResult> {
    try {
        const sourceStats = await fs.stat(sourcePath);
        let shouldConvert = true;

        try {
            const webpStats = await fs.stat(outputPath);
            if (webpStats.mtime >= sourceStats.mtime) {
                console.log(`Skipping ${sourcePath} - WebP is up to date`);
                return {
                    success: true,
                    sourcePath,
                    outputPath
                };
            }
            console.log(`WebP at ${outputPath} is older than source (${webpStats.mtime.toISOString()} < ${sourceStats.mtime.toISOString()})`);
        } catch (error) {
            // Output file doesn't exist, we should create it
            console.log(`Creating new WebP file at ${outputPath}`);
        }

        if (shouldConvert) {
            // Ensure the output directory exists
            await fs.mkdir(path.dirname(outputPath), { recursive: true });

            await sharp(sourcePath)
                .webp(CONFIG.WEBP_OPTIONS)
                .toFile(outputPath);

            console.log(`✓ Created ${outputPath}`);
        }

        return {
            success: true,
            sourcePath,
            outputPath
        };
    } catch (error) {
        console.error(`✗ Failed to convert ${sourcePath}:`, error);
        return {
            success: false,
            sourcePath,
            outputPath,
            error: error as Error
        };
    }
}

/**
 * Processes a directory recursively, maintaining the same structure in the output directory
 * @param inputDirPath - Path to the input directory
 * @param baseInputDir - Base input directory for relative path calculation
 * @param baseOutputDir - Base output directory where converted files will be stored
 * @returns Promise containing an array of conversion results
 */
async function processDirectory(
    inputDirPath: string,
    baseInputDir: string,
    baseOutputDir: string
): Promise<ConversionResult[]> {
    console.log(`\nScanning directory: ${inputDirPath}`);
    const entries = await fs.readdir(inputDirPath, {withFileTypes: true});
    const results: ConversionResult[] = [];

    for (const entry of entries) {
        const inputPath = path.join(inputDirPath, entry.name);
        // Calculate the path relative to the base input directory
        const relativePath = path.relative(baseInputDir, inputPath);
        // Create the output path by joining the base output directory with the relative path
        const outputPath = path.join(baseOutputDir, relativePath);

        if (entry.isDirectory()) {
            const subResults = await processDirectory(inputPath, baseInputDir, baseOutputDir);
            results.push(...subResults);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (CONFIG.SUPPORTED_FORMATS.includes(ext as typeof CONFIG.SUPPORTED_FORMATS[number])) {
                const webpOutputPath = outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                const result = await convertToWebP(inputPath, webpOutputPath);
                results.push(result);
            }
        }
    }

    return results;
}

/**
 * Main execution function that orchestrates the image optimization process
 */
async function main(): Promise<void> {
    console.log('Starting image optimization...');
    console.log(`Input directory: ${path.resolve(CONFIG.INPUT_DIR)}`);
    console.log(`Output directory: ${path.resolve(CONFIG.OUTPUT_DIR)}`);
    console.log(`Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);

    const startTime = Date.now();

    try {
        // Ensure output directory exists
        await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });

        // Process all files with correct base directories
        const results = await processDirectory(
            CONFIG.INPUT_DIR,
            CONFIG.INPUT_DIR,
            CONFIG.OUTPUT_DIR
        );

        // Log summary
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\nConversion Summary:');
        console.log(`✓ Successfully converted: ${successCount} files`);
        console.log(`✗ Failed conversions: ${failureCount} files`);
        console.log(`Total time: ${duration}s`);

        if (failureCount > 0) {
            exit(1);
        }
    } catch (error) {
        console.error('Failed to process images:', error);
        exit(1);
    }
}

void main();