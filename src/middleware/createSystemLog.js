import SystemLog from '../models/SystemLog.js';

export const createSystemLog = async (
    action, 
    type, 
    entityID, 
    entityType, 
    description, 
    attachment
    ) => {
        
    const systemLog = {
        action,
        type,
        entityID,
        entityType,
        description,
        attachment
    };

    try {
        const newSystemLog = await SystemLog.create(systemLog);
        if(newSystemLog) {
            return true;
        }
        return false;
    } catch (error) {
        console.error(error);
        return false;
    }
}
