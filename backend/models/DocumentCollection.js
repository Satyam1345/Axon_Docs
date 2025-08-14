// backend/models/DocumentCollection.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentCollectionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collectionName: { type: String, required: true, trim: true },
  analysisData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DocumentCollection', DocumentCollectionSchema);
