import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Textarea, Spinner, Card } from 'flowbite-react';
import { HiCamera, HiVideoCamera, HiOutlineEmojiHappy, HiOutlineLocationMarker, HiOutlineTag } from 'react-icons/hi';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';
import imageCompression from 'browser-image-compression';

export default function CreateStoryPage() {
    const [file, setFile] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const [caption, setCaption] = useState('');
    const [duration, setDuration] = useState(5);
    const [location, setLocation] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef();
    const navigate = useNavigate();

    // Handle file selection
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        try {
            const isImage = selectedFile.type.startsWith('image/');
            const isVideo = selectedFile.type.startsWith('video/');
            
            if (!isImage && !isVideo) {
                setError('Please select an image or video');
                return;
            }

            setMediaType(isImage ? 'image' : 'video');
            
            // Compress images only
            let processedFile = selectedFile;
            if (isImage) {
                const options = {
                    maxSizeMB: 2,
                    maxWidthOrHeight: 1080,
                    useWebWorker: true,
                };
                processedFile = await imageCompression(selectedFile, options);
                setDuration(5); // Default for images
            } else {
                // For videos, set default duration
                setDuration(15);
            }

            setFile(processedFile);
            setError('');
        } catch (err) {
            console.error('Error processing file:', err);
            setError('Failed to process file');
        }
    };

    // Upload to Firebase and create story
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            // Upload to Firebase
            const storage = getStorage(app);
            const fileName = `stories/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, fileName);
            
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Track upload progress
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error) => {
                    console.error('Upload error:', error);
                    setError('Upload failed');
                    setUploading(false);
                },
                async () => {
                    try {
                        // Get download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        // Prepare story data for MongoDB
                        const storyData = {
                            mediaType,
                            mediaUrl: downloadURL,
                            caption: caption.trim(),
                            duration: parseInt(duration),
                            location: location.trim(),
                            hashtags: hashtags.split('#').filter(tag => tag.trim()).map(tag => tag.trim())
                        };

                        // Save to MongoDB using createStory API
                        const token = localStorage.getItem('token');
                        const response = await fetch('/api/stories/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(storyData)
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.message || 'Failed to create story');
                        }

                        setSuccess('Story created successfully!');
                        setUploading(false);
                        
                        // Reset form after 2 seconds
                        setTimeout(() => {
                            resetForm();
                            navigate('/stories');
                        }, 2000);

                    } catch (error) {
                        console.error('Save story error:', error);
                        setError(error.message);
                        setUploading(false);
                    }
                }
            );
        } catch (error) {
            console.error('Submit error:', error);
            setError('An error occurred');
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setCaption('');
        setDuration(5);
        setLocation('');
        setHashtags('');
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto">
                <Card>
                    <h1 className="text-2xl font-bold text-center mb-6">Create New Story</h1>
                    
                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Media
                        </label>
                        <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {file ? (
                                <div className="space-y-2">
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {mediaType === 'image' ? 'Image' : 'Video'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <HiCamera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-gray-600">Click to upload photo or video</p>
                                    <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, GIF, MP4</p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Caption */}
                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            <HiOutlineEmojiHappy className="w-4 h-4 mr-1" />
                            Caption
                        </label>
                        <Textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="What's happening?"
                            rows={3}
                            disabled={uploading}
                        />
                    </div>

                    {/* Duration (for videos) */}
                    {mediaType === 'video' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (seconds)
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full"
                                disabled={uploading}
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>1s</span>
                                <span>{duration}s</span>
                                <span>30s</span>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            <HiOutlineLocationMarker className="w-4 h-4 mr-1" />
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Add location"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            disabled={uploading}
                        />
                    </div>

                    {/* Hashtags */}
                    <div className="mb-6">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            <HiOutlineTag className="w-4 h-4 mr-1" />
                            Hashtags
                        </label>
                        <input
                            type="text"
                            value={hashtags}
                            onChange={(e) => setHashtags(e.target.value)}
                            placeholder="#fun #memories #daily"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            disabled={uploading}
                        />
                        <p className="text-xs text-gray-500 mt-1">Separate with spaces</p>
                    </div>

                    {/* Error & Success Messages */}
                    {error && (
                        <Alert color="failure" className="mb-4">
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert color="success" className="mb-4">
                            {success}
                        </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                        gradientDuoTone="purpleToPink"
                        onClick={handleSubmit}
                        disabled={uploading || !file}
                        className="w-full"
                    >
                        {uploading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Uploading...
                            </>
                        ) : (
                            'Share Story'
                        )}
                    </Button>
                </Card>
            </div>
        </div>
    );
}