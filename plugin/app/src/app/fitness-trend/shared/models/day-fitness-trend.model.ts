import * as moment from "moment";
import { DayStressModel } from "./day-stress.model";
import { TrainingZone } from "../enums/training-zone.enum";
import * as _ from "lodash";

export class DayFitnessTrendModel extends DayStressModel {

	public static readonly DATE_FORMAT: string = "YYYY-MM-DD";

	constructor(dayStress: DayStressModel, ctl: number, atl: number, vo2 : number, tsb: number, prevCtl?: number, prevAtl?: number,prevVo2?:number, prevTsb?: number) {
		super(dayStress.date, dayStress.previewDay);

		this.ids = dayStress.ids;
		this.types = dayStress.types;
		this.activitiesName = dayStress.activitiesName;
		this.heartRateStressScore = dayStress.heartRateStressScore;
		this.trainingImpulseScore = dayStress.trainingImpulseScore;
		this.powerStressScore = dayStress.powerStressScore;
		this.runningStressScore = dayStress.runningStressScore;
		this.swimStressScore = dayStress.swimStressScore;
		this.vo2max =dayStress.vo2max;
		this.finalStressScore = dayStress.finalStressScore;
		this.athleteSnapshot = (dayStress.athleteSnapshot) ? dayStress.athleteSnapshot : null;

		this.dateString = moment(this.date).format(DayFitnessTrendModel.DATE_FORMAT);

		this.ctl = ctl;
		this.atl = atl;
		this.tsb = tsb;
		this.vo2 = vo2;
		this.prevCtl = (prevCtl) ? prevCtl : null;
		this.prevAtl = (prevAtl) ? prevAtl : null;
		this.prevTsb = (prevTsb) ? prevTsb : null;
		this.prevVo2  = (prevVo2) ? prevVo2:null; 
		this.trainingZone = this.findTrainingZone(this.tsb);
	}

	public dateString: string;

	public ctl: number;
	public atl: number;
	public tsb: number;
	public vo2: number;


	public prevCtl: number;
	public prevAtl: number;
	public prevTsb: number;
	public prevVo2: number;


	public trainingZone: TrainingZone;
	public trainingZoneAsString: string;

	public printFitness(): number {
		return _.floor(this.ctl, 1);
	}

	public printFatigue(): number {
		return _.floor(this.atl, 1);
	}

	public printForm(): number {
		return _.floor(this.tsb, 1);
	}
	public printvo2max(): number {
		return _.floor(this.vo2, 1);
	}

	public printDeltaFitness(): string {
		if (!this.prevCtl) {
			return null;
		}
		const delta = _.floor(this.ctl, 1) - _.floor(this.prevCtl, 1);
		return ((delta >= 0) ? "+" : "") + _.round(delta, 1);
	}

	public printDeltaVo2max(): string {
		if (!this.prevVo2) {
			return null;
		}
		return JSON.stringify( _.round(this.prevVo2));
	}
	public printDeltaFatigue(): string {
		if (!this.prevAtl) {
			return null;
		}
		const delta = _.floor(this.atl, 1) - _.floor(this.prevAtl, 1);
		return ((delta >= 0) ? "+" : "") + _.round(delta, 1);
	}

	public printDeltaForm(): string {
		if (!this.prevTsb) {
			return null;
		}
		const delta = _.floor(this.tsb, 1) - _.floor(this.prevTsb, 1);
		return ((delta >= 0) ? "+" : "") + _.round(delta, 1);
	}

	public printDate(): string {

		const dayFitnessMoment = moment(this.date);
		const isToday = moment().startOf("day").isSame(dayFitnessMoment);

		let niceDate: string = dayFitnessMoment.format("dddd, MMMM Do YYYY");

		if (isToday) {
			niceDate = "Today, " + niceDate;
		}

		return niceDate;
	}

	public printShortDate(): string {
		return moment(this.date).format("dd, MMM Do YYYY");
	}

	public hasActivities(): boolean {
		return (this.activitiesName.length > 0);
	}

	public printActivities(defaultEmptyValue?: string): string {

		if (this.activitiesName.length === 0) {
			return (defaultEmptyValue) ? defaultEmptyValue : "";
		}
		return this.activitiesName.join("; ");
	}
	

