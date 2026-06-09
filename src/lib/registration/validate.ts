import type { RegistrationFormData } from "@/lib/types";

export type ValidationError = {
  field: string;
  message: string;
};

const VALID_PROJECTS = ["单项测试", "男子单人", "女子单人", "男子双人", "女子双人", "混合4人"];

const TEAM_PROJECTS = ["男子双人", "女子双人", "混合4人"];
const REQUIRED_TEAM_SIZE: Record<string, number> = {
  "男子双人": 1,
  "女子双人": 1,
  "混合4人": 3,
};

export function validateRegistrationForm(data: Partial<RegistrationFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name?.trim()) {
    errors.push({ field: "name", message: "请输入姓名" });
  }

  if (!data.gender || !["男", "女"].includes(data.gender)) {
    errors.push({ field: "gender", message: "请选择性别" });
  }

  if (!data.phone?.trim()) {
    errors.push({ field: "phone", message: "请输入手机号" });
  } else if (!/^1[3-9]\d{9}$/.test(data.phone.trim())) {
    errors.push({ field: "phone", message: "请输入有效的手机号" });
  }

  if (!data.email?.trim()) {
    errors.push({ field: "email", message: "请输入邮箱" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push({ field: "email", message: "请输入有效的邮箱地址" });
  }

  if (!data.project || !VALID_PROJECTS.includes(data.project)) {
    errors.push({ field: "project", message: "请选择参赛项目" });
  }

  if (data.project && TEAM_PROJECTS.includes(data.project)) {
    if (!data.teamName?.trim()) {
      errors.push({ field: "teamName", message: "请输入队名" });
    }

    const members = data.teammates ?? [];
    const requiredSize = REQUIRED_TEAM_SIZE[data.project] ?? 0;
    if (members.length < requiredSize) {
      errors.push({
        field: "teammates",
        message: `请填写至少 ${requiredSize} 名队友信息`,
      });
    } else {
      members.forEach((member, index) => {
        if (!member.name?.trim()) {
          errors.push({ field: `teammates.${index}.name`, message: `请填写队友${index + 1}的姓名` });
        }
        if (!member.gender || !["男", "女"].includes(member.gender)) {
          errors.push({ field: `teammates.${index}.gender`, message: `请选择队友${index + 1}的性别` });
        }
        if (!member.phone?.trim() || !/^1[3-9]\d{9}$/.test(member.phone.trim())) {
          errors.push({ field: `teammates.${index}.phone`, message: `请输入队友${index + 1}的有效手机号` });
        }
      });
    }
  }

  if (!data.verificationCode?.trim() || data.verificationCode.trim().length !== 6) {
    errors.push({ field: "verificationCode", message: "请输入6位邮箱验证码" });
  }

  if (!data.waiverOk) {
    errors.push({ field: "waiverOk", message: "请阅读并同意免责声明" });
  }

  if (!data.healthOk) {
    errors.push({ field: "healthOk", message: "请确认身体健康状况适合参赛" });
  }

  return errors;
}
