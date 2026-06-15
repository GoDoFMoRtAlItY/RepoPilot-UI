import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const analyzeRepository = async (owner: string, repo: string, force: boolean = false) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/analyze/${owner}/${repo}?force=${force}`);
    return response.data;
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw error;
  }
};

export const askAiQuestion = async (owner: string, repo: string, question: string, aiKey?: string) => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (aiKey) {
      headers['X-AI-Key'] = aiKey;
    }
    
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      owner,
      repo,
      question
    }, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Error asking AI question:', error);
    throw error;
  }
};
