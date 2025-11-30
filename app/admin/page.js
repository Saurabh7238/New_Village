"use client";

import Image from 'next/image';
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const INFRA_TYPES = ['Street Light', 'Water Pump', 'Road', 'Solar Panel', 'Primary School', 'Primary Health Center', 'Other'];
const INFRA_STATUSES = ['Operational', 'Under Maintenance', 'Broken', 'Planned'];
const FALLBACK_IMAGE_URL = '/images/placeholder.svg';

export default function AdminPanel() {
    const { data: session, status } = useSession();

    // --- NOTIFICATION STATE ---
    const [notifications, setNotifications] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [editingNotification, setEditingNotification] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // --- GALLERY STATE ---
    const [images, setImages] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageTitle, setImageTitle] = useState("");
    const [imageTags, setImageTags] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState("No file chosen");
    const [showVoterImagePicker, setShowVoterImagePicker] = useState(false);
    const [editingImage, setEditingImage] = useState(null);

    // --- VOTER STATE / IMAGE PICKER STATE ---
    const [voterList, setVoterList] = useState([]);
    const [voterType, setVoterType] = useState("vidhan-sabha");
    const [voterName, setVoterName] = useState("");
    const [voterGuardianName, setVoterGuardianName] = useState("");
    const [voterGender, setVoterGender] = useState("");
    const [voterWardNo, setVoterWardNo] = useState("");
    const [voterConstituency, setVoterConstituency] = useState("");
    const [voterId, setVoterId] = useState("");
    const [voterImage, setVoterImage] = useState("");

    // --- INFRASTRUCTURE STATE ---
    const [infrastructureList, setInfrastructureList] = useState([]);
    const [infraForm, setInfraForm] = useState({
        title: '',
        description: '',
        type: INFRA_TYPES[0],
        status: INFRA_STATUSES[0],
        location: { latitude: '', longitude: '', address: '' },
        cost: '',
        installationDate: '',
        image: '',
        details: {},
        schoolStudents: '',
        schoolWashrooms: '',
        schoolHandpumps: '',
        healthCenterDoctors: '',
        healthCenterBeds: '',
        healthCenterAmbulances: '',
    });
    const [editingInfraId, setEditingInfraId] = useState(null);
    const [infraSubmitText, setInfraSubmitText] = useState("Add Infrastructure Item");

    // --- DATA FETCHING HOOKS ---
    useEffect(() => {
        fetch("/api/notifications").then((res) => res.json()).then((data) => setNotifications(data));
        fetch("/api/images").then((res) => res.json()).then((data) => setImages(Array.isArray(data) ? data : data.images || []));
        fetch("/api/infrastructure").then((res) => res.json()).then((data) => setInfrastructureList(data)).catch((err) => console.error("Failed to fetch infra:", err));
    }, []);

    useEffect(() => {
        let apiRoute = `/api/voter-data?type=${voterType}`;
        fetch(apiRoute).then((res) => res.json()).then((data) => setVoterList(Array.isArray(data) ? data : data.voters || []))
            .catch((err) => { console.error("Failed to fetch voter list:", err); setVoterList([]); });
    }, [voterType]);

    // --- INFRASTRUCTURE CRUD HANDLERS ---
    const resetInfraForm = () => {
        setEditingInfraId(null);
        setInfraForm({
            title: '', description: '', type: INFRA_TYPES[0], status: INFRA_STATUSES[0],
            location: { latitude: '', longitude: '', address: '' }, cost: '', installationDate: '', image: '',
            details: {},
            schoolStudents: '', schoolWashrooms: '', schoolHandpumps: '',
            healthCenterDoctors: '', healthCenterBeds: '', healthCenterAmbulances: '',
        });
        setInfraSubmitText("Add Infrastructure Item");
    };

    const handleInfraInputChange = (e) => {
        const { name, value } = e.target;
        setInfraForm(prev => ({ ...prev, [name]: value }));

        if (name === 'type') {
            setInfraForm(prev => ({
                ...prev,
                details: {},
                schoolStudents: '', schoolWashrooms: '', schoolHandpumps: '',
                healthCenterDoctors: '', healthCenterBeds: '', healthCenterAmbulances: '',
            }));
        }
    };

    const handleSpecificDetailChange = (e) => {
        const { name, value } = e.target;
        setInfraForm(prev => ({ ...prev, [name]: value }));
    };

    const handleInfraLocationChange = (e) => {
        const { name, value } = e.target;
        setInfraForm(prev => ({
            ...prev,
            location: { ...prev.location, [name]: value }
        }));
    };

    const handleInfraImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit. Please choose a smaller image.");
                e.target.value = null;
                setInfraForm(prev => ({ ...prev, image: '' }));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setInfraForm(prev => ({ ...prev, image: reader.result }));
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Could not read the file.");
            };
            reader.readAsDataURL(file);
        }
    };

    const editInfrastructure = (item) => {
        const details = item.details || {};

        setEditingInfraId(item._id);
        setInfraForm({
            title: item.title,
            description: item.description || '',
            type: item.type,
            status: item.status,
            location: {
                latitude: item.location?.latitude || '', longitude: item.location?.longitude || '', address: item.location?.address || ''
            },
            cost: item.cost || '',
            installationDate: item.installationDate ? new Date(item.installationDate).toISOString().split('T')[0] : '',
            image: item.image || '',
            details: details,
            schoolStudents: details.students || '',
            schoolWashrooms: details.washrooms || '',
            schoolHandpumps: details.handpumps || '',
            healthCenterDoctors: details.doctors || '',
            healthCenterBeds: details.beds || '',
            healthCenterAmbulances: details.ambulances || '',
        });
        setInfraSubmitText("Update Infrastructure Item");
    };

    const submitInfrastructure = async (e) => {
        e.preventDefault();

        const isUpdating = editingInfraId !== null;
        const method = isUpdating ? "PUT" : "POST";

        if (!infraForm.title.trim() || !infraForm.type || !infraForm.status) {
            alert("Title, Type, and Status are required fields.");
            return;
        }

        const payload = {
            title: infraForm.title.trim(),
            description: infraForm.description.trim(),
            type: infraForm.type,
            status: infraForm.status,
            location: {
                ...(infraForm.location.latitude && { latitude: parseFloat(infraForm.location.latitude) }),
                ...(infraForm.location.longitude && { longitude: parseFloat(infraForm.location.longitude) }),
                ...(infraForm.location.address && { address: infraForm.location.address.trim() }),
            },
            ...(infraForm.image && { image: infraForm.image }),
            ...(infraForm.cost && { cost: parseFloat(infraForm.cost) }),
            ...(infraForm.installationDate && { installationDate: new Date(infraForm.installationDate) }),
        };

        let details = {};
        if (infraForm.type === 'Primary School') {
            details = {
                students: infraForm.schoolStudents ? parseInt(infraForm.schoolStudents) : undefined,
                washrooms: infraForm.schoolWashrooms ? parseInt(infraForm.schoolWashrooms) : undefined,
                handpumps: infraForm.schoolHandpumps ? parseInt(infraForm.schoolHandpumps) : undefined,
            };
        } else if (infraForm.type === 'Primary Health Center') {
            details = {
                doctors: infraForm.healthCenterDoctors ? parseInt(infraForm.healthCenterDoctors) : undefined,
                beds: infraForm.healthCenterBeds ? parseInt(infraForm.healthCenterBeds) : undefined,
                ambulances: infraForm.healthCenterAmbulances ? parseInt(infraForm.healthCenterAmbulances) : undefined,
            };
        }

        const filteredDetails = Object.fromEntries(
            Object.entries(details).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );

        if (Object.keys(filteredDetails).length > 0) {
            payload.details = filteredDetails;
        }
        
        let url = "/api/infrastructure";
        if (isUpdating) {
            url = `/api/infrastructure?id=${editingInfraId}`;
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.ok) {
                setInfrastructureList((prev) =>
                    isUpdating
                        ? prev.map(item => (item._id === result.infrastructure._id ? result.infrastructure : item))
                        : [result.infrastructure, ...prev]
                );
                resetInfraForm();
            } else {
                console.error("Infrastructure operation failed:", result.message || result.details);
                alert(`Operation Failed: ${result.message || result.details || 'Server Error'}`);
            }
        } catch (error) {
            console.error("Infrastructure Network or Fetch Error:", error);
            alert("A network error occurred.");
        }
    };

    const deleteInfrastructure = async (id) => {
        const confirmed = confirm("Are you sure you want to delete this infrastructure item?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/infrastructure?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setInfrastructureList((prev) => prev.filter((item) => item._id !== id));
                if (editingInfraId === id) {
                    resetInfraForm();
                }
            } else {
                const error = await res.json();
                alert(`Failed to delete item: ${error.message || 'Server Error'}`);
            }
        } catch (error) {
            console.error("Delete Network Error:", error);
        }
    };

    // --- Utility Component for Primary School Specific Fields ---
    const PrimarySchoolFields = () => (
        <fieldset className="border p-4 rounded-lg mt-4 bg-yellow-50 dark:bg-gray-700 dark:border-gray-600">
            <legend className="text-base font-medium text-yellow-700 dark:text-yellow-400 px-2">Primary School Specific Details</legend>
            <div className="grid md:grid-cols-3 gap-4 mt-2">
                <input
                    name="schoolStudents"
                    type="number"
                    placeholder="No. of Students"
                    value={infraForm.schoolStudents}
                    onChange={handleSpecificDetailChange}
                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                    name="schoolWashrooms"
                    type="number"
                    placeholder="No. of Washrooms"
                    value={infraForm.schoolWashrooms}
                    onChange={handleSpecificDetailChange}
                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                    name="schoolHandpumps"
                    type="number"
                    placeholder="No. of Handpumps"
                    value={infraForm.schoolHandpumps}
                    onChange={handleSpecificDetailChange}
                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
            </div>
        </fieldset>
    );

    // --- Utility Component for Primary Health Center Specific Fields ---
    const PrimaryHealthCenterFields = () => (
        <fieldset className="border p-4 rounded-lg mt-4 bg-red-50 dark:bg-gray-700 dark:border-gray-600">
            <legend className="text-base font-medium text-red-700 dark:text-red-400 px-2">Primary Health Center Specific Details</legend>
            <div className="grid md:grid-cols-3 gap-4 mt-2">
                <input
                    name="healthCenterDoctors"
                    type="number"
                    placeholder="No. of Doctors"
                    value={infraForm.healthCenterDoctors}
                    onChange={handleSpecificDetailChange}
                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                    name="healthCenterBeds"
                    type="number"
                    placeholder="No. of Beds"
                    value={infraForm.healthCenterBeds}
                    onChange={handleSpecificDetailChange}
                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                    name="healthCenterAmbulances"
                    type="number"
                    placeholder="No. of Ambulances"
                    value={infraForm.healthCenterAmbulances}
                    onChange={handleSpecificDetailChange}
                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
            </div>
        </fieldset>
    );

    // --- NOTIFICATION CRUD HANDLERS ---
    const editNotification = (notification) => {
        setEditingNotification(notification);
        setEditTitle(notification.title);
        setEditDescription(notification.description);
        setTitle("");
        setDescription("");
    };

    const updateNotification = async (e) => {
        e.preventDefault();

        if (!editingNotification || !editTitle.trim() || !editDescription.trim()) {
            alert("Title and description are required for update.");
            return;
        }

        const payload = {
            title: editTitle.trim(),
            description: editDescription.trim(),
        };

        try {
            const res = await fetch(`/api/notifications?id=${editingNotification.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map(n => (n.id === editingNotification.id ? result.notification : n))
                );
                setEditingNotification(null);
                setEditTitle("");
                setEditDescription("");
            } else {
                alert(`Update Failed: ${result.message || 'Server Error'}`);
            }
        } catch (error) {
            console.error("Update Network or Fetch Error:", error);
            alert("A network error occurred during update.");
        }
    };

    const deleteNotification = async (id) => {
        const confirmed = confirm("Are you sure you want to delete this notification permanently?");
        if (!confirmed) return;

        try {
            const res = await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                if (editingNotification?.id === id) {
                    setEditingNotification(null);
                }
            } else {
                const error = await res.json();
                alert(`Failed to delete item: ${error.message || 'Server Error'}`);
            }
        } catch (error) {
            console.error("Delete Network Error:", error);
        }
    };

    const addNotification = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            alert("Title and description cannot be empty.");
            return;
        }
        const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description }),
        });
        const newItem = await res.json();
        setNotifications((prev) => [newItem, ...prev]);
        setTitle("");
        setDescription("");
    };

    // --- GALLERY CRUD HANDLERS ---
    const resetImageForm = () => {
        setSelectedFile(null);
        setFileName("No file chosen");
        setImageTitle("");
        setImageTags("");
        setEditingImage(null);
        setUploadError("");
    };

    const editImage = (image) => {
        setEditingImage(image);
        setImageTitle(image.title || "");
        setImageTags(image.tags?.join(', ') || "");
        setSelectedFile(null);
        setFileName("Existing file will be kept unless new one is chosen");
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploadError("");
        setUploadProgress(0);

        const isUpdating = editingImage !== null;

        if (!imageTitle) {
            setUploadError("Title is required.");
            return;
        }

        if (!isUpdating && !selectedFile) {
            setUploadError("File is required for new uploads.");
            return;
        }

        if (isUpdating && !selectedFile && imageTitle === editingImage.title && imageTags === (editingImage.tags?.join(', ') || '')) {
            setUploadError("No changes detected.");
            return;
        }

        setUploading(true);
        const formData = new FormData();

        formData.append("title", imageTitle);
        formData.append("tags", imageTags);

        if (selectedFile) {
            formData.append("image", selectedFile);
        }

        const method = isUpdating ? "PUT" : "POST";
        const url = isUpdating ? `/api/upload?id=${editingImage._id}` : "/api/upload";

        try {
            const res = await fetch(url, {
                method: method,
                body: formData
            });

            setUploadProgress(100);
            if (!res.ok) {
                throw new Error((await res.json()).message || 'Operation failed');
            }

            const result = await res.json();

            if (isUpdating) {
                setImages((prev) => prev.map(img => (img._id === result.image._id ? result.image : img)));
            } else {
                setImages((prev) => [...prev, result.image]);
            }

            resetImageForm();
            setUploadProgress(0);
        } catch (error) {
            console.error('Gallery operation failed:', error);
            setUploadError(error.message || (isUpdating ? "Failed to update image." : "Failed to upload image."));
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (imageId) => {
        const confirmed = confirm("Are you sure you want to delete this gallery image?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/images`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageId })
            });

            if (res.ok) {
                setImages((prev) => prev.filter((img) => img._id !== imageId));
                if (editingImage?._id === imageId) {
                    resetImageForm();
                }
            } else {
                const error = await res.json();
                alert(`Failed to delete item: ${error.message || 'Server Error'}`);
            }
        } catch (error) {
            console.error("Delete Network Error:", error);
            alert("A network error occurred during delete.");
        }
    };

    // --- Other Utility Components (Voter Handlers - MINIMIZED) ---
    const handleVoterImageSelect = (imageData) => { setVoterImage(imageData); setShowVoterImagePicker(false); };
    const addVoter = async (e) => { e.preventDefault(); let voterData = { type: voterType, voterId, voterName, voterGuardianName, voterGender, image: voterImage, }; if (voterType === "gram-panchayat") { voterData = { ...voterData, voterWardNo }; } else { voterData = { ...voterData, voterConstituency }; } await fetch("/api/voter-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(voterData), }); setVoterName(""); setVoterGuardianName(""); setVoterGender(""); setVoterWardNo(""); setVoterConstituency(""); setVoterId(""); setVoterImage(""); };
    const deleteVoter = async (id) => {
        const confirmed = confirm("Are you sure you want to delete this voter record?");
        if (!confirmed) return;
        await fetch("/api/voter-data", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, type: voterType }), });
        setVoterList((prev) => prev.filter((v) => v.id !== id));
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
                    <button onClick={() => signOut()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sign Out</button>
                </div>

                {/* --- Notifications Section --- */}
                <section>
                    <h1 className="text-3xl font-bold mb-6 text-green-700 dark:text-yellow-400">Admin Notifications</h1>

                    {/* Conditional Form: Edit or Add */}
                    {editingNotification ? (
                        <form onSubmit={updateNotification} className="mb-8 space-y-4 p-4 border rounded-lg bg-yellow-50 dark:bg-gray-700 dark:border-yellow-600">
                            <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400">Editing Notification: {editingNotification.title}</h3>
                            <input
                                className="border p-2 w-full rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                placeholder="Title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                required
                            />
                            <textarea
                                className="border p-2 w-full rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                placeholder="Description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                required
                            />
                            <div className="flex gap-4">
                                <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Save Changes</button>
                                <button type="button" onClick={() => setEditingNotification(null)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={addNotification} className="mb-8 space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-green-700 dark:text-yellow-400">Add New Notification</h3>
                            <input
                                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <textarea
                                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Notification</button>
                        </form>
                    )}

                    {/* Notification List */}
                    <ul className="space-y-4">
                        {notifications.map((n) => (
                            <li
                                key={n.id}
                                className={`border rounded p-4 flex justify-between items-center dark:border-gray-700 ${editingNotification?.id === n.id ? 'bg-yellow-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800'}`}
                            >
                                <div>
                                    <h2 className="font-semibold">{n.title}</h2>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">{n.description}</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => editNotification(n)}
                                        className="text-indigo-500 hover:text-indigo-700 text-sm disabled:opacity-50"
                                        disabled={editingNotification !== null && editingNotification.id !== n.id}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteNotification(n.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <hr className="my-12 border-gray-300 dark:border-gray-700" />

                {/* --- GALLERY MANAGEMENT SECTION --- */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 text-indigo-700 dark:text-fuchsia-400">Manage Image Gallery</h2>
                    {/* Image Upload/Edit Form */}
                    <form onSubmit={handleUpload} className={`mb-8 space-y-4 p-4 border rounded-lg ${editingImage ? 'bg-indigo-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:border-gray-700`}>
                        <h3 className="text-xl font-semibold text-indigo-700 dark:text-fuchsia-400">
                            {editingImage ? `Editing Image: ${editingImage.title}` : "Upload New Image"}
                        </h3>

                        <input
                            className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Title (e.g., Ward 5 Road Construction)"
                            value={imageTitle}
                            onChange={(e) => setImageTitle(e.target.value)}
                            required
                        />

                        <input
                            className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Tags (comma separated, e.g., road, construction, ward5)"
                            value={imageTags}
                            onChange={(e) => setImageTags(e.target.value)}
                        />

                        <div className="flex items-center space-x-4">
                            <label className="block w-full">
                                <span className="sr-only">Choose profile photo</span>
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        setSelectedFile(file);
                                        setFileName(file ? file.name : "No file chosen");
                                    }}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100"
                                    accept="image/*"
                                />
                            </label>
                            <span className="text-sm text-gray-500 dark:text-gray-400 min-w-0 truncate">{fileName}</span>
                        </div>


                        {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                        {uploadProgress > 0 && uploading && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                                <div
                                    className="bg-indigo-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                >
                                    {uploadProgress}%
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                                disabled={uploading}
                            >
                                {uploading ? 'Processing...' : (editingImage ? 'Update Image' : 'Upload Image')}
                            </button>
                            {editingImage && (
                                <button
                                    type="button"
                                    onClick={resetImageForm}
                                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 disabled:opacity-50"
                                    disabled={uploading}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Image Gallery List */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((img) => (
                            <div key={img._id} className={`border rounded-lg overflow-hidden shadow-lg p-2 ${editingImage?._id === img._id ? 'border-4 border-indigo-500' : 'dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <div className="relative w-full h-32">
                                    <Image
                                        src={img.url || FALLBACK_IMAGE_URL}
                                        alt={img.title}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className="rounded"
                                        onError={(e) => { e.target.src = FALLBACK_IMAGE_URL; }}
                                    />
                                </div>
                                <div className="pt-2">
                                    <p className="text-sm font-semibold truncate dark:text-white" title={img.title}>{img.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{img.tags?.join(', ') || 'No Tags'}</p>
                                    <div className="flex justify-between mt-2">
                                        <button
                                            onClick={() => editImage(img)}
                                            className="text-indigo-500 hover:text-indigo-700 text-xs disabled:opacity-50"
                                            disabled={editingImage !== null && editingImage._id !== img._id}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteImage(img._id)}
                                            className="text-red-500 hover:text-red-700 text-xs"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="my-12 border-gray-300 dark:border-gray-700" />

                {/* --- INFRASTRUCTURE MANAGEMENT SECTION (FIXED) --- */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 text-orange-700 dark:text-teal-400">Manage Infrastructure</h2>
                    {/* Add/Edit Infrastructure Form */}
                    <form onSubmit={submitInfrastructure} className="mb-8 space-y-4 p-6 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-orange-700 dark:text-teal-400">{infraSubmitText}</h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                name="title"
                                type="text"
                                placeholder="Title (e.g., Ward 1 Street Light Project)"
                                value={infraForm.title}
                                onChange={handleInfraInputChange}
                                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            <select
                                name="type"
                                value={infraForm.type}
                                onChange={handleInfraInputChange}
                                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            >
                                {/* FIX: Added key prop */}
                                {INFRA_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>

                        <textarea
                            name="description"
                            placeholder="Description"
                            value={infraForm.description}
                            onChange={handleInfraInputChange}
                            className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />

                        {/* Location Details */}
                        <fieldset className="border p-4 rounded-lg bg-blue-50 dark:bg-gray-700 dark:border-gray-600">
                            <legend className="text-base font-medium text-blue-700 dark:text-blue-400 px-2">Location & Status</legend>
                            <div className="grid md:grid-cols-3 gap-4 mt-2">
                                <input
                                    name="latitude"
                                    type="text"
                                    placeholder="Latitude"
                                    value={infraForm.location.latitude}
                                    onChange={handleInfraLocationChange}
                                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <input
                                    name="longitude"
                                    type="text"
                                    placeholder="Longitude"
                                    value={infraForm.location.longitude}
                                    onChange={handleInfraLocationChange}
                                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <select
                                    name="status"
                                    value={infraForm.status}
                                    onChange={handleInfraInputChange}
                                    className="border p-2 w-full rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    required
                                >
                                    {/* FIX: Added key prop */}
                                    {INFRA_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <input
                                name="address"
                                type="text"
                                placeholder="Address / Landmark"
                                value={infraForm.location.address}
                                onChange={handleInfraLocationChange}
                                className="border p-2 w-full rounded mt-4 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                        </fieldset>

                        {/* Cost, Date, and Image */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <input
                                name="cost"
                                type="number"
                                placeholder="Cost (₹)"
                                value={infraForm.cost}
                                onChange={handleInfraInputChange}
                                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <input
                                name="installationDate"
                                type="date"
                                placeholder="Installation Date"
                                value={infraForm.installationDate}
                                onChange={handleInfraInputChange}
                                className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <label className="block">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Image (Max 5MB)</span>
                                <input
                                    type="file"
                                    onChange={handleInfraImageUpload}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                    accept="image/*"
                                />
                            </label>
                        </div>

                        {/* Display Infra Image Preview */}
                        {infraForm.image && (
                            <div className="mt-4 flex items-center space-x-4">
                                <Image
                                    src={infraForm.image}
                                    alt="Infrastructure Preview"
                                    width={100}
                                    height={100}
                                    className="rounded object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setInfraForm(prev => ({ ...prev, image: '' }))}
                                    className="text-red-500 text-sm hover:text-red-700"
                                >
                                    Remove Image
                                </button>
                            </div>
                        )}

                        {/* Conditional Specific Fields */}
                        {infraForm.type === 'Primary School' && <PrimarySchoolFields />}
                        {infraForm.type === 'Primary Health Center' && <PrimaryHealthCenterFields />}

                        <div className="flex gap-4">
                            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">{infraSubmitText}</button>
                            {editingInfraId && (
                                <button type="button" onClick={resetInfraForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel Edit</button>
                            )}
                        </div>
                    </form>

                    {/* Infrastructure List */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-orange-700 dark:text-teal-400">Existing Infrastructure ({infrastructureList.length})</h3>
                        {infrastructureList.map((item) => (
                            <div key={item._id} className={`border rounded-lg p-4 flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700 ${editingInfraId === item._id ? 'border-2 border-orange-500' : ''}`}>
                                <div>
                                    <h4 className="font-bold">{item.title} ({item.type})</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">Status: <span className={`font-semibold ${item.status === 'Operational' ? 'text-green-500' : item.status === 'Broken' ? 'text-red-500' : 'text-yellow-500'}`}>{item.status}</span></p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.location?.address || 'Location N/A'}</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => editInfrastructure(item)}
                                        className="text-indigo-500 hover:text-indigo-700 text-sm disabled:opacity-50"
                                        disabled={editingInfraId !== null && editingInfraId !== item._id}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteInfrastructure(item._id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="my-12 border-gray-300 dark:border-gray-700" />

                {/* --- VOTER MANAGEMENT SECTION (MINIMIZED) --- */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 text-pink-700 dark:text-cyan-400">Voter Data Management</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Voter Type</label>
                        <select
                            value={voterType}
                            onChange={(e) => setVoterType(e.target.value)}
                            className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="vidhan-sabha">Vidhan Sabha</option>
                            <option value="gram-panchayat">Gram Panchayat</option>
                        </select>
                    </div>

                    {/* Add Voter Form */}
                    <form onSubmit={addVoter} className="mb-8 space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-pink-700 dark:text-cyan-400">Add New Voter ({voterType === "vidhan-sabha" ? "Vidhan Sabha" : "Gram Panchayat"})</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Voter ID" value={voterId} onChange={(e) => setVoterId(e.target.value)} required />
                            <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} required />
                            <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Guardian's Name" value={voterGuardianName} onChange={(e) => setVoterGuardianName(e.target.value)} />
                            <select className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={voterGender} onChange={(e) => setVoterGender(e.target.value)} required>
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            {voterType === "gram-panchayat" ? (
                                <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ward No." value={voterWardNo} onChange={(e) => setVoterWardNo(e.target.value)} />
                            ) : (
                                <input className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Constituency" value={voterConstituency} onChange={(e) => setVoterConstituency(e.target.value)} />
                            )}
                            <div className="flex items-center space-x-2">
                                <button type="button" onClick={() => setShowVoterImagePicker(true)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm">Select Image</button>
                                {voterImage && <p className="text-sm text-green-600 dark:text-green-400">Image Selected</p>}
                            </div>
                        </div>
                        <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">Add Voter</button>
                    </form>

                    {/* Voter List (Minimal Display) */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-pink-700 dark:text-cyan-400">Voter List ({voterList.length})</h3>
                        {voterList.slice(0, 5).map((voter) => (
                            <div key={voter.id} className="border rounded p-3 flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700">
                                <div>
                                    <h4 className="font-bold">{voter.voterName} ({voter.voterId})</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">Guardian: {voter.voterGuardianName}</p>
                                </div>
                                <button onClick={() => deleteVoter(voter.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                            </div>
                        ))}
                        {voterList.length > 5 && <p className="text-center text-gray-500 dark:text-gray-400 text-sm">...and {voterList.length - 5} more records.</p>}
                    </div>
                </section>

                {/* --- Voter Image Picker Modal (MINIMIZED) --- */}
                {showVoterImagePicker && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-xl w-full">
                            <h3 className="text-xl font-bold mb-4">Select Voter Image from Gallery</h3>
                            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                {images.map((img) => (
                                    <div
                                        key={img._id}
                                        onClick={() => handleVoterImageSelect(img.url)}
                                        className="relative w-full h-24 cursor-pointer border-2 border-transparent hover:border-purple-500 rounded-lg overflow-hidden"
                                    >
                                        <Image
                                            src={img.url || FALLBACK_IMAGE_URL}
                                            alt={img.title}
                                            fill
                                            style={{ objectFit: "cover" }}
                                            sizes="33vw"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button onClick={() => setShowVoterImagePicker(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}