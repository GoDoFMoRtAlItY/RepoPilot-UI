import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const analyzeRepository = async (owner: string, repo: string, force: boolean = false) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);
  
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/${owner}/${repo}?force=${force}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { response: { data: errorData } };
    }
    
    // We expect an NDJSON stream where the first object is { type: 'complete', data: analysis }
    // and subsequent objects are { type: 'file_update', path, description }
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let analysisData: any = null;
    let buffer = '';

    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'complete') {
              analysisData = parsed.data;
              // Inform store immediately so UI doesn't wait
              const { useRepoStore } = await import('../store/useRepoStore');
              useRepoStore.setState({ analysis: { ...analysisData } });
            } else if (parsed.type === 'file_update' && analysisData) {
              // Update specific file description in place
              const file = analysisData.files.find((f: any) => f.path === parsed.path);
              if (file) {
                file.description = parsed.description;
                file.loading = false;
                // Trigger re-render by creating new reference for files
                const { useRepoStore } = await import('../store/useRepoStore');
                useRepoStore.setState((state: any) => ({
                  analysis: {
                    ...state.analysis,
                    files: [...analysisData.files]
                  }
                }));
              }
            }
          } catch (e) {
            console.error('Error parsing NDJSON chunk', e);
          }
        }
      }
    }
    
    return analysisData;
  } catch (error: any) {
    console.error('Error analyzing repository:', error);
    if (error.name === 'AbortError') {
      throw { response: { data: { error: 'Request timed out while waiting for server.' } } };
    }
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

export const generateReadme = async (owner: string, repo: string, aiKey?: string, analysis?: any) => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (aiKey) {
      headers['X-AI-Key'] = aiKey;
    }
    
    const response = await axios.post(`${API_BASE_URL}/readme`, {
      owner,
      repo,
      analysis
    }, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Error generating README:', error);
    throw error;
  }
};

export const getAiSummary = async (owner: string, repo: string, aiKey?: string) => {
  try {
    const headers = aiKey ? { 'X-AI-Key': aiKey } : undefined;
    const response = await axios.get(`${API_BASE_URL}/analyze/${owner}/${repo}/summary`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI summary:', error);
    throw error;
  }
};

export const getAiSecurityReview = async (owner: string, repo: string, aiKey?: string) => {
  try {
    const headers = aiKey ? { 'X-AI-Key': aiKey } : undefined;
    const response = await axios.get(`${API_BASE_URL}/analyze/${owner}/${repo}/security-review`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI security review:', error);
    throw error;
  }
};

export const getApiExplanation = async (owner: string, repo: string, routePath: string, method: string, aiKey?: string) => {
  try {
    const headers = aiKey ? { 'X-AI-Key': aiKey } : undefined;
    const response = await axios.post(`${API_BASE_URL}/analyze/${owner}/${repo}/api-explanation`, { routePath, method }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching API explanation:', error);
    throw error;
  }
};

export const getDetailedFileAnalysis = async (
  owner: string,
  repo: string,
  path: string,
  sha: string,
  aiKey?: string
) => {
  const headers = aiKey ? { 'X-AI-Key': aiKey } : undefined;
  const response = await axios.post(
    `${API_BASE_URL}/explorer/analyze-line-by-line`,
    { owner, repo, path, sha },
    { headers }
  );
  return response.data;
};
