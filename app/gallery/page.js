"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLanguage } from '@/app/language-provider';
import { TRANSLATIONS } from '@/app/translations';

const GalleryPage = () => {
    const { language } = useLanguage();
    const t = TRANSLATIONS.gallery[language];
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/images')
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('[Gallery] Error response body:', text);
                        try {
                            const data = JSON.parse(text);
                            throw new Error(data.error || `API error: ${res.status} ${res.statusText}`);
                        } catch (e) {
                            throw new Error(`API error: ${res.status} - ${text.substring(0, 200)}`);
                        }
                    });
                }
                return res.json();
            })
            .then(data => {
                const imageArray = Array.isArray(data) ? data : data.images || [];
                console.log(`[Gallery] Loaded ${imageArray.length} images from API`);
                setImages(imageArray);
            })
            .catch(error => {
                console.error("Failed to fetch gallery images:", error);
                setImages([]);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingSpinner message={t.loading} />;
    }

    if (images.length === 0) {
        return <div className="p-8 text-center">{t.noImages}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <h1 className="text-4xl font-bold text-center mb-10 text-blue-700 dark:text-blue-400">{t.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {images.map((img, index) => {
                    const altText = img.title || `Gallery ${index + 1}`;
                    return (
                        <LazyImageCard 
                            key={img._id || index} 
                            image={img}
                            altText={altText}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// Lazy load image data on demand
const LazyImageCard = ({ image, altText }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Fetch image data when component mounts
        fetch(`/api/images?id=${image._id}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load image ${image._id}`);
                return res.json();
            })
            .then(data => {
                if (data.image_data) {
                    setImageSrc(data.image_data);
                }
                setLoaded(true);
            })
            .catch(error => {
                console.error(`[LazyImageCard] Error loading image ${image._id}:`, error);
                setLoaded(true);
            });
    }, [image._id]);

    return (
        <div 
            className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg"
            onClick={() => imageSrc && window.open(imageSrc, "_blank")}
        >
            {!loaded ? (
                <div className="w-full h-48 bg-gray-300 animate-pulse" />
            ) : imageSrc ? (
                <>
                    <Image
                        src={imageSrc}
                        alt={altText}
                        width={300}
                        height={200}
                        unoptimized
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-semibold truncate">{altText}</p>
                    </div>
                </>
            ) : (
                <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">{t.failedLoad}</p>
                </div>
            )}
        </div>
    );
};

export default GalleryPage;