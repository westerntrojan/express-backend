import {Schema, model, Document} from 'mongoose';

const UserSessionSchema: Schema = new Schema({
	userId: {
		type: String,
		default: 0,
	},
	isRemoved: {
		type: Boolean,
		default: false,
	},
	created: {
		type: Date,
		default: Date.now,
	},
});

export interface UserSessionInterface extends Document {
	userId: string;
	isRemoved: boolean;
	created: string;
}

export default model('sessions', UserSessionSchema);