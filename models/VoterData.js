import mongoose from 'mongoose';

// Defines the schema for a voter data record
const VoterDataSchema = new mongoose.Schema({
    // Critical field: Categorizes the record (replaces separate JSON files)
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['vidhan-sabha', 'lok-sabha', 'gram-panchayat'],
    },
    // Adding common fields. Update these if your data has different primary fields:
    voterId: {
        type: String,
        required: false, // Make it required if every record must have one
    },
    name: {
        type: String,
        required: false,
    },
    ward: {
        type: String,
    },
}, { 
    timestamps: true, 
    strict: false // Allows the model to save any extra fields in the POST request
});

// Use existing model or create a new one
const VoterData = mongoose.models.VoterData || mongoose.model('VoterData', VoterDataSchema);

export default VoterData;