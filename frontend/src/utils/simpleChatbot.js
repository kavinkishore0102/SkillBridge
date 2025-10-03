// Simple SkillBridge AI Chatbot
export const chatbotResponses = {
  greeting: "👋 Hello! I'm your SkillBridge AI assistant. How can I help you today?",
  about: "SkillBridge connects students with companies for real-world project collaboration. Students gain experience while companies get fresh talent!",
  projects: "To find projects: Go to Projects page → Browse available projects → Click 'Apply Now' on projects that interest you.",
  apply: "To apply to a project: Visit the project details → Click 'Apply Now' → Submit your application with your GitHub profile.",
  postProject: "To post a new project (Company account required): 📝 Go to Dashboard → Click 'Post New Project' → Fill in project details (title, description, requirements, deadline) → Click 'Post Project'. Make sure you're logged in as a Company user!",
  uploadProject: "To upload/post a project: 🚀 Navigate to your Company Dashboard → Look for 'Post Project' or 'Create Project' button → Fill out the project form with title, description, skills required, and deadline → Submit to make it live for students to apply!",
  companyFeatures: "As a Company user, you can: 📋 Post new projects, 👥 View applications from students, 📊 Review student profiles, ⚙️ Manage your posted projects, and 📈 Track application status.",
  studentFeatures: "As a Student, you can: 🔍 Browse available projects, 📝 Apply to interesting projects, 📊 Track your application status, 💼 Build your portfolio, and 🤝 Connect with companies.",
  dashboard: "Your dashboard shows your applied projects, application status, and personalized recommendations.",
  help: "I can help you with: Finding projects, applying to them, posting projects (for companies), understanding platform features, and navigating SkillBridge.",
  default: "I'm here to help with SkillBridge! Ask me about projects, applications, or platform features."
};

export const getChatbotResponse = (message) => {
  const msg = message.toLowerCase().trim();
  
  // Greetings
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('good morning') || msg.includes('good afternoon')) {
    return chatbotResponses.greeting;
  }
  
  // About SkillBridge
  if (msg.includes('what is') || msg.includes('about') || msg.includes('skillbridge') || msg.includes('tell me about')) {
    return chatbotResponses.about;
  }
  
  // Handle posting/uploading projects - multiple variations
  if ((msg.includes('post') || msg.includes('upload') || msg.includes('create') || msg.includes('add') || msg.includes('publish')) && 
      (msg.includes('project') || msg.includes('new project'))) {
    return chatbotResponses.postProject;
  }
  
  // Handle "how to" questions about posting projects
  if ((msg.includes('how') || msg.includes('how can') || msg.includes('how do')) && 
      (msg.includes('post') || msg.includes('upload') || msg.includes('create') || msg.includes('add')) && 
      (msg.includes('project') || msg.includes('new project'))) {
    return chatbotResponses.uploadProject;
  }
  
  // Handle company-specific features
  if ((msg.includes('company') || msg.includes('business') || msg.includes('employer')) && 
      (msg.includes('feature') || msg.includes('can do') || msg.includes('what can') || msg.includes('capabilities'))) {
    return chatbotResponses.companyFeatures;
  }
  
  // Handle student-specific features
  if ((msg.includes('student') || msg.includes('learner')) && 
      (msg.includes('feature') || msg.includes('can do') || msg.includes('what can') || msg.includes('capabilities'))) {
    return chatbotResponses.studentFeatures;
  }
  
  // Handle finding/searching projects (for students)
  if (msg.includes('project') && 
      (msg.includes('find') || msg.includes('search') || msg.includes('browse') || msg.includes('look for') || msg.includes('available'))) {
    return chatbotResponses.projects;
  }
  
  // Handle applications
  if (msg.includes('apply') || msg.includes('application') || msg.includes('submit application')) {
    return chatbotResponses.apply;
  }
  
  // Handle dashboard questions
  if (msg.includes('dashboard') || msg.includes('main page') || msg.includes('home page')) {
    return chatbotResponses.dashboard;
  }
  
  // Handle help requests
  if (msg.includes('help') || msg.includes('support') || msg.includes('assist') || msg.includes('guide')) {
    return chatbotResponses.help;
  }
  
  // Catch other project-related questions that might not match above patterns
  if (msg.includes('project') && (msg.includes('new') || msg.includes('create') || msg.includes('make'))) {
    return chatbotResponses.postProject;
  }
  
  return chatbotResponses.default;
};
