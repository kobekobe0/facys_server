import Face from '../models/Face.js';
import * as faceapi from 'face-api.js';

const loadEmbeddingsIntoMemory = async () => {
    const faces = await Face.find();
    if(faces.length === 0) return []
    const labeledFaceDescriptors = faces.map(face => new faceapi.LabeledFaceDescriptors(
      face.name,
      [new Float32Array(face.descriptor)]
    ));
    
    return new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
};

export default loadEmbeddingsIntoMemory;