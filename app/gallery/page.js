"use client";

import { useEffect, useState } from 'react';
// Do NOT import Next's Image component here, we will use a standard <img> tag

const GalleryPage = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/images')
            .then(res => res.json())
            .then(data => {
                const imageArray = Array.isArray(data) ? data : data.images || [];
                setImages(imageArray);
            })
            .catch(error => {
                console.error("Failed to fetch gallery images:", error);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading Gallery...</div>;
    }

    if (images.length === 0) {
        return <div className="p-8 text-center">No images found in the gallery.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <h1 className="text-4xl font-bold text-center mb-10 text-blue-700 dark:text-blue-400">Village Gallery</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {images.map((img, index) => {
                    
                    // CRITICAL CHANGE: Use img.image_data which contains the Base64 URI
                    const imageUrl = img.image_data;
                    const altText = img.title || `Gallery ${index + 1}`;

                    if (!imageUrl) {
                        console.warn(`Image record ID ${img._id} is missing image_data and will be skipped.`);
                        return null; // Skip rendering if Base64 data is missing
                    }

                    return (
                        // Replace <Image> with <img> for Base64 compatibility
                        <div 
                            key={img._id || index} 
                            className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg"
                            // Use window.open with the image data directly if needed, or link to a dedicated viewer
                            onClick={() => window.open(imageUrl, "_blank")}
                        >
                            <img
                                src={imageUrl}
                                alt={altText}
                                // You must set explicit width and height for CSS layout
                                width={300} 
                                height={200}
                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-sm font-semibold truncate">{altText}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GalleryPage;