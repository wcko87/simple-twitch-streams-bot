const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_CREDENTIALS)
  ),
  databaseURL:
    'https://geoguess-discord-bot-default-rtdb.europe-west1.firebasedatabase.app/',
});
const db = admin.database();

class GeoQuizDataBase {
  async getQuizId() {
    const snapshot = await db.ref(`/quizActive`).once('value');

    return snapshot.val();
  }

  async setQuizActive(id) {
    await db.ref(`/quizActive`).set(id);
  }

  async setMessageId(id) {
    db.ref(`/quiz/${await this.getQuizId()}/messageId`).set(id);
  }
  async getMessageId() {
    return (
      await db.ref(`/quiz/${await this.getQuizId()}/messageId`).once('value')
    ).val();
  }

  async setRightAnswer(rightAnswer) {
    db.ref(`/quiz/${await this.getQuizId()}/rightAnswer`).set(rightAnswer);
  }
  async getRightAnswer() {
    return (
      await db.ref(`/quiz/${await this.getQuizId()}/rightAnswer`).once('value')
    ).val();
  }

  async addAnswer(userId, answer) {
    db.ref(`/quiz/${await this.getQuizId()}/answers/${userId}`).set(answer);
  }

  async getAnswers() {
    return (
      (
        await db.ref(`/quiz/${await this.getQuizId()}/answers`).once('value')
      ).val() || {}
    );
  }

  async getTotals() {
    return (await db.ref('totalScore').once('value')).val() || {};
  }

  setTotals(totalScore) {
    db.ref('totalScore').set(totalScore);
  }
}

module.exports = new GeoQuizDataBase();
