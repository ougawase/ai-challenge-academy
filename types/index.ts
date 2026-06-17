export interface Profile {
  id: string
  name: string | null
  grade: string | null
  school_name: string | null
  location: string | null
  interests: string[] | null
  strengths: string | null
  weaknesses: string | null
  future_goal: string | null
  target_universities: string[] | null
  achievements: string | null
  qualifications: string | null
  created_at: string
  updated_at: string
}

export interface SelfAnalysisResult {
  id: string
  user_id: string
  summary: string | null
  strengths: string | null
  personality_type: string | null
  recommended_themes: string[] | null
  admission_axis: string | null
  chat_history: ChatMessage[] | null
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SocialIssue {
  id: string
  user_id: string
  title: string | null
  description: string | null
  reason: string | null
  difficulty: string | null
  university_connection: string | null
  action_ideas: string | null
  is_selected: boolean
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string | null
  issue: string | null
  hypothesis: string | null
  target: string | null
  description: string | null
  roadmap: RoadmapItem[] | null
  week1_tasks: string[] | null
  dm_template: string | null
  survey_template: string | null
  success_metrics: string | null
  status: string
  created_at: string
}

export interface RoadmapItem {
  week: string
  tasks: string[]
}

export interface ActivityLog {
  id: string
  user_id: string
  project_id: string | null
  date: string | null
  content: string | null
  people_met: string | null
  learning: string | null
  problem: string | null
  next_action: string | null
  ai_feedback: ActivityFeedback | null
  created_at: string
}

export interface ActivityFeedback {
  meaning: string
  admission_points: string
  next_suggestions: string
  deep_questions: string
}

export interface Essay {
  id: string
  user_id: string
  university: string | null
  faculty: string | null
  content: string | null
  ai_feedback: EssayFeedback | null
  created_at: string
}

export interface EssayFeedback {
  overall: string
  university_connection: string
  activity_connection: string
  originality: string
  logic: string
  improvements: string
  rewrite_example: string
  interview_questions: string
}
