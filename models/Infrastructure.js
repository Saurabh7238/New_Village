import mongoose from 'mongoose';

const InfrastructureSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    type: { 
        type: String, 
        required: true, 
        // Ensure 'Primary School' is in the allowed enum values
        enum: ['Street Light', 'Water Pump', 'Road', 'Solar Panel', 'Primary School', 'Primary Health Center', 'Other'] 
    },
    status: { 
        type: String, 
        required: true, 
        enum: ['Operational', 'Under Maintenance', 'Broken', 'Planned'] 
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
    },
    // --- FIELDS FOR SCHOOL IMAGE, COST, & INSTALLATION DATE ---
    cost: { 
        type: Number, 
        default: 0 
    },
    installationDate: { 
        type: Date 
    },
    image: { 
        type: String 
    }, // Stores Base64 Data URI from the gallery
    
    // CRITICAL: This object stores the school-specific fields (students, washrooms, handpumps)
    details: { 
        type: Object, 
        default: {} 
    } 
    
}, { 
    timestamps: true 
});

// Check if the model already exists to prevent 'OverwriteModelError'
const Infrastructure = mongoose.models.Infrastructure || mongoose.model('Infrastructure', InfrastructureSchema);

export default Infrastructure;