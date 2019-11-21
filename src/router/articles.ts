import {Request, Response, Router, NextFunction} from 'express';
import {validationResult} from 'express-validator';

import {articleValidators, commentValidators} from '../utils/validators';
import Article from '../models/Article';
import Comment from '../models/Comment';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const articles = await Article.find()
			.sort({created: -1})
			.skip(Number(req.query.skip))
			.limit(10)
			.populate('comments', null, null, {
				sort: {created: -1},
				populate: {
					path: 'user',
				},
			})
			.populate('user');

		res.json({articles});
	} catch (err) {
		next(err);
	}
});

router.post('/', articleValidators, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.json({errors: errors.array()});
		}

		const validationArticle = await Article.findOne({title: req.body.title});
		if (validationArticle) {
			return res.json({errors: [{msg: 'Article with the same title already exists'}]});
		}

		const newArticle = await Article.create(req.body);
		const article = await Article.findById(newArticle._id).populate('user');

		res.json({article});
	} catch (err) {
		next(err);
	}
});

router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const article = await Article.findOne({slug: req.params.slug})
			.populate('comments', null, null, {
				sort: {created: -1},
				populate: {
					path: 'user',
				},
			})
			.populate('user');

		res.json({article});
	} catch (err) {
		next(err);
	}
});

router.put(
	'/:articleId',
	articleValidators,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.json({errors: errors.array()});
			}

			const validationArticle = await Article.findOne({title: req.body.title});
			if (validationArticle && String(validationArticle._id) !== req.params.articleId) {
				return res.json({errors: [{msg: 'Article with the same title already exists'}]});
			}

			const slug = req.body.title
				.split(' ')
				.join('-')
				.toLowerCase();

			const article = await Article.findByIdAndUpdate(
				req.params.articleId,
				{$set: {...req.body, slug}},
				{new: true},
			)
				.populate('comments', null, null, {
					sort: {created: -1},
					populate: {
						path: 'user',
					},
				})
				.populate('user');

			res.json({article});
		} catch (err) {
			next(err);
		}
	},
);

router.delete('/:articleId', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const article = await Article.findByIdAndRemove(req.params.articleId);

		if (article) {
			await Comment.deleteMany({articleId: article._id});

			res.json({article});
		}
	} catch (err) {
		next(err);
	}
});

router.get('/views/:slug', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const article = await Article.findOneAndUpdate(
			{slug: req.params.slug},
			{$inc: {views: 1}},
			{new: true},
		)
			.populate('comments', null, null, {
				sort: {created: -1},
				populate: {
					path: 'user',
				},
			})
			.populate('user');

		res.json({article});
	} catch (err) {
		next(err);
	}
});

router.post(
	'/comments',
	commentValidators,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.json({errors: errors.array()});
			}

			let comment = await Comment.create(req.body);

			await Article.updateOne({_id: req.body.articleId}, {$push: {comments: comment._id}});

			comment = await comment.populate('user').execPopulate();

			res.json({comment});
		} catch (err) {
			next(err);
		}
	},
);

router.delete('/comments/:commentId', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const comment = await Comment.findByIdAndRemove(req.params.commentId);

		res.json({comment});
	} catch (err) {
		next(err);
	}
});

export default router;
