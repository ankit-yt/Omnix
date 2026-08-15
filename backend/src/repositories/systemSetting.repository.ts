import SystemSetting, { ISystemSetting } from '@/models/SystemSetting.js';

class SystemSettingRepository {
  async findByKey(key: string): Promise<ISystemSetting | null> {
    return SystemSetting.findOne({ key });
  }

  async upsert(key: string, value: any, updatedBy: string): Promise<ISystemSetting> {
    return SystemSetting.findOneAndUpdate(
      { key },
      { value, updatedBy, description: `Dynamic system configuration for ${key}` },
      { new: true, upsert: true } 
    );
  }
}

export default new SystemSettingRepository();