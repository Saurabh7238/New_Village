import mongoose from 'mongoose';

// Defines the schema for a voter data record
const VoterDataSchema = new mongoose.Schema(
  {
    // Critical field: Categorizes the record (replaces separate JSON files)
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['vidhan-sabha', 'lok-sabha', 'gram-panchayat'],
    },

    // Gram panchayat canonical fields (and usable for others too)
    serial_number: { type: String }, // Serial No.
    house_no: { type: String }, // House No.
    svn_no: { type: String }, // Service Voter No. (SVN)

    elector_name: { type: String }, // Voter name

    // Relation between voter and the guardian name
    relation_type: {
      type: String,
      enum: ['father', 'mother', 'husband', 'wife', 'other', ''],
      default: '',
    },

    // Displayable guardian/spouse name
    relationship: { type: String },
    parent_name: { type: String },

    gender: { type: String },
    age: { type: Number },

    // Backward-compatible common fields (used by existing UI)
    voterId: { type: String },
    name: { type: String },
    ward: { type: String },
    constituency: { type: String },

    // Aliases used by current API/UI
    voterName: { type: String },
    voterGuardianName: { type: String },
    voterGender: { type: String },
    voterAge: { type: Number },
    voterWardNo: { type: String },
    voterConstituency: { type: String },

    voterGenderLabel: { type: String },

    // Keep flexible for older imports
    image: { type: String },
    dateOfBirth: { type: String },
  },
  {
    timestamps: true,
    strict: false, // Allows the model to save any extra fields in the POST request
  }
);

// Use existing model or create a new one
const VoterData = mongoose.models.VoterData || mongoose.model('VoterData', VoterDataSchema);

export default VoterData;

