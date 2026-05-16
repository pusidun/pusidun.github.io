export interface CareerEntry {
  start: string;
  end: string;
  company: string;
  companyZh?: string;
  current?: boolean;
}

export const career: CareerEntry[] = [
  {
    start: '2023',
    end: '至今',
    company: 'LiAuto',
    companyZh: '理想汽车',
    current: true,
  },
  {
    start: '2021',
    end: '2023',
    company: 'Sangfor',
    companyZh: '深信服科技',
  },
  {
    start: '2018',
    end: '2021',
    company: 'AsiaInfo Sec',
    companyZh: '亚信安全',
  },
  {
    start: '2016',
    end: '2018',
    company: 'Alcatel',
    companyZh: '阿尔卡特',
  },
];
