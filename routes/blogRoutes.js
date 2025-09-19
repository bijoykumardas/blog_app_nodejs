const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const blogCtrl = require('../controllers/blogController');

router.get('/', blogCtrl.getBlogs);
router.post('/', auth, blogCtrl.createBlog);
router.get('/:id', blogCtrl.getBlogById);
router.put('/:id', auth, blogCtrl.updateBlog);
router.delete('/:id', auth, blogCtrl.deleteBlog);

// likes and comments
router.post('/:blogId/like', auth, blogCtrl.toggleLike);
router.post('/:blogId/comments', auth, blogCtrl.addComment);
router.delete('/:blogId/comments/:commentId', auth, blogCtrl.deleteComment);

module.exports = router;
