import mongoose from 'mongoose';

// Check if the model is already defined
const Vote = mongoose.models.Vote || mongoose.model('Vote', new mongoose.Schema({
  kol_address: {
    type: String,
    required: true,
    index: true
  },
  voter_wallet: {
    type: String,
    required: true,
    index: true
  },
  vote_type: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}));

export default Vote; 