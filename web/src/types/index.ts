export interface Student {
  record_id: string;
  学生姓名: string;
  年级: string;
  科目: string[];
  入学时间: number;
  家长联系方式: string;
  当前状态: string;
  总课时数?: number;
  最近上课日期?: number;
}

export interface Lesson {
  record_id: string;
  关联学生: string[];
  上课日期: number;
  科目: string;
  课程主题: string;
  课堂表现评分: number;
  作业完成情况: string;
  课堂照片?: Array<{file_token: string; name: string}>;
  教师备注: string;
  下节课计划: string;
}

export interface KnowledgePoint {
  record_id: string;
  知识点名称: string;
  所属科目: string;
  所属年级: string;
  难度等级: string;
}

export interface StudentKnowledge {
  record_id: string;
  关联学生: string[];
  关联知识点: string[];
  掌握程度: string;
  首次接触日期: number;
  最近巩固日期: number;
}

export interface Material {
  record_id: string;
  资料名称: string;
  资料类型: string;
  关联科目: string;
  关联年级: string;
  文件?: Array<{file_token: string; name: string}>;
  适用场景: string[];
}

export interface Milestone {
  record_id: string;
  关联学生: string[];
  阶段类型: string;
  开始日期: number;
  结束日期: number;
  阶段评价: string;
  报告状态: string;
}
