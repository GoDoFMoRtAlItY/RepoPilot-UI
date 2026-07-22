const BaseProvider = require('./BaseProvider');

class LocalProvider extends BaseProvider {
  constructor() {
    super('LocalProvider');
  }

  async generateDetailedAnalysis(fileName, fileContent, overrideKey) {
    const error = new Error('LocalProvider is not yet implemented.');
    error.status = 501;
    throw error;
  }

  async answerQuestion(question, analysisJson, overrideKey) {
    const error = new Error('LocalProvider is not yet implemented.');
    error.status = 501;
    throw error;
  }
}

module.exports = LocalProvider;
