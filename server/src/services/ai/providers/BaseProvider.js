class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generates a detailed analysis for a file
   * @param {string} fileName 
   * @param {string} fileContent 
   * @param {string} [overrideKey] Optional API key override
   * @returns {Promise<string>} Markdown string response
   */
  async generateDetailedAnalysis(fileName, fileContent, overrideKey) {
    throw new Error(`generateDetailedAnalysis not implemented in ${this.name}`);
  }

  /**
   * Answers a chat question based on repository analysis
   * @param {string} question 
   * @param {object} analysisJson 
   * @param {string} [overrideKey] Optional API key override
   * @returns {Promise<{answer: string, citations: Array}>}
   */
  async answerQuestion(question, analysisJson, overrideKey) {
    throw new Error(`answerQuestion not implemented in ${this.name}`);
  }

  /**
   * Generates a 100-word executive summary for a repository
   * @param {object} analysisJson
   * @param {string} [overrideKey] Optional API key override
   * @returns {Promise<string>} Summary string
   */
  async generateExecutiveSummary(analysisJson, overrideKey) {
    throw new Error(`generateExecutiveSummary not implemented in ${this.name}`);
  }

  /**
   * Generates a concise security review for a repository
   * @param {object} analysisJson
   * @param {string} [overrideKey] Optional API key override
   * @returns {Promise<string>} Review string
   */
  async generateSecurityReview(analysisJson, overrideKey) {
    throw new Error('generateSecurityReview not implemented in ' + this.name);
  }

  async generateApiExplanation(route, overrideKey) {
    throw new Error('generateApiExplanation not implemented in ' + this.name);
  }

  async generateReadme(analysisJson, overrideKey) {
    throw new Error('generateReadme not implemented in ' + this.name);
  }

  async generateFileDescription(fileName, compressedContext, overrideKey) {
    throw new Error('generateFileDescription not implemented in ' + this.name);
  }
}

module.exports = BaseProvider;
