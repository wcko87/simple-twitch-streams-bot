const { writeFile } = require('../filesystem');
const totalScore = require('./totalScore.json');

class GeoQuiz{

	constructor(){
		this.messageId = undefined;
		this.rightAnswer = '✅';

		this.answers = {};

		this.totalScore = totalScore
	}

	addAnswer(userId, answer){
		this.answers[userId] = answer;
	}
	startQuestion(messageId){
		this.messageId = messageId;

	}

	endQuestion(){
		for(const userId in this.answers){
			const answer = this.answers[userId];
			const score = +(this.rightAnswer === answer);
			this.totalScore[userId] =+ score;
		}
		this.answers = {};
		this.messageId = undefined;
		writeFile('./totalScore.json', JSON.stringify(this.totalScore));
	}

	getUserScore(userId){
		return this.totalScore[userId];
	}

	getAllScores(){
		const sortedScores = Object.keys(this.totalScore).sort((a, b) => this.totalScore[b] - this.totalScore[a]);
		const scores = [];
		for(const userId of sortedScores){
			scores.push({userId, score: this.totalScore[userId]});
		}
		return scores;

	}
	

}

module.exports = GeoQuiz;