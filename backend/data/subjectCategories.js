const subjectCategories = [
  {
    slug: 'information-technology',
    name: 'Information Technology',
    description: 'Core computer systems, networks, and digital foundations.',
    questions: [
      {
        question: 'What is the main purpose of an operating system?',
        options: [
          'To design websites',
          'To manage hardware and software resources',
          'To create databases only',
          'To replace antivirus software',
        ],
        correctAnswer: 1,
      },
      {
        question: 'Which memory is temporary and loses data when power is off?',
        options: ['ROM', 'SSD', 'RAM', 'Cache-only memory card'],
        correctAnswer: 2,
      },
      {
        question: 'Which protocol is primarily used for secure web browsing?',
        options: ['FTP', 'HTTP', 'HTTPS', 'SMTP'],
        correctAnswer: 2,
      },
      {
        question: 'What does CPU stand for?',
        options: ['Central Program Utility', 'Central Processing Unit', 'Control Process Unit', 'Core Power Unit'],
        correctAnswer: 1,
      },
      {
        question: 'Which device forwards data packets between computer networks?',
        options: ['Router', 'Monitor', 'Keyboard', 'Printer'],
        correctAnswer: 0,
      },
      {
        question: 'Which one is an example of an operating system?',
        options: ['Microsoft Excel', 'Windows 11', 'Google Chrome', 'MySQL'],
        correctAnswer: 1,
      },
      {
        question: 'Which topology connects all devices to a central hub?',
        options: ['Ring topology', 'Bus topology', 'Star topology', 'Mesh topology'],
        correctAnswer: 2,
      },
      {
        question: 'What does URL stand for?',
        options: ['Unified Resource Locator', 'Uniform Resource Locator', 'Universal Routing Link', 'Uniform Routing Locator'],
        correctAnswer: 1,
      },
      {
        question: 'Which storage is fastest among the following?',
        options: ['Hard Disk Drive', 'USB Flash Drive', 'Solid State Drive', 'DVD'],
        correctAnswer: 2,
      },
      {
        question: 'Which one is a programming language?',
        options: ['HTML', 'Python', 'HTTP', 'CSS'],
        correctAnswer: 1,
      },
    ],
  },
  {
    slug: 'data-science',
    name: 'Data Science',
    description: 'Data analysis, visualization, and model-based decision making.',
    questions: [
      { question: 'Which library is commonly used in Python for data analysis?', options: ['NumPy', 'Pandas', 'Matplotlib', 'Flask'], correctAnswer: 1 },
      { question: 'What does CSV stand for?', options: ['Common Structured Values', 'Comma Separated Values', 'Central Stored Variables', 'Column System Value'], correctAnswer: 1 },
      { question: 'Which chart is best for category comparison?', options: ['Bar chart', 'Scatter chart', 'Histogram', 'Area chart'], correctAnswer: 0 },
      { question: 'In ML, what is overfitting?', options: ['Model performs well on unseen data', 'Model memorizes training data and generalizes poorly', 'Removing outliers', 'Balancing classes'], correctAnswer: 1 },
      { question: 'Which measure shows average central tendency?', options: ['Variance', 'Mean', 'Skewness', 'Standard Error'], correctAnswer: 1 },
      { question: 'What is a confusion matrix used for?', options: ['Clustering', 'Classification evaluation', 'Data cleaning', 'Feature scaling'], correctAnswer: 1 },
      { question: 'Which algorithm is supervised?', options: ['K-means', 'Linear Regression', 'Apriori', 'PCA'], correctAnswer: 1 },
      { question: 'What does null value mean?', options: ['Incorrect number', 'Missing or undefined data', 'Duplicate record', 'Primary key'], correctAnswer: 1 },
      { question: 'Which process transforms raw data into useful insight?', options: ['Data wrangling', 'Data deletion', 'Data shutdown', 'Data blocking'], correctAnswer: 0 },
      { question: 'What is the purpose of train-test split?', options: ['Increase data size', 'Evaluate model on unseen data', 'Delete noise', 'Convert labels'], correctAnswer: 1 },
    ],
  },
  {
    slug: 'software-engineering',
    name: 'Software Engineering',
    description: 'Design, development, testing, and maintenance of software systems.',
    questions: [
      { question: 'Which SDLC model is iterative?', options: ['Waterfall', 'Spiral', 'V-model', 'Big Bang'], correctAnswer: 1 },
      { question: 'What is version control used for?', options: ['UI design', 'Track code changes', 'Run tests', 'Deploy servers'], correctAnswer: 1 },
      { question: 'Which is a common unit testing framework for JavaScript?', options: ['Jest', 'Jira', 'Figma', 'Docker'], correctAnswer: 0 },
      { question: 'What is refactoring?', options: ['Adding features only', 'Improving code structure without changing behavior', 'Deleting tests', 'Changing database engine'], correctAnswer: 1 },
      { question: 'Which principle reduces module dependency?', options: ['Tight coupling', 'High cohesion', 'Hard coding', 'Code duplication'], correctAnswer: 1 },
      { question: 'What does CI stand for?', options: ['Continuous Integration', 'Code Injection', 'Component Isolation', 'Control Interface'], correctAnswer: 0 },
      { question: 'Which document captures software requirements?', options: ['SRS', 'SLA', 'SEO', 'CSV'], correctAnswer: 0 },
      { question: 'What is a bug?', options: ['A new feature', 'An error in software', 'A deployment script', 'A testing framework'], correctAnswer: 1 },
      { question: 'Which pattern is used to create objects?', options: ['Factory', 'Singleton loop', 'Observer only', 'Bridge table'], correctAnswer: 0 },
      { question: 'What is code review for?', options: ['Random styling', 'Quality and defect detection', 'License activation', 'Disk partition'], correctAnswer: 1 },
    ],
  },
  {
    slug: 'business-management',
    name: 'Business Management',
    description: 'Planning, organizing, leading, and controlling business operations.',
    questions: [
      { question: 'What is the first step in management?', options: ['Controlling', 'Planning', 'Hiring', 'Auditing'], correctAnswer: 1 },
      { question: 'SWOT stands for?', options: ['Strengths, Weaknesses, Opportunities, Threats', 'Sales, Work, Operations, Tasks', 'Systems, Workflow, Output, Time', 'Strategy, Workforce, Objectives, Tactics'], correctAnswer: 0 },
      { question: 'Which leadership style invites team input?', options: ['Autocratic', 'Democratic', 'Laissez-faire only', 'Directive'], correctAnswer: 1 },
      { question: 'KPI means?', options: ['Key Performance Indicator', 'Knowledge Performance Index', 'Key Planning Interface', 'Knowledge Process Input'], correctAnswer: 0 },
      { question: 'A budget is mainly used for?', options: ['Random spending', 'Financial planning and control', 'Hiring only', 'Branding only'], correctAnswer: 1 },
      { question: 'What is delegation?', options: ['Avoiding tasks', 'Assigning authority and responsibility', 'Removing management', 'Writing policy'], correctAnswer: 1 },
      { question: 'Market segmentation divides customers by?', options: ['One fixed group', 'Shared characteristics', 'Only age', 'Only geography'], correctAnswer: 1 },
      { question: 'Which is part of the marketing mix?', options: ['People only', 'Product, Price, Place, Promotion', 'Profit and payroll', 'Policy and penalty'], correctAnswer: 1 },
      { question: 'Risk management is for?', options: ['Ignoring uncertainty', 'Identifying and handling potential issues', 'Avoiding planning', 'Reducing staff'], correctAnswer: 1 },
      { question: 'Organizational structure defines?', options: ['Office color', 'Roles and reporting lines', 'Internet speed', 'Meeting length'], correctAnswer: 1 },
    ],
  },
  {
    slug: 'accounting',
    name: 'Accounting',
    description: 'Recording, summarizing, and reporting financial transactions.',
    questions: [
      { question: 'Which statement shows assets, liabilities, and equity?', options: ['Income statement', 'Cash flow statement', 'Balance sheet', 'Trial balance'], correctAnswer: 2 },
      { question: 'Debit and credit are used in?', options: ['Single-entry system only', 'Double-entry bookkeeping', 'Payroll only', 'Tax filing only'], correctAnswer: 1 },
      { question: 'Revenue is generally recorded when?', options: ['Cash is spent', 'Earned', 'Stock decreases', 'Tax is paid'], correctAnswer: 1 },
      { question: 'Which is a current asset?', options: ['Land', 'Cash', 'Patent', 'Building'], correctAnswer: 1 },
      { question: 'Depreciation applies to?', options: ['Inventory', 'Fixed assets', 'Cash', 'Accounts payable'], correctAnswer: 1 },
      { question: 'Accounts payable is?', options: ['Money owed to suppliers', 'Money customers owe', 'Owner investment', 'Cash on hand'], correctAnswer: 0 },
      { question: 'Gross profit equals?', options: ['Sales - operating expenses', 'Sales - cost of goods sold', 'Net income + tax', 'Assets - liabilities'], correctAnswer: 1 },
      { question: 'Trial balance is used to?', options: ['Prepare payroll', 'Check debit-credit equality', 'Record sales only', 'Pay taxes'], correctAnswer: 1 },
      { question: 'Which is an expense?', options: ['Rent', 'Accounts receivable', 'Capital', 'Inventory purchase return'], correctAnswer: 0 },
      { question: 'Net income appears in?', options: ['Income statement', 'Ledger only', 'Purchase order', 'Invoice footer'], correctAnswer: 0 },
    ],
  },
  {
    slug: 'bio-chemistry',
    name: 'Bio Chemistry',
    description: 'Chemical processes in living organisms and biological systems.',
    questions: [
      { question: 'Proteins are made up of?', options: ['Fatty acids', 'Amino acids', 'Nucleotides', 'Monosaccharides'], correctAnswer: 1 },
      { question: 'Primary energy currency of cells?', options: ['DNA', 'ATP', 'NADH', 'RNA'], correctAnswer: 1 },
      { question: 'Enzymes are mostly?', options: ['Lipids', 'Carbohydrates', 'Proteins', 'Minerals'], correctAnswer: 2 },
      { question: 'pH less than 7 is?', options: ['Basic', 'Acidic', 'Neutral', 'Buffer'], correctAnswer: 1 },
      { question: 'DNA stands for?', options: ['Deoxyribonucleic acid', 'Dioxyribose nucleic acid', 'Dual nucleic acid', 'Deoxy ribo protein'], correctAnswer: 0 },
      { question: 'Which organelle performs cellular respiration?', options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Golgi body'], correctAnswer: 2 },
      { question: 'Substrate binds to which enzyme region?', options: ['Allosteric site only', 'Active site', 'Lipid layer', 'Backbone'], correctAnswer: 1 },
      { question: 'Denaturation affects?', options: ['DNA replication only', 'Protein structure and function', 'Cell wall thickness', 'pH neutrality'], correctAnswer: 1 },
      { question: 'Which biomolecule stores long-term energy?', options: ['Lipids', 'Proteins', 'Nucleic acids', 'Enzymes'], correctAnswer: 0 },
      { question: 'A catalyst does what?', options: ['Increases activation energy', 'Slows reactions', 'Speeds up reaction without being consumed', 'Changes equilibrium only'], correctAnswer: 2 },
    ],
  },
];

function getSubjectBySlug(slug) {
  return subjectCategories.find((subject) => subject.slug === slug);
}

module.exports = {
  subjectCategories,
  getSubjectBySlug,
};
