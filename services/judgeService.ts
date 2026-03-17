

export type JudgingStage = 'abstract' | 'paper' | 'final';

export interface Criterion {
  id: string;
  label: string;
  max: number;
  desc: string;
}

export interface JudgeAssignment {
  id: string;
  eventId: string;
  eventTitle: string;
  categoryId: string; // e.g., "cat-a"
  categoryName: string; // e.g., "Life Sciences"
  currentStage: JudgingStage;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  total: number;
}

// Rubric Definitions per Stage
export const RUBRICS: Record<JudgingStage, Criterion[]> = {
  abstract: [
    { id: 'novelty', label: 'Novelty & Innovation', max: 10, desc: 'Is the idea original and distinct from existing research?' },
    { id: 'clarity', label: 'Problem Statement', max: 10, desc: 'Is the problem clearly defined and significant?' },
    { id: 'relevance', label: 'Theme Relevance', max: 10, desc: 'Alignment with the competition theme and category.' },
  ],
  paper: [
    { id: 'methodology', label: 'Methodology', max: 20, desc: 'Rigor of the research methods, experimental design, and data collection.' },
    { id: 'results', label: 'Results & Analysis', max: 20, desc: 'Data-driven evidence, statistical analysis, and interpretation.' },
    { id: 'poster', label: 'Poster Design', max: 10, desc: 'Visual clarity, flow, and ability to communicate key findings effectively.' },
    { id: 'impact', label: 'Scientific Impact', max: 20, desc: 'Contribution to the field and potential for real-world application.' },
    { id: 'writing', label: 'Documentation Quality', max: 10, desc: 'Structure, citations, and professional tone of the full paper.' },
  ],
  final: [
    { id: 'presentation', label: 'Presentation Delivery', max: 30, desc: 'Oratory skills, timing, engagement, and professionalism.' },
    { id: 'qa', label: 'Q&A Mastery', max: 30, desc: 'Ability to answer technical questions confidently and accurately.' },
    { id: 'feasibility', label: 'Feasibility & Scalability', max: 20, desc: 'Commercial viability or potential for deployment.' },
    { id: 'overall', label: 'Overall Impression', max: 20, desc: 'Final holistic assessment of the project.' },
  ]
};

// Mock Data Seeding
const SEED_DATA = {
  // Assignments link a Judge to an Event + Category
  assignments: [
    {
      id: "asn-001",
      eventId: "ev-001",
      eventTitle: "M-GFEST 2024",
      categoryId: "cat-life-sci",
      categoryName: "Life Sciences & Medicine",
      currentStage: "paper" as JudgingStage,
      status: "active"
    },
    {
      id: "asn-002",
      eventId: "ev-001",
      eventTitle: "M-GFEST 2024",
      categoryId: "cat-eng",
      categoryName: "Engineering & Technology",
      currentStage: "abstract" as JudgingStage,
      status: "completed"
    },
    {
      id: "asn-003",
      eventId: "ev-002",
      eventTitle: "Global Innovation Challenge",
      categoryId: "cat-sustain",
      categoryName: "Sustainability",
      currentStage: "final" as JudgingStage,
      status: "active"
    }
  ],
  submissions: [
    // Life Sciences (Paper Stage)
    { 
      id: "sub-101", 
      eventId: "ev-001", 
      categoryId: "cat-life-sci",
      title: "Novel Malaria Diagnostic Kit", 
      team: "MediDetect", 
      institution: "University of Lagos",
      abstract: "A low-cost, rapid diagnostic test using synthetic biology.",
      abstractPdf: "abstract.pdf",
      fullPaperPdf: "paper.pdf",
      posterUrl: "poster.jpg",
      presentationUrl: "http://youtube.com"
    },
    { 
      id: "sub-102", 
      eventId: "ev-001", 
      categoryId: "cat-life-sci",
      title: "AI for Early Cancer Detection", 
      team: "OncoAI", 
      institution: "MIT",
      abstract: "Using deep learning on radiology scans for early detection.",
      abstractPdf: "abstract.pdf",
      fullPaperPdf: "paper.pdf",
      posterUrl: "poster.jpg",
      presentationUrl: "http://youtube.com"
    },
    // Engineering (Abstract Stage)
    { 
      id: "sub-201", 
      eventId: "ev-001", 
      categoryId: "cat-eng",
      title: "Autonomous Drone Swarm", 
      team: "SkyHive", 
      institution: "Imperial College",
      abstract: "Coordinated drone flight for agricultural monitoring.",
      abstractPdf: "abstract.pdf", 
      fullPaperPdf: null,
      posterUrl: null
    },
    // Sustainability (Final Stage)
    { 
      id: "sub-301", 
      eventId: "ev-002", 
      categoryId: "cat-sustain",
      title: "Ocean Plastic Recycler", 
      team: "BlueClean", 
      institution: "NUS",
      abstract: "Autonomous vessel for microplastic filtration.",
      abstractPdf: "abstract.pdf",
      fullPaperPdf: "paper.pdf",
      posterUrl: "poster.jpg",
      presentationUrl: "http://youtube.com"
    }
  ],
  // Scores keyed by submissionId + stage
  scores: [] as any[]
};

