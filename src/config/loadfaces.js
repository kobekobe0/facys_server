import Face from '../models/Face.js';
import * as faceapi from 'face-api.js';

const loadEmbeddingsIntoMemory = async () => {
    const faces = await Face.find(); // Fetch stored face embeddings
    if (faces.length === 0) return null; // If no faces are stored, return null

    // Create labeled face descriptors
    const labeledFaceDescriptors = faces.map(face => new faceapi.LabeledFaceDescriptors(
        face.studentID, // Label for the face descriptor
        [new Float32Array(face.descriptor)] // Each descriptor is stored as a Float32Array
    ));

    // Return a FaceMatcher instance using the labeled face descriptors
    return new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6); // 0.6 is the matching threshold
};

export default loadEmbeddingsIntoMemory;