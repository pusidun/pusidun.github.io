export interface Project {
  name: string;
  href: string;
  description: string;
  language: string;
  status: string;
  /** Renders on the dark surface — the system's strongest emphasis. One at a time. */
  featured?: boolean;
}

export const projects: Project[] = [
  { name: 'swallow', href: 'https://github.com/pusidun/swallow', description: '基于 C++14 标准的开源库，包含日志、配置和协程模块。使用 gtest 进行单元测试，并通过 Travis CI 自动运行测试。', language: 'C++14', status: '开源库', featured: true },
  { name: 'IM-Golang', href: 'https://github.com/pusidun/IM-Golang', description: '基于 Gin 网络框架开发的 IM 系统，已完成鉴权、ORM 和用户管理。项目尚未完成。', language: 'Go', status: '未完成' },
];
