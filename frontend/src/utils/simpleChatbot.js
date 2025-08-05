// Simple SkillBridge AI Chatbot
export const chatbotResponses = {
  greeting: "👋 Hello! I'm your SkillBridge AI assistant. How can I help you today?",
  about: "SkillBridge connects students with companies for real-world project collaboration. Students gain experience while companies get fresh talent!",
  projects: "To find projects: Go to Projects page → Browse available projects → Click 'Apply Now' on projects that interest you.",
  apply: "To apply to a project: Visit the project details → Click 'Apply Now' → Submit your application with your GitHub profile.",
  dashboard: "Your dashboard shows your applied projects, application status, and personalized recommendations.",
  help: "I can help you with: Finding projects, applying to them, understanding platform features, and navigating SkillBridge.",
  default: "I'm here to help with SkillBridge! Ask me about projects, applications, or platform features."
};

export const getChatbotResponse = (message) => {
  const msg = message.toLowerCase().trim();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return chatbotResponses.greeting;
  }
  
  if (msg.includes('what is') || msg.includes('about') || msg.includes('skillbridge')) {
    return chatbotResponses.about;
  }
  
  if (msg.includes('project') && (msg.includes('find') || msg.includes('search'))) {
    return chatbotResponses.projects;
  }
  
  if (msg.includes('apply') || msg.includes('application')) {
    return chatbotResponses.apply;
  }
  
  if (msg.includes('dashboard')) {
    return chatbotResponses.dashboard;
  }
  
  if (msg.includes('help')) {
    return chatbotResponses.help;
  }
  
  return chatbotResponses.default;
};
