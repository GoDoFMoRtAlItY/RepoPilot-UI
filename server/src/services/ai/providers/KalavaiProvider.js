const BaseProvider = require('./BaseProvider');

class KalavaiProvider extends BaseProvider {
  constructor() {
    super('Kalavai');
  }

  async generateDetailedAnalysis(fileName, fileContent, overrideKey) {
    const error = new Error('KalavaiProvider is not yet implemented.');
    error.status = 501;
    throw error;
  }

  async answerQuestion(question, analysisJson, overrideKey) {
    const error = new Error('KalavaiProvider is not yet implemented.');
    error.status = 501;
    throw error;
  }
}

module.exports = KalavaiProvider;
