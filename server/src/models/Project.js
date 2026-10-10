import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  role: { type: String, required: true, trim: true, maxlength: 100 },
  skills: [{ type: String, trim: true, maxlength: 100 }]
});
const activitySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  duration: { type: Number, required: true, min: 0 },
  predecessors: [String],
  assignedMember: { type: mongoose.Schema.Types.ObjectId, default: null },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  requiredRole: { type: String, default: '', maxlength: 100 },
  requiredSkills: [{ type: String, maxlength: 100 }],
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null }
}, { _id: false });
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  startDate: { type: Date, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [memberSchema],
  activities: [activitySchema]
}, { timestamps: true, optimisticConcurrency: true });
projectSchema.index({ 'members.email': 1 });
export default mongoose.model('Project', projectSchema);
