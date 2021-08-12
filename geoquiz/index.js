const { writeFile } = require('../filesystem');
const database = require('./database.js');

class GeoQuiz {
  constructor() {
    this.database = database;
  }

  addAnswer(userId, answer) {
    this.database.addAnswer(userId, answer);
  }
  async startQuestion(messageId) {
    await this.database.setQuizActive('quiz' + messageId);
    this.setMessageId(messageId);
  }

  setMessageId(messageId) {
    this.database.setMessageId(messageId);
  }

  setRightAnswer(rightAnswer) {
    this.database.setRightAnswer(rightAnswer);
  }

  async endQuestion() {
    const rightAnswer = await this.database.getRightAnswer();
    if(!rightAnswer){
      throw 'Not rightAnswer set';
    }
    const totalScore = await this.database.getTotals();
    const answers = await this.database.getAnswers();
    const userIdWithRightAnswer = [];
    for (const userId in answers) {
      const answer = answers[userId];
      const score = +(rightAnswer === answer);
      if (score > 0) {
        userIdWithRightAnswer.push(userId);
      }
      if (!totalScore[userId]) {
        totalScore[userId] = score;
      } else {
        totalScore[userId] += score;
      }
    }
    this.database.setTotals(totalScore);
    this.database.setQuizActive('');
    return userIdWithRightAnswer;
  }

  async getAllScores() {
    const totalScore = await this.database.getTotals();
    const sortedScores = Object.keys(totalScore).sort(
      (a, b) => totalScore[b] - totalScore[a]
    );
    const scores = [];
    for (const userId of sortedScores) {
      scores.push({ userId, score: totalScore[userId] });
    }
    return scores;
  }
}

module.exports = GeoQuiz;
