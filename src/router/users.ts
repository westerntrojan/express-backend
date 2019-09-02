import {Request, Response, Router} from 'express';
import {validationResult} from 'express-validator';

import User from '../models/User';
import UserSession from '../models/UserSession';
import Article from '../models/Article';
import Comment from '../models/Comment';
import {editUserValidators} from '../utils/validators';

const router = Router();

router.get('/:userId', async (req: Request, res: Response) => {
	const user = await User.findById(req.params.userId);

	res.json({user});
});

router.put('/:userId', editUserValidators, async (req: Request, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.json({errors: errors.array()});
	}

	const user = await User.findOneAndUpdate({_id: req.params.userId}, {$set: req.body}, {new: true});

	res.json({user});
});

router.delete('/:userId', async (req: Request, res: Response) => {
	const user: any = await User.findOneAndUpdate(
		{_id: req.params.userId},
		{$set: {isRemoved: true}},
		{new: true}
	);

	await UserSession.update(
		{userId: req.params.userId, isRemoved: false},
		{$set: {isRemoved: true}},
		{new: true}
	);

	await Article.remove({user: user._id});
	await Comment.remove({user: user._id});

	res.json({user});
});

export default router;