	public printTypes(defaultEmptyValue?: string): string {

		if (this.types.length === 0) {
			return (defaultEmptyValue) ? defaultEmptyValue : "";
		}
		return this.types.join("; ");

	}

	public printTypesCount(maxType?: number, defaultEmptyValue?: string): string {

		if (this.types.length === 0) {
			return (defaultEmptyValue) ? defaultEmptyValue : "";
		}

		const typesCount = _.chain(this.types).countBy().map((count, type) => {
			return {type: type, count: count};
		}).value();

		let result = "";
		_.forEach(_.orderBy(typesCount, "count", "desc"), (obj: any, index: number) => {

			result += obj.count + " " + obj.type + ((obj.count > 1) ? "s" : "");

			if (maxType && index === (maxType - 1)) {
				const remaining = (typesCount.length - 1) - index;
				result += ((remaining > 0) ? " & " + remaining + " more" : "");
				return false;
			}
			if (index < (typesCount.length - 1)) {
				result += ", ";
			}
		});
		return result;
	}

	public findTrainingZone(tsb: number): TrainingZone {

		if (tsb <= TrainingZone.OVERLOAD) {
			return TrainingZone.OVERLOAD;
		}

		if (tsb <= TrainingZone.OPTIMAL) {
			return TrainingZone.OPTIMAL;
		}

		if (tsb <= TrainingZone.NEUTRAL) {
			return TrainingZone.NEUTRAL;
		}

		if (tsb <= TrainingZone.FRESHNESS) {
			return TrainingZone.FRESHNESS;
		}

		return TrainingZone.TRANSITION;
	}

	public printTrainingZone(): string {
		if (!this.trainingZoneAsString) {
			const trainingZoneString = TrainingZone[this.trainingZone].toLowerCase();
			this.trainingZoneAsString = trainingZoneString.charAt(0).toUpperCase() + trainingZoneString.slice(1);
		}
		return this.trainingZoneAsString;
	}

	public printAthleteSettings(): string {

		if (!this.athleteSnapshot) {
			return null;
		}

		let inlineSettings = "";

		if (_.isNumber(this.heartRateStressScore) || _.isNumber(this.trainingImpulseScore)) {

			inlineSettings += "MaxHr " + this.athleteSnapshot.athleteSettings.maxHr + "bpm. ";
			inlineSettings += "RestHr " + this.athleteSnapshot.athleteSettings.restHr + "bpm. ";

			if (this.athleteSnapshot.athleteSettings.lthr.default
				|| this.athleteSnapshot.athleteSettings.lthr.cycling
				|| this.athleteSnapshot.athleteSettings.lthr.running) {

				let lthrStr = "Lthr ";

				lthrStr += (this.athleteSnapshot.athleteSettings.lthr.default) ? "D:" + this.athleteSnapshot.athleteSettings.lthr.default + "bpm, " : "";
				lthrStr += (this.athleteSnapshot.athleteSettings.lthr.cycling) ? "C:" + this.athleteSnapshot.athleteSettings.lthr.cycling + "bpm, " : "";
				lthrStr += (this.athleteSnapshot.athleteSettings.lthr.running) ? "R:" + this.athleteSnapshot.athleteSettings.lthr.running + "bpm, " : "";
				lthrStr = lthrStr.slice(0, -2);

				inlineSettings += lthrStr + ". ";
			}

		}

		if (_.isNumber(this.powerStressScore) && this.athleteSnapshot.athleteSettings.cyclingFtp) {
			inlineSettings += "Cycling Ftp " + this.athleteSnapshot.athleteSettings.cyclingFtp + "w. ";
		}

		if (_.isNumber(this.runningStressScore) && this.athleteSnapshot.athleteSettings.runningFtp) {
			inlineSettings += "Run Ftp " + this.athleteSnapshot.athleteSettings.runningFtp + "s/km. ";
		}

		if (_.isNumber(this.swimStressScore) && this.athleteSnapshot.athleteSettings.swimFtp) {
			inlineSettings += "Swim Ftp " + this.athleteSnapshot.athleteSettings.swimFtp + "m/min. ";
		}

		inlineSettings += "Weight " + this.athleteSnapshot.athleteSettings.weight + "kg.";

		return inlineSettings;

	}

}