const DB_KEY = 'moova_judge_db_v3';

class JudgeService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
    }
  }

  private getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
  }

  private saveDB(data: any) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  // Get high-level assignments for the dashboard
  async getAssignments(): Promise<JudgeAssignment[]> {
    await new Promise(r => setTimeout(r, 400));
    const db = this.getDB();
    
    // Calculate progress for each assignment
    const assignments = db.assignments.map((asn: any) => {
      const relevantSubmissions = db.submissions.filter((s: any) => 
        s.eventId === asn.eventId && s.categoryId === asn.categoryId
      );
      
      const scoredCount = relevantSubmissions.reduce((acc: number, sub: any) => {
        const hasScore = db.scores.find((s: any) => 
          s.submissionId === sub.id && 
          s.stage === asn.currentStage && 
          s.status === 'submitted'
        );
        return acc + (hasScore ? 1 : 0);
      }, 0);

      return {
        ...asn,
        progress: scoredCount,
        total: relevantSubmissions.length
      };
    });

    return assignments;
  }

  // Get submissions for an event and stage (for JudgeRoundView)
  async getEventSubmissions(eventId: string, stage: JudgingStage) {
    await new Promise(r => setTimeout(r, 300));
    const db = this.getDB();
    const submissions = db.submissions.filter((s: any) => s.eventId === eventId);

    return submissions.map((sub: any) => {
      const scoreRecord = db.scores.find((s: any) => s.submissionId === sub.id && s.stage === stage);
      return {
        ...sub,
        scoringStatus: scoreRecord ? scoreRecord.status : 'pending',
        totalScore: scoreRecord ? scoreRecord.totalScore : null,
        updatedAt: scoreRecord ? scoreRecord.updatedAt : null
      };
    });
  }

  // Get submissions for a specific category workspace
  async getCategorySubmissions(categoryId: string, stage: JudgingStage) {
    await new Promise(r => setTimeout(r, 300));
    const db = this.getDB();
    const submissions = db.submissions.filter((s: any) => s.categoryId === categoryId);

    return submissions.map((sub: any) => {
      const scoreRecord = db.scores.find((s: any) => s.submissionId === sub.id && s.stage === stage);
      return {
        ...sub,
        scoringStatus: scoreRecord ? scoreRecord.status : 'pending', // pending, draft, submitted
        totalScore: scoreRecord ? scoreRecord.totalScore : null,
        updatedAt: scoreRecord ? scoreRecord.updatedAt : null
      };
    });
  }

  // Get details for scoring
  async getSubmissionDetails(submissionId: string, stage: JudgingStage) {
    await new Promise(r => setTimeout(r, 400));
    const db = this.getDB();
    const submission = db.submissions.find((s: any) => s.id === submissionId);
    
    if (!submission) throw new Error("Submission not found");

    const scoreRecord = db.scores.find((s: any) => s.submissionId === submissionId && s.stage === stage);

    return {
      submission,
      scoreRecord: scoreRecord || null,
      rubric: RUBRICS[stage]
    };
  }

  async saveScore(payload: { 
    submissionId: string, 
    stage: JudgingStage,
    criteriaScores: Record<string, number>, 
    comment: string, 
    status: 'draft' | 'submitted' 
  }) {
    await new Promise(r => setTimeout(r, 600));
    const db = this.getDB();
    
    let total = 0;
    const rubric = RUBRICS[payload.stage];
    rubric.forEach(c => {
      total += (payload.criteriaScores[c.id] || 0);
    });

    const record = {
      ...payload,
      judgeId: "current_user",
      totalScore: total,
      updatedAt: new Date().toISOString()
    };

    const existingIndex = db.scores.findIndex((s: any) => 
      s.submissionId === payload.submissionId && s.stage === payload.stage
    );
    
    if (existingIndex >= 0) {
      db.scores[existingIndex] = { ...db.scores[existingIndex], ...record };
    } else {
      db.scores.push(record);
    }

    this.saveDB(db);
    return record;
  }
}

export const judgeService = new JudgeService();
