/**
 * Optimizes an image file to be under a maximum size (default 3MB) while preserving resolution.
 * If the file is not an image or is already smaller than the target size, it returns the original file.
 * Otherwise, it uses Canvas to compress the image.
 */
export async function optimizeImage(file: File, maxSizeBytes: number = 3 * 1024 * 1024): Promise<File> {
    // Only optimize images, excluding SVGs and GIFs which shouldn't be flattened
    const isCompressibleImage = file.type.startsWith("image/") && 
                                !file.type.includes("svg") && 
                                !file.type.includes("gif");
                                
    if (!isCompressibleImage || file.size <= maxSizeBytes) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    let canvas = document.createElement("canvas");
                    let ctx = canvas.getContext("2d");
                    if (!ctx) {
                        resolve(file); // Fallback to original
                        return;
                    }

                    // Initial resolution cap to 2560px (2K/4K range) to optimize extremely large source files (e.g. 30MB DSLRs)
                    const MAX_DIMENSION = 2560;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        if (width > height) {
                            height = Math.round((height * MAX_DIMENSION) / width);
                            width = MAX_DIMENSION;
                        } else {
                            width = Math.round((width * MAX_DIMENSION) / height);
                            height = MAX_DIMENSION;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Iterative compression
                    let quality = 0.9;
                    let compressedBlob: Blob | null = null;
                    let mimeType = file.type;

                    // If original is PNG and too large, convert to JPEG for lossy compression
                    if (file.type === "image/png") {
                        mimeType = "image/jpeg";
                        // Draw white background for transparency fallback
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                    }

                    // Loop to try compression at different qualities, and if still too large, downscale
                    let attempt = 0;
                    const maxAttempts = 8;
                    while (attempt < maxAttempts) {
                        compressedBlob = await new Promise<Blob | null>((res) => {
                            canvas.toBlob((b) => res(b), mimeType, quality);
                        });

                        if (compressedBlob && compressedBlob.size <= maxSizeBytes) {
                            break;
                        }

                        // Reduce quality
                        quality -= 0.15;
                        if (quality < 0.35) {
                            // If quality gets too low, downscale resolution by 15% and reset quality
                            width = Math.round(width * 0.85);
                            height = Math.round(height * 0.85);
                            canvas.width = width;
                            canvas.height = height;
                            
                            // Re-get context in case of canvas resize context reset
                            ctx = canvas.getContext("2d") || ctx;
                            
                            // Redraw on canvas
                            if (mimeType === "image/jpeg") {
                                ctx.fillStyle = "#FFFFFF";
                                ctx.fillRect(0, 0, width, height);
                            }
                            ctx.drawImage(img, 0, 0, width, height);
                            quality = 0.85;
                        }
                        attempt++;
                    }

                    if (compressedBlob && compressedBlob.size < file.size) {
                        // Construct clean file name
                        let newName = file.name;
                        if (file.type === "image/png" && mimeType === "image/jpeg") {
                            newName = file.name.replace(/\.png$/i, ".jpg");
                        }
                        
                        const optimizedFile = new File([compressedBlob], newName, {
                            type: mimeType,
                            lastModified: Date.now()
                        });
                        resolve(optimizedFile);
                    } else {
                        resolve(file);
                    }
                } catch (err) {
                    console.error("Error optimizing image:", err);
                    resolve(file); // Fallback
                }
            };
            img.onerror = () => resolve(file);
            img.src = event.target?.result as string;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}
