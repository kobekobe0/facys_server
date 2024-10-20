import Admin from "../models/Admin.js";
import bcrypt from 'bcryptjs';

const createDefaultAdmin = async () => {
    const count = await Admin.countDocuments();
    if(count === 0){
        const password = await bcrypt.hash('admin123', 12);
        const admin = await Admin.create({
            email: 'admin@admin.com',
            password,
            name: 'Admin'
        });
        console.log('Default admin created');
    }
}

export default createDefaultAdmin;