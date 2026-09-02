import mongoose from 'mongoose';
import { INFRA_TYPES, INFRA_STATUSES } from '@/lib/infrastructureDisplay';

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
        enum: INFRA_TYPES,
    },
    status: { 
        type: String, 
        required: true, 
        enum: INFRA_STATUSES,
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
        ward: { type: String },
        village: { type: String },
        landmark: { type: String },
    },
    cost: { 
        type: Number, 
        default: 0 
    },
    installationDate: { 
        type: Date 
    },
    expectedCompletionDate: { type: Date },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    fundingScheme: { type: String, default: '' },
    approvedBudget: { type: Number, default: 0 },
    amountSpent: { type: Number, default: 0 },
    implementingAgency: { type: String, default: '' },
    image: { 
        type: String 
    },
    beforeImage: { type: String },
    afterImage: { type: String },
    details: { 
        type: Object, 
        default: {} 
    } 
    
}, { 
    timestamps: true 
});

const Infrastructure = mongoose.models.Infrastructure || mongoose.model('Infrastructure', InfrastructureSchema);

export default Infrastructure;
