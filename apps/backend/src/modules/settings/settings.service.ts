import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Setting } from './setting.entity.js';

export interface WorkspaceSettings {
  company: {
    name: string;
    shortName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  // Nhãn gợi ý khi tạo công việc, mỗi nhãn có màu
  taskLabels: { name: string; color: string }[];
  // Giờ làm việc dùng cho nhắc hạn và báo cáo
  workHours: { start: string; end: string; workDays: number[] };
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  company: {
    name: '4SigmaBrains',
    shortName: '4SB',
    address: '',
    phone: '',
    email: '',
    website: '',
  },
  taskLabels: [
    { name: 'Kết cấu', color: '#4F7CF5' },
    { name: 'Kiến trúc', color: '#E08A3C' },
    { name: 'MEP', color: '#38B2A0' },
    { name: 'Dataset', color: '#7C3AED' },
    { name: 'Pháp lý', color: '#B45309' },
    { name: 'Khẩn', color: '#B42318' },
  ],
  workHours: { start: '08:00', end: '17:30', workDays: [1, 2, 3, 4, 5, 6] },
};

type Key = keyof WorkspaceSettings;
const KEYS = Object.keys(DEFAULT_SETTINGS) as Key[];

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting) private readonly settings: Repository<Setting>,
  ) {}

  async all(): Promise<WorkspaceSettings> {
    const rows = await this.settings.find();
    const out = structuredClone(DEFAULT_SETTINGS) as unknown as Record<
      string,
      unknown
    >;
    for (const r of rows) if (KEYS.includes(r.key as Key)) out[r.key] = r.value;
    return out as unknown as WorkspaceSettings;
  }

  async update(patch: Partial<WorkspaceSettings>) {
    const rows = KEYS.filter((k) => patch[k] !== undefined).map((k) =>
      this.settings.create({ key: k, value: patch[k] }),
    );
    if (rows.length) await this.settings.save(rows);
    return this.all();
  }
}
