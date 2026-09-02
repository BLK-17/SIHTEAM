export const roadmapNodes = [
  {
    id: 'html',
    type: 'skill',
    position: { x: 0, y: 0 },
    data: {
      title: 'HTML & CSS',
      category: 'Frontend',
      status: 'completed',
      progress: 100,
      description: 'Build strong web fundamentals.'
    }
  },
  {
    id: 'javascript',
    type: 'skill',
    position: { x: 300, y: 0 },
    data: {
      title: 'JavaScript',
      category: 'Frontend',
      status: 'completed',
      progress: 100,
      description: 'Master modern JavaScript.'
    }
  },
  {
    id: 'react',
    type: 'skill',
    position: { x: 600, y: 0 },
    data: {
      title: 'React',
      category: 'Frontend',
      status: 'in-progress',
      progress: 65,
      description: 'Build production React applications.'
    }
  },
  {
    id: 'backend',
    type: 'skill',
    position: { x: 900, y: 0 },
    data: {
      title: 'Node.js',
      category: 'Backend',
      status: 'available',
      progress: 0,
      description: 'Learn backend development with Node.js.'
    }
  },
  {
    id: 'database',
    type: 'skill',
    position: { x: 1200, y: 0 },
    data: {
      title: 'PostgreSQL',
      category: 'Database',
      status: 'locked',
      progress: 0,
      description: 'Learn relational database design.'
    }
  },
  {
    id: 'fullstack',
    type: 'project',
    position: { x: 1500, y: 0 },
    data: {
      title: 'Full-Stack Project',
      category: 'Project',
      status: 'locked',
      progress: 0,
      description: 'Build and deploy a complete application.'
    }
  }
];

export const roadmapEdges = [
  {
    id: 'html-javascript',
    source: 'html',
    target: 'javascript'
  },
  {
    id: 'javascript-react',
    source: 'javascript',
    target: 'react'
  },
  {
    id: 'react-backend',
    source: 'react',
    target: 'backend'
  },
  {
    id: 'backend-database',
    source: 'backend',
    target: 'database'
  },
  {
    id: 'database-fullstack',
    source: 'database',
    target: 'fullstack'
  }
];