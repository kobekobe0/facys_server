import Face from '../models/Face.js';
import * as faceapi from 'face-api.js';

const loadEmbeddingsIntoMemory = async () => {
    const faces = await Face.find(); // Fetch stored face embeddings
    if (faces.length === 0) return null; // If no faces are stored, return null

    // Create labeled face descriptors with main and supporting descriptors
    const labeledFaceDescriptors = faces.map(face => {
        // Convert each descriptor to Float32Array
        const mainDescriptor = new Float32Array(face.mainDescriptor);
        const supportDescriptors = face.supportDescriptors.map(desc => new Float32Array(desc));

        // Combine main and support descriptors into a single array
        const descriptors = [mainDescriptor, ...supportDescriptors];

        // Create LabeledFaceDescriptors with multiple descriptors
        return new faceapi.LabeledFaceDescriptors(face.studentID, descriptors);
    });
    console.log(faceapi.LabeledFaceDescriptors)
    // Return a FaceMatcher instance using the labeled face descriptors
    return new faceapi.FaceMatcher(labeledFaceDescriptors, 0.45); // Adjust threshold as needed
};

export default loadEmbeddingsIntoMemory;
