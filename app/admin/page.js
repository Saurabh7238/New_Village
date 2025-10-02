"use client";

import Image from 'next/image';
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function AdminPanel() {
  const { data: session, status } = useSession();

  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImageForUpload, setSelectedImageForUpload] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [imageTags, setImageTags] = useState(""); 
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [fileName, setFileName] = useState("No file chosen");

  const [voterList, setVoterList] = useState([]);
  const [voterType, setVoterType] = useState("vidhan-sabha");
  const [voterName, setVoterName] = useState("");
  const [voterGuardianName, setVoterGuardianName] = useState("");
  const [voterGender, setVoterGender] = useState("");
  const [voterWardNo, setVoterWardNo] = useState("");
  const [voterConstituency, setVoterConstituency] = useState("");
  const [voterId, setVoterId] = useState("");
  // voterImage now stores the Base64 data URI
  const [voterImage, setVoterImage] = useState(""); 
  const [showImagePicker, setShowImagePicker] = useState(false);

  // --- Data Fetching Hooks ---

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data));
  }, []);

  useEffect(() => {
    // Fetch images which now contain the Base64 data in 'image_data'
    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => {
        const imageArray = Array.isArray(data) ? data : data.images;
        setImages(imageArray || []);
      });
  }, []);

  useEffect(() => {
    let apiRoute = `/api/voter-data?type=${voterType}`;

    fetch(apiRoute)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch data for ${voterType}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        const voterData = Array.isArray(data) ? data : data.voters || [];
        setVoterList(voterData);
      })
      .catch((err) => {
        console.error("Failed to fetch voter list:", err);
        setVoterList([]);
      });
  }, [voterType]);

  // --- API Handlers ---

  const addNotification = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const newItem = await res.json();
    setNotifications((prev) => [...prev, newItem]);
    setTitle("");
    setDescription("");
  };

  const addVoter = async (e) => {
    e.preventDefault();
    let voterData = {
      type: voterType,
      voterId,
      voterName,
      voterGuardianName,
      voterGender,
      // voterImage now holds the Base64 string
      image: voterImage, 
    };

    if (voterType === "gram-panchayat") {
      voterData = { ...voterData, voterWardNo };
    } else {
      voterData = { ...voterData, voterConstituency };
    }

    const res = await fetch("/api/voter-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voterData),
    });
    const newVoter = await res.json();
    setVoterList((prev) => [...prev, newVoter]);
    setVoterName("");
    setVoterGuardianName("");
    setVoterGender("");
    setVoterWardNo("");
    setVoterConstituency("");
    setVoterId("");
    setVoterImage("");
  };

  const deleteNotification = async (id) => {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const deleteVoter = async (id) => {
    await fetch("/api/voter-data", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: voterType }),
    });
    setVoterList((prev) => prev.filter((v) => v.id !== id));
  };

  // Upload function for Base64 storage
  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError("");
    setUploadProgress(0);

    if (selectedImageForUpload) {
      setUploading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      setUploading(false);
      console.log(`Image from gallery selected: ${selectedImageForUpload.title}`);
      setSelectedImageForUpload(null);
      setImageTitle("");
      setImageTags("");
      return;
    }

    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    
    if (!imageTitle) {
        setUploadError("Please provide an image title.");
        return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("image", selectedFile); 
    formData.append("title", imageTitle); 

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(100); 

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed with status ' + res.status);
      }

      const result = await res.json();
      
      setImages((prev) => [
        ...prev,
        result.image, 
      ]);
      
      // Reset form states
      setSelectedFile(null);
      setFileName("No file chosen");
      setImageTitle("");
      setImageTags("");
      setUploadProgress(0);
      setUploadError(""); 

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Deletion using MongoDB document ID (_id)
  const handleDeleteImage = async (imageId) => {
    await fetch(`/api/images`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }), 
    });
    setImages((prev) => prev.filter((img) => img._id !== imageId));
  };

  const handleGallerySelect = (img) => {
    setSelectedImageForUpload(img);
    setSelectedFile(null);
    setFileName(`Gallery: ${img.title || img._id}`);
    setImageTitle(img.title || "");
    setTags(Array.isArray(img.tags) ? img.tags.join(", ") : img.tags || ""); 
    setShowGalleryPicker(false);
  };

  // Select now stores the Base64 data URI
  const handleImageSelect = (imageData) => {
    setVoterImage(imageData); 
    setShowImagePicker(false);
  };

  if (status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 text-red-500">
        Access Denied. You must be an admin to view this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 dark:text-yellow-400">Admin Panel</h1>
          <button
            onClick={() => signOut()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        {/* --- Notifications Section (unchanged) --- */}
        <section>
          <h1 className="text-3xl font-bold mb-6 text-green-700 dark:text-yellow-400">Admin Notifications</h1>
          <form onSubmit={addNotification} className="mb-8 space-y-4">
            <input
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Notification
            </button>
          </form>
          <ul className="space-y-4">
            {notifications.map((n) => (
              <li key={n.id} className="border rounded p-4 flex justify-between items-center dark:border-gray-700 bg-white dark:bg-gray-800">
                <div>
                  <h2 className="font-semibold">{n.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{n.description}</p>
                </div>
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        <hr className="my-12 border-gray-300 dark:border-gray-700" />

        {/* --- Voter List Section --- */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-orange-700 dark:text-orange-400">Manage Voter List</h2>
          <form onSubmit={addVoter} className="mb-8 space-y-4">
            <select
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={voterType}
              onChange={(e) => setVoterType(e.target.value)}
            >
              <option value="vidhan-sabha">Vidhan Sabha</option>
              <option value="lok-sabha">Lok Sabha</option>
              <option value="gram-panchayat">Gram Panchayat</option>
            </select>
            <input
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Voter Name"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              required
            />
            <input
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Guardian Name"
              value={voterGuardianName}
              onChange={(e) => setVoterGuardianName(e.target.value)}
              required
            />
            <input
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Gender"
              value={voterGender}
              onChange={(e) => setVoterGender(e.target.value)}
              required
            />
            {voterType === "gram-panchayat" ? (
              <input
                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ward Number"
                value={voterWardNo}
                onChange={(e) => setVoterWardNo(e.target.value)}
                required
              />
            ) : (
              <input
                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Constituency"
                value={voterConstituency}
                onChange={(e) => setVoterConstituency(e.target.value)}
                required
              />
            )}
            <input
              className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Voter ID"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              required
            />
            
            <div className="flex items-center gap-4">
              {/* RENDER USING Base64 (Using <img> tag for data URI compatibility) */}
              {voterImage && (
                <img
                  src={voterImage}
                  alt="Selected Voter"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {voterImage ? "Change Image" : "Select Image from Gallery"}
              </button>
            </div>
            
            <button
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Add Voter
            </button>
          </form>

          {/* Image Picker Modal for Voter */}
          {showImagePicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                <button
                  onClick={() => setShowImagePicker(false)}
                  className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-2xl"
                >
                  &times;
                </button>
                <h3 className="text-xl font-semibold mb-4">Select an Image</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.length > 0 ? (
                    images.map((img, idx) => (
                      <div
                        key={img._id || idx}
                        className="cursor-pointer border-2 border-transparent hover:border-blue-500 rounded p-1"
                        // Pass the image_data (Base64 URI)
                        onClick={() => handleImageSelect(img.image_data)}
                      >
                        {/* RENDER USING Base64 */}
                        <img
                          src={img.image_data}
                          alt={img.title}
                          width={150}
                          height={96}
                          className="w-full h-24 object-cover rounded"
                        />
                        <p className="text-xs text-center mt-1 truncate">{img.title || img._id}</p>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-4 text-center text-gray-500">No images in gallery. Please upload some first.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-4">
            {voterList.length > 0 ? (
              voterList.map((voter, index) => (
                <li key={`${voter.id || 'voter'}-${index}`} className="border rounded p-4 flex justify-between items-center dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-4">
                    {/* RENDER USING Base64 */}
                    {voter.image && (
                      <img
                        src={voter.image} // This field now holds the Base64 data from the voter record
                        alt={voter.name || voter.elector_name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{voter.name || voter.elector_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">ID: {voter.voter_id || voter.voterId}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {voter.constituency ? `Constituency: ${voter.constituency}` : `Ward: ${voter.house_number}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteVoter(voter.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No voters found.</p>
            )}
          </ul>
        </section>

        <hr className="my-12 border-gray-300 dark:border-gray-700" />

        {/* --- Gallery Management Section --- */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Manage Gallery Images (MongoDB Base64 Storage)</h2>
          
          <p className="text-sm text-red-500 mb-4 font-semibold">
            WARNING: Images are stored directly in MongoDB as Base64. **Files larger than 16MB will fail to upload.**
          </p>
          
          <button
            onClick={() => {
               // Just refetch the images
               fetch("/api/images")
                .then((res) => res.json())
                .then((data) => {
                  const imageArray = Array.isArray(data) ? data : data.images;
                  setImages(imageArray || []);
                });
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Refresh Gallery Index
          </button>
          
          <form onSubmit={handleUpload} className="mb-6 space-y-4 p-4 border rounded dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-2">Upload New Image</h3>
            <div className="flex items-center space-x-4">
              <label
                htmlFor="file-upload"
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 ease-in-out"
              >
                {fileName}
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setSelectedFile(file);
                  setSelectedImageForUpload(null);
                  setFileName(file ? file.name : "No file chosen");
                }}
              />
            </div>
            <input
              type="text"
              placeholder="Image title (Required by server)"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Tags (comma-separated, optional)"
              value={imageTags}
              onChange={(e) => setImageTags(e.target.value)}
              className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex gap-4 flex-wrap">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-opacity disabled:opacity-50"
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
            </div>
            {uploading && (
              <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          </form>

          {/* Image List */}
          {Array.isArray(images) && images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={img._id || idx} className="relative group">
                  {/* RENDER USING Base64 */}
                  <img
                    src={img.image_data}
                    alt={img.title || `Image ${idx}`}
                    width={250}
                    height={192}
                    className="w-full h-48 object-cover rounded shadow-md transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center truncate">
                    {img.title || "Untitled"}
                    {img.tags?.length > 0 && (
                      <div className="mt-1 text-[10px] text-gray-300">
                        {Array.isArray(img.tags) ? img.tags.join(", ") : img.tags}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteImage(img._id)}
                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleGallerySelect(img)}
                    className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No images found.</p>
          )}
        </section>
      </div>
    </div>
  );
}