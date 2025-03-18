import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { app } from '../firebase';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

export default function CreatePost() {
    const [file, setFile] = useState(null);
    const [imageUploadProgress, setImageFileUploadProgress] = useState(null);
    const [imageUploadError, setImageFileUploadError] = useState(null);
    const [formData, setFormData] = useState({});
    const [publishError, setPublishError] = useState(null);
    const navigate = useNavigate();

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(selectedFile, options);
                setFile(compressedFile);
            } catch (error) {
                console.error('Image compression error:', error);
                setImageFileUploadError('Failed to compress the image');
            }
        }
    };

    const handleUploadImage = async () => {
        try {
            if (!file) {
                setImageFileUploadError('Please select an image');
                return;
            }
            setImageFileUploadError(null);
            const storage = getStorage(app);
            const fileName = new Date().getTime() + '-' + file.name;
            const storageRef = ref(storage, fileName);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setImageFileUploadProgress(progress.toFixed(0));
                },
                (error) => {
                    console.error('Upload error:', error);
                    setImageFileUploadError('Image upload failed');
                    setImageFileUploadProgress(null);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setImageFileUploadProgress(null);
                    setImageFileUploadError(null);
                    setFormData({ ...formData, image: downloadURL });
                }
            );
        } catch (error) {
            console.error('Upload failed:', error);
            setImageFileUploadError('Image upload failed');
            setImageFileUploadProgress(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/post/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setPublishError(data.message);
                return;
            }
            setPublishError(null);
            navigate(`/post/${data.slug}`);
        } catch (error) {
            console.error('Publish failed:', error);
            setPublishError('Something went wrong');
        }
    };

    return (
        <div className='p-3 max-w-3xl mx-auto min-h-screen'>
            <h1 className='text-center text-3xl my-7 font-semibold'>
                Create a post
            </h1>
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <div className='flex flex-col gap-4 sm:flex-row justify-between'>
                    <TextInput
                        type='text'
                        placeholder='Title'
                        required
                        id='title'
                        className='flex-1'
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Select
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option value="uncategorized">Select a category</option>
                        <option value="Thak gaya hoon, lekin ruk nahi sakta">Thak gaya hoon, lekin ruk nahi sakta</option>
                        <option value="badmoshi">बदमोशी</option>
                        <option value="Lmao ded">Lmao ded</option>
                        <option value="kabhi lafda kerna hai toh batana">kabhi lafda kerna hai toh batana</option>
                        <option value="Kyun We Met">Kyun We Met</option>
                        <option value="Padhai Chalu">Padhai Chalu</option>
                        <option value="Tunak Tunak Music Stops">Tunak Tunak Music Stops</option>
                        <option value="GirlBoss hu Raja">GirlBoss hu Raja</option>
                        <option value="Babumoshai Zindagi honi hi nahi chahiye">Babumoshai Zindagi honi hi nahi chahiye</option>
                    </Select>
                </div>  <h7 className='text-gray-800'>*img should be less than 2MB</h7> 
                <div className='flex gap-4 items-center justify-center border-4 border-teal-500 border-dotted p-3'>
                 
                   <FileInput type='file' accept='image/*' onChange={handleFileChange} />
                    
                    <button
                        type="button"
                        className="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-gradient-to-br from-purple-600 to-cyan-500 enabled:hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800 border-0 rounded-lg focus:ring-2"
                        size='sm'
                        outline="true"
                        onClick={handleUploadImage}
                        disabled={imageUploadProgress !== null}
                    >
                        <span className="items-center flex justify-center bg-white text-gray-900 transition-all duration-75 ease-in group-enabled:group-hover:bg-opacity-0 group-enabled:group-hover:text-inherit dark:bg-gray-900 dark:text-white w-full rounded-md text-sm px-4 py-2 border border-transparent">
                            {imageUploadProgress !== null ? (
                                <div className='w-16 h-16'>
                                    <CircularProgressbar value={imageUploadProgress} text={`${imageUploadProgress}%`} />
                                </div>
                            ) : (
                                'Upload Image'
                            )}
                        </span>
                    </button>
                </div>
                {imageUploadError && 
                    <Alert color="failure">{imageUploadError}</Alert>
                }
                {formData.image && (
                    <img
                        src={formData.image}
                        alt='upload'
                        className='w-full h-72 object-cover'
                    />
                )}
                <div className='dark:text-white'><ReactQuill
                    theme='snow'
                    placeholder='Write Something..'
                    className='h-72 mb-12 dark:placeholder:text-white'
                    required
                    onChange={(value) => setFormData({ ...formData, content: value })}
                /></div>
                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-1 px-2 rounded-lg text-sm md:text-base hover:bg-gradient-to-r hover:from-purple-700 hover:to-pink-700"
                >
                    Publish
                </Button>
                {publishError && <Alert className='mt-5' color="failure">{publishError}</Alert>}
            </form>
        </div>
    );
}
