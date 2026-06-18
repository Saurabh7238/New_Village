import mongoose from 'mongoose';

const QueryCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'query'
  },
  count: {
    type: Number,
    default: 0
  }
});

const QueryCounter = mongoose.models.QueryCounter || mongoose.model('QueryCounter', QueryCounterSchema);

export default QueryCounter;
