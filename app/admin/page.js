"use client";

import Image from 'next/image';
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

// Define constants based on the Mongoose model for clarity
const INFRA_TYPES = ['Street Light', 'Water Pump', 'Road', 'Solar Panel', 'Primary School', 'Primary Health Center', 'Other'];
const INFRA_STATUSES = ['Operational', 'Under Maintenance', 'Broken', 'Planned'];

export default function AdminPanel() {
    const { data: session, status } = useSession();

    // --- NOTIFICATION STATE ---
    const [notifications, setNotifications] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    
    // ⭐ NEW STATE for Editing Notifications ⭐
    const [editingNotification, setEditingNotification] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");


    // --- GALLERY STATE (Kept for voter image logic, but simplified) ---
    const [images, setImages] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageTitle, setImageTitle] = useState("");
    const [imageTags, setImageTags] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState("No file chosen");
    const [showVoterImagePicker, setShowVoterImagePicker] = useState(false); 


    // --- VOTER STATE / IMAGE PICKER STATE ---
    const [voterList, setVoterList] = useState([]);
    const [voterType, setVoterType] = useState("vidhan-sabha");
    const [voterName, setVoterName] = useState("");
    const [voterGuardianName, setVoterGuardianName] = useState("");
    const [voterGender, setVoterGender] = useState("");
    const [voterWardNo, setVoterWardNo] = useState("");
    const [voterConstituency, setVoterConstituency] = useState("");
    const [voterId, setVoterId] = useState("");
    const [voterImage, setVoterImage] = useState(""); // Base64 or gallery image URL

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
        image: '', // Holds Base64 data from system storage 
        details: {},
        // Primary School Specific Fields
        schoolStudents: '',
        schoolWashrooms: '',
        schoolHandpumps: '',
        // Primary Health Center Specific Fields
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
            .catch((err) => {console.error("Failed to fetch voter list:", err);setVoterList([]);});
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
            // Reset specific details when the type changes
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
    
    // Handles direct file selection and conversion to Base64 for infrastructure image
    const handleInfraImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // MongoDB document size limit is 16MB. We enforce a smaller limit (e.g., 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit. Please choose a smaller image.");
                e.target.value = null; // Clear the input
                setInfraForm(prev => ({ ...prev, image: '' }));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                // Save the Base64 Data URI string to the infraForm state
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
            image: item.image || '', // Load existing image (Base64)
            details: details,
            // Map specific details back to local state for easy editing
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
        const method = "POST"; // Use POST for both CREATE and UPDATE, passing ID for update

        if (!infraForm.title.trim() || !infraForm.type || !infraForm.status) {
            alert("Title, Type, and Status are required fields.");
            return;
        }

        // 1. Prepare generic fields
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
            // Include image, cost, and date
            ...(infraForm.image && { image: infraForm.image }), // School Image (Base64)
            ...(infraForm.cost && { cost: parseFloat(infraForm.cost) }),
            ...(infraForm.installationDate && { installationDate: new Date(infraForm.installationDate) }),
        };

        // 2. Prepare type-specific details object
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

        // 3. Attach details to payload
        const filteredDetails = Object.fromEntries(
            Object.entries(details).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );
        
        if (Object.keys(filteredDetails).length > 0) {
            payload.details = filteredDetails;
        }


        if (isUpdating) {
            payload.id = editingInfraId; 
        }

        try {
            const res = await fetch("/api/infrastructure", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.ok) {
                setInfrastructureList((prev) => 
                    isUpdating 
                    ? prev.map(item => (item._id === result._id ? result : item))
                    : [result, ...prev]
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
            const res = await fetch("/api/infrastructure", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
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

    // --- Utility Component for Primary Health Center Specific Fields (Kept for completeness) ---
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
    
    // --- NOTIFICATION CRUD HANDLERS (UPDATED) ---

    // ⭐ NEW: Sets the state for editing
    const editNotification = (notification) => {
        setEditingNotification(notification);
        setEditTitle(notification.title);
        setEditDescription(notification.description);
        // Clear the Add Form fields
        setTitle("");
        setDescription("");
    };

    // ⭐ NEW: Handles the update/PUT request
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
            // Send a PUT request with the ID in the URL query as configured in the API route
            const res = await fetch(`/api/notifications?id=${editingNotification.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.ok) {
                // Update the state with the new notification data
                setNotifications((prev) => 
                    prev.map(n => (n.id === editingNotification.id ? result.notification : n))
                );
                // Reset the Edit Form
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
    
    // ⭐ UPDATED: Original delete function with confirmation and edit reset
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
    
    // Original Add Notification (Kept)
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
        setNotifications((prev) => [newItem, ...prev]); // Add new item to the top
        setTitle(""); 
        setDescription(""); 
    };

    // --- Other Utility Components (Gallery/Voter Handlers - Kept) ---
    const handleDeleteImage = async (imageId) => {
        await fetch(`/api/images`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageId }) });
        setImages((prev) => prev.filter((img) => img._id !== imageId));
    };
    const handleVoterImageSelect = (imageData) => {setVoterImage(imageData);setShowVoterImagePicker(false);}; 
    
    const handleUpload = async (e) => {
        e.preventDefault();
        setUploadError("");
        setUploadProgress(0);
        if (!selectedFile || !imageTitle) {
            setUploadError("File and title required.");
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("title", imageTitle);
        formData.append("tags", imageTags);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            setUploadProgress(100);
            if (!res.ok) {
                throw new Error((await res.json()).message || 'Upload failed');
            }

            const result = await res.json();
            setImages((prev) => [...prev, result.image]);
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
    
    const addVoter = async (e) => { e.preventDefault(); let voterData = { type: voterType, voterId, voterName, voterGuardianName, voterGender, image: voterImage, }; if (voterType === "gram-panchayat") { voterData = { ...voterData, voterWardNo }; } else { voterData = { ...voterData, voterConstituency }; } const res = await fetch("/api/voter-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(voterData), }); const newVoter = await res.json(); setVoterList((prev) => [...prev, newVoter]); setVoterName(""); setVoterGuardianName(""); setVoterGender(""); setVoterWardNo(""); setVoterConstituency(""); setVoterId(""); setVoterImage(""); };
    const deleteVoter = async (id) => { await fetch("/api/voter-data", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, type: voterType }), }); setVoterList((prev) => prev.filter((v) => v.id !== id)); };


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

                {/* --- Notifications Section (UPDATED) --- */}
                <section>
                    <h1 className="text-3xl font-bold mb-6 text-green-700 dark:text-yellow-400">Admin Notifications</h1>
                    
                    {/* Conditional Form: Edit or Add */}
                    {editingNotification ? (
                        // ⭐ EDIT FORM ⭐
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
                        // ⭐ ADD FORM (Original) ⭐
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

                    {/* Notification List (UPDATED to include action buttons) */}
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
                                    {/* ⭐ EDIT BUTTON ⭐ */}
                                    <button 
                                        onClick={() => editNotification(n)} 
                                        className="text-indigo-500 hover:text-indigo-700 text-sm disabled:opacity-50"
                                        disabled={editingNotification !== null && editingNotification.id !== n.id}
                                    >
                                        Edit
                                    </button>
                                    {/* ⭐ DELETE BUTTON ⭐ */}
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

                {/* --- Voter List Section (Voter Management) --- */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-orange-700 dark:text-orange-400">Manage Voter List</h2>
                    <form onSubmit={addVoter} className="mb-8 space-y-4">
                        <select className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={voterType} onChange={(e) => setVoterType(e.target.value)}><option value="vidhan-sabha">Vidhan Sabha</option><option value="lok-sabha">Lok Sabha</option><option value="gram-panchayat">Gram Panchayat</option></select>
                        <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Voter Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} required/>
                        <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Guardian Name" value={voterGuardianName} onChange={(e) => setVoterGuardianName(e.target.value)} required/>
                        <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Gender" value={voterGender} onChange={(e) => setVoterGender(e.target.value)} required/>
                        {voterType === "gram-panchayat" ? (<input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ward Number" value={voterWardNo} onChange={(e) => setVoterWardNo(e.target.value)} required/>) : (<input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Constituency" value={voterConstituency} onChange={(e) => setVoterConstituency(e.target.value)} required/>)}
                        <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Voter ID" value={voterId} onChange={(e) => setVoterId(e.target.value)} required/>
                        <div className="flex items-center gap-4">
                            {voterImage && (<img src={voterImage} alt="Selected Voter" width={64} height={64} className="w-16 h-16 rounded-full object-cover"/>)}
                            {/* Voter image still uses gallery for selection */}
                            <button type="button" onClick={() => setShowVoterImagePicker(true)} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">{voterImage ? "Change Image" : "Select Image from Gallery"}</button>
                        </div>
                        <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">Add Voter</button>
                    </form>
                    <ul className="space-y-4">
                        {voterList.length > 0 ? (voterList.map((voter, index) => (<li key={`${voter.id || 'voter'}-${index}`} className="border rounded p-4 flex justify-between items-center dark:border-gray-700 bg-white dark:bg-gray-800"><div className="flex items-center gap-4">{voter.image && (<img src={voter.image} alt={voter.name || voter.elector_name} width={64} height={64} className="w-16 h-16 rounded-full object-cover"/>)}<div><h3 className="font-semibold">{voter.name || voter.elector_name}</h3><p className="text-sm text-gray-600 dark:text-gray-300">ID: {voter.voter_id || voter.voterId}</p><p className="text-sm text-gray-600 dark:text-gray-300">{voter.constituency ? `Constituency: ${voter.constituency}` : `Ward: ${voter.house_number}`}</p></div></div><button onClick={() => deleteVoter(voter.id)} className="text-red-500 hover:underline">Delete</button></li>))) : (<p className="text-sm text-gray-500 dark:text-gray-400">No voters found.</p>)}
                    </ul>
                </section>

                <hr className="my-12 border-gray-300 dark:border-gray-700" />

                {/* --- INFRASTRUCTURE MANAGEMENT SECTION --- */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 text-indigo-700 dark:text-teal-400">Infrastructure Management</h2>

                    {/* Infrastructure Form (Create/Update) */}
                    <form id="infrastructure-form" onSubmit={submitInfrastructure} className="mb-10 p-6 border-2 border-indigo-200 rounded-xl shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-2xl font-semibold mb-5 text-indigo-600 dark:text-teal-400">{infraSubmitText}</h3>

                        {/* Row 1: Title, Type, Status */}
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <input name="title" type="text" placeholder="Title / Identifier *" value={infraForm.title} onChange={handleInfraInputChange} required className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                            <select name="type" value={infraForm.type} onChange={handleInfraInputChange} required className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                {INFRA_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                            </select>
                            <select name="status" value={infraForm.status} onChange={handleInfraInputChange} required className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                {INFRA_STATUSES.map(status => (<option key={status} value={status}>{status}</option>))}
                            </select>
                        </div>

                        {/* Row 2: Description */}
                        <div className="mb-4">
                            <textarea name="description" placeholder="Description (Optional)" value={infraForm.description} onChange={handleInfraInputChange} rows="2" className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                        </div>

                        {/* Row 3: Cost & Installation Date (Inauguration) */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <input name="cost" type="number" step="0.01" placeholder="Cost (in ₹, e.g., 150000)" value={infraForm.cost} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                            <input name="installationDate" type="date" placeholder="Inauguration / Installation Date" value={infraForm.installationDate} onChange={handleInfraInputChange} className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                        </div>

                        {/* CONDITIONAL SPECIFIC FIELDS: PRIMARY SCHOOL */}
                        {infraForm.type === 'Primary School' && <PrimarySchoolFields />}
                        {infraForm.type === 'Primary Health Center' && <PrimaryHealthCenterFields />}

                        {/* Row 4: Location */}
                        <fieldset className="border p-4 rounded-lg my-6 dark:border-gray-600">
                            <legend className="text-base font-medium text-gray-700 dark:text-gray-300 px-2">Location Data (Optional)</legend>
                            <div className="grid md:grid-cols-3 gap-4 mt-2">
                                <input name="latitude" type="number" step="any" placeholder="Latitude" value={infraForm.location.latitude} onChange={handleInfraLocationChange} className="border p-2 w-full rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                                <input name="longitude" type="number" step="any" placeholder="Longitude" value={infraForm.location.longitude} onChange={handleInfraLocationChange} className="border p-2 w-full rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                                <input name="address" type="text" placeholder="Address/Landmark" value={infraForm.location.address} onChange={handleInfraLocationChange} className="border p-2 w-full rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                            </div>
                        </fieldset>

                        {/* UPDATED: IMAGE SELECTION FROM SYSTEM STORAGE */}
                        <div className="flex items-center gap-4 mb-6 p-4 border rounded dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                            {infraForm.image ? (
                                <img src={infraForm.image} alt="Infrastructure Image Preview" width={96} height={96} className="w-24 h-24 object-cover rounded shadow-md"/>
                            ) : (
                                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs">No Image</div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Image from System Storage (.jpg, .png)</label>
                                
                                <input 
                                    type="file" 
                                    accept="image/png, image/jpeg" 
                                    onChange={handleInfraImageUpload} 
                                    className="block text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-200 file:text-indigo-700 hover:file:bg-indigo-300"
                                />

                                {infraForm.image && (
                                    <button type="button" onClick={() => setInfraForm(prev => ({...prev, image: ''}))} className="text-red-500 hover:text-red-700 text-xs">Remove Image</button>
                                )}
                            </div>
                        </div>

                        {/* Submission Buttons */}
                        <div className="flex gap-4">
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200">{infraSubmitText}</button>
                            {editingInfraId && (<button type="button" onClick={resetInfraForm} className="px-8 py-3 bg-gray-400 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 transition duration-200">Cancel Edit</button>)}
                        </div>
                    </form>
                </section>

                <hr className="my-12 border-gray-300 dark:border-gray-700" />

                {/* --- GALLERY MANAGEMENT SECTION (Simplified) --- */}
                <section>
                    <h2 className="text-3xl font-bold mb-6 text-pink-700 dark:text-purple-400">Gallery Image Upload</h2>
                    <form onSubmit={handleUpload} className="mb-8 space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-pink-700 dark:text-purple-400">Upload New Image</h3>
                        <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Image Title" value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} required/>
                        <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Tags (comma separated)" value={imageTags} onChange={(e) => setImageTags(e.target.value)} />
                        
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            onChange={(e) => {
                                setSelectedFile(e.target.files[0]);
                                setFileName(e.target.files[0] ? e.target.files[0].name : "No file chosen");
                            }}
                            className="block text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-200 file:text-pink-700 hover:file:bg-pink-300"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Selected file: {fileName}</p>

                        <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700" disabled={uploading}>
                            {uploading ? `Uploading... (${uploadProgress}%)` : "Upload to Gallery"}
                        </button>
                        {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                    </form>

                    <h3 className="text-2xl font-semibold mb-4 text-pink-700 dark:text-purple-400">Existing Gallery Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((img) => (
                            <div key={img._id} className="relative group overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-800">
                                <img src={img.image_data} alt={img.title} className="w-full h-32 object-cover"/>
                                <div className="p-2">
                                    <p className="text-xs font-medium truncate">{img.title}</p>
                                </div>
                                <button onClick={() => handleDeleteImage(img._id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* Voter Image Picker Modal (Conditionally rendered) */}
                {showVoterImagePicker && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4">Select Voter Image from Gallery</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {images.map((img) => (
                                    <div key={img._id} onClick={() => handleVoterImageSelect(img.image_data)} className="relative group cursor-pointer border-4 border-transparent hover:border-indigo-500 rounded-lg overflow-hidden transition-colors">
                                        <img src={img.image_data} alt={img.title} className="w-full h-24 object-cover"/>
                                        <p className="text-xs text-center p-1 truncate dark:text-white">{img.title}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowVoterImagePicker(false)} className="mt-6 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}