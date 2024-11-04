import Config from "../models/Config.js";
import bcrypt from 'bcryptjs';

const createDefaultConfig = async () => {
    const count = await Config.countDocuments();
    if(count === 0){
        const config = await Config.create({
            departments: ['Computer Science', 'Information Technology', 'Information Systems', 'Computer Engineering'],
            SY: 'AY 2024 - 2025 1st Semester'
        });
        console.log('Default config created');
    }
}

export default createDefaultConfig;