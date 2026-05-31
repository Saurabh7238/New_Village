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
    },
    cost: { 
        type: Number, 
        default: 0 
    },
    installationDate: { 
        type: Date 
    },
    image: { 
        type: String 
    },
    details: { 
        type: Object, 
        default: {} 
    } 
    
}, { 
    timestamps: true 
});

const Infrastructure = mongoose.models.Infrastructure || mongoose.model('Infrastructure', InfrastructureSchema);

export default Infrastructure;
