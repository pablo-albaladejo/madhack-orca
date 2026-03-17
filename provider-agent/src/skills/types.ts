export type SkillResult = {
  text: string
  data: Record<string, unknown>
}

export type SkillHandler = (message: string) => Promise<SkillResult>
