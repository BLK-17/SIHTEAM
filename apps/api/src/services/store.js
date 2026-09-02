const studentTemplate = {
    name: 'Student',
    targetRole: 'Backend Developer',
    skills: [
        {
            name: 'REST API design',
            have: 82,
            need: 90
        },
        {
            name: 'Database migrations',
            have: 55,
            need: 85
        },
        {
            name: 'System design',
            have: 40,
            need: 80
        },
        {
            name: 'Containerization',
            have: 60,
            need: 75
        }
    ],
    certifications: [],
    assessments: [
        {
            name: 'REST API practical build',
            score: 92
        },
        {
            name: 'Database fundamentals quiz',
            score: 71
        }
    ],
    roadmap: [
        [
            'Core REST API project',
            'done'
        ],
        [
            'Database migrations mini-project',
            'progress'
        ],
        [
            'Practical system-design assessment',
            'locked'
        ],
        [
            'Containerize your project with Docker',
            'locked'
        ]
    ]
};

const collegeTemplate = {
    courses: [
        'Data Structures',
        'Operating Systems',
        'Computer Networks',
        'Data Structures & Algorithms'
    ],
    demand: [
        [
            'Cloud & DevOps',
            88
        ],
        [
            'Applied GenAI',
            81
        ],
        [
            'Data Engineering',
            74
        ],
        [
            'Cybersecurity basics',
            68
        ]
    ]
};

const industryTemplate = {
    talentCount: 1240,
    demand: [
        [
            'Cloud & DevOps',
            88
        ],
        [
            'Applied GenAI',
            81
        ],
        [
            'Data Engineering',
            74
        ],
        [
            'Cybersecurity basics',
            68
        ]
    ],
    candidates: []
};

function createStudentData(user) {
    return {
        id: user.userId,
        name: user.name || studentTemplate.name,
        targetRole: studentTemplate.targetRole,
        skills: structuredClone(studentTemplate.skills),
        certifications: structuredClone(studentTemplate.certifications),
        assessments: structuredClone(studentTemplate.assessments),
        roadmap: structuredClone(studentTemplate.roadmap)
    };
}

function createCollegeData() {
    return structuredClone(collegeTemplate);
}

function createIndustryData() {
    return structuredClone(industryTemplate);
}

export const store = {
    students: {
        users: new Map()
    },

    college: {
        users: new Map()
    },

    industry: {
        users: new Map()
    },

    getStudent(user) {
        if (!this.students.users.has(user.userId)) {
            this.students.users.set(
                user.userId,
                createStudentData(user)
            );
        }

        return this.students.users.get(user.userId);
    },

    getCollege(user) {
        if (!this.college.users.has(user.userId)) {
            this.college.users.set(
                user.userId,
                createCollegeData()
            );
        }

        return this.college.users.get(user.userId);
    },

    getIndustry(user) {
        if (!this.industry.users.has(user.userId)) {
            this.industry.users.set(
                user.userId,
                createIndustryData()
            );
        }

        return this.industry.users.get(user.userId);
    }
